import assert from "node:assert/strict";
import test from "node:test";
import {
  canAthleteCancelApplication,
  canAthleteEditApplication,
  getAthleteDecisionStatus,
  canAthleteDecide,
} from "../../lib/athlete-decision-service.ts";

test("canAthleteCancelApplication allows cancellation only during pre-selection SUBMITTED or CLUB_REJECTED stage and not in roster", () => {
  // Allowed to cancel
  assert.equal(canAthleteCancelApplication({ status: "SUBMITTED", rosterItem: null }), true);
  assert.equal(canAthleteCancelApplication({ status: "SUBMITTED" }), true);
  assert.equal(canAthleteCancelApplication({ status: "CLUB_REJECTED", rosterItem: null }), true);
  assert.equal(canAthleteCancelApplication({ status: "CLUB_REJECTED", hasRosterItem: false }), true);

  // Not allowed once in roster
  assert.equal(canAthleteCancelApplication({ status: "SUBMITTED", rosterItem: { squadType: "main" } }), false);
  assert.equal(canAthleteCancelApplication({ status: "CLUB_REJECTED", hasRosterItem: true }), false);

  // Not allowed after club or staff approvals / final selection
  assert.equal(canAthleteCancelApplication({ status: "CLUB_APPROVED", rosterItem: null }), false);
  assert.equal(canAthleteCancelApplication({ status: "STAFF_APPROVED", rosterItem: null }), false);
  assert.equal(canAthleteCancelApplication({ status: "FINAL_SELECTED", rosterItem: null }), false);
});

test("canAthleteEditApplication allows editing during SUBMITTED and CLUB_REJECTED stages when not in roster", () => {
  assert.equal(canAthleteEditApplication({ status: "SUBMITTED", rosterItem: null }), true);
  assert.equal(canAthleteEditApplication({ status: "CLUB_REJECTED", rosterItem: null }), true);
  assert.equal(canAthleteEditApplication({ status: "SUBMITTED", hasRosterItem: false }), true);
  assert.equal(canAthleteEditApplication({ status: "CLUB_REJECTED", hasRosterItem: false }), true);

  // Locked once in roster or approved
  assert.equal(canAthleteEditApplication({ status: "SUBMITTED", rosterItem: { squadType: "main" } }), false);
  assert.equal(canAthleteEditApplication({ status: "CLUB_REJECTED", hasRosterItem: true }), false);
  assert.equal(canAthleteEditApplication({ status: "CLUB_APPROVED", rosterItem: null }), false);
  assert.equal(canAthleteEditApplication({ status: "STAFF_APPROVED", rosterItem: null }), false);
  assert.equal(canAthleteEditApplication({ status: "FINAL_SELECTED", rosterItem: null }), false);
});

test("getAthleteDecisionStatus and canAthleteDecide track representation decision state", () => {
  // Not selected yet
  assert.equal(getAthleteDecisionStatus({ status: "SUBMITTED", statusHistory: [] }), "NOT_ELIGIBLE");
  assert.equal(canAthleteDecide({ status: "SUBMITTED", statusHistory: [] }), false);

  assert.equal(getAthleteDecisionStatus({ status: "STAFF_APPROVED", statusHistory: [] }), "NOT_ELIGIBLE");
  assert.equal(canAthleteDecide({ status: "STAFF_APPROVED", statusHistory: [] }), false);

  // Final selected, awaiting decision
  const finalPending = {
    status: "FINAL_SELECTED",
    statusHistory: [{ status: "FINAL_SELECTED" }],
  };
  assert.equal(getAthleteDecisionStatus(finalPending), "PENDING");
  assert.equal(canAthleteDecide(finalPending), true);

  // Final selected, athlete confirmed
  const finalConfirmed = {
    status: "FINAL_SELECTED",
    statusHistory: [
      { status: "FINAL_SELECTED" },
      { status: "ATHLETE_CONFIRMED" },
    ],
  };
  assert.equal(getAthleteDecisionStatus(finalConfirmed), "CONFIRMED");
  assert.equal(canAthleteDecide(finalConfirmed), false);

  // Final selected, athlete declined
  const finalDeclined = {
    status: "FINAL_SELECTED",
    statusHistory: [
      { status: "FINAL_SELECTED" },
      { status: "ATHLETE_DECLINED" },
    ],
  };
  assert.equal(getAthleteDecisionStatus(finalDeclined), "DECLINED");
  assert.equal(canAthleteDecide(finalDeclined), false);
});