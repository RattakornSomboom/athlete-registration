import test from "node:test";
import assert from "node:assert/strict";
import { sendPasswordResetEmail, PasswordResetDeliveryError } from "../../lib/password-reset-delivery.ts";

test("reset email uses configured trusted origin and never calls a provider without configuration", async (t) => {
  const saved = { RESEND_API_KEY: process.env.RESEND_API_KEY, PASSWORD_RESET_FROM_EMAIL: process.env.PASSWORD_RESET_FROM_EMAIL, APP_URL: process.env.APP_URL };
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    calls.push(args);
    return new Response(JSON.stringify({ id: "mock-email" }), { status: 200 });
  });
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendPasswordResetEmail("test@example.org", "test-token"), PasswordResetDeliveryError);
  assert.equal(calls.length, 0);
  process.env.RESEND_API_KEY = "test-key";
  process.env.PASSWORD_RESET_FROM_EMAIL = "Sports <sports@example.org>";
  process.env.APP_URL = "https://sports.example.org";
  await sendPasswordResetEmail("test@example.org", "test-token");
  assert.equal(calls[0][0], "https://api.resend.com/emails");
  const body = JSON.parse(calls[0][1].body);
  assert.deepEqual(body.to, ["test@example.org"]);
  assert.match(body.text, /https:\/\/sports.example.org\/reset-password\?token=test-token/);
  assert.match(body.text, /15/);
  process.env.APP_URL = "http://untrusted.example.org";
  await assert.rejects(sendPasswordResetEmail("test@example.org", "test-token"), PasswordResetDeliveryError);
  assert.equal(calls.length, 1);
  process.env.APP_URL = "https://sports.example.org";
  t.mock.method(globalThis, "fetch", async () => new Response("provider-secret", { status: 500 }));
  await assert.rejects(sendPasswordResetEmail("test@example.org", "test-token"), (error) => error instanceof PasswordResetDeliveryError && !error.message.includes("provider-secret"));
});
