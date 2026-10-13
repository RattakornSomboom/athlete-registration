import assert from "node:assert/strict";
import test from "node:test";
import { staffProfileOutput, updateStaffProfileEmail } from "../../lib/staff-profile.ts";
import { staffProfileInput, ValidationError } from "../../lib/staff-profile-validation.ts";

test("staffProfileInput normalizes valid email to lowercase", () => {
  const result = staffProfileInput({ email: "  STAFF.Member@UP.AC.TH  " });
  assert.equal(result.email, "staff.member@up.ac.th");
});

test("staffProfileInput rejects empty, invalid, and too-long email", () => {
  for (const email of ["", "invalid-email", `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@up.ac.th`]) {
    assert.throws(
      () => staffProfileInput({ email }),
      (error) => error instanceof ValidationError && "email" in error.fieldErrors
    );
  }
});

test("staffProfileInput rejects forbidden fields for mass assignment prevention", () => {
  for (const forbidden of ["role", "isActive", "password", "id"]) {
    assert.throws(
      () => staffProfileInput({ email: "staff@up.ac.th", [forbidden]: "ADMIN" }),
      (error) => error instanceof ValidationError && forbidden in error.fieldErrors
    );
  }
});

test("staffProfileOutput returns only the allowed staff profile fields", () => {
  const now = new Date("2026-10-08T00:00:00.000Z");
  const output = staffProfileOutput({
    id: "user-1",
    email: "staff@up.ac.th",
    role: "STAFF",
    createdAt: now,
    updatedAt: now,
    password: "secret",
    mustChangePassword: false,
    credentialVersion: "version",
    profile: { firstName: "ไม่ควรหลุด" },
  });

  assert.deepEqual(Object.keys(output).sort(), ["createdAt", "email", "id", "role", "updatedAt"]);
  assert.equal(output.email, "staff@up.ac.th");
  assert.equal(output.password, undefined);
  assert.equal(output.profile, undefined);
});

test("updateStaffProfileEmail updates only the authenticated user's email", async () => {
  const calls = [];
  const now = new Date("2026-10-08T00:00:00.000Z");
  const client = {
    user: {
      update: async (args) => {
        calls.push(args);
        return {
          id: args.where.id,
          email: args.data.email,
          role: "ADMIN",
          createdAt: now,
          updatedAt: now,
        };
      },
    },
  };

  const output = await updateStaffProfileEmail("staff-session-id", "new@up.ac.th", client);

  assert.equal(output.email, "new@up.ac.th");
  assert.deepEqual(calls, [{
    where: { id: "staff-session-id" },
    data: { email: "new@up.ac.th" },
    select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
  }]);
});



