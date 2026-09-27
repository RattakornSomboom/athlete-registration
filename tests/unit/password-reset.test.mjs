import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
process.env.JWT_SECRET = "unit-test-password-reset-secret-only";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  getPasswordTokenVersion,
  validateNewPassword,
  checkResetRateLimit,
  PasswordResetError,
} from "../../lib/password-reset.ts";

test("createPasswordResetToken and verifyPasswordResetToken work round-trip", () => {
  const user = {
    userId: "user-123",
    email: "athlete@up.ac.th",
    userType: "USER",
    passwordHash: "$2a$10$abcdefghijklmnopqrstu",
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const token = createPasswordResetToken(user);
  assert.ok(typeof token === "string" && token.length > 20);

  const payload = verifyPasswordResetToken(token);
  assert.equal(payload.userId, "user-123");
  assert.equal(payload.email, "athlete@up.ac.th");
  assert.equal(payload.userType, "USER");
  assert.equal(payload.purpose, "password_reset");
});

test("verifyPasswordResetToken rejects tampered or expired tokens", () => {
  assert.throws(
    () => verifyPasswordResetToken("invalid.token.string"),
    (err) => err instanceof PasswordResetError && "token" in err.fieldErrors
  );

  assert.throws(
    () => verifyPasswordResetToken(""),
    (err) => err instanceof PasswordResetError && "token" in err.fieldErrors
  );
});

test("getPasswordTokenVersion changes when password changes (single-use semantics)", () => {
  const updatedAt = new Date();
  const v1 = getPasswordTokenVersion("old-password-hash-1", updatedAt);
  const v2 = getPasswordTokenVersion("new-password-hash-2", updatedAt);

  assert.notEqual(v1, v2);

  // If user changes password, payload.tokenVersion no longer matches currentVersion
  const token = createPasswordResetToken({
    userId: "user-1",
    email: "user@up.ac.th",
    userType: "USER",
    passwordHash: "old-password-hash-1",
    updatedAt,
  });

  const payload = verifyPasswordResetToken(token);
  assert.equal(payload.tokenVersion, v1);
  assert.notEqual(payload.tokenVersion, v2);
});

test("validateNewPassword validates length, match, and missing fields", () => {
  // Valid matching password >= 8 characters
  const valid = validateNewPassword("Passw0rd123!", "Passw0rd123!");
  assert.equal(valid, "Passw0rd123!");

  // Too short (< 8 chars)
  assert.throws(
    () => validateNewPassword("short", "short"),
    (err) => err instanceof PasswordResetError && "password" in err.fieldErrors
  );

  // Missing confirmPassword
  assert.throws(
    () => validateNewPassword("Passw0rd123!", ""),
    (err) => err instanceof PasswordResetError && "confirmPassword" in err.fieldErrors
  );

  // Mismatch
  assert.throws(
    () => validateNewPassword("Passw0rd123!", "Passw0rd456!"),
    (err) => err instanceof PasswordResetError && "confirmPassword" in err.fieldErrors
  );
});

test("checkResetRateLimit throttles rapid spam per email", () => {
  const email1 = `test-rate-${Date.now()}@up.ac.th`;
  const email2 = `test-rate-other-${Date.now()}@up.ac.th`;

  // First request: allowed
  assert.equal(checkResetRateLimit(email1, 1000), true);

  // Immediate second request: throttled
  assert.equal(checkResetRateLimit(email1, 1000), false);

  // Different email: allowed
  assert.equal(checkResetRateLimit(email2, 1000), true);
});

test("reset tokens expire after precisely 15 minutes and require well-formed claims", () => {
  const token = createPasswordResetToken({ userId: "u", email: "u@example.org", userType: "USER", passwordHash: "hash", updatedAt: new Date() });
  const payload = jwt.decode(token);
  assert.equal(payload.exp - payload.iat, 900);
  const sign = (overrides) => jwt.sign({ ...payload, ...overrides }, process.env.JWT_SECRET);
  for (const overrides of [{ userType: "ADMIN" }, { userId: 123 }, { tokenVersion: null }, { exp: payload.iat + 3600 }, { exp: 1 }]) {
    assert.throws(() => verifyPasswordResetToken(sign(overrides)), PasswordResetError);
  }
});

test("password fingerprint includes the entire hash and password byte limit is enforced", () => {
  const time = new Date();
  assert.notEqual(getPasswordTokenVersion("one-identical-suffix", time), getPasswordTokenVersion("two-identical-suffix", time));
  assert.equal(validateNewPassword("ก".repeat(24), "ก".repeat(24)), "ก".repeat(24));
  assert.throws(() => validateNewPassword("ก".repeat(25), "ก".repeat(25)), PasswordResetError);
});

test("missing JWT secret fails closed without a predictable fallback", () => {
  const saved = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    assert.throws(() => createPasswordResetToken({ userId: "u", email: "u@example.org", userType: "USER", passwordHash: "hash", updatedAt: new Date() }), /JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = saved;
  }
});
