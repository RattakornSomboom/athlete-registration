import test from "node:test";
import assert from "node:assert/strict";

// This suite intentionally uses no valid accounts or reset tokens and never writes to a database.
const base = process.env.TEST_BASE_URL;
if (!base) throw new Error("TEST_BASE_URL is required for account smoke tests");
const origin = new URL(base);
if (!["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) {
  throw new Error("Account smoke tests require a local server");
}

async function request(path, options = {}) {
  return fetch(new URL(path, origin), { redirect: "manual", ...options });
}

test("removed dev routes cannot render or issue credentials", async () => {
  for (const path of ["/dev", "/superadmin"]) assert.equal((await request(path)).status, 404);
  const response = await request("/api/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "admin" }) });
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("release mutations and private files require authentication", async () => {
  for (const [path, method] of [["/api/competitions", "POST"], ["/api/competitions/missing", "PATCH"], ["/api/staff/applications/announce", "POST"], ["/api/documents/missing", "DELETE"], ["/api/documents/missing/download", "GET"]]) {
    const response = await request(path, { method, ...(method === "GET" ? {} : { headers: { "Content-Type": "application/json" }, body: "{}" }) });
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});

test("email recovery endpoints are removed and forced password page requires login", async () => {
  for (const path of ["/forgot-password", "/reset-password", "/api/auth/forgot-password", "/api/auth/reset-password"]) {
    assert.equal((await request(path)).status, 404);
  }
  for (const path of ["/api/auth/forgot-password", "/api/auth/reset-password"]) {
    assert.equal((await request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 404);
  }
  const response = await request("/change-password");
  assert.ok([302, 303, 307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location"), origin).pathname, "/login");
});

test("every account management API rejects unauthenticated requests", async () => {
  const routes = [
    ["GET", "/api/admin/users"],
    ["POST", "/api/admin/users"],
    ["GET", "/api/admin/users/smoke-nonexistent"],
    ["PATCH", "/api/admin/users/smoke-nonexistent"],
    ["PATCH", "/api/admin/users/smoke-nonexistent/role"],
    ["PATCH", "/api/admin/users/smoke-nonexistent/status"],
    ["POST", "/api/admin/users/smoke-nonexistent/reset-password"],
  ];
  for (const [method, path] of routes) {
    const response = await request(path, { method });
    assert.equal(response.status, 401, `${method} ${path}`);
    const data = await response.json();
    assert.equal(typeof data.error, "string");
    assert.equal(data.user, undefined);
    assert.equal(data.users, undefined);
  }
});
