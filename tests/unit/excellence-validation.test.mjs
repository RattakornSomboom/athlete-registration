import assert from "node:assert/strict";
import test from "node:test";
import { ATHLETICS_EVENTS, ATHLETICS_STATIONS } from "../../lib/excellence-athletics.ts";
import {
  EVENT_RULES,
  ExcellenceValidationError,
  VALID_STATION_KEYS,
  assertEventForGender,
  MAX_BATCH_ENTRIES,
  markValue,
  resultId,
  retestId,
  validateBatchResultInput,
  validateBenchmarkInput,
  validatePlanInput,
  validateResultInput,
  validateResultUpdateInput,
  validateRetestDeleteInput,
  validateRetestInput,
} from "../../lib/excellence-validation.ts";
import { preserveExcellenceMetadata } from "../../lib/fitness-score-metadata.ts";

const rejects = (fn, field) => assert.throws(fn, error => error instanceof ExcellenceValidationError && (!field || field in (error.fieldErrors ?? {})));

test("validator event rules and station keys match the athletics module", () => {
  const fromModule = Object.fromEntries(ATHLETICS_EVENTS.map(event => [event.key, { kind: event.kind, genders: [...event.genders], min: event.min, max: event.max }]));
  const fromValidator = Object.fromEntries(Object.entries(EVENT_RULES).map(([key, rule]) => [key, { kind: rule.kind, genders: [...rule.genders], min: rule.min, max: rule.max }]));
  assert.deepEqual(fromValidator, fromModule);
  assert.deepEqual(ATHLETICS_STATIONS.map(station => station.key), [...VALID_STATION_KEYS]);
});

test("track marks accept seconds or minute format, field marks accept metres, each within its range", () => {
  assert.equal(markValue("1:58.32", "800m"), 118.32);
  assert.equal(markValue(10.856, "100m"), 10.86);
  assert.equal(markValue("7.85", "longJump"), 7.85);
  assert.equal(markValue(7.856, "longJump"), 7.86);
  rejects(() => markValue("10.85", "800m"), "mark");
  rejects(() => markValue("1:58", "longJump"), "mark");
  rejects(() => markValue("7.856", "longJump"), "mark");
  rejects(() => markValue("12", "longJump"), "mark");
  rejects(() => markValue("3.5", "highJump"), "mark");
  rejects(() => markValue("0.5", "highJump"), "mark");
  assert.equal(markValue("2.05", "highJump"), 2.05);
  rejects(() => markValue("abc", "100m"), "mark");
});

test("result input checks the event, the mark and the date", () => {
  const base = { applicationId: "app-1", event: "800m", competedAt: "2026-08-22" };
  assert.equal(validateResultInput({ ...base, mark: "1:58.32" }).mark, 118.32);
  assert.equal(validateResultInput({ ...base, event: "javelin", mark: "61.40" }).mark, 61.4);
  rejects(() => validateResultInput({ ...base, mark: "10.85" }), "mark");
  rejects(() => validateResultInput({ ...base, event: "60m", mark: 7 }), "event");
  rejects(() => validateResultInput({ ...base, mark: "1:58.32", competedAt: "2026-02-30" }), "competedAt");
  rejects(() => validateResultInput({ ...base, event: "toString", mark: 1 }), "event");
});

test("demo records cannot be written", () => {
  assert.throws(
    () => validateResultInput({ applicationId: "demo-1", event: "100m", mark: 11, competedAt: "2026-08-22" }),
    error => error instanceof ExcellenceValidationError && error.message.includes("สาธิต"),
  );
});

test("event must be open for the athlete gender", () => {
  assert.doesNotThrow(() => assertEventForGender("110mH", "ชาย"));
  assert.doesNotThrow(() => assertEventForGender("shotPut", "หญิง"));
  rejects(() => assertEventForGender("110mH", "หญิง"), "event");
  rejects(() => validateBenchmarkInput({ event: "100mH", gender: "ชาย", target: 14 }), "event");
});

test("benchmark input allows clearing a target and validates by event kind", () => {
  assert.equal(validateBenchmarkInput({ event: "100m", gender: "หญิง", target: null }).target, null);
  assert.equal(validateBenchmarkInput({ event: "100m", gender: "หญิง", target: "" }).target, null);
  assert.equal(validateBenchmarkInput({ event: "400m", gender: "ชาย", target: "50.5" }).target, 50.5);
  assert.equal(validateBenchmarkInput({ event: "longJump", gender: "ชาย", target: "7.20" }).target, 7.2);
  rejects(() => validateBenchmarkInput({ event: "longJump", gender: "ชาย", target: "50" }), "target");
  rejects(() => validateBenchmarkInput({ event: "100m", gender: "อื่น", target: 11 }), "gender");
});

const planBody = (overrides = {}) => ({
  applicationId: "app-1",
  revision: 2,
  plan: {
    coachName: "โค้ช",
    startDate: "2026-08-25",
    endDate: "2026-10-20",
    status: "ACTIVE",
    items: [{ stationKey: "legStrengthRatio", activity: "Squat" }],
    ...overrides,
  },
});

test("plan input requires items linked to valid stations and an ordered date range", () => {
  const parsed = validatePlanInput(planBody());
  assert.equal(parsed.revision, 2);
  assert.deepEqual(parsed.plan.items, [{ id: null, stationKey: "legStrengthRatio", activity: "Squat" }]);
  rejects(() => validatePlanInput(planBody({ items: [] })), "items");
  rejects(() => validatePlanInput(planBody({ items: [{ stationKey: "swim", activity: "x" }] })), "items.0.stationKey");
  rejects(() => validatePlanInput(planBody({ items: [{ stationKey: "gripStrengthRatio", activity: " " }] })), "items.0.activity");
  rejects(() => validatePlanInput(planBody({ endDate: "2026-08-01" })), "endDate");
  rejects(() => validatePlanInput(planBody({ status: "DONE" })), "status");
  rejects(() => validatePlanInput({ ...planBody(), revision: undefined }), "revision");
});

const retestBody = (overrides = {}) => ({
  applicationId: "app-1",
  revision: 0,
  retest: { testedAt: "2026-10-05", ratings: { legStrengthRatio: "ปานกลาง", gripStrengthRatio: "" }, ...overrides },
});

test("retest input keeps tested stations and pairs event with mark", () => {
  const parsed = validateRetestInput(retestBody({ event: "100m", mark: "11.30" }));
  assert.deepEqual(parsed.retest.ratings, { legStrengthRatio: "ปานกลาง" });
  assert.equal(parsed.retest.mark, 11.3);
  assert.equal(validateRetestInput(retestBody({ event: "longJump", mark: "7.30" })).retest.mark, 7.3);
  rejects(() => validateRetestInput(retestBody({ event: "100m" })), "mark");
  rejects(() => validateRetestInput(retestBody({ mark: 11 })), "event");
  rejects(() => validateRetestInput(retestBody({ event: "longJump", mark: "11.3" })), "mark");
  rejects(() => validateRetestInput(retestBody({ ratings: {} })), "ratings");
  rejects(() => validateRetestInput(retestBody({ ratings: { legStrengthRatio: "เยี่ยม" } })), "ratings.legStrengthRatio");
  // กลุ่ม 9 มี 5 ระดับ ไม่รับ "พอใช้" และชื่อสถานีเดิม
  rejects(() => validateRetestInput(retestBody({ ratings: { legStrengthRatio: "พอใช้" } })), "ratings.legStrengthRatio");
  rejects(() => validateRetestInput(retestBody({ ratings: { legPower: "ดี" } })), "ratings.legPower");
});

test("fitness re-import keeps Excellence v2 data", () => {
  const existing = { items: { agility: "ดี" }, _excellence: { v2: { revision: 4, plans: [], retests: [] } } };
  const next = preserveExcellenceMetadata(existing, { items: { agility: "ดีมาก" }, _excellence: { v2: { revision: 0 } } });
  assert.deepEqual(next, { items: { agility: "ดีมาก" }, _excellence: { v2: { revision: 4, plans: [], retests: [] } } });
});

test("keeping Excellence data handles first imports, legacy rows and odd score shapes", () => {
  const v2 = { v2: { revision: 2, plans: [], retests: [] } };
  const fresh = { items: { sitUps: "ผ่าน" } };
  // ยังไม่มีผลเดิม / ผลเดิมไม่มี _excellence / ผลเดิมเป็นรูปร่างผิด = ใช้ค่าใหม่ตามเดิม
  assert.deepEqual(preserveExcellenceMetadata(null, fresh), fresh);
  assert.deepEqual(preserveExcellenceMetadata({ items: {} }, fresh), fresh);
  assert.deepEqual(preserveExcellenceMetadata([1], fresh), fresh);
  assert.deepEqual(preserveExcellenceMetadata({ _excellence: "x" }, fresh), fresh);
  // ผู้เรียกส่ง _excellence มาเองไม่ได้ ค่าใหม่ถูกตัดทิ้งแม้ไม่มีของเดิม
  assert.deepEqual(preserveExcellenceMetadata(null, { ...fresh, _excellence: { v2: { revision: 9 } } }), fresh);
  // คะแนนใหม่ที่ไม่ใช่ object ถูกห่อใน items และยังคงข้อมูลเดิมไว้
  assert.deepEqual(preserveExcellenceMetadata({ _excellence: v2 }, "ผ่าน"), { items: "ผ่าน", _excellence: v2 });
  assert.deepEqual(preserveExcellenceMetadata({ _excellence: v2 }, null), { items: {}, _excellence: v2 });
});

test("result update takes the same fields without an application id and refuses demo ids", () => {
  const parsed = validateResultUpdateInput({ event: "200m", mark: "23.45", competedAt: "2026-09-01", stage: "" });
  assert.deepEqual(parsed, { event: "200m", mark: 23.45, competedAt: "2026-09-01", stage: null });
  rejects(() => validateResultUpdateInput({ event: "200m", mark: "5", competedAt: "2026-09-01" }), "mark");
  rejects(() => validateResultUpdateInput({ event: "200m", mark: "23.45" }), "competedAt");
  assert.equal(resultId("cmabc123"), "cmabc123");
  assert.throws(() => resultId("demo-1-r1"), error => error instanceof ExcellenceValidationError && error.message.includes("สาธิต"));
  rejects(() => resultId(" "), "resultId");
});

test("retest delete needs an application id and revision and refuses demo ids", () => {
  assert.deepEqual(validateRetestDeleteInput({ applicationId: "app-1", revision: 3 }), { applicationId: "app-1", revision: 3 });
  rejects(() => validateRetestDeleteInput({ applicationId: "app-1" }), "revision");
  rejects(() => validateRetestDeleteInput({ applicationId: "demo-2", revision: 0 }));
  assert.equal(retestId("abc-123"), "abc-123");
  assert.throws(() => retestId("demo-2-t1"), error => error instanceof ExcellenceValidationError && error.message.includes("สาธิต"));
});

const batch = (overrides = {}) => ({
  event: "100m",
  competedAt: "2026-10-18",
  stage: "รอบชิง",
  entries: [{ applicationId: "app-1", mark: "10.85" }, { applicationId: "app-2", mark: 11.2 }],
  ...overrides,
});

test("batch input accepts one event, date and stage with many marks", () => {
  const parsed = validateBatchResultInput(batch());
  assert.equal(parsed.event, "100m");
  assert.equal(parsed.stage, "รอบชิง");
  assert.deepEqual(parsed.entries, [{ applicationId: "app-1", mark: 10.85 }, { applicationId: "app-2", mark: 11.2 }]);
  assert.equal(validateBatchResultInput(batch({ stage: "" })).stage, null);
  assert.equal(validateBatchResultInput(batch({ event: "javelin", entries: [{ applicationId: "app-1", mark: "61.40" }] })).entries[0].mark, 61.4);
});

test("batch input reports every bad row at once, keyed by athlete", () => {
  try {
    validateBatchResultInput(batch({ entries: [
      { applicationId: "app-1", mark: "abc" },
      { applicationId: "app-2", mark: "5" },
      { applicationId: "app-3", mark: "10.9" },
      { applicationId: "app-3", mark: "11.0" },
      { mark: "10.5" },
    ] }));
    assert.fail("should reject");
  } catch (error) {
    assert.ok(error instanceof ExcellenceValidationError);
    assert.equal(error.status, 400);
    assert.deepEqual(Object.keys(error.fieldErrors).sort(), ["entries.4", "entries.app-1", "entries.app-2", "entries.app-3"].sort());
    assert.ok(error.fieldErrors["entries.app-3"].includes("ซ้ำ"));
    assert.ok(error.message.includes("4 แถว"));
  }
});

test("batch input rejects empty, oversized, demo and wrongly shaped requests", () => {
  rejects(() => validateBatchResultInput(batch({ entries: [] })), "entries");
  rejects(() => validateBatchResultInput(batch({ entries: Array.from({ length: MAX_BATCH_ENTRIES + 1 }, (_, i) => ({ applicationId: `a${i}`, mark: 11 })) })), "entries");
  rejects(() => validateBatchResultInput(batch({ event: "60m" })), "event");
  rejects(() => validateBatchResultInput(batch({ competedAt: "2026-02-30" })), "competedAt");
  assert.throws(() => validateBatchResultInput(batch({ entries: [{ applicationId: "demo-1", mark: 11 }] })), error => error instanceof ExcellenceValidationError && error.message.includes("สาธิต"));
  rejects(() => validateBatchResultInput({ ...batch(), entries: "x" }), "entries");
  assert.doesNotThrow(() => validateBatchResultInput(batch({ entries: Array.from({ length: MAX_BATCH_ENTRIES }, (_, i) => ({ applicationId: `a${i}`, mark: 11 })) })));
});

