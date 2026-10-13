import assert from "node:assert/strict";
import test from "node:test";
import {
  canReviewStaffRequest,
  normalizeStaffRequestDecision,
  StaffRequestInputError,
} from "../../lib/staff-request-validation.ts";

test("staff request reviewers are limited to STAFF and ADMIN", () => {
  assert.equal(canReviewStaffRequest("STAFF"), true);
  assert.equal(canReviewStaffRequest("ADMIN"), true);
  assert.equal(canReviewStaffRequest("CLUB"), false);
  assert.equal(canReviewStaffRequest(undefined), false);
});

test("approval clears rejection reason", () => {
  assert.deepEqual(normalizeStaffRequestDecision({ status: "APPROVED", rejectedReason: "old reason" }), {
    status: "APPROVED",
    rejectedReason: null,
  });
});

test("rejection trims and keeps a valid reason", () => {
  assert.deepEqual(normalizeStaffRequestDecision({ status: "REJECTED", rejectedReason: "  เอกสารไม่ครบ  " }), {
    status: "REJECTED",
    rejectedReason: "เอกสารไม่ครบ",
  });
});

test("decision validation rejects invalid status, blank reason, and oversized reason", () => {
  for (const input of [
    { status: "PENDING" },
    { status: "REJECTED", rejectedReason: "   " },
    { status: "REJECTED", rejectedReason: "x".repeat(5001) },
  ]) {
    assert.throws(() => normalizeStaffRequestDecision(input), StaffRequestInputError);
  }
});
