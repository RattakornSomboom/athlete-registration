import assert from "node:assert/strict";
import test from "node:test";
import {
  ATHLETICS_TRACK_EVENTS,
  buildAthleteDetail,
  classifyChange,
  compareRetest,
  eventsForGender,
  extractStationRatings,
  filterRows,
  formatTrackTime,
  gapToTarget,
  markBests,
  overviewRows,
  parseBenchmarks,
  parseTrackGender,
  parseTrackTime,
  percentOfTarget,
  progressionSeries,
  readExcellenceStorage,
  summarizeRows,
  targetStatus,
  timeSwcSeconds,
  weakStations,
  writeExcellenceStorage,
} from "../../lib/excellence-athletics.ts";
import { DEMO_BENCHMARKS, getDemoAthletes } from "../../lib/excellence-demo.ts";

test("gender comes from the track category and field categories are rejected", () => {
  assert.equal(parseTrackGender("ลู่ (ชาย)"), "ชาย");
  assert.equal(parseTrackGender(" ลู่ (หญิง) "), "หญิง");
  assert.equal(parseTrackGender("ลาน (ชาย)"), null);
  assert.equal(parseTrackGender("บุคคลชาย"), null);
});

test("hurdle events are offered only to the matching gender", () => {
  const men = eventsForGender("ชาย").map(event => event.key);
  const women = eventsForGender("หญิง").map(event => event.key);
  assert.ok(men.includes("110mH") && !men.includes("100mH"));
  assert.ok(women.includes("100mH") && !women.includes("110mH"));
});

test("track times parse and format in seconds or minutes", () => {
  assert.equal(parseTrackTime("10.85"), 10.85);
  assert.equal(parseTrackTime("1:58.32"), 118.32);
  assert.equal(parseTrackTime("31:02.5"), 1862.5);
  assert.equal(parseTrackTime("1:75.00"), null);
  assert.equal(parseTrackTime("abc"), null);
  assert.equal(formatTrackTime(10.8), "10.80");
  assert.equal(formatTrackTime(118.32), "1:58.32");
  assert.equal(formatTrackTime(65.05), "1:05.05");
  assert.equal(formatTrackTime(null), "—");
});

test("gap and status report missing targets instead of guessing", () => {
  assert.equal(gapToTarget(11.48, 11), 0.48);
  assert.equal(gapToTarget(10.98, 11), -0.02);
  assert.equal(gapToTarget(11.2, null), null);
  assert.equal(targetStatus(10.98, 11), "AT_TARGET");
  assert.equal(targetStatus(11, 11), "AT_TARGET");
  assert.equal(targetStatus(11.2, 11), "BELOW_TARGET");
  assert.equal(targetStatus(11.2, null), "NO_TARGET");
  assert.equal(targetStatus(null, 11), "NO_RESULT");
});

test("benchmarks drop unknown events, wrong genders and invalid values", () => {
  const parsed = parseBenchmarks({
    "100m|ชาย": { targetSeconds: 11, updatedAt: "x", updatedBy: "y" },
    "100mH|ชาย": { targetSeconds: 14 },
    "999m|ชาย": { targetSeconds: 1 },
    "200m|หญิง": { targetSeconds: -1 },
  });
  assert.deepEqual(Object.keys(parsed), ["100m|ชาย"]);
  assert.deepEqual(parseBenchmarks(null), {});
});

test("PB marks the best time per event and SB the best per year", () => {
  const marked = markBests([
    { id: "a", event: "100m", timeSeconds: 11.35, competedAt: "2025-11-20", competitionName: "x", stage: null },
    { id: "b", event: "100m", timeSeconds: 11.12, competedAt: "2026-03-14", competitionName: "x", stage: null },
    { id: "c", event: "100m", timeSeconds: 11.2, competedAt: "2026-08-22", competitionName: "x", stage: null },
    { id: "d", event: "200m", timeSeconds: 22.9, competedAt: "2026-08-22", competitionName: "x", stage: null },
  ]);
  const byId = Object.fromEntries(marked.map(result => [result.id, result]));
  assert.deepEqual([byId.a.isPB, byId.a.isSB], [false, true]);
  assert.deepEqual([byId.b.isPB, byId.b.isSB], [true, true]);
  assert.deepEqual([byId.c.isPB, byId.c.isSB], [false, false]);
  assert.deepEqual([byId.d.isPB, byId.d.isSB], [true, true]);
  assert.equal(marked[0].competedAt, "2026-08-22");
});

test("an equal time keeps PB on the earlier result", () => {
  const marked = markBests([
    { id: "a", event: "100m", timeSeconds: 11, competedAt: "2026-01-01", competitionName: "x", stage: null },
    { id: "b", event: "100m", timeSeconds: 11, competedAt: "2026-02-01", competitionName: "x", stage: null },
  ]);
  assert.equal(marked.find(result => result.id === "a").isPB, true);
  assert.equal(marked.find(result => result.id === "b").isPB, false);
});

test("SWC uses a 0.1s floor or 0.5% of the baseline time", () => {
  assert.equal(timeSwcSeconds(11.48), 0.1);
  assert.equal(timeSwcSeconds(50.9), 0.25);
  assert.equal(timeSwcSeconds(240), 1.2);
  assert.equal(classifyChange(-0.05, 0.1, true), "WITHIN_SWC");
  assert.equal(classifyChange(-0.1, 0.1, true), "IMPROVED");
  assert.equal(classifyChange(0.3, 0.1, true), "DECLINED");
  assert.equal(classifyChange(0, 0, true), "WITHIN_SWC");
});

test("station ratings are read from flat, items and object forms and mapped to station keys", () => {
  assert.deepEqual(extractStationRatings({ "40m Sprint": "ดี", sitAndReachCm: { rating: "ต่ำ" }, legStrength: 42 }), { sprint40m: "ดี", flexibility: "ต่ำ" });
  assert.deepEqual(extractStationRatings({ items: { agility: "ปานกลาง" }, _excellence: { v2: {} } }), { agility: "ปานกลาง" });
  assert.deepEqual(extractStationRatings(null), {});
});

test("weak stations are rated พอใช้ or lower, weakest first", () => {
  const weak = weakStations({ sprint40m: "พอใช้", legPower: "ต่ำ", agility: "ปานกลาง", grip: "ดีมาก" });
  assert.deepEqual(weak.map(station => station.key), ["legPower", "sprint40m"]);
});

test("v2 storage is written beside legacy _excellence data and other score keys", () => {
  const scores = { items: { agility: "ดี" }, _excellence: { actionPlan: { coachName: "เดิม" } } };
  const storage = { revision: 3, plans: [], retests: [] };
  const written = writeExcellenceStorage(scores, storage);
  assert.deepEqual(written.items, { agility: "ดี" });
  assert.deepEqual(written._excellence.actionPlan, { coachName: "เดิม" });
  assert.deepEqual(readExcellenceStorage(written), storage);
  assert.deepEqual(readExcellenceStorage(scores), { revision: 0, plans: [], retests: [] });
  assert.deepEqual(writeExcellenceStorage(null, storage)._excellence.v2, storage);
});

const plan = {
  id: "p1",
  coachName: "โค้ช",
  startDate: "2026-08-25",
  endDate: "2026-10-20",
  status: "ACTIVE",
  items: [
    { id: "i1", stationKey: "legPower", activity: "Plyometrics" },
    { id: "i2", stationKey: "sprint40m", activity: "Block starts" },
    { id: "i3", stationKey: "agility", activity: "Ladder drills" },
  ],
  notes: null,
  updatedAt: "2026-08-25T00:00:00.000Z",
  updatedBy: "staff",
};
const results = [
  { id: "r1", event: "100m", timeSeconds: 11.62, competedAt: "2026-03-14", competitionName: "x", stage: null },
  { id: "r2", event: "100m", timeSeconds: 11.48, competedAt: "2026-08-22", competitionName: "x", stage: null },
  { id: "r3", event: "100m", timeSeconds: 11.1, competedAt: "2026-11-01", competitionName: "x", stage: null },
];

test("retest reports each plan item against its linked station", () => {
  const comparison = compareRetest({
    retest: { id: "t1", planId: "p1", testedAt: "2026-10-05", ratings: { legPower: "ปานกลาง", sprint40m: "พอใช้" }, event: "100m", timeSeconds: 11.3, notes: null, recordedAt: "", recordedBy: "" },
    baselineRatings: { legPower: "ต่ำ", sprint40m: "พอใช้", agility: "ดี" },
    plan,
    results,
  });
  assert.deepEqual(comparison.planItems.map(item => item.change), ["IMPROVED", "NO_CHANGE", "NOT_TESTED"]);
  assert.ok(comparison.summary.includes("ดีขึ้น 1 จาก 2 สถานี"));
  // เทียบกับผลแข่งล่าสุดก่อนวันทดสอบซ้ำ (11.48) ไม่ใช่ผลหลังจากนั้น (11.10)
  assert.equal(comparison.time.before, 11.48);
  assert.equal(comparison.time.delta, -0.18);
  assert.equal(comparison.time.change, "IMPROVED");
});

test("retest time within SWC is reported as no clear change", () => {
  const comparison = compareRetest({
    retest: { id: "t1", planId: null, testedAt: "2026-10-05", ratings: {}, event: "100m", timeSeconds: 11.42, notes: null, recordedAt: "", recordedBy: "" },
    baselineRatings: {},
    plan: null,
    results,
  });
  assert.equal(comparison.planItems.length, 0);
  assert.equal(comparison.time.change, "WITHIN_SWC");
  assert.ok(comparison.summary.includes("±0.1s"));
});

test("retest without an earlier result of that event has no time baseline", () => {
  const comparison = compareRetest({
    retest: { id: "t1", planId: null, testedAt: "2026-10-05", ratings: {}, event: "400m", timeSeconds: 52, notes: null, recordedAt: "", recordedBy: "" },
    baselineRatings: {},
    plan: null,
    results,
  });
  assert.equal(comparison.time.before, null);
  assert.equal(comparison.time.change, null);
});

test("overview gives one row per athlete and event, and counts people not rows", () => {
  const athletes = getDemoAthletes();
  const rows = athletes.flatMap(athlete => overviewRows(athlete, DEMO_BENCHMARKS));
  assert.equal(new Set(rows.map(row => row.applicationId)).size, athletes.length);
  const summary = summarizeRows(rows);
  assert.equal(summary.athletes, athletes.length);
  assert.ok(rows.some(row => row.status === "NO_TARGET"));
  assert.ok(rows.some(row => row.status === "NO_RESULT"));
  assert.ok(rows.some(row => row.status === "AT_TARGET"));
  assert.ok(rows.some(row => row.status === "BELOW_TARGET"));

  const women100 = filterRows(rows, { event: "100m", gender: "หญิง" });
  assert.ok(women100.length > 0 && women100.every(row => row.event === "100m" && row.gender === "หญิง"));
  assert.equal(filterRows(rows, { search: "กฤษดา" }).length, 1);
});

test("demo data is athletics track only and every detail builds", () => {
  const events = new Set(ATHLETICS_TRACK_EVENTS.map(event => event.key));
  for (const athlete of getDemoAthletes()) {
    assert.ok(athlete.applicationId.startsWith("demo-"));
    assert.ok(athlete.results.every(result => events.has(result.event)));
    const detail = buildAthleteDetail(athlete, DEMO_BENCHMARKS);
    assert.equal(detail.results.length, athlete.results.length);
    assert.equal(detail.retests.length, athlete.storage.retests.length);
  }
});

test("demo covers improved and within-SWC retest times", () => {
  const changes = getDemoAthletes()
    .flatMap(athlete => buildAthleteDetail(athlete, DEMO_BENCHMARKS).retests)
    .map(retest => retest.comparison.time?.change);
  assert.ok(changes.includes("IMPROVED"));
  assert.ok(changes.includes("WITHIN_SWC"));
});

test("percent of target is target over time, comparable across events", () => {
  assert.equal(percentOfTarget(11, 11), 100);
  assert.equal(percentOfTarget(10.98, 11), 100.2);
  assert.equal(percentOfTarget(50.9, 50.5), 99.2);
  assert.equal(percentOfTarget(11.48, null), null);
  assert.equal(percentOfTarget(null, 11), null);
  assert.equal(percentOfTarget(0, 11), null);
});

test("overview and detail carry percent of target and null when no target is set", () => {
  const athletes = getDemoAthletes();
  const rows = athletes.flatMap(athlete => overviewRows(athlete, DEMO_BENCHMARKS));
  const kritsada = rows.find(row => row.name.includes("กฤษดา"));
  assert.equal(kritsada.percentOfTarget, percentOfTarget(kritsada.bestSeconds, kritsada.targetSeconds));
  assert.ok(kritsada.percentOfTarget > 100);
  assert.ok(rows.filter(row => row.status === "NO_TARGET" || row.status === "NO_RESULT").every(row => row.percentOfTarget === null));
  const detail = buildAthleteDetail(athletes[0], DEMO_BENCHMARKS);
  assert.ok(detail.results.every(result => result.percentOfTarget === percentOfTarget(result.timeSeconds, result.targetSeconds)));
});

test("progression series keeps only events with two or more results, oldest first", () => {
  const detail = buildAthleteDetail(getDemoAthletes()[0], DEMO_BENCHMARKS);
  const series = progressionSeries(detail.results);
  assert.equal(series.length, 1);
  assert.equal(series[0].event, "100m");
  assert.equal(series[0].targetSeconds, 11);
  assert.deepEqual(series[0].points.map(point => point.date), ["2025-11-20", "2026-03-14", "2026-08-22"]);
  assert.deepEqual(series[0].points.map(point => point.isPB), [false, false, true]);
  const single = buildAthleteDetail(getDemoAthletes()[3], DEMO_BENCHMARKS);
  assert.deepEqual(progressionSeries(single.results), []);
});
