import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTeamReadiness, isTeamSport } from "../../lib/team-readiness.ts";

test("team readiness reports shortfall for 5 of 11 verified", () => {
  const result = evaluateTeamReadiness(11, 5, true);
  assert.equal(result.passed, false);
  assert.equal(result.requiredCount, 6);
  assert.equal(result.shortfall, 1);
  assert.match(result.message, /ยังขาดนักกีฬาที่มีผลงานรับรองอีก 1 คน/);
});

test("exactly 50% passes and empty roster fails", () => {
  assert.equal(evaluateTeamReadiness(10, 5, true).passed, true);
  assert.equal(evaluateTeamReadiness(0, 0, true).passed, false);
});

test("individual sports skip the team rule", () => {
  assert.equal(evaluateTeamReadiness(1, 0, false).passed, true);
  assert.equal(isTeamSport(1), false);
  assert.equal(isTeamSport(11), true);
});

test("team of 11 with 6 verified passes", () => {
  const result = evaluateTeamReadiness(11, 6, true);
  assert.equal(result.passed, true);
  assert.equal(result.shortfall, 0);
});
