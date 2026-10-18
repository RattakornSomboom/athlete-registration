import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeAthletePerformance,
  calculateCompetitionScore,
  calculateFitnessAverage,
  calculateGapMetrics,
  classifyChange,
  compareFollowUp,
  mapToStandardSevenStations,
  timeSwcSeconds,
  getSportFitnessStations,
  mapToSportFitnessStations,
  STANDARD_SEVEN_STATIONS,
} from "../../lib/performance-analytics.ts";

const baseInput = (overrides = {}) => ({
  applicationId: "application-1",
  studentId: "student-1",
  athleteName: "นักกีฬาทดสอบ",
  sport: "กรีฑา",
  fitness: {
    totalScore: 60,
    ratings: {
      endurance: "ปานกลาง",
      speed: "ดีมาก",
      strength: "ดี",
    },
    testedAt: new Date("2026-10-15T00:00:00.000Z"),
  },
  matchResult: {
    score: 50,
    timeSeconds: null,
    rank: 4,
    outcome: "LOSS",
    isWinner: false,
    staffNotes: null,
  },
  ...overrides,
});

test("calculates fitness average from ratings and total score", () => {
  const input = baseInput();
  assert.equal(calculateFitnessAverage(input), 70);
});

test("calculates competition score from rank, outcome, and score", () => {
  const input = baseInput();
  assert.equal(calculateCompetitionScore(input), 50);
});

test("calculates fitness gap and time gap against benchmark", () => {
  const input = baseInput({
    sport: "กรีฑา",
    fitness: { totalScore: 70, ratings: { speed: "ต่ำ" }, testedAt: null },
    matchResult: {
      score: null,
      timeSeconds: 5.6,
      targetTimeSeconds: 5.2,
      rank: 2,
      outcome: null,
      isWinner: false,
      staffNotes: null,
    },
  });

  const gap = calculateGapMetrics(input, 45);
  assert.equal(gap.fitnessScoreGap, 35); // 80 - 45 = 35
  assert.equal(gap.timeGapSeconds, 0.4); // 5.6 - 5.2 = 0.4 วินาทีช้ากว่าเป้า
});

test("maps ratings reliably to standard 7 stations", () => {
  const ratings = {
    "นั่งงอตัว": "ดีมาก",
    "แรงบีบมือ": "ดี",
    "วิ่ง 40 เมตร": "ต่ำ",
  };
  const stations = mapToStandardSevenStations(ratings);
  assert.equal(stations.length, 7);
  assert.equal(stations[0].name, STANDARD_SEVEN_STATIONS[0]);
  assert.equal(stations[0].rating, "ดีมาก");
  assert.equal(stations[4].name, STANDARD_SEVEN_STATIONS[4]);
  assert.equal(stations[4].rating, "ต่ำ");
});

test("uses sport-specific station definitions for athletics and aquatics", () => {
  const athleticsStations = getSportFitnessStations("กรีฑา");
  const aquaticsStations = getSportFitnessStations("กีฬาทางน้ำ");
  assert.equal(athleticsStations.length, 7);
  assert.equal(aquaticsStations.length, 8);
  assert.notDeepEqual(athleticsStations.map(station => station.name), aquaticsStations.map(station => station.name));

  const swimmingAnalysis = mapToSportFitnessStations(
    { "ความเร็ว": "ดี", "ความแข็งแรง": "ปานกลาง", "ความอดทน": "ดีมาก" },
    "กีฬาทางน้ำ",
  );
  assert.equal(swimmingAnalysis[0].name, "ความแข็งแรง (Grip Strength)");
  assert.equal(swimmingAnalysis[0].rating, "ปานกลาง");
  assert.equal(swimmingAnalysis.some(station => station.name.includes("50 เมตร")), false);
});

test("recommends HIIT when endurance is low and the athlete loses late", () => {
  const insight = analyzeAthletePerformance(baseInput({
    fitness: {
      totalScore: 60,
      ratings: { endurance: "ต่ำ", speed: "ดีมาก", strength: "ดี" },
      testedAt: new Date("2026-10-15T00:00:00.000Z"),
    },
  }));

  assert.equal(insight.ruleRecommendations.length, 1);
  assert.match(insight.ruleRecommendations[0], /HIIT/);
  assert.ok(insight.weaknesses.includes("ความอดทนระบบหายใจ (Aerobic / Beep Test)"));
  assert.equal(insight.performanceIndex, 58);
});

test("tailors swimming recommendations for endurance and resistance training", () => {
  const insight = analyzeAthletePerformance(baseInput({
    sport: "กีฬาทางน้ำ",
    fitness: {
      totalScore: 55,
      ratings: { endurance: "ต่ำ", speed: "พอใช้", explosive: "พอใช้" },
      testedAt: null,
    },
    matchResult: {
      score: 60,
      timeSeconds: 29.5,
      targetTimeSeconds: 27.5,
      rank: 4,
      outcome: "LOSS",
      isWinner: false,
      staffNotes: null,
    },
  }));

  assert.ok(insight.ruleRecommendations.some(r => r.includes("Aerobic Swim Capacity")));
  assert.ok(insight.ruleRecommendations.some(r => r.includes("Dryland Resistance Training")));
  assert.equal(insight.gaps.timeGapSeconds, 2.0);
});

test("recommends plyometrics when speed is low and time is slower than target", () => {
  const insight = analyzeAthletePerformance(baseInput({
    fitness: {
      totalScore: null,
      ratings: { "40m Sprint": "ต่ำ" },
      testedAt: null,
    },
    matchResult: {
      score: null,
      timeSeconds: 5.8,
      targetTimeSeconds: 5.2,
      rank: 5,
      outcome: "LOSS",
      isWinner: false,
      staffNotes: null,
    },
  }));

  assert.ok(insight.ruleRecommendations.some(recommendation => recommendation.includes("Plyometrics")));
  assert.equal(insight.gaps.timeGapSeconds, 0.6);
});

test("recognizes a benchmark athlete with more than four excellent stations", () => {
  const insight = analyzeAthletePerformance(baseInput({
    fitness: {
      totalScore: 100,
      ratings: {
        endurance: "ดีมาก",
        speed: "ดีมาก",
        strength: "ดีมาก",
        flexibility: "ดีมาก",
        agility: "ดีมาก",
      },
      testedAt: null,
    },
    matchResult: {
      score: 95,
      timeSeconds: 5.1,
      targetTimeSeconds: 5.2,
      rank: 1,
      outcome: "WIN",
      isWinner: true,
      staffNotes: null,
    },
  }));

  assert.ok(insight.ruleRecommendations.some(recommendation => recommendation.includes("Active Recovery")));
  assert.equal(insight.performanceIndex, 99);
  assert.equal(insight.gaps.timeGapSeconds, -0.1); // เร็วกว่าเป้า 0.1s
});

const speedGapBaseline = () => baseInput({
  fitness: {
    totalScore: 58,
    ratings: { "40m Sprint": "ต่ำ", "Leg Power": "ต่ำ", endurance: "ปานกลาง" },
    testedAt: null,
  },
  matchResult: {
    score: 55,
    timeSeconds: 5.7,
    targetTimeSeconds: 5.2,
    rank: 5,
    outcome: "LOSS",
    isWinner: false,
    staffNotes: null,
  },
});

test("follow-up comparison reports improvement and remaining gap", () => {
  const comparison = compareFollowUp(speedGapBaseline(), {
    testedAt: null,
    weeksAfterBaseline: 4,
    totalScore: 70,
    ratings: { "40m Sprint": "ปานกลาง", "Leg Power": "ปานกลาง", endurance: "ปานกลาง" },
    timeSeconds: 5.4,
    targetTimeSeconds: 5.2,
    trainingPlan: ["Plyometrics"],
  });

  assert.equal(comparison.status, "IMPROVED");
  assert.equal(comparison.timeDeltaSeconds, -0.3);
  assert.equal(comparison.remainingGapSeconds, 0.2);
  assert.ok(comparison.fitnessDelta > 0);
  assert.ok(comparison.improvedStations.includes("ความเร็วและอัตราเร่ง (วิ่ง 40 เมตร)"));
});

test("follow-up comparison reports decline when retest is worse", () => {
  const comparison = compareFollowUp(speedGapBaseline(), {
    testedAt: null,
    weeksAfterBaseline: 4,
    totalScore: 40,
    ratings: { "40m Sprint": "ต่ำ", "Leg Power": "ต่ำ", endurance: "ต่ำ" },
    timeSeconds: 5.9,
    targetTimeSeconds: 5.2,
    trainingPlan: [],
  });

  assert.equal(comparison.status, "DECLINED");
  assert.equal(comparison.timeDeltaSeconds, 0.2);
});
test("follow-up comparison handles missing time gracefully", () => {
  const comparison = compareFollowUp(speedGapBaseline(), {
    testedAt: null,
    weeksAfterBaseline: 4,
    totalScore: 75,
    ratings: { "40m Sprint": "ปานกลาง", "Leg Power": "ปานกลาง", endurance: "ดี" },
    timeSeconds: null,
    targetTimeSeconds: 5.2,
    trainingPlan: ["Conditioning"],
  });

  assert.equal(comparison.timeDeltaSeconds, null);
  assert.equal(comparison.remainingGapSeconds, null);
  assert.equal(comparison.status, "IMPROVED");
});

test("follow-up comparison handles equal metrics as no change", () => {
  const comparison = compareFollowUp(speedGapBaseline(), {
    testedAt: null,
    weeksAfterBaseline: 2,
    totalScore: 58,
    ratings: { "40m Sprint": "ต่ำ", "Leg Power": "ต่ำ", endurance: "ปานกลาง" },
    timeSeconds: 5.7,
    targetTimeSeconds: 5.2,
    trainingPlan: [],
  });

  assert.equal(comparison.status, "NO_CHANGE");
  assert.equal(comparison.timeDeltaSeconds, 0);
  assert.equal(comparison.fitnessDelta, 0);
});

const retestOf = (overrides = {}) => ({
  testedAt: null,
  weeksAfterBaseline: 4,
  totalScore: 58,
  ratings: { "40m Sprint": "ต่ำ", "Leg Power": "ต่ำ", endurance: "ปานกลาง" },
  timeSeconds: 5.7,
  targetTimeSeconds: 5.2,
  trainingPlan: [],
  ...overrides,
});

test("SWC time threshold uses 0.1s floor or 0.5% of baseline", () => {
  assert.equal(timeSwcSeconds(5.7), 0.1);
  assert.equal(timeSwcSeconds(27.5), 0.14);
  assert.equal(timeSwcSeconds(40), 0.2);
});

test("classifyChange treats changes smaller than SWC as within error", () => {
  assert.equal(classifyChange(0, 0), "WITHIN_SWC");
  assert.equal(classifyChange(-0.05, 0.1, true), "WITHIN_SWC");
  assert.equal(classifyChange(-0.1, 0.1, true), "IMPROVED");
  assert.equal(classifyChange(0.1, 0.1, true), "DECLINED");
  assert.equal(classifyChange(3, 3), "IMPROVED");
  assert.equal(classifyChange(-2.9, 3), "WITHIN_SWC");
});

test("follow-up comparison ignores time change within SWC", () => {
  const comparison = compareFollowUp(speedGapBaseline(), retestOf({ timeSeconds: 5.65 }));

  assert.equal(comparison.timeDeltaSeconds, -0.05);
  assert.equal(comparison.timeChange, "WITHIN_SWC");
  assert.equal(comparison.swc.timeSeconds, 0.1);
  assert.equal(comparison.status, "NO_CHANGE");
  assert.ok(comparison.summary.includes("น้อยกว่าเกณฑ์ขั้นต่ำ"));
  assert.ok(comparison.summary.includes("±0.1s"));
});

test("follow-up comparison counts time change equal to SWC as improvement", () => {
  const comparison = compareFollowUp(speedGapBaseline(), retestOf({ timeSeconds: 5.6 }));

  assert.equal(comparison.timeDeltaSeconds, -0.1);
  assert.equal(comparison.timeChange, "IMPROVED");
  assert.equal(comparison.status, "IMPROVED");
});

test("follow-up comparison scales time SWC with longer swimming times", () => {
  const swimBaseline = baseInput({
    sport: "กีฬาทางน้ำ",
    fitness: speedGapBaseline().fitness,
    matchResult: { ...speedGapBaseline().matchResult, timeSeconds: 27.5, targetTimeSeconds: 27 },
  });
  const comparison = compareFollowUp(swimBaseline, retestOf({ timeSeconds: 27.4, targetTimeSeconds: 27 }));

  assert.equal(comparison.swc.timeSeconds, 0.14);
  assert.equal(comparison.timeChange, "WITHIN_SWC");
  assert.equal(comparison.status, "NO_CHANGE");
});

test("follow-up comparison ignores fitness change within SWC", () => {
  const comparison = compareFollowUp(speedGapBaseline(), retestOf({ totalScore: 62 }));

  assert.equal(comparison.fitnessDelta, 2);
  assert.equal(comparison.fitnessChange, "WITHIN_SWC");
  assert.equal(comparison.timeChange, "WITHIN_SWC");
  assert.equal(comparison.status, "NO_CHANGE");
});

test("follow-up comparison reports mixed results when time improves but fitness declines", () => {
  const comparison = compareFollowUp(speedGapBaseline(), retestOf({
    totalScore: 40,
    ratings: { "40m Sprint": "ต่ำ", "Leg Power": "ต่ำ", endurance: "ต่ำ" },
    timeSeconds: 5.4,
  }));

  assert.equal(comparison.timeChange, "IMPROVED");
  assert.equal(comparison.fitnessChange, "DECLINED");
  assert.equal(comparison.status, "NO_CHANGE");
  assert.ok(comparison.summary.includes("ทั้งด้านที่ดีขึ้นและลดลง"));
});
