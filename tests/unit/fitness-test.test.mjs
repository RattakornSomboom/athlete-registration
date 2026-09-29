import assert from "node:assert/strict";
import test from "node:test";
import { getFitnessTestGroup } from "../../lib/fitness-test.ts";
import {
  validateFitnessTestStatus,
  validateFitnessTestItem,
  ValidationError,
} from "../../lib/validation.ts";
import {
  evaluateGeneralFitness,
  evaluateFootballFitness,
  evaluateBasketballFitness,
  rateFootballLowerIsBetter,
  rateBasketballLowerIsBetter,
  rateBasketballHigherIsBetter,
  rateFootballHigherIsBetter,
  calcVerticalJump,
  calcRSSA,
  calcRAST,
} from "../../lib/fitness-calculation.ts";

test("getFitnessTestGroup maps sports and categories to correct fitness test groups", () => {
  const football = getFitnessTestGroup("ฟุตบอล");
  assert.ok(football);
  assert.equal(football.id, 1);
  assert.ok(football.tests["องค์ประกอบทางร่างกาย"]);
  assert.ok(football.tests["ความแข็งแรงของกล้ามเนื้อ"]);

  const volleyball = getFitnessTestGroup("วอลเลย์บอล");
  assert.ok(volleyball);
  assert.equal(volleyball.id, 2);

  const athleticsSprint = getFitnessTestGroup("กรีฑา", "ระยะสั้น 100 เมตร");
  assert.ok(athleticsSprint);
  assert.equal(athleticsSprint.id, 8);

  const athleticsLongDistance = getFitnessTestGroup("กรีฑา", "ระยะไกล 5000 เมตร");
  assert.ok(athleticsLongDistance);
  assert.equal(athleticsLongDistance.id, 9);

  const boardGame = getFitnessTestGroup("หมากรุกสากล");
  assert.ok(boardGame);
  assert.equal(boardGame.id, 5);

  const unknownSport = getFitnessTestGroup("กีฬาจำลองที่ไม่มีในระบบ");
  assert.equal(unknownSport, null);
});

test("validateFitnessTestStatus accepts valid statuses and rejects invalid ones", () => {
  assert.equal(validateFitnessTestStatus("PENDING"), "PENDING");
  assert.equal(validateFitnessTestStatus("PASSED"), "PASSED");
  assert.equal(validateFitnessTestStatus("FAILED"), "FAILED");

  assert.throws(() => validateFitnessTestStatus("UNKNOWN"), ValidationError);
  assert.throws(() => validateFitnessTestStatus(""), ValidationError);
  assert.throws(() => validateFitnessTestStatus(null), ValidationError);
  assert.throws(() => validateFitnessTestStatus(123), ValidationError);
});

test("validateFitnessTestItem validates and normalizes complete fitness input", () => {
  const input = {
    applicationId: "app_12345",
    status: "passed",
    totalScore: "85.5",
    scores: { sitUp: 40, pushUp: 35 },
    notes: "ผ่านเกณฑ์มาตรฐานดีมาก",
    testedAt: "2026-09-29T10:00:00.000Z",
  };

  const validated = validateFitnessTestItem(input);
  assert.equal(validated.applicationId, "app_12345");
  assert.equal(validated.status, "PASSED");
  assert.equal(validated.totalScore, 85.5);
  assert.deepEqual(validated.scores, { sitUp: 40, pushUp: 35 });
  assert.equal(validated.notes, "ผ่านเกณฑ์มาตรฐานดีมาก");
  assert.ok(validated.testedAt instanceof Date);
});

test("validateFitnessTestItem rejects missing required fields and invalid scores", () => {
  assert.throws(
    () => validateFitnessTestItem({ applicationId: "", status: "PASSED" }),
    ValidationError
  );

  assert.throws(
    () => validateFitnessTestItem({ applicationId: "app_1", status: "INVALID_STATUS" }),
    ValidationError
  );

  assert.throws(
    () => validateFitnessTestItem({ applicationId: "app_1", status: "PASSED", totalScore: -5 }),
    ValidationError
  );

  assert.throws(
    () => validateFitnessTestItem({ applicationId: "app_1", status: "PASSED", totalScore: "not_a_number" }),
    ValidationError
  );

  assert.throws(
    () => validateFitnessTestItem({ applicationId: "app_1", status: "PASSED", notes: "x".repeat(1500) }),
    ValidationError
  );
});

test("validateFitnessTestItem supports indexed prefix for bulk import errors", () => {
  try {
    validateFitnessTestItem({ applicationId: "", status: "BAD" }, 2);
    assert.fail("Should throw");
  } catch (err) {
    assert.ok(err instanceof ValidationError);
    assert.ok(err.fieldErrors["items[2].applicationId"]);
    assert.ok(err.fieldErrors["items[2].status"]);
  }
});

test("evaluateGeneralFitness correctly calculates ratios, ratings and overall pass/fail", () => {
  // Test athlete: 21 years old, 70 kg, 175 cm, high performance
  const athleteInput = {
    age: 21,
    weightKg: 70,
    heightCm: 175,
    bodyFatPercent: 10,       // Athletes (< 13%) -> ดีมาก
    gripStrengthKg: 60,       // 60/70 = 0.857 (>= 0.84) -> ดีมาก
    vitalCapacityCc: 4300,    // 4300/70 = 61.4 (>= 60.3) -> ดีมาก
    standingBroadJumpCm: 260, // 260/175 = 1.48 (>= 1.45) -> ดีมาก
    legStrengthKg: 200,       // 200/70 = 2.85 (>= 2.81) -> ดีมาก
    flexibilityCm: 22,        // >= 20 -> ดีมาก
    sitUps30Sec: 30,          // >= 27 -> ดีมาก
    pushUps30Sec: 38,         // >= 35 -> ดีมาก
  };

  const evalResult = evaluateGeneralFitness(athleteInput);
  assert.equal(evalResult.passed, true);
  assert.equal(evalResult.overallRating, "ดีมาก");
  assert.equal(evalResult.totalScore, 40); // 8 items * 5
  assert.equal(evalResult.maxScore, 40);
  assert.equal(evalResult.percentage, 100);

  // Test failing athlete due to low push-ups
  const failingInput = {
    ...athleteInput,
    pushUps30Sec: 15, // <= 22 -> ต่ำมาก
  };
  const failingResult = evaluateGeneralFitness(failingInput);
  assert.equal(failingResult.passed, false);
  assert.equal(failingResult.items.pushUps.rating, "ต่ำมาก");
});

test("calcVerticalJump accurately computes difference between jump and standing reach", () => {
  const res = calcVerticalJump(215, 275.5);
  assert.equal(res.standingReachCm, 215);
  assert.equal(res.jumpReachCm, 275.5);
  assert.equal(res.jumpHeightCm, 60.5);
});

test("calcRSSA computes best, mean and velocity decrement percentage", () => {
  const runs = [5.0, 5.1, 5.2, 5.3, 5.4, 5.5];
  const res = calcRSSA(runs);
  assert.equal(res.rssaBest, 5.0);
  assert.equal(res.rssaMean, 5.25);
  // decrement = ((5.25 / 5.0) * 100) - 100 = 5%
  assert.equal(res.decrementPercent, 5);
});

test("calcRAST accurately calculates sprint powers, peak watts and fatigue index", () => {
  const weightKg = 70;
  const timesSec = [5.0, 5.1, 5.2, 5.3, 5.4, 5.5];
  const res = calcRAST(weightKg, timesSec, 35);

  assert.equal(res.powersWatts.length, 6);
  assert.ok(res.maxPower > res.minPower);
  assert.ok(res.avgPower > 0);
  assert.ok(res.fatigueIndex > 0);
  assert.equal(res.totalTime, 31.5);
});

test("rateFootballLowerIsBetter and rateFootballHigherIsBetter map boundaries accurately", () => {
  // Football 10m sprint: [1.61, 1.67, 1.75, 1.83]
  assert.equal(rateFootballLowerIsBetter(1.58, [1.61, 1.67, 1.75, 1.83]), "ดีมาก");
  assert.equal(rateFootballLowerIsBetter(1.61, [1.61, 1.67, 1.75, 1.83]), "ดี");
  assert.equal(rateFootballLowerIsBetter(1.67, [1.61, 1.67, 1.75, 1.83]), "ดี");
  assert.equal(rateFootballLowerIsBetter(1.70, [1.61, 1.67, 1.75, 1.83]), "ปานกลาง");
  assert.equal(rateFootballLowerIsBetter(1.75, [1.61, 1.67, 1.75, 1.83]), "ปานกลาง");
  assert.equal(rateFootballLowerIsBetter(1.80, [1.61, 1.67, 1.75, 1.83]), "ต่ำ");
  assert.equal(rateFootballLowerIsBetter(1.83, [1.61, 1.67, 1.75, 1.83]), "ต่ำ");
  assert.equal(rateFootballLowerIsBetter(1.89, [1.61, 1.67, 1.75, 1.83]), "ต่ำมาก");

  // Vertical jump: [62.0, 56.9, 51.6, 46.4]
  assert.equal(rateFootballHigherIsBetter(65.0, [62.0, 56.9, 51.6, 46.4]), "ดีมาก");
  assert.equal(rateFootballHigherIsBetter(62.0, [62.0, 56.9, 51.6, 46.4]), "ดี");
  assert.equal(rateFootballHigherIsBetter(56.9, [62.0, 56.9, 51.6, 46.4]), "ดี");
  assert.equal(rateFootballHigherIsBetter(54.0, [62.0, 56.9, 51.6, 46.4]), "ปานกลาง");
  assert.equal(rateFootballHigherIsBetter(51.6, [62.0, 56.9, 51.6, 46.4]), "ปานกลาง");
  assert.equal(rateFootballHigherIsBetter(48.0, [62.0, 56.9, 51.6, 46.4]), "ต่ำ");
  assert.equal(rateFootballHigherIsBetter(46.4, [62.0, 56.9, 51.6, 46.4]), "ต่ำ");
  assert.equal(rateFootballHigherIsBetter(42.0, [62.0, 56.9, 51.6, 46.4]), "ต่ำมาก");
});

test("evaluateFootballFitness evaluates complete football battery correctly with ratings and overall result", () => {
  const eliteFootballPlayer = {
    sprint10mSec: 1.55,          // ดีมาก (< 1.61)
    sprint20mSec: 2.75,          // ดีมาก (< 2.81)
    sprint40mSec: 4.95,          // ดีมาก (< 5.07)
    tTestSec: 8.85,              // ดีมาก (< 9.01)
    fafSlalomSec: 7.60,          // ดีมาก (< 7.84)
    semoTestSec: 11.10,          // ดีมาก (< 11.31)
    verticalJumpCm: 64.0,        // ดีมาก (> 62.0)
    standingBroadJumpCm: 270.0,  // ดีมาก (> 264.0)
    rssaBestSec: 5.40,           // ดีมาก (< 5.55)
    rssaMeanSec: 5.60,           // ดีมาก (< 5.73)
    rssaDecrementPercent: 2.5,   // ดีมาก (< 3.10)
    rastMaxPowerWatts: 850.0,    // ดีมาก (> 817.7)
    rastMinPowerWatts: 550.0,    // ดีมาก (> 527.2)
    rastAvgPowerWatts: 700.0,    // ดีมาก (> 673.5)
    rastFatigueIndex: 6.5,       // ดีมาก (< 7.65)
    vo2maxMlKgMin: 62.0,         // ดีมาก (> 59.3)
  };

  const evalResult = evaluateFootballFitness(eliteFootballPlayer);
  assert.equal(evalResult.sport, "ฟุตบอล");
  assert.equal(evalResult.passed, true);
  assert.equal(evalResult.overallRating, "ดีมาก");
  assert.equal(evalResult.totalScore, 16 * 5); // 16 items * 5
  assert.equal(evalResult.maxScore, 16 * 5);
  assert.equal(evalResult.percentage, 100);

  // Partial test with moderate and low performance
  const developingPlayer = {
    sprint10mSec: 1.70, // ปานกลาง
    tTestSec: 9.30,     // ดี
    verticalJumpCm: 44.0, // ต่ำมาก (< 46.4)
  };

  const devResult = evaluateFootballFitness(developingPlayer);
  assert.equal(devResult.items.sprint10m.rating, "ปานกลาง");
  assert.equal(devResult.items.tTest.rating, "ดี");
  assert.equal(devResult.items.verticalJump.rating, "ต่ำมาก");
  assert.equal(devResult.passed, false, "Should fail because an item is ต่ำมาก");
});

test("rateBasketballLowerIsBetter and rateBasketballHigherIsBetter map boundaries accurately", () => {
  // Basketball 10m sprint: [1.62, 1.68, 1.76, 1.84]
  assert.equal(rateBasketballLowerIsBetter(1.60, [1.62, 1.68, 1.76, 1.84]), "ดีมาก");
  assert.equal(rateBasketballLowerIsBetter(1.62, [1.62, 1.68, 1.76, 1.84]), "ดี");
  assert.equal(rateBasketballLowerIsBetter(1.68, [1.62, 1.68, 1.76, 1.84]), "ดี");
  assert.equal(rateBasketballLowerIsBetter(1.70, [1.62, 1.68, 1.76, 1.84]), "ปานกลาง");
  assert.equal(rateBasketballLowerIsBetter(1.76, [1.62, 1.68, 1.76, 1.84]), "ปานกลาง");
  assert.equal(rateBasketballLowerIsBetter(1.80, [1.62, 1.68, 1.76, 1.84]), "ต่ำ");
  assert.equal(rateBasketballLowerIsBetter(1.84, [1.62, 1.68, 1.76, 1.84]), "ต่ำ");
  assert.equal(rateBasketballLowerIsBetter(1.88, [1.62, 1.68, 1.76, 1.84]), "ต่ำมาก");

  // Edgren Side Step test: [41, 37, 32, 27] (higher is better)
  assert.equal(rateBasketballHigherIsBetter(45, [41, 37, 32, 27]), "ดีมาก");
  assert.equal(rateBasketballHigherIsBetter(41, [41, 37, 32, 27]), "ดี");
  assert.equal(rateBasketballHigherIsBetter(37, [41, 37, 32, 27]), "ดี");
  assert.equal(rateBasketballHigherIsBetter(35, [41, 37, 32, 27]), "ปานกลาง");
  assert.equal(rateBasketballHigherIsBetter(32, [41, 37, 32, 27]), "ปานกลาง");
  assert.equal(rateBasketballHigherIsBetter(30, [41, 37, 32, 27]), "ต่ำ");
  assert.equal(rateBasketballHigherIsBetter(27, [41, 37, 32, 27]), "ต่ำ");
  assert.equal(rateBasketballHigherIsBetter(25, [41, 37, 32, 27]), "ต่ำมาก");

  // Seated Medicine Ball Toss: [6.10, 5.61, 5.10, 4.60] (higher is better)
  assert.equal(rateBasketballHigherIsBetter(6.5, [6.10, 5.61, 5.10, 4.60]), "ดีมาก");
  assert.equal(rateBasketballHigherIsBetter(6.10, [6.10, 5.61, 5.10, 4.60]), "ดี");
  assert.equal(rateBasketballHigherIsBetter(5.61, [6.10, 5.61, 5.10, 4.60]), "ดี");
  assert.equal(rateBasketballHigherIsBetter(5.30, [6.10, 5.61, 5.10, 4.60]), "ปานกลาง");
  assert.equal(rateBasketballHigherIsBetter(5.10, [6.10, 5.61, 5.10, 4.60]), "ปานกลาง");
  assert.equal(rateBasketballHigherIsBetter(4.80, [6.10, 5.61, 5.10, 4.60]), "ต่ำ");
  assert.equal(rateBasketballHigherIsBetter(4.60, [6.10, 5.61, 5.10, 4.60]), "ต่ำ");
  assert.equal(rateBasketballHigherIsBetter(4.20, [6.10, 5.61, 5.10, 4.60]), "ต่ำมาก");
});

test("evaluateBasketballFitness evaluates complete basketball battery correctly with ratings and overall result", () => {
  const eliteBasketballPlayer = {
    // 1. ความเร็ว
    sprint10mSec: 1.58,          // ดีมาก (< 1.62)
    sprint20mSec: 2.78,          // ดีมาก (< 2.82)
    // 2. ความคล่องแคล่วว่องไว
    tTestSec: 8.90,              // ดีมาก (< 9.05)
    edgrenSideStepCount: 43,     // ดีมาก (> 41)
    semoTestSec: 11.20,          // ดีมาก (< 11.35)
    // 3. พลังกล้ามเนื้อ
    verticalJumpCm: 63.0,        // ดีมาก (> 60.5)
    standingBroadJumpCm: 265.0,  // ดีมาก (> 260.0)
    medicineBallTossM: 6.30,     // ดีมาก (> 6.10)
    // 4. สมรรถภาพแบบไม่ใช้ออกซิเจน
    rssaBestSec: 5.50,           // ดีมาก (< 5.60)
    rssaMeanSec: 5.70,           // ดีมาก (< 5.78)
    rssaDecrementPercent: 2.8,   // ดีมาก (< 3.15)
    rastMaxPowerWatts: 820.0,    // ดีมาก (> 805.0)
    rastMinPowerWatts: 530.0,    // ดีมาก (> 515.0)
    rastAvgPowerWatts: 680.0,    // ดีมาก (> 660.0)
    rastFatigueIndex: 7.2,       // ดีมาก (< 7.80)
    // 5. สมรรถภาพแบบใช้ออกซิเจน
    vo2maxMlKgMin: 60.0,         // ดีมาก (> 58.0)
  };

  const evalResult = evaluateBasketballFitness(eliteBasketballPlayer);
  assert.equal(evalResult.sport, "บาสเกตบอล");
  assert.equal(evalResult.passed, true);
  assert.equal(evalResult.overallRating, "ดีมาก");
  assert.equal(evalResult.totalScore, 16 * 5); // 16 items * 5 = 80
  assert.equal(evalResult.maxScore, 16 * 5);
  assert.equal(evalResult.percentage, 100);

  // Partial test with moderate, low, and failing performance
  const developingPlayer = {
    sprint10mSec: 1.72,       // ปานกลาง (1.69–1.76)
    edgrenSideStepCount: 38,  // ดี (37–41)
    medicineBallTossM: 4.40,  // ต่ำมาก (< 4.60)
  };

  const devResult = evaluateBasketballFitness(developingPlayer);
  assert.equal(devResult.items.sprint10m.rating, "ปานกลาง");
  assert.equal(devResult.items.edgrenSideStep.rating, "ดี");
  assert.equal(devResult.items.medicineBallToss.rating, "ต่ำมาก");
  assert.equal(devResult.passed, false, "Should fail because medicine ball toss is ต่ำมาก");
});
