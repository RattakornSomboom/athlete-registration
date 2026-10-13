import assert from "node:assert/strict";
import test from "node:test";
import { checkAthleteEligibility, countParticipationForLevel, evaluateAge, evaluateParticipationCount, isFirstSemesterGradeExempt } from "../../lib/rule-checker.ts";

test("age uses the competition calendar year and accepts Buddhist Era years", () => {
  const result = evaluateAge(new Date("1998-12-31T00:00:00.000Z"), 2569);

  assert.equal(result.passed, true);
  assert.equal(result.age, 28);
  assert.equal(result.competitionYear, 2569);
});

test("age rejects an athlete who is over the limit by the competition year", () => {
  const result = evaluateAge(new Date("1997-12-31T00:00:00.000Z"), 2026);

  assert.equal(result.passed, false);
  assert.equal(result.age, 29);
  assert.match(result.message, /อายุเกินตามปีมหกรรม 2026/);
});

test("age normalizes a Buddhist Era birth year against a Common Era competition year", () => {
  const result = evaluateAge(new Date(Date.UTC(2568, 0, 1)), 2026);

  assert.equal(result.passed, true);
  assert.equal(result.age, 1);
});

test("the fifth bachelor participation, including this application, is allowed", () => {
  const result = evaluateParticipationCount(4, "BACHELOR");

  assert.equal(result.passed, true);
  assert.equal(result.previousCount, 4);
  assert.equal(result.currentApplicationCount, 1);
  assert.equal(result.count, 5);
});

test("the sixth bachelor participation, including this application, is rejected", () => {
  const result = evaluateParticipationCount(5, "BACHELOR");

  assert.equal(result.passed, false);
  assert.equal(result.count, 6);
  assert.match(result.message, /จำนวนครั้งการแข่งขันระดับปริญญาตรีเกิน 5 ครั้ง/);
});

test("graduate participation uses its separate three-event cap", () => {
  assert.equal(evaluateParticipationCount(2, "GRADUATE").count, 3);

  const result = evaluateParticipationCount(3, "GRADUATE");
  assert.equal(result.passed, false);
  assert.equal(result.count, 4);
  assert.match(result.message, /ระดับบัณฑิตศึกษาเกิน 3 ครั้ง/);
});

test("eligibility result exposes specific failed checks and a user-facing summary", () => {
  const result = checkAthleteEligibility({
    birthDate: new Date("1997-12-31T00:00:00.000Z"),
    competitionYear: 2569,
    gpaCumulative: "3.50",
    studentLevel: "BACHELOR",
    participationCount: 5,
  });

  assert.equal(result.isEligible, false);
  assert.match(result.message, /อายุเกินตามปีมหกรรม 2569/);
  assert.match(result.message, /จำนวนครั้งการแข่งขันระดับปริญญาตรีเกิน 5 ครั้ง/);
  assert.equal(result.rules.age.passed, false);
  assert.equal(result.rules.participationCount.count, 6);
  assert.match(result.reasons[0], /GPAX 3.50 ผ่านเกณฑ์ขั้นต่ำ 2.00/);
});

test("participation count is per level: master and PhD are combined, bachelor history ignored for graduates", () => {
  const counts = { bachelor: 4, master: 1, phd: 1 };
  assert.equal(countParticipationForLevel(counts, "BACHELOR"), 4);
  assert.equal(countParticipationForLevel(counts, "GRADUATE"), 2);
  assert.equal(evaluateParticipationCount(countParticipationForLevel(counts, "GRADUATE"), "GRADUATE").passed, true);
  assert.equal(evaluateParticipationCount(countParticipationForLevel({ master: 2, phd: 1 }, "GRADUATE"), "GRADUATE").passed, false);
});

test("graduate with 2 previous participations may apply for the 3rd", () => {
  assert.equal(evaluateParticipationCount(2, "GRADUATE").passed, true);
  assert.equal(evaluateParticipationCount(3, "GRADUATE").passed, false);
});

test("first-year bachelor in semester one is exempt when GPAX is missing", () => {
  const profile = {
    studentLevel: "BACHELOR",
    year: "1",
    semester: "1",
    gpaCumulative: null,
  };

  assert.equal(isFirstSemesterGradeExempt({ ...profile, gpaSemester: null }), true);
  assert.equal(isFirstSemesterGradeExempt({ ...profile, gpaSemester: "3.50" }), true);

  const result = checkAthleteEligibility({
    birthDate: new Date("2000-01-01T00:00:00.000Z"),
    competitionYear: 2569,
    ...profile,
    gpaSemester: "3.50",
    participationCount: 0,
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.rules.gpax.passed, true);
  assert.equal(result.rules.gpax.exempt, true);
});

test("missing GPAX is not exempt outside first-year bachelor semester one", () => {
  assert.equal(isFirstSemesterGradeExempt({
    studentLevel: "BACHELOR",
    year: "1",
    semester: "2",
    gpaCumulative: null,
  }), false);
  assert.equal(isFirstSemesterGradeExempt({
    studentLevel: "GRADUATE",
    year: "1",
    semester: "1",
    gpaCumulative: null,
  }), false);
});
