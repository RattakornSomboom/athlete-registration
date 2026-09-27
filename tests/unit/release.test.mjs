import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { competitionInput, athleteApplicationInput, applicationStatus, ValidationError } from "../../lib/validation.ts";
import { documentReference, documentId, protectedApplication } from "../../lib/athlete-document-policy.ts";
import { routeLoader } from "../helpers/load-route.mjs";

const context = id => ({ params: Promise.resolve({ id }) });
const request = (data, method = "POST", url = "http://localhost/api/test") => new Request(url, { method, ...(data === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }) });
function harness(role = "ADMIN", db = {}, storage = {}) {
  let session = role ? { id: "actor", role, clubId: role === "CLUB" ? "club-a" : undefined } : null;
  const prisma = { ...db, $transaction: async fn => fn(prisma) };
  const load = routeLoader({ "@/lib/prisma": { prisma }, "@/lib/auth": { getSession: async () => session }, "@/lib/supabase-admin": { supabaseAdmin: { storage } } });
  return { load, prisma, setSession: value => { session = value; } };
}
const competition = { name: "University", round: "final", year: "2569", deadline: "2026-10-01T12:00:00+07:00", status: "OPEN", quotas: [{ sport: "football", maxStarters: "11", maxSubstitutes: "5", ageLimit: "28" }] };

test("competition validation rejects duplicate sports, malformed integers, invalid status/date", () => {
  assert.equal(competitionInput(competition).quotas[0].maxStarters, 11);
  for (const value of [-1, 1.5, "1x", "", null, true, Infinity]) assert.throws(() => competitionInput({ ...competition, quotas: [{ ...competition.quotas[0], maxStarters: value }] }), ValidationError);
  for (const change of [{ quotas: [...competition.quotas, ...competition.quotas] }, { status: "HACK" }, { deadline: "bad" }, { deadline: "2026-10-01T12:00" }, { deadline: "2026-02-30T12:00:00Z" }]) assert.throws(() => competitionInput({ ...competition, ...change }), ValidationError);
  assert.deepEqual(competitionInput({ status: "CLOSED" }, true), { status: "CLOSED" });
});
test("application input rejects self approval, malformed numbers and nested entries", () => {
  const input = { competitionId: "c", sport: "football", category: "male" };
  assert.equal(athleteApplicationInput(input).previousBachelorCount, 0);
  for (const change of [{ status: "FINAL_SELECTED" }, { userId: "other" }, { previousBachelorCount: -1 }, { previousGraduateCount: "2x" }, { sportEntries: [null] }, { competitionResults: [{ year: "NaN" }] }]) assert.throws(() => athleteApplicationInput({ ...input, ...change }), ValidationError);
  assert.throws(() => applicationStatus("MADE_UP"), ValidationError);
});
test("document references never accept arbitrary URLs and responses hide legacy public links", () => {
  assert.equal(documentId(documentReference("doc1")), "doc1");
  for (const ref of ["https://evil/file", "/api/documents/../download", {}, "//host/file"]) assert.equal(documentId(ref), null);
  const old = { id: "app1", idCardFileUrl: "https://public/file" };
  assert.equal(protectedApplication(old).idCardFileUrl, "/api/applications/app1/documents/idCardFileUrl");
  assert.equal(old.idCardFileUrl, "https://public/file");
});
test("dev and superadmin routes are absent", () => {
  for (const path of ["app/dev/page.tsx", "app/superadmin/page.tsx", "app/api/auth/dev-login/route.ts"]) assert.equal(fs.existsSync(path), false);
});
test("session checks reject legacy roles/dev identity and validate current CLUB associations", async () => {
  const original = process.env.JWT_SECRET;
  const environment = process.env.NODE_ENV;
  process.env.JWT_SECRET = "test-only-release-secret";
  process.env.NODE_ENV = "development";
  let account = null;
  let active = true;
  try {
    const load = routeLoader({ "@/lib/prisma": { prisma: {
      user: { findUnique: async () => account }, club: { findUnique: async () => ({ id: "club-a", isActive: active }) },
    } } });
    const auth = load("lib/auth.ts");
    const signed = payload => jwt.sign(payload, process.env.JWT_SECRET);
    const session = payload => auth.getSession({ cookies: { get: () => ({ value: signed(payload) }) } });
    for (const role of ["SUPERADMIN", "DEV"]) assert.throws(() => auth.verifyToken(signed({ id: "old", role })));
    assert.equal(await session({ id: "dev-user-id", role: "ADMIN" }), null);
    account = { id: "actor", role: "CLUB", clubId: "club-a", isActive: true };
    assert.equal((await session({ id: "actor", role: "CLUB", clubId: "club-a" })).clubId, "club-a");
    account.clubId = "club-b";
    assert.equal(await session({ id: "actor", role: "CLUB", clubId: "club-a" }), null);
    assert.equal((await session({ id: "club-a", role: "CLUB", clubId: "club-a" })).id, "club-a");
    active = false;
    assert.equal(await session({ id: "club-a", role: "CLUB", clubId: "club-a" }), null);
  } finally {
    if (original === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = original;
    if (environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = environment;
  }
});
test("public registration rejects privileged roles and malformed payloads before DB access", async () => {
  const h = harness();
  const route = h.load("app/api/auth/register/route.ts");
  for (const data of [null, [], { studentId: "12345678", password: "Password123!", role: "ADMIN" }, { studentId: "12345678", password: "short" }, { studentId: "12345678", password: "Password123!", profile: {} }]) assert.equal((await route.POST(request(data))).status, 400);
});
test("competition mutations reject STAFF and CLUB before database access", async () => {
  for (const role of ["STAFF", "CLUB", "ATHLETE", "TEAM_OFFICIAL", null]) {
    const h = harness(role);
    const collection = h.load("app/api/competitions/route.ts");
    const item = h.load("app/api/competitions/[id]/route.ts");
    for (const response of [await collection.POST(request(competition)), await item.PATCH(request({ status: "CLOSED" }, "PATCH"), context("c")), await item.DELETE(request(undefined, "DELETE"), context("c"))]) assert.equal(response.status, role ? 403 : 401);
  }
});
test("CLUB scope intersects competition/sport filters, rejects forged club and missing association", async () => {
  const h = harness("CLUB", { club: { findUnique: async () => ({ id: "club-a", isActive: true, sport: "football" }) } });
  const { applicationWhere } = h.load("lib/application-query.ts");
  const where = await applicationWhere({ id: "club-a", role: "CLUB", clubId: "club-a" }, new URLSearchParams({ competitionId: "c-other", sport: "tennis" }));
  assert.equal(where.competitionId, "c-other"); assert.equal(where.sport, "tennis"); assert.equal(where.AND[0].sport, "football");
  // CLUB scope must require rosterItem linked to this club; no rosterItem:null branch.
  assert.equal(where.AND[1].rosterItem.roster.clubId, "club-a");
  assert.equal(where.AND[1].OR, undefined, "CLUB must NOT have an OR branch allowing rosterItem:null");
  await assert.rejects(() => applicationWhere({ role: "CLUB", clubId: "club-a" }, new URLSearchParams({ clubId: "club-b" })), /ไม่มีสิทธิ์/);
  await assert.rejects(() => applicationWhere({ role: "CLUB" }, new URLSearchParams()), /ชมรม/);
});
test("CLUB scope excludes unrostered applications from other athletes (regression: rosterItem null)", async () => {
  // CLUB must not see applications where rosterItem is null, even in the same sport.
  const h = harness("CLUB", { club: { findUnique: async () => ({ id: "club-a", isActive: true, sport: "football" }) } });
  const { applicationWhere } = h.load("lib/application-query.ts");
  const where = await applicationWhere({ id: "club-a", role: "CLUB", clubId: "club-a" }, new URLSearchParams());
  // The AND conditions must require rosterItem linked to this club.
  assert.ok(where.AND, "CLUB query must have AND conditions");
  const rosterCondition = where.AND[1];
  // rosterCondition must be { rosterItem: { roster: { clubId: "club-a" } } } without OR wrapping null.
  assert.deepEqual(rosterCondition, { rosterItem: { roster: { clubId: "club-a" } } });
});
test("STAFF/ADMIN club filter retains rosterItem:null for broader view", async () => {
  for (const role of ["STAFF", "ADMIN"]) {
    const h = harness(role, { club: { findUnique: async () => ({ id: "club-a", isActive: true, sport: "football" }) } });
    const { applicationWhere } = h.load("lib/application-query.ts");
    const where = await applicationWhere({ role }, new URLSearchParams({ clubId: "club-a" }));
    assert.equal(where.AND[0].sport, "football");
    assert.ok(where.AND[1].OR, `${role} club filter must retain OR branch`);
    assert.deepEqual(where.AND[1].OR[0], { rosterItem: null });
    assert.equal(where.AND[1].OR[1].rosterItem.roster.clubId, "club-a");
  }
});
test("CLUB canReadDocument rejects documents from unrostered applications in same sport", async () => {
  // Simulate: retained document attached to an application without a rosterItem.
  // CLUB should NOT be able to read it even if the sport matches.
  const h = harness("CLUB", {
    club: { findUnique: async () => ({ id: "club-a", isActive: true, sport: "football" }) },
    application: { findFirst: async (args) => {
      // The query must require rosterItem linked to club; if it allows null rosters, that's a bug.
      // Simulate no matching application (the unrostered app is filtered out).
      if (args.where.rosterItem?.roster?.clubId === "club-a") return null;
      // If the query does not enforce rosterItem, return a match to detect the vulnerability.
      return { id: "leaked-app" };
    } },
  });
  const { canReadDocument } = h.load("lib/document-service.ts");
  const doc = { ownerId: "other-athlete", ownerRole: "ATHLETE", purpose: "ATHLETE", retained: true, state: "READY", id: "doc-1" };
  const session = { id: "club-actor", role: "CLUB", clubId: "club-a" };
  const result = await canReadDocument(session, doc);
  assert.equal(result, false, "CLUB must not read documents from unrostered applications");
});
test("CLUB GET application/[id] rejects unrostered applications and other clubs", async () => {
  const club = { id: "club-a", isActive: true, sport: "football" };
  const makeApp = (rosterItem) => ({
    id: "app-1",
    sport: "football",
    userId: "athlete-1",
    status: "SUBMITTED",
    rosterItem,
    user: { id: "athlete-1", studentId: "66001", email: "a@up.ac.th", role: "ATHLETE", profile: null },
    competition: { quotas: [] },
    statusHistory: [],
    sportEntries: [],
    competitionResults: [],
  });

  // Scenario 1: rosterItem is null -> 403
  let currentApp = makeApp(null);
  const h = harness("CLUB", {
    club: { findUnique: async () => club },
    application: { findUnique: async () => currentApp },
  });
  const route = h.load("app/api/applications/[id]/route.ts");
  let res = await route.GET(request(undefined, "GET"), context("app-1"));
  assert.equal(res.status, 403, "CLUB must be rejected when rosterItem is null");

  // Scenario 2: rosterItem belongs to another club -> 403
  currentApp = makeApp({ roster: { club: { id: "club-b", name: "Club B", sport: "football" } } });
  res = await route.GET(request(undefined, "GET"), context("app-1"));
  assert.equal(res.status, 403, "CLUB must be rejected when rosterItem belongs to another club");

  // Scenario 3: rosterItem belongs to club-a -> 200
  currentApp = makeApp({ roster: { club: { id: "club-a", name: "Club A", sport: "football" } } });
  res = await route.GET(request(undefined, "GET"), context("app-1"));
  assert.equal(res.status, 200, "CLUB can access applications rostered by their own club");
});
test("club filters distinguish missing clubs from forbidden club scope and inactive clubs", async () => {
  for (const role of ["ADMIN", "STAFF", "CLUB"]) {
    for (const club of [null, { id: "club-a", isActive: false, sport: "football" }]) {
      const h = harness(role, { club: { findUnique: async () => club } });
      const { applicationWhere } = h.load("lib/application-query.ts");
      await assert.rejects(
        () => applicationWhere({ role, clubId: "club-a" }, new URLSearchParams({ clubId: "club-a" })),
        { status: !club && role !== "CLUB" ? 404 : 403 },
      );
    }
  }
});

test("search and status filters reach the database query", async () => {
  const h = harness();
  const where = await h.load("lib/application-query.ts").applicationWhere({ role: "STAFF" }, new URLSearchParams({ search: "660001", status: "SUBMITTED", competitionId: "c" }));
  assert.equal(where.OR[0].user.studentId.contains, "660001"); assert.equal(where.status, "SUBMITTED"); assert.equal(where.competitionId, "c");
});
test("publication requires competition and rejects mixed/stale IDs atomically", async () => {
  let writes = 0;
  const h = harness("STAFF", { competition: { findUnique: async () => ({ id: "c" }) }, application: { findMany: async args => {
    assert.equal(args.where.competitionId, "c"); return [{ id: "a", rosterItem: null }];
  }, updateMany: async () => { writes++; return { count: 1 }; } }, statusHistory: { createMany: async () => {} } });
  const route = h.load("app/api/staff/applications/announce/route.ts");
  assert.equal((await route.POST(request({ applicationIds: ["a"] }))).status, 400);
  assert.equal((await route.POST(request({ competitionId: "c", applicationIds: ["a", "foreign"] }))).status, 409);
  assert.equal(writes, 0);
  assert.equal((await route.POST(request({ competitionId: "c", applicationIds: ["a"] }))).status, 200);
  assert.equal(writes, 1);
});
test("staff reviews submitted applications; athletes cannot approve themselves and repeat review fails", async () => {
  let status = "SUBMITTED";
  const h = harness("STAFF", { application: { findUnique: async () => ({ id: "a", status, rosterItem: null }), update: async ({ data }) => { status = data.status; return { id: "a", status }; } } });
  const route = h.load("app/api/applications/[id]/route.ts");
  assert.equal((await route.PATCH(request({ status: "STAFF_APPROVED", label: "reviewed" }, "PATCH"), context("a"))).status, 200);
  assert.equal(status, "STAFF_APPROVED");
  assert.equal((await route.PATCH(request({ status: "STAFF_APPROVED", label: "reviewed" }, "PATCH"), context("a"))).status, 409);
  h.setSession({ id: "actor", role: "ATHLETE" });
  assert.equal((await route.PATCH(request({ status: "STAFF_APPROVED", label: "self" }, "PATCH"), context("a"))).status, 403);
});
test("a failed transaction commit never produces review success", async () => {
  const h = harness("STAFF", { application: { findUnique: async () => ({ id: "a", status: "SUBMITTED", rosterItem: null }), update: async () => ({ id: "a" }) } });
  h.prisma.$transaction = async fn => { await fn(h.prisma); throw new Error("commit failed"); };
  const response = await h.load("app/api/applications/[id]/route.ts").PATCH(request({ status: "STAFF_APPROVED", label: "reviewed" }, "PATCH"), context("a"));
  assert.equal(response.status, 500);
});
test("document deletion checks owner and retention for every allowed role", async () => {
  let removed = false;
  for (const role of ["ATHLETE", "STAFF", "ADMIN", "CLUB", "TEAM_OFFICIAL"]) {
    const h = harness(role, { privateDocument: { findUnique: async () => ({ ownerId: "another", ownerRole: role, retained: false, state: "READY" }) } }, { from: () => ({ remove: async () => { removed = true; } }) });
    assert.equal((await h.load("app/api/documents/[id]/route.ts").DELETE(request(undefined, "DELETE"), context("d"))).status, 403);
  }
  assert.equal(removed, false);
  const h = harness("ATHLETE", { privateDocument: { findUnique: async () => ({ ownerId: "actor", ownerRole: "ATHLETE", retained: true, state: "READY" }) } });
  assert.equal((await h.load("app/api/documents/[id]/route.ts").DELETE(request(undefined, "DELETE"), context("d"))).status, 403);
});
test("public buckets fail closed before signing private document URLs", async () => {
  let signed = false;
  const h = harness("ATHLETE", { privateDocument: { findUnique: async () => ({ ownerId: "actor", ownerRole: "ATHLETE", state: "READY", path: "a/d" }) } }, { getBucket: async () => ({ data: { public: true } }), from: () => ({ createSignedUrl: async () => { signed = true; } }) });
  assert.equal((await h.load("app/api/documents/[id]/route.ts").GET(request(undefined, "GET"), context("d"))).status, 503);
  assert.equal(signed, false);
});
test("submitted documents must belong to the athlete and be ready", async () => {
  for (const bad of [{ ownerId: "other" }, { ownerRole: "CLUB" }, { state: "DELETED" }]) {
    const h = harness("ATHLETE", { privateDocument: { findUnique: async () => ({ ownerId: "actor", ownerRole: "ATHLETE", purpose: "ATHLETE", state: "READY", ...bad }) } });
    await assert.rejects(() => h.load("lib/document-service.ts").retainAthleteDocuments(h.prisma, { photoFileUrl: documentReference("d") }, "actor", true), /เอกสาร/);
  }
});
test("application transaction enforces open competition, deadline, sport membership and duplicates", async () => {
  for (const scenario of ["closed", "late", "sport", "duplicate"]) {
    let created = false;
    const h = harness("ATHLETE", {
      user: { findUnique: async () => ({ id: "actor", isActive: true, studentId: "66001", profile: { birthDate: new Date("2005-01-01"), studentLevel: "BACHELOR" } }) },
      competition: { findUnique: async () => ({ id: "c", status: scenario === "closed" ? "CLOSED" : "OPEN", deadline: scenario === "late" ? new Date(0) : null, quotas: scenario === "sport" ? [] : [{ sport: "football", ageLimit: 28 }] }) },
      application: { findUnique: async () => scenario === "duplicate" ? { id: "existing" } : null, create: async () => { created = true; } },
    }, { getBucket: async () => ({ data: { public: false } }) });
    const r = await h.load("app/api/applications/route.ts").POST(request({ competitionId: "c", sport: "football", category: "male" }));
    assert.equal(r.status, scenario === "duplicate" ? 409 : 400, scenario); assert.equal(created, false);
  }
});
