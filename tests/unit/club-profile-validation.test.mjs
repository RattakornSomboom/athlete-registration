import assert from "node:assert/strict";
import test from "node:test";
import { clubProfileInput, ValidationError } from "../../lib/staff-profile-validation.ts";

test("clubProfileInput trims and normalizes profile values", () => {
  assert.deepEqual(clubProfileInput({ name: "  Club Name  ", email: " CLUB@UP.AC.TH ", sport: "  มวยไทย   สมัครเล่น " }), {
    name: "Club Name",
    email: "club@up.ac.th",
    sport: "มวยไทย   สมัครเล่น",
  });
});

test("clubProfileInput rejects empty, oversized, and invalid email fields", () => {
  const tooLongEmail = `${"a".repeat(250)}@up.ac.th`;
  for (const payload of [
    { name: "   " },
    { name: "x".repeat(201) },
    { email: "bad-email" },
    { email: tooLongEmail },
    { sport: " " },
    { sport: "x".repeat(101) },
    { isActive: "true" },
  ]) {
    assert.throws(() => clubProfileInput(payload), ValidationError);
  }
});

test("clubProfileInput rejects mass-assignment and unknown fields", () => {
  for (const key of ["password", "role", "id", "status", "presidentPhone"]) {
    assert.throws(
      () => clubProfileInput({ name: "Club", [key]: "admin" }),
      error => error instanceof ValidationError && key in error.fieldErrors
    );
  }
});

test("clubProfileInput rejects empty updates and non-object payloads", () => {
  for (const payload of [{}, null, [], "name", 1]) {
    assert.throws(() => clubProfileInput(payload), ValidationError);
  }
});
