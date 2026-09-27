import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

if (!process.env.TEST_BASE_URL || !process.env.TEST_DATABASE_URL || process.env.TEST_ALLOW_WRITE !== "yes") throw new Error("Dedicated TEST_BASE_URL, TEST_DATABASE_URL and TEST_ALLOW_WRITE=yes required");
const base = new URL(process.env.TEST_BASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw new Error("Local test server required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });
const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tag = "release-" + randomUUID();
const password = "Test!" + randomUUID();
const users = [], competitions = [], documents = [];
async function call(path, cookie = "", data, method = data === undefined ? "GET" : "POST", expected = 200) {
  const response = await fetch(new URL(path, base), { method, headers: { Cookie: cookie, ...(data && !(data instanceof FormData) ? { "Content-Type": "application/json" } : {}) }, body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data), redirect: "manual" });
  const text = await response.text();
  let json = {}; try { json = JSON.parse(text); } catch { /* CSV or HTML */ }
  assert.equal(response.status, expected, `${method} ${path}: ${json.error ?? text.slice(0, 100)}`);
  return { response, json, text };
}
async function login(username) {
  const { response } = await call("/api/auth/login", "", { username, password });
  return response.headers.getSetCookie().find(c => c.startsWith("token=")).split(";")[0];
}
test("Release core flow persists configuration, application, review and competition-scoped result", { timeout: 180000 }, async () => {
  try {
    for (const role of ["ADMIN", "STAFF"]) {
      const u = await db.user.create({ data: { email: `${tag}-${role}@example.test`, password: await bcrypt.hash(password, 4), role } });
      users.push(u.id);
    }
    const admin = await login(`${tag}-ADMIN@example.test`), staff = await login(`${tag}-STAFF@example.test`);
    const studentId = "8" + String(Date.now()).slice(-7);
    const { json: registered } = await call("/api/auth/register", "", { studentId, password }, "POST", 201);
    users.push(registered.user.id);
    // A login through the server must resolve the same record as the dedicated DB.
    assert.ok(await db.user.findUnique({ where: { id: registered.user.id } }), "Server must use the dedicated test database");
    const athlete = await login(studentId);
    await call("/api/athletes/profile", athlete, { studentId, firstName: "Release", lastName: tag, faculty: "Science", major: "Test", year: "1", nationalId: "1234567890123", birthDate: "2005-01-01", addressNo: "1", subDistrict: "Test", district: "Test", province: "Test", postalCode: "56000", phone: "0800000000", studentLevel: "bachelor" }, "PUT");
    const input = { name: tag, round: "final", year: 2569, status: "CLOSED", deadline: new Date(Date.now() + 86400000).toISOString(), quotas: [{ sport: tag, maxStarters: 10, maxSubstitutes: 5, ageLimit: 28 }] };
    await call("/api/competitions", staff, input, "POST", 403);
    for (let i = 0; i < 2; i++) {
      const { json } = await call("/api/competitions", admin, { ...input, name: tag + i }, "POST", 201);
      competitions.push(json.competition.id);
      await call("/api/competitions/" + json.competition.id, admin, { status: "OPEN" }, "PATCH");
    }
    const files = {};
    for (const key of ["photoFileUrl", "idCardFileUrl", "studentCardFileUrl", "studentCertFileUrl", "upAcademyFileUrl", "fitnessTestFileUrl"]) {
      const form = new FormData(); form.set("file", new Blob(["%PDF-1.4\nfixture\n%%EOF"], { type: "application/pdf" }), "fixture.pdf");
      const { json } = await call("/api/documents", athlete, form);
      documents.push(json.document.id); files[key] = `/api/documents/${json.document.id}/download`;
    }
    const applications = [];
    for (const competitionId of competitions) {
      const payload = { competitionId, sport: tag, category: "ทั่วไป", ...files };
      const { json } = await call("/api/applications", athlete, payload, "POST", 201);
      applications.push(json.application.id);
      await call("/api/applications", athlete, payload, "POST", 409);
      await call("/api/applications/" + json.application.id, athlete, { status: "STAFF_APPROVED", label: "self" }, "PATCH", 403);
      await call("/api/applications/" + json.application.id, staff, { status: "STAFF_APPROVED", label: "reviewed" }, "PATCH");
      assert.equal((await db.application.findUnique({ where: { id: json.application.id } })).status, "STAFF_APPROVED");
    }
    const found = await call("/api/staff/applications?" + new URLSearchParams({ search: studentId, competitionId: competitions[0], sport: tag, status: "STAFF_APPROVED" }), staff);
    assert.deepEqual(found.json.applications.map(a => a.id), [applications[0]]);
    await call("/api/staff/applications/announce", staff, { competitionId: competitions[0], applicationIds: applications }, "POST", 409);
    const preview = await call("/api/staff/applications/announce?competitionId=" + competitions[0], staff);
    await call("/api/staff/applications/announce", staff, { competitionId: competitions[0], applicationIds: preview.json.applications.map(a => a.id) });
    assert.equal((await db.application.findUnique({ where: { id: applications[1] } })).status, "STAFF_APPROVED");
    const result = await call("/api/applications/" + applications[0], athlete);
    assert.equal(result.json.application.status, "FINAL_SELECTED");
    await call(result.json.application.idCardFileUrl, athlete, undefined, "GET", 302);
    await call(result.json.application.idCardFileUrl, "", undefined, "GET", 401);
    const csv = await call("/api/export/applications?competitionId=" + competitions[0] + "&status=FINAL_SELECTED", staff);
    assert.ok(csv.text.includes(applications[0])); assert.ok(!csv.text.includes(applications[1]));
    await call("/api/documents/" + documents[0], athlete, undefined, "DELETE", 403);
    await call("/dev", "", undefined, "GET", 404);
    await call("/api/auth/dev-login", "", { role: "admin" }, "POST", 404);
  } finally {
    try {
      const docs = await db.privateDocument.findMany({ where: { id: { in: documents } } });
      if (docs.length) {
        const { error } = await storage.storage.from(process.env.PRIVATE_DOCUMENT_BUCKET || "athlete-private").remove(docs.map(d => d.path));
        if (error) throw new Error("Test document cleanup failed");
      }
      await db.$transaction(async tx => {
        await tx.privateDocument.deleteMany({ where: { id: { in: documents } } });
        await tx.application.deleteMany({ where: { competitionId: { in: competitions } } });
        await tx.competition.deleteMany({ where: { id: { in: competitions } } });
        await tx.user.deleteMany({ where: { id: { in: users } } });
      });
    } finally { await db.$disconnect(); }
  }
});
