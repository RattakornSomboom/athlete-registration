import assert from "node:assert/strict";
import test from "node:test";
import {
  averageRanks,
  computeProgramAnalytics,
  median,
  MIN_CORRELATION_SAMPLE,
  ratio,
  spearman,
} from "../../lib/performance-program-analytics.ts";
import { generateDemoCohort } from "../../lib/performance-program-demo.ts";
import { classifyChange, FOLLOW_UP_SWC, timeSwcSeconds } from "../../lib/performance-analytics.ts";

// เกณฑ์เดียวกับที่ lib/performance-service.ts ส่งให้ระบบจริง
const SWC_CLASSIFIER = {
  time: (beforeSeconds, deltaSeconds) => classifyChange(deltaSeconds, timeSwcSeconds(beforeSeconds), true),
  fitness: delta => classifyChange(delta, FOLLOW_UP_SWC.fitnessPoints),
};

const BENCH = {
  "กรีฑา": { targetTimeSeconds: 5.2, targetScore: 80 },
  "กีฬาทางน้ำ": { targetTimeSeconds: 27.5, targetScore: 85 },
};

let counter = 0;
const athlete = (overrides = {}) => ({
  applicationId: `a-${(counter += 1)}`,
  sport: "กรีฑา",
  fitnessAverage: 70,
  timeSeconds: 5.3,
  stations: [],
  hasActionPlan: false,
  followUp: null,
  ...overrides,
});

test("averageRanks gives tied values the mean rank", () => {
  assert.deepEqual(averageRanks([10, 20, 20, 30]), [1, 2.5, 2.5, 4]);
  assert.deepEqual(averageRanks([5, 5, 5]), [2, 2, 2]);
});

test("spearman handles ties and returns null when a variable is constant", () => {
  assert.equal(spearman([1, 2, 3, 4], [10, 20, 30, 40]), 1);
  assert.equal(spearman([1, 2, 3, 4], [40, 30, 20, 10]), -1);
  assert.equal(spearman([1, 1, 1, 1], [1, 2, 3, 4]), null);
  const tied = spearman([1, 2, 2, 3], [1, 2, 3, 4]);
  assert.ok(tied !== null && tied > 0.9 && tied < 1);
});

test("median and ratio behave on empty and even input", () => {
  assert.equal(median([]), null);
  assert.equal(median([1, 3]), 2);
  assert.equal(median([5, 1, 3]), 3);
  assert.deepEqual(ratio(0, 0), { count: 0, total: 0, pct: null });
  assert.deepEqual(ratio(1, 3), { count: 1, total: 3, pct: 33 });
});

test("attainment uses only athletes that have the measure as denominator", () => {
  const result = computeProgramAnalytics(
    [
      athlete({ timeSeconds: 5.1, fitnessAverage: 85 }),
      athlete({ timeSeconds: 5.4, fitnessAverage: 90 }),
      athlete({ timeSeconds: null, fitnessAverage: 60 }),
      athlete({ timeSeconds: 5.2, fitnessAverage: null }),
    ],
    BENCH,
  );
  const [sport] = result.sports;
  assert.equal(sport.coverage.total, 4);
  assert.equal(sport.coverage.withTime, 3);
  assert.equal(sport.coverage.withFitness, 3);
  assert.deepEqual(sport.baseline.time, { count: 2, total: 3, pct: 67 });
  assert.deepEqual(sport.baseline.fitness, { count: 2, total: 3, pct: 67 });
  // "ทั้งสองด้าน" นับเฉพาะคนที่มีครบทั้งเวลาและสมรรถภาพ
  assert.deepEqual(sport.baseline.both, { count: 1, total: 2, pct: 50 });
});

test("sports are never mixed and ว่ายน้ำ is grouped with กีฬาทางน้ำ", () => {
  const result = computeProgramAnalytics(
    [
      athlete({ sport: "กรีฑา", timeSeconds: 5.0 }),
      athlete({ sport: "ว่ายน้ำ", timeSeconds: 27.0 }),
      athlete({ sport: "กีฬาทางน้ำ", timeSeconds: 28.0 }),
    ],
    BENCH,
  );
  assert.equal(result.sports.length, 2);
  const aqua = result.sports.find(s => s.sport === "กีฬาทางน้ำ");
  assert.equal(aqua.coverage.total, 2);
  assert.deepEqual(aqua.baseline.time, { count: 1, total: 2, pct: 50 });
  assert.equal(aqua.benchmark.targetTimeSeconds, 27.5);
});

test("follow-up comparison is paired and reports median gap before and after", () => {
  const result = computeProgramAnalytics(
    [
      athlete({ timeSeconds: 5.7, fitnessAverage: 50, followUp: { timeSeconds: 5.4, fitnessAverage: 70 } }),
      athlete({ timeSeconds: 5.5, fitnessAverage: 60, followUp: { timeSeconds: 5.1, fitnessAverage: 75 } }),
      athlete({ timeSeconds: 5.3, fitnessAverage: 65, followUp: { timeSeconds: 5.35, fitnessAverage: 65 } }),
      // ไม่มีผลทดสอบซ้ำ ต้องไม่ถูกนับในฝั่งก่อน-หลัง
      athlete({ timeSeconds: 6.0, fitnessAverage: 40 }),
    ],
    BENCH,
  );
  const { followUp } = result.sports[0];
  assert.equal(followUp.n, 3);
  assert.equal(followUp.time.n, 3);
  assert.equal(followUp.time.medianGapBefore, 0.3);
  assert.equal(followUp.time.medianGapAfter, 0.15);
  assert.equal(followUp.time.improved, 2);
  assert.equal(followUp.time.worsened, 1);
  assert.equal(followUp.time.unchanged, 0);
  // เดิมช้ากว่าเป้า 3 คน ปิด gap ได้ 1 คน (5.1)
  assert.deepEqual(followUp.time.gapClosed, { closed: 1, hadGap: 3 });
  assert.equal(followUp.fitness.medianDelta, 15);
  assert.equal(followUp.fitness.improved, 2);
  assert.equal(followUp.fitness.unchanged, 1);
  // ตัวหารก่อน-หลังต้องเท่ากัน
  assert.equal(followUp.before.time.total, followUp.after.time.total);
  assert.deepEqual(followUp.before.time, { count: 0, total: 3, pct: 0 });
  assert.deepEqual(followUp.after.time, { count: 1, total: 3, pct: 33 });
});

test("a follow-up missing time is excluded from the time comparison only", () => {
  const result = computeProgramAnalytics(
    [athlete({ timeSeconds: 5.6, fitnessAverage: 50, followUp: { timeSeconds: null, fitnessAverage: 70 } })],
    BENCH,
  );
  const { followUp } = result.sports[0];
  assert.equal(followUp.n, 1);
  assert.equal(followUp.time.n, 0);
  assert.equal(followUp.time.medianDelta, null);
  assert.equal(followUp.fitness.n, 1);
});

function correlationCohort(n, stationFor) {
  return Array.from({ length: n }, (_, index) =>
    athlete({
      timeSeconds: 5.0 + index * 0.1,
      stations: stationFor(index),
    }),
  );
}

test("station correlation is withheld below the minimum sample", () => {
  const small = correlationCohort(MIN_CORRELATION_SAMPLE - 1, i => [{ name: "แรงระเบิด", score: 100 - i * 10 }]);
  const [corr] = computeProgramAnalytics(small, BENCH).sports[0].correlations;
  assert.equal(corr.status, "INSUFFICIENT_N");
  assert.equal(corr.rho, null);
  assert.equal(corr.alignment, null);
});

test("station correlation reports alignment where higher score means faster time", () => {
  const cohort = correlationCohort(10, i => [
    { name: "ตรงกัน", score: 100 - i * 10 },
    { name: "สวนทาง", score: i * 10 },
    { name: "คงที่", score: 60 },
  ]);
  const byName = Object.fromEntries(
    computeProgramAnalytics(cohort, BENCH).sports[0].correlations.map(c => [c.station, c]),
  );
  assert.equal(byName["ตรงกัน"].status, "OK");
  assert.equal(byName["ตรงกัน"].alignment, 1);
  assert.equal(byName["ตรงกัน"].strength, "ชัด");
  assert.equal(byName["สวนทาง"].alignment, -1);
  assert.equal(byName["คงที่"].status, "NO_VARIATION");
  assert.equal(byName["คงที่"].alignment, null);
});

test("race proxy stations are flagged and never ranked", () => {
  const cohort = correlationCohort(10, i => [
    { name: "วิ่ง 40 เมตร", score: 100 - i * 10 },
    { name: "แรงระเบิด", score: 100 - i * 9 },
  ]);
  const { correlations } = computeProgramAnalytics(cohort, BENCH, { "กรีฑา": ["วิ่ง 40 เมตร"] }).sports[0];
  const proxy = correlations.find(c => c.station === "วิ่ง 40 เมตร");
  assert.equal(proxy.status, "RACE_PROXY");
  assert.equal(proxy.rho, null);
  assert.equal(correlations.at(-1).station, "วิ่ง 40 เมตร");
});

test("athletes without a race time are left out of the correlation sample", () => {
  const cohort = correlationCohort(9, i => [{ name: "แรงระเบิด", score: 100 - i * 10 }]);
  cohort.push(athlete({ timeSeconds: null, stations: [{ name: "แรงระเบิด", score: 0 }] }));
  const [corr] = computeProgramAnalytics(cohort, BENCH).sports[0].correlations;
  assert.equal(corr.n, 9);
  assert.equal(corr.alignment, 1);
});

test("a sport without a benchmark is skipped instead of guessed", () => {
  const result = computeProgramAnalytics([athlete({ sport: "ฟุตบอล" })], BENCH);
  assert.equal(result.sports.length, 0);
});

const TRACK_STATIONS = [
  "ความเร็วและอัตราเร่ง (วิ่ง 40 เมตร)",
  "แรงระเบิดกล้ามเนื้อ (Leg Power)",
  "ความคล่องแคล่วว่องไว (Agility)",
  "ความอ่อนตัว (Sit & Reach)",
];

test("demo cohort is deterministic, sized 12 and covers the incomplete-data cases", () => {
  const first = generateDemoCohort("กรีฑา", TRACK_STATIONS, BENCH["กรีฑา"]);
  const second = generateDemoCohort("กรีฑา", TRACK_STATIONS, BENCH["กรีฑา"]);
  assert.deepEqual(first, second);
  assert.equal(first.length, 12);
  assert.ok(first.some(a => a.timeSeconds === null));
  assert.ok(first.some(a => a.followUp !== null));
  assert.ok(first.some(a => a.hasActionPlan && a.followUp === null));
  assert.ok(first.every(a => a.applicationId.startsWith("demo-cohort-")));
  assert.deepEqual(generateDemoCohort("ฟุตบอล", TRACK_STATIONS, BENCH["กรีฑา"]), []);
});

test("demo cohort has enough data for station correlations and a before/after comparison", () => {
  const cohort = generateDemoCohort("กรีฑา", TRACK_STATIONS, BENCH["กรีฑา"]);
  const sport = computeProgramAnalytics(cohort, BENCH, { "กรีฑา": [TRACK_STATIONS[0]] }).sports[0];
  assert.ok(sport.followUp.time.n >= 5);
  assert.ok(sport.correlations.filter(c => c.status === "OK").length >= 2);
  assert.equal(sport.correlations.find(c => c.station === TRACK_STATIONS[0]).status, "RACE_PROXY");
});

test("SWC classifier counts small follow-up changes as unchanged, matching athlete cards", () => {
  const result = computeProgramAnalytics(
    [
      athlete({ timeSeconds: 5.7, fitnessAverage: 50, followUp: { timeSeconds: 5.4, fitnessAverage: 70 } }),
      // +0.05s และ +2 คะแนน: น้อยกว่า SWC (0.1s / 3 คะแนน)
      athlete({ timeSeconds: 5.3, fitnessAverage: 70, followUp: { timeSeconds: 5.35, fitnessAverage: 72 } }),
      // +0.1s เท่ากับ SWC พอดี: นับว่าแย่ลง
      athlete({ timeSeconds: 5.3, fitnessAverage: 70, followUp: { timeSeconds: 5.4, fitnessAverage: 66 } }),
    ],
    BENCH,
    {},
    SWC_CLASSIFIER,
  );
  const { time, fitness } = result.sports[0].followUp;
  assert.deepEqual([time.improved, time.unchanged, time.worsened], [1, 1, 1]);
  assert.deepEqual(time.points.map(point => point.change), ["IMPROVED", "WITHIN_SWC", "DECLINED"]);
  assert.deepEqual([fitness.improved, fitness.unchanged, fitness.worsened], [1, 1, 1]);
});

test("default classifier still counts every non-zero change", () => {
  const result = computeProgramAnalytics(
    [athlete({ timeSeconds: 5.3, fitnessAverage: 70, followUp: { timeSeconds: 5.35, fitnessAverage: 72 } })],
    BENCH,
  );
  const { time, fitness } = result.sports[0].followUp;
  assert.equal(time.worsened, 1);
  assert.equal(fitness.improved, 1);
});

test("SWC time threshold scales for swimming in program counts", () => {
  const result = computeProgramAnalytics(
    [athlete({ sport: "กีฬาทางน้ำ", timeSeconds: 27.5, fitnessAverage: 70, followUp: { timeSeconds: 27.4, fitnessAverage: 70 } })],
    BENCH,
    {},
    SWC_CLASSIFIER,
  );
  assert.equal(result.sports[0].followUp.time.unchanged, 1);
});
