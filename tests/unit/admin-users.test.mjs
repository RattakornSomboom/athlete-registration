import test from "node:test";
import assert from "node:assert/strict";
import {
  ValidationError,
  validateAccountAccessChange,
  validateCreateUserInput,
  validateUpdateUserInput,
} from "../../lib/validation.ts";

test("validateCreateUserInput accepts valid internal roles and normalizes email", () => {
  for (const role of ["STAFF", "ADMIN", "TEAM_OFFICIAL"]) {
    const result = validateCreateUserInput({
      name: "นาย ทดสอบ ระบบ",
      email: ` TEST_${role}@UP.AC.TH `,
      password: "Password123!",
      role: role.toLowerCase(),
      phone: " 0812345678 ",
      isActive: true,
    });

    assert.equal(result.name, "นาย ทดสอบ ระบบ");
    assert.equal(result.email, `test_${role.toLowerCase()}@up.ac.th`);
    assert.equal(result.role, role);
    assert.equal(result.phone, "0812345678");
    assert.equal(result.isActive, true);
  }
});

test("validateCreateUserInput rejects missing name, short password, bad email, and athlete role", () => {
  for (const isActive of ["false", 0, null, {}]) {
    assert.throws(() => validateCreateUserInput({ name: "Staff", email: "staff@example.org", password: "Password123!", role: "STAFF", isActive }), (err) => err instanceof ValidationError && "isActive" in err.fieldErrors);
  }
  // Missing name
  assert.throws(
    () =>
      validateCreateUserInput({
        name: "   ",
        email: "staff@up.ac.th",
        password: "Password123!",
        role: "STAFF",
      }),
    (err) => err instanceof ValidationError && "name" in err.fieldErrors
  );

  // Short password (< 8 chars)
  assert.throws(
    () =>
      validateCreateUserInput({
        name: "สมศรี",
        email: "staff@up.ac.th",
        password: "short",
        role: "STAFF",
      }),
    (err) => err instanceof ValidationError && "password" in err.fieldErrors
  );

  // Invalid email
  assert.throws(
    () =>
      validateCreateUserInput({
        name: "สมศรี",
        email: "not-an-email",
        password: "Password123!",
        role: "STAFF",
      }),
    (err) => err instanceof ValidationError && "email" in err.fieldErrors
  );

  // ATHLETE is not allowed in internal creation
  assert.throws(
    () =>
      validateCreateUserInput({
        name: "สมศรี",
        email: "athlete@up.ac.th",
        password: "Password123!",
        role: "ATHLETE",
      }),
    (err) => err instanceof ValidationError && "role" in err.fieldErrors
  );

  // Arbitrary invalid role
  assert.throws(
    () =>
      validateCreateUserInput({
        name: "สมศรี",
        email: "hacker@up.ac.th",
        password: "Password123!",
        role: "HACKER",
      }),
    (err) => err instanceof ValidationError && "role" in err.fieldErrors
  );
});

test("validateUpdateUserInput accepts partial updates and normalizes fields", () => {
  const update1 = validateUpdateUserInput({ name: " นาย สมชาย " });
  assert.equal(update1.name, "นาย สมชาย");

  const update2 = validateUpdateUserInput({ email: " NEW@UP.AC.TH " });
  assert.equal(update2.email, "new@up.ac.th");

  const update3 = validateUpdateUserInput({ role: "staff" });
  assert.equal(update3.role, "STAFF");

  const update4 = validateUpdateUserInput({ isActive: false });
  assert.equal(update4.isActive, false);

  const update5 = validateUpdateUserInput({ phone: "" });
  assert.equal(update5.phone, "");
});

test("validateUpdateUserInput rejects empty payload and invalid field types", () => {
  assert.throws(
    () => validateUpdateUserInput({}),
    (err) => err instanceof ValidationError
  );

  assert.throws(
    () => validateUpdateUserInput({ name: "   " }),
    (err) => err instanceof ValidationError && "name" in err.fieldErrors
  );

  assert.throws(
    () => validateUpdateUserInput({ email: "invalid" }),
    (err) => err instanceof ValidationError && "email" in err.fieldErrors
  );

  assert.throws(
    () => validateUpdateUserInput({ role: "INVALID_ROLE" }),
    (err) => err instanceof ValidationError && "role" in err.fieldErrors
  );

  assert.throws(
    () => validateUpdateUserInput({ isActive: "not-boolean" }),
    (err) => err instanceof ValidationError && "isActive" in err.fieldErrors
  );
});

test("production account policy protects self and last active admin", () => {
  const base = { actorId: "actor", targetId: "target", currentRole: "ADMIN", currentActive: true, activeAdminCount: 1 };
  assert.throws(() => validateAccountAccessChange({ ...base, nextActive: false }), ValidationError);
  assert.throws(() => validateAccountAccessChange({ ...base, nextRole: "STAFF" }), ValidationError);
  assert.throws(() => validateAccountAccessChange({ ...base, targetId: "actor", activeAdminCount: 2, nextActive: false }), ValidationError);
  assert.throws(() => validateAccountAccessChange({ ...base, targetId: "actor", activeAdminCount: 2, nextRole: "STAFF" }), ValidationError);
  assert.doesNotThrow(() => validateAccountAccessChange({ ...base, activeAdminCount: 2, nextActive: false }));
  assert.doesNotThrow(() => validateAccountAccessChange({ ...base, currentRole: "STAFF", nextActive: false }));
  assert.doesNotThrow(() => validateAccountAccessChange({ ...base, currentActive: false, nextRole: "STAFF" }));
});

test("removed roles cannot be created or assigned", () => {
  for (const role of ["SUPERADMIN", "DEV"]) {
    assert.throws(() => validateCreateUserInput({ name: "Test", email: "test@example.org", password: "Password123!", role }), ValidationError);
    assert.throws(() => validateUpdateUserInput({ role }), ValidationError);
  }
});
