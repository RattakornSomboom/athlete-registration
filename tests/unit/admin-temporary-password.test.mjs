import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { routeLoader } from "../helpers/load-route.mjs";

function harness(kind = "USER") {
  process.env.JWT_SECRET = "temporary-password-unit-test-secret";
  let account = { id: "target", role: kind === "CLUB" ? "CLUB" : "ATHLETE", isActive: true, password: "old-hash", mustChangePassword: false };
  const audits = [];
  let actor = { id: "admin", role: "ADMIN" };
  let failAudit = false;
  const model = { findUnique: async () => account, update: async ({ data }) => (account = { ...account, ...data }) };
  const db = { user: model, club: model, systemSetting: { create: async ({ data }) => { if (failAudit) throw Error("audit failed"); audits.push(data); } } };
  db.$transaction = async fn => {
    const before = { ...account };
    try { return await fn(db); } catch (e) { account = before; throw e; }
  };
  const load = routeLoader({ "@/lib/prisma": { prisma: db }, "@/lib/auth": { getSession: async () => actor, credentialVersion: value => value } });
  return { load, db, audits, get account() { return account; }, setActor: value => { actor = value; }, failAudit: () => { failAudit = true; } };
}
const request = data => new Request("http://localhost/api/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
const context = { params: Promise.resolve({ id: "target" }) };

test("only ADMIN with identity confirmation can reset User and legacy Club accounts", async () => {
  for (const kind of ["USER", "CLUB"]) {
    const h = harness(kind);
    const route = h.load(`app/api/admin/${kind === "USER" ? "users" : "clubs"}/[id]/reset-password/route.ts`);
    for (const role of ["ATHLETE", "STAFF", "CLUB", "TEAM_OFFICIAL"]) {
      h.setActor({ id: "actor", role });
      assert.equal((await route.POST(request({ identityVerified: true }), context)).status, 403);
    }
    h.setActor(null);
    assert.equal((await route.POST(request({ identityVerified: true }), context)).status, 401);
    h.setActor({ id: "admin", role: "ADMIN" });
    assert.equal((await route.POST(request({}), context)).status, 400);
    h.account.isActive = false;
    const response = await route.POST(request({ identityVerified: true }), context);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const { temporaryPassword } = await response.json();
    assert.equal(temporaryPassword.length, 24);
    assert.equal(await bcrypt.compare(temporaryPassword, h.account.password), true);
    assert.equal(h.account.isActive, false);
    assert.equal(h.account.mustChangePassword, true);
    assert.equal(JSON.stringify(h.audits).includes(temporaryPassword), false);
    assert.equal(JSON.stringify(h.audits).includes(h.account.password), false);
  }
});

test("failed audit rolls back reset and never returns the temporary password", async () => {
  const h = harness(); h.failAudit();
  const route = h.load("app/api/admin/users/[id]/reset-password/route.ts");
  const response = await route.POST(request({ identityVerified: true }), context);
  assert.equal(response.status, 500);
  assert.equal((await response.json()).temporaryPassword, undefined);
  assert.equal(h.account.password, "old-hash");
});

test("credential binding revokes old sessions and forces password change server-side", async () => {
  const h = harness();
  const auth = routeLoader({ "@/lib/prisma": { prisma: h.db } })("lib/auth.ts");
  const cookie = token => ({ cookies: { get: () => ({ value: token }) } });
  const token = auth.signToken({ id: "target", role: "ATHLETE", credentialVersion: auth.credentialVersion(h.account.password) });
  assert.ok(await auth.getSession(cookie(token)));
  h.account.password = "new-hash"; h.account.mustChangePassword = true;
  assert.equal(await auth.getSession(cookie(token), true), null);
  const fresh = auth.signToken({ id: "target", role: "ATHLETE", credentialVersion: auth.credentialVersion(h.account.password) });
  assert.equal(await auth.getSession(cookie(fresh)), null);
  assert.equal((await auth.getSession(cookie(fresh), true)).mustChangePassword, true);
  h.account.isActive = false;
  assert.equal(await auth.getSession(cookie(fresh), true), null);
});

test("password change rejects reused credentials and commits flag plus audit atomically", async () => {
  for (const kind of ["USER", "CLUB"]) {
    const h = harness(kind);
    h.account.password = await bcrypt.hash("TemporaryPass123!", 4); h.account.mustChangePassword = true;
    h.setActor({ id: "target", role: h.account.role, ...(kind === "CLUB" ? { clubId: "target" } : {}), credentialVersion: h.account.password });
    const route = h.load("app/api/auth/password/route.ts");
    assert.equal((await route.PUT(request({ oldPassword: "TemporaryPass123!", newPassword: "TemporaryPass123!" }))).status, 400);
    assert.equal((await route.PUT(request({ oldPassword: "wrong", newPassword: "NewPassword123!" }))).status, 400);
    const response = await route.PUT(request({ oldPassword: "TemporaryPass123!", newPassword: "NewPassword123!", confirmPassword: "NewPassword123!" }));
    assert.equal(response.status, 200);
    assert.equal(h.account.mustChangePassword, false);
    assert.equal(await bcrypt.compare("NewPassword123!", h.account.password), true);
    assert.match(response.headers.get("set-cookie"), /token=/);
    assert.equal(h.audits.length, 1);
  }
});

test("email reset pages, APIs and delivery implementation are removed", () => {
  for (const file of ["app/forgot-password/page.tsx", "app/reset-password/page.tsx", "app/api/auth/forgot-password/route.ts", "app/api/auth/reset-password/route.ts", "lib/password-reset.ts", "lib/password-reset-delivery.ts"]) assert.equal(fs.existsSync(file), false);
});

test("ADMIN cannot bypass temporary recovery through club profile password edits", async () => {
  const h = harness("CLUB");
  const route = h.load("app/api/clubs/[id]/route.ts");
  assert.equal((await route.PUT(request({ password: "BypassPassword123!" }), context)).status, 400);
  assert.equal(h.account.password, "old-hash");
});

test("self-reset is rejected and a failed password-change audit preserves the temporary credential", async () => {
  const h = harness();
  h.setActor({ id: "target", role: "ADMIN" });
  const reset = h.load("app/api/admin/users/[id]/reset-password/route.ts");
  assert.equal((await reset.POST(request({ identityVerified: true }), context)).status, 403);
  h.account.password = await bcrypt.hash("TemporaryPass123!", 4); h.account.mustChangePassword = true;
  const original = h.account.password;
  h.setActor({ id: "target", role: "ATHLETE", credentialVersion: original });
  h.failAudit();
  const change = h.load("app/api/auth/password/route.ts");
  assert.equal((await change.PUT(request({ oldPassword: "TemporaryPass123!", newPassword: "NewPassword123!" }))).status, 500);
  assert.equal(h.account.password, original);
  assert.equal(h.account.mustChangePassword, true);
});
