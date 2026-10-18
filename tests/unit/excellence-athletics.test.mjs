import assert from "node:assert/strict";
import test from "node:test";
import {
  ATHLETICS_EVENTS,
  buildAthleteDetail,
  buildHeatmap,
  classifyChange,
  compareRetest,
  eventKind,
  eventsForGender,
  extractStationRatings,
  filterRows,
  formatMark,
  formatMarkInput,
  formatSignedMark,
  formatTrackTime,
  gapToTarget,
  lowerIsBetter,
  markBests,
  markSwc,
  overviewRows,
  parseAthleticsGender,
  parseBenchmarks,
  parseFieldDistance,
  parseMark,
  parseTrackTime,
  percentOfTarget,
  personalBest,
  progressionSeries,
  readExcellenceStorage,
  summarizeRows,
  targetStatus,
  weakStations,
  writeExcellenceStorage,
} from "../../lib/excellence-athletics.ts";
import { DEMO_BENCHMARKS, getDemoAthletes } from "../../lib/excellence-demo.ts";

const result = (id, event, mark, competedAt) => ({ id, event, mark, competedAt, competitionName: "x", stage: null });

test("gender comes from the track or field category and other categories are rejected", () => {
  assert.equal(parseAthleticsGender("ลู่ (ชาย)"), "ชาย");
  assert.equal(parseAthleticsGender(" ลู่ (หญิง) "), "หญิง");
  assert.equal(parseAthleticsGender("ลาน (ชาย)"), "ชาย");
  assert.equal(parseAthleticsGender("ลาน (หญิง)"), "หญิง");
  assert.equal(parseAthleticsGender("บุคคลชาย"), null);
});

test("events are track (lower is better) or field (higher is better)", () => {
  assert.equal(eventKind("100m"), "TRACK");
  assert.equal(eventKind("longJump"), "FIELD");
  assert.equal(lowerIsBetter("400mH"), true);
  assert.equal(lowerIsBetter("javelin"), false);
  assert.ok(ATHLETICS_EVENTS.filter(event => event.kind === "FIELD").length >= 6);
});

test("hurdle events are offered only to the matching gender, field events to both", () => {
  const men = eventsForGender("ชาย").map(event => event.key);
  const women = eventsForGender("หญิง").map(event => event.key);
  assert.ok(men.includes("110mH") && !men.includes("100mH"));
  assert.ok(women.includes("100mH") && !women.includes("110mH"));
  assert.ok(men.includes("shotPut") && women.includes("shotPut"));
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

test("marks parse and format by event kind, and input text round-trips", () => {
  assert.equal(parseFieldDistance("7.85"), 7.85);
  assert.equal(parseFieldDistance("7.856"), null);
  assert.equal(parseFieldDistance("1:58"), null);
  assert.equal(parseMark("longJump", "7.85"), 7.85);
  assert.equal(parseMark("100m", "10.85"), 10.85);
  assert.equal(parseMark("longJump", "1:20"), null);
  assert.equal(formatMark("longJump", 7.8), "7.80 ม.");
  assert.equal(formatMark("800m", 118.32), "1:58.32");
  assert.equal(formatMark("longJump", null), "—");
  assert.equal(formatSignedMark("100m", 0.48), "+0.48s");
  assert.equal(formatSignedMark("100m", -0.02), "−0.02s");
  assert.equal(formatSignedMark("shotPut", 0.15), "+0.15 ม.");
  assert.equal(formatSignedMark("shotPut", 0), "0.00 ม.");
  for (const [event, value] of [["800m", 118.32], ["100m", 10.8], ["longJump", 7.85], ["highJump", 1.9]]) {
    assert.equal(parseMark(event, formatMarkInput(event, value)), value);
  }
});

test("gap is positive when behind the target for both track and field", () => {
  assert.equal(gapToTarget("100m", 11.48, 11), 0.48);
  assert.equal(gapToTarget("100m", 10.98, 11), -0.02);
  assert.equal(gapToTarget("longJump", 7.05, 7.2), 0.15);
  assert.equal(gapToTarget("longJump", 7.3, 7.2), -0.1);
  assert.equal(gapToTarget("100m", 11.2, null), null);
  assert.equal(gapToTarget("longJump", null, 7.2), null);
});

test("status reports missing targets instead of guessing and respects direction", () => {
  assert.equal(targetStatus("100m", 10.98, 11), "AT_TARGET");
  assert.equal(targetStatus("100m", 11, 11), "AT_TARGET");
  assert.equal(targetStatus("100m", 11.2, 11), "BELOW_TARGET");
  assert.equal(targetStatus("longJump", 7.2, 7.2), "AT_TARGET");
  assert.equal(targetStatus("longJump", 7.3, 7.2), "AT_TARGET");
  assert.equal(targetStatus("longJump", 7.1, 7.2), "BELOW_TARGET");
  assert.equal(targetStatus("100m", 11.2, null), "NO_TARGET");
  assert.equal(targetStatus("100m", null, 11), "NO_RESULT");
});

test("benchmarks drop unknown events, wrong genders and invalid values and read the legacy key", () => {
  const parsed = parseBenchmarks({
    "100m|ชาย": { target: 11, updatedAt: "x", updatedBy: "y" },
    "200m|ชาย": { targetSeconds: 22.5 },
    "longJump|หญิง": { target: 5.8 },
    "100mH|ชาย": { target: 14 },
    "999m|ชาย": { target: 1 },
    "200m|หญิง": { target: -1 },
  });
  assert.deepEqual(Object.keys(parsed).sort(), ["100m|ชาย", "200m|ชาย", "longJump|หญิง"]);
  assert.equal(parsed["200m|ชาย"].target, 22.5);
  assert.deepEqual(parseBenchmarks(null), {});
});

test("PB marks the best time per event and SB the best per year", () => {
  const marked = markBests([
    result("a", "100m", 11.35, "2025-11-20"),
    result("b", "100m", 11.12, "2026-03-14"),
    result("c", "100m", 11.2, "2026-08-22"),
    result("d", "200m", 22.9, "2026-08-22"),
  ]);
  const byId = Object.fromEntries(marked.map(item => [item.id, item]));
  assert.deepEqual([byId.a.isPB, byId.a.isSB], [false, true]);
  assert.deepEqual([byId.b.isPB, byId.b.isSB], [true, true]);
  assert.deepEqual([byId.c.isPB, byId.c.isSB], [false, false]);
  assert.deepEqual([byId.d.isPB, byId.d.isSB], [true, true]);
  assert.equal(marked[0].competedAt, "2026-08-22");
});

test("field PB and SB are the longest or highest mark", () => {
  const marked = markBests([
    result("a", "longJump", 6.85, "2025-11-20"),
    result("b", "longJump", 7.18, "2026-03-14"),
    result("c", "longJump", 7.05, "2026-08-22"),
  ]);
  const byId = Object.fromEntries(marked.map(item => [item.id, item]));
  assert.deepEqual([byId.a.isPB, byId.a.isSB], [false, true]);
  assert.deepEqual([byId.b.isPB, byId.b.isSB], [true, true]);
  assert.deepEqual([byId.c.isPB, byId.c.isSB], [false, false]);
  assert.equal(personalBest(marked, "longJump"), 7.18);
  assert.equal(personalBest(marked, "100m"), null);
  assert.equal(personalBest([result("x", "100m", 11.5, "2026-01-01"), result("y", "100m", 11.1, "2026-02-01")], "100m"), 11.1);
});

test("an equal mark keeps PB on the earlier result", () => {
  const marked = markBests([result("a", "100m", 11, "2026-01-01"), result("b", "100m", 11, "2026-02-01")]);
  assert.equal(marked.find(item => item.id === "a").isPB, true);
  assert.equal(marked.find(item => item.id === "b").isPB, false);
});

test("SWC uses a floor or 0.5% of the baseline, per event kind", () => {
  assert.equal(markSwc("100m", 11.48), 0.1);
  assert.equal(markSwc("400m", 50.9), 0.25);
  assert.equal(markSwc("800m", 240), 1.2);
  assert.equal(markSwc("highJump", 1.9), 0.02);
  assert.equal(markSwc("longJump", 7.18), 0.04);
  assert.equal(markSwc("javelin", 60), 0.3);
  assert.equal(classifyChange(-0.05, 0.1, true), "WITHIN_SWC");
  assert.equal(classifyChange(-0.1, 0.1, true), "IMPROVED");
  assert.equal(classifyChange(0.3, 0.1, true), "DECLINED");
  assert.equal(classifyChange(0, 0, true), "WITHIN_SWC");
  assert.equal(classifyChange(0.12, 0.04), "IMPROVED");
  assert.equal(classifyChange(-0.12, 0.04), "DECLINED");
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

test("retests saved with the first-version timeSeconds field are read as mark", () => {
  const legacy = { _excellence: { v2: { revision: 2, plans: [], retests: [
    { id: "t1", planId: null, testedAt: "2026-10-05", ratings: {}, event: "100m", timeSeconds: 11.3, notes: null, recordedAt: "x", recordedBy: "y" },
    { id: "t2", planId: null, testedAt: "2026-10-06", ratings: { grip: "ดี" }, event: null, timeSeconds: null, notes: null, recordedAt: "x", recordedBy: "y" },
  ] } } };
  const [first, second] = readExcellenceStorage(legacy).retests;
  assert.equal(first.mark, 11.3);
  assert.equal("timeSeconds" in first, false);
  assert.equal(second.mark, null);
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
  result("r1", "100m", 11.62, "2026-03-14"),
  result("r2", "100m", 11.48, "2026-08-22"),
  result("r3", "100m", 11.1, "2026-11-01"),
];
const retestOf = (overrides) => ({ id: "t1", planId: null, testedAt: "2026-10-05", ratings: {}, event: "100m", mark: 11.3, notes: null, recordedAt: "", recordedBy: "", ...overrides });

test("retest reports each plan item against its linked station", () => {
  const comparison = compareRetest({
    retest: retestOf({ planId: "p1", ratings: { legPower: "ปานกลาง", sprint40m: "พอใช้" } }),
    baselineRatings: { legPower: "ต่ำ", sprint40m: "พอใช้", agility: "ดี" },
    plan,
    results,
  });
  assert.deepEqual(comparison.planItems.map(item => item.change), ["IMPROVED", "NO_CHANGE", "NOT_TESTED"]);
  assert.ok(comparison.summary.includes("ดีขึ้น 1 จาก 2 สถานี"));
  // เทียบกับผลแข่งล่าสุดก่อนวันทดสอบซ้ำ (11.48) ไม่ใช่ผลหลังจากนั้น (11.10)
  assert.equal(comparison.mark.before, 11.48);
  assert.equal(comparison.mark.delta, -0.18);
  assert.equal(comparison.mark.change, "IMPROVED");
});

test("retest mark within SWC is reported as no clear change", () => {
  const comparison = compareRetest({ retest: retestOf({ mark: 11.42 }), baselineRatings: {}, plan: null, results });
  assert.equal(comparison.planItems.length, 0);
  assert.equal(comparison.mark.change, "WITHIN_SWC");
  assert.ok(comparison.summary.includes("±0.1s"));
});

test("retest without an earlier result of that event has no baseline", () => {
  const comparison = compareRetest({ retest: retestOf({ event: "400m", mark: 52 }), baselineRatings: {}, plan: null, results });
  assert.equal(comparison.mark.before, null);
  assert.equal(comparison.mark.change, null);
});

test("a field retest improves when the distance grows and uses the field SWC", () => {
  const jumps = [result("j1", "longJump", 7.05, "2026-03-14"), result("j2", "longJump", 7.18, "2026-08-22")];
  const better = compareRetest({ retest: retestOf({ event: "longJump", mark: 7.3 }), baselineRatings: {}, plan: null, results: jumps });
  assert.equal(better.mark.delta, 0.12);
  assert.equal(better.mark.swc, 0.04);
  assert.equal(better.mark.change, "IMPROVED");
  assert.ok(better.summary.includes("ระยะ"));
  const worse = compareRetest({ retest: retestOf({ event: "longJump", mark: 7.0 }), baselineRatings: {}, plan: null, results: jumps });
  assert.equal(worse.mark.change, "DECLINED");
  const same = compareRetest({ retest: retestOf({ event: "longJump", mark: 7.2 }), baselineRatings: {}, plan: null, results: jumps });
  assert.equal(same.mark.change, "WITHIN_SWC");
  assert.ok(same.summary.includes("±0.04 ม."));
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

test("demo includes field events and reports them in the field direction", () => {
  const rows = getDemoAthletes().flatMap(athlete => overviewRows(athlete, DEMO_BENCHMARKS));
  const jumper = rows.find(row => row.event === "longJump");
  assert.equal(jumper.bestMark, 7.18);
  assert.equal(jumper.targetMark, 7.2);
  assert.equal(jumper.gapMark, 0.02);
  assert.equal(jumper.status, "BELOW_TARGET");
  assert.equal(jumper.percentOfTarget, 99.7);
  const thrower = rows.find(row => row.event === "shotPut");
  assert.equal(thrower.bestMark, 12.8);
  assert.equal(thrower.gapMark, 0.2);
});

test("every demo athlete uses known events and every detail builds", () => {
  const events = new Set(ATHLETICS_EVENTS.map(event => event.key));
  for (const athlete of getDemoAthletes()) {
    assert.ok(athlete.applicationId.startsWith("demo-"));
    assert.ok(athlete.results.every(item => events.has(item.event)));
    const detail = buildAthleteDetail(athlete, DEMO_BENCHMARKS);
    assert.equal(detail.results.length, athlete.results.length);
    assert.equal(detail.retests.length, athlete.storage.retests.length);
  }
});

test("demo covers improved and within-SWC retests for both track and field", () => {
  const compared = getDemoAthletes()
    .flatMap(athlete => buildAthleteDetail(athlete, DEMO_BENCHMARKS).retests)
    .map(retest => retest.comparison.mark)
    .filter(Boolean);
  for (const kind of ["TRACK", "FIELD"]) {
    const changes = compared.filter(mark => eventKind(mark.event) === kind).map(mark => mark.change);
    assert.ok(changes.includes("IMPROVED"), `${kind} improved`);
    assert.ok(changes.includes("WITHIN_SWC"), `${kind} within SWC`);
  }
});

test("percent of target is comparable across events and directions", () => {
  assert.equal(percentOfTarget("100m", 11, 11), 100);
  assert.equal(percentOfTarget("100m", 10.98, 11), 100.2);
  assert.equal(percentOfTarget("400m", 50.9, 50.5), 99.2);
  assert.equal(percentOfTarget("longJump", 7.56, 7.2), 105);
  assert.equal(percentOfTarget("shotPut", 12.8, 13), 98.5);
  assert.equal(percentOfTarget("100m", 11.48, null), null);
  assert.equal(percentOfTarget("100m", null, 11), null);
  assert.equal(percentOfTarget("100m", 0, 11), null);
});

test("overview and detail carry percent of target and null when no target is set", () => {
  const athletes = getDemoAthletes();
  const rows = athletes.flatMap(athlete => overviewRows(athlete, DEMO_BENCHMARKS));
  const kritsada = rows.find(row => row.name.includes("กฤษดา"));
  assert.equal(kritsada.percentOfTarget, percentOfTarget("100m", kritsada.bestMark, kritsada.targetMark));
  assert.ok(kritsada.percentOfTarget > 100);
  assert.ok(rows.filter(row => row.status === "NO_TARGET" || row.status === "NO_RESULT").every(row => row.percentOfTarget === null));
  const detail = buildAthleteDetail(athletes[0], DEMO_BENCHMARKS);
  assert.ok(detail.results.every(item => item.percentOfTarget === percentOfTarget(item.event, item.mark, item.target)));
});

test("progression series keeps only events with two or more results, oldest first, with the event kind", () => {
  const detail = buildAthleteDetail(getDemoAthletes()[0], DEMO_BENCHMARKS);
  const series = progressionSeries(detail.results);
  assert.equal(series.length, 1);
  assert.equal(series[0].event, "100m");
  assert.equal(series[0].kind, "TRACK");
  assert.equal(series[0].target, 11);
  assert.deepEqual(series[0].points.map(point => point.date), ["2025-11-20", "2026-03-14", "2026-08-22"]);
  assert.deepEqual(series[0].points.map(point => point.isPB), [false, false, true]);
  const single = buildAthleteDetail(getDemoAthletes()[3], DEMO_BENCHMARKS);
  assert.deepEqual(progressionSeries(single.results), []);
  const jumper = buildAthleteDetail(getDemoAthletes().find(athlete => athlete.results.some(item => item.event === "longJump")), DEMO_BENCHMARKS);
  const jumps = progressionSeries(jumper.results)[0];
  assert.equal(jumps.kind, "FIELD");
  assert.deepEqual(jumps.points.map(point => point.isPB), [false, false, true]);
});

test("heatmap lists each athlete once, weakest first, and summarizes only tested stations", () => {
  const athletes = getDemoAthletes();
  const heatmap = buildHeatmap(athletes, {});
  assert.equal(heatmap.rows.length, athletes.length);
  assert.equal(heatmap.stations.length, 7);
  const weakCounts = heatmap.rows.map(row => row.weakCount);
  assert.deepEqual(weakCounts, [...weakCounts].sort((a, b) => b - a));
  for (const station of heatmap.stations) {
    const cells = heatmap.rows.map(row => row.cells[station.key]).filter(Boolean);
    assert.equal(station.tested, cells.length);
    assert.equal(station.weak, cells.filter(cell => cell.weak).length);
  }
  const untested = buildHeatmap([{ ...athletes[0], fitness: null }], {});
  assert.equal(untested.rows[0].testedCount, 0);
  assert.equal(untested.rows[0].weakCount, 0);
  assert.ok(untested.stations.every(station => station.tested === 0 && station.averageScore === null));
});

test("heatmap filters by gender, event and search", () => {
  const athletes = getDemoAthletes();
  const women = buildHeatmap(athletes, { gender: "หญิง" });
  assert.ok(women.rows.length > 0 && women.rows.every(row => row.gender === "หญิง"));
  const jumpers = buildHeatmap(athletes, { event: "longJump" });
  assert.equal(jumpers.rows.length, 1);
  assert.deepEqual(jumpers.rows[0].events, ["longJump"]);
  assert.equal(buildHeatmap(athletes, { search: "กฤษดา" }).rows.length, 1);
  assert.equal(buildHeatmap(athletes, { search: "ไม่มีชื่อนี้" }).rows.length, 0);
});
