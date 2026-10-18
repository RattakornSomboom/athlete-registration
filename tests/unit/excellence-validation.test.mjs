import assert from "node:assert/strict";
import test from "node:test";
import { ATHLETICS_STATIONS, ATHLETICS_TRACK_EVENTS } from "../../lib/excellence-athletics.ts";
import {
  EVENT_TIME_RANGES,
  ExcellenceValidationError,
  VALID_EVENT_GENDERS,
  VALID_STATION_KEYS,
  assertEventForGender,
  resultId,
  retestId,
  validateBenchmarkInput,
  validatePlanInput,
  validateResultInput,
  validateResultUpdateInput,
  validateRetestDeleteInput,
  validateRetestInput,
} from "../../lib/excellence-validation.ts";
import { preserveExcellenceMetadata } from "../../lib/fitness-score-metadata.ts";

const rejects = (fn, field) => assert.throws(fn, error => error instanceof ExcellenceValidationError && (!field || field in (error.fieldErrors ?? {})));

test("validator event and station tables match the athletics module", () => {
  assert.deepEqual(
    Object.fromEntries(ATHLETICS_TRACK_EVENTS.map(event => [event.key, [...event.genders]])),
    Object.fromEntries(Object.entries(VALID_EVENT_GENDERS).map(([key, genders]) => [key, [...genders]])),
  );
  assert.deepEqual(
    Object.fromEntries(ATHLETICS_TRACK_EVENTS.map(event => [event.key, [event.minSeconds, event.maxSeconds]])),
    Object.fromEntries(Object.entries(EVENT_TIME_RANGES).map(([key, range]) => [key, [...range]])),
  );
  assert.deepEqual(ATHLETICS_STATIONS.map(station => station.key), [...VALID_STATION_KEYS]);
});

test("result input accepts seconds or minute format and checks the event range", () => {
  const base = { applicationId: "app-1", event: "800m", competedAt: "2026-08-22" };
  assert.equal(validateResultInput({ ...base, timeSeconds: "1:58.32" }).timeSeconds, 118.32);
  assert.equal(validateResultInput({ ...base, event: "100m", timeSeconds: 10.856 }).timeSeconds, 10.86);
  rejects(() => validateResultInput({ ...base, timeSeconds: "10.85" }), "timeSeconds");
  rejects(() => validateResultInput({ ...base, event: "60m", timeSeconds: 7 }), "event");
  rejects(() => validateResultInput({ ...base, timeSeconds: "1:58.32", competedAt: "2026-02-30" }), "competedAt");
});

test("demo records cannot be written", () => {
  assert.throws(
    () => validateResultInput({ applicationId: "demo-1", event: "100m", timeSeconds: 11, competedAt: "2026-08-22" }),
    error => error instanceof ExcellenceValidationError && error.message.includes("สาธิต"),
  );
});

test("event must be open for the athlete gender", () => {
  assert.doesNotThrow(() => assertEventForGender("110mH", "ชาย"));
  rejects(() => assertEventForGender("110mH", "หญิง"), "event");
  rejects(() => validateBenchmarkInput({ event: "100mH", gender: "ชาย", targetSeconds: 14 }), "event");
});

test("benchmark input allows clearing a target with null or empty text", () => {
  assert.equal(validateBenchmarkInput({ event: "100m", gender: "หญิง", targetSeconds: null }).targetSeconds, null);
  assert.equal(validateBenchmarkInput({ event: "100m", gender: "หญิง", targetSeconds: "" }).targetSeconds, null);
  assert.equal(validateBenchmarkInput({ event: "400m", gender: "ชาย", targetSeconds: "50.5" }).targetSeconds, 50.5);
  rejects(() => validateBenchmarkInput({ event: "100m", gender: "อื่น", targetSeconds: 11 }), "gender");
});

const planBody = (overrides = {}) => ({
  applicationId: "app-1",
  revision: 2,
  plan: {
    coachName: "โค้ช",
    startDate: "2026-08-25",
    endDate: "2026-10-20",
    status: "ACTIVE",
    items: [{ stationKey: "legPower", activity: "Plyometrics" }],
    ...overrides,
  },
});

test("plan input requires items linked to valid stations and an ordered date range", () => {
  const parsed = validatePlanInput(planBody());
  assert.equal(parsed.revision, 2);
  assert.deepEqual(parsed.plan.items, [{ id: null, stationKey: "legPower", activity: "Plyometrics" }]);
  rejects(() => validatePlanInput(planBody({ items: [] })), "items");
  rejects(() => validatePlanInput(planBody({ items: [{ stationKey: "swim", activity: "x" }] })), "items.0.stationKey");
  rejects(() => validatePlanInput(planBody({ items: [{ stationKey: "grip", activity: " " }] })), "items.0.activity");
  rejects(() => validatePlanInput(planBody({ endDate: "2026-08-01" })), "endDate");
  rejects(() => validatePlanInput(planBody({ status: "DONE" })), "status");
  rejects(() => validatePlanInput({ ...planBody(), revision: undefined }), "revision");
});

const retestBody = (overrides = {}) => ({
  applicationId: "app-1",
  revision: 0,
  retest: { testedAt: "2026-10-05", ratings: { legPower: "ปานกลาง", grip: "" }, ...overrides },
});

test("retest input keeps tested stations and pairs event with time", () => {
  const parsed = validateRetestInput(retestBody({ event: "100m", timeSeconds: "11.30" }));
  assert.deepEqual(parsed.retest.ratings, { legPower: "ปานกลาง" });
  assert.equal(parsed.retest.timeSeconds, 11.3);
  rejects(() => validateRetestInput(retestBody({ event: "100m" })), "timeSeconds");
  rejects(() => validateRetestInput(retestBody({ timeSeconds: 11 })), "event");
  rejects(() => validateRetestInput(retestBody({ ratings: {} })), "ratings");
  rejects(() => validateRetestInput(retestBody({ ratings: { legPower: "เยี่ยม" } })), "ratings.legPower");
});

test("fitness re-import keeps Excellence v2 data", () => {
  const existing = { items: { agility: "ดี" }, _excellence: { v2: { revision: 4, plans: [], retests: [] } } };
  const next = preserveExcellenceMetadata(existing, { items: { agility: "ดีมาก" }, _excellence: { v2: { revision: 0 } } });
  assert.deepEqual(next, { items: { agility: "ดีมาก" }, _excellence: { v2: { revision: 4, plans: [], retests: [] } } });
});

test("result update takes the same fields without an application id and refuses demo ids", () => {
  const parsed = validateResultUpdateInput({ event: "200m", timeSeconds: "23.45", competedAt: "2026-09-01", stage: "" });
  assert.deepEqual(parsed, { event: "200m", timeSeconds: 23.45, competedAt: "2026-09-01", stage: null });
  rejects(() => validateResultUpdateInput({ event: "200m", timeSeconds: "5", competedAt: "2026-09-01" }), "timeSeconds");
  rejects(() => validateResultUpdateInput({ event: "200m", timeSeconds: "23.45" }), "competedAt");
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
