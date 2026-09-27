import test from "node:test";
import assert from "node:assert/strict";
import { clubReviewProgress } from "../../lib/phase4-client.ts";

test("direct STAFF flow never claims club approval", () => {
  for (const status of ["SUBMITTED", "STAFF_APPROVED", "STAFF_REJECTED", "FINAL_SELECTED"]) {
    assert.deepEqual(clubReviewProgress({ status, rosterClub: null, statusHistory: [{ status: "SUBMITTED" }, { status }] }), {
      label: "เจ้าหน้าที่พิจารณาโดยตรง", approved: false, rejected: false,
    });
  }
});

test("club review uses recorded decisions and preserves legacy history", () => {
  const base = { rosterClub: { id: "club" }, statusHistory: [] };
  assert.equal(clubReviewProgress({ ...base, status: "SUBMITTED" }).label, "รอพิจารณา");
  assert.equal(clubReviewProgress({ ...base, status: "FINAL_SELECTED" }).approved, false);
  assert.equal(clubReviewProgress({ ...base, status: "CLUB_APPROVED" }).approved, true);
  assert.equal(clubReviewProgress({ ...base, status: "CLUB_REJECTED" }).rejected, true);
  assert.equal(clubReviewProgress({ status: "FINAL_SELECTED", rosterClub: null, statusHistory: [{ status: "CLUB_APPROVED" }, { status: "STAFF_APPROVED" }] }).approved, true);
  assert.equal(clubReviewProgress({ ...base, status: "STAFF_REJECTED", statusHistory: [{ status: "CLUB_APPROVED" }, { status: "CLUB_REJECTED" }] }).rejected, true);
});
