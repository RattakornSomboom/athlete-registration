import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.TEST_BASE_URL || !process.env.TEST_DATABASE_URL || process.env.TEST_ALLOW_WRITE !== "yes") throw Error("Explicit isolated test configuration required");
const base = new URL(process.env.TEST_BASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw Error("Local test server required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });

test("ADMIN temporary recovery revokes sessions and forces change without email", { timeout: 120000 }, async () => {
  const tag = randomUUID();
  const ids = [];
  const clubIds = [];
  const initialPassword = "Initial!" + tag;
  async function call(path, cookie, data, method = data === undefined ? "GET" : "POST") {
    return fetch(new URL(path, base), { method, redirect: "manual", headers: { Cookie: cookie ?? "", "Content-Type": "application/json" }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  }
  async function login(email, password) {
    const response = await call("/api/auth/login", "", { username: email, password });
    const data = await response.json();
    return { response, data, cookie: response.headers.getSetCookie().find(c => c.startsWith("token="))?.split(";")[0] };
  }
  try {
    for (const role of ["ADMIN", "STAFF", "ATHLETE"]) {
      const user = await db.user.create({ data: { role, email: `${tag}-${role}@example.test`, password: await bcrypt.hash(initialPassword, 4) } });
      ids.push(user.id);
    }
    const admin = await login(`${tag}-ADMIN@example.test`, initialPassword);
    assert.equal(admin.response.status, 200, "Server must use the isolated test DB");
    const staff = await login(`${tag}-STAFF@example.test`, initialPassword);
    const old = await login(`${tag}-ATHLETE@example.test`, initialPassword);
    const path = `/api/admin/users/${ids[2]}/reset-password`;
    assert.equal((await call(path, staff.cookie, { identityVerified: true })).status, 403);
    assert.equal((await call(path, admin.cookie, {})).status, 400);
    const reset = await call(path, admin.cookie, { identityVerified: true });
    assert.equal(reset.status, 200);
    const { temporaryPassword } = await reset.json();
    assert.equal((await call("/api/auth/me", old.cookie)).status, 401);
    assert.equal((await login(`${tag}-ATHLETE@example.test`, initialPassword)).response.status, 401);
    const temporary = await login(`${tag}-ATHLETE@example.test`, temporaryPassword);
    assert.equal(temporary.data.mustChangePassword, true);
    assert.equal((await call("/api/applications", temporary.cookie)).status, 401);
    const redirect = await call("/athlete/status", temporary.cookie);
    assert.equal(new URL(redirect.headers.get("location"), base).pathname, "/change-password");
    const finalPassword = "Final!" + tag;
    assert.equal((await call("/api/auth/password", temporary.cookie, { oldPassword: temporaryPassword, newPassword: finalPassword, confirmPassword: finalPassword }, "PUT")).status, 200);
    assert.equal((await login(`${tag}-ATHLETE@example.test`, temporaryPassword)).response.status, 401);
    assert.equal((await call("/api/auth/me", temporary.cookie)).status, 401);
    const final = await login(`${tag}-ATHLETE@example.test`, finalPassword);
    assert.equal(final.response.status, 200);
    assert.equal(final.data.mustChangePassword, false);
    await db.user.update({ where: { id: ids[2] }, data: { isActive: false } });
    const suspended = await call(path, admin.cookie, { identityVerified: true });
    assert.equal(suspended.status, 200);
    assert.equal((await login(`${tag}-ATHLETE@example.test`, (await suspended.json()).temporaryPassword)).response.status, 403);
    assert.equal((await db.user.findUnique({ where: { id: ids[2] } })).isActive, false);
    const club = await db.club.create({ data: { name: tag, sport: "football", email: `${tag}-club@example.test`, password: await bcrypt.hash(initialPassword, 4) } });
    clubIds.push(club.id);
    const clubLogin = await login(club.email, initialPassword);
    assert.equal(clubLogin.response.status, 200);
    const clubPath = `/api/clubs/${club.id}`;
    assert.equal((await call(clubPath, staff.cookie, { isActive: false }, "PUT")).status, 403);
    assert.equal((await call(clubPath, clubLogin.cookie, { isActive: false }, "PUT")).status, 403);
    assert.equal((await call(clubPath, admin.cookie, { isActive: false }, "PUT")).status, 200);
    assert.equal((await call("/api/auth/me", clubLogin.cookie)).status, 401);
    assert.equal((await login(club.email, initialPassword)).response.status, 403);
    const clubReset = await call(`/api/admin/clubs/${club.id}/reset-password`, admin.cookie, { identityVerified: true });
    assert.equal(clubReset.status, 200);
    const clubTemporaryPassword = (await clubReset.json()).temporaryPassword;
    assert.equal((await db.club.findUnique({ where: { id: club.id } })).isActive, false);
    assert.equal((await login(club.email, clubTemporaryPassword)).response.status, 403);
    assert.equal((await call(clubPath, admin.cookie, { isActive: true }, "PUT")).status, 200);
    const clubTemporary = await login(club.email, clubTemporaryPassword);
    assert.equal(clubTemporary.response.status, 200);
    assert.equal(clubTemporary.data.mustChangePassword, true);
    assert.equal((await call("/api/auth/me", clubTemporary.cookie)).status, 401);
    assert.equal((await call("/api/auth/password", clubTemporary.cookie, { oldPassword: clubTemporaryPassword, newPassword: finalPassword, confirmPassword: finalPassword }, "PUT")).status, 200);
    assert.equal((await login(club.email, clubTemporaryPassword)).response.status, 401);
    assert.equal((await call("/api/auth/me", clubTemporary.cookie)).status, 401);
    const clubFinal = await login(club.email, finalPassword);
    assert.equal(clubFinal.response.status, 200);
    assert.equal(clubFinal.data.mustChangePassword, false);
  } finally {
    // Remove only this test's audit events and accounts.
    const audits = await db.systemSetting.findMany({ where: { key: { startsWith: "audit_logs:" } } });
    const keys = audits.filter(row => [...ids, ...clubIds].includes(row.value?.entityId)).map(row => row.key);
    await db.systemSetting.deleteMany({ where: { key: { in: keys } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.club.deleteMany({ where: { id: { in: clubIds } } });
    await db.$disconnect();
  }
});
