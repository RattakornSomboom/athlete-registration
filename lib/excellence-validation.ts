// ตรวจ input ของ API โมดูลสู่ความเป็นเลิศ (กรีฑาประเภทลู่และลาน)
// ไม่ import ค่า runtime จากโมดูลอื่นนอกจาก ./excellence-athletics.ts แบบ type-only เพื่อให้ node รัน unit test ได้โดยตรง
import type { AthleticsGender, FitnessRating, PlanStatus } from "./excellence-athletics";

export class ExcellenceValidationError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type EventRule = { kind: "TRACK" | "FIELD"; genders: readonly AthleticsGender[]; min: number; max: number };

// ตารางนี้ซ้ำกับ ATHLETICS_EVENTS ใน excellence-athletics.ts โดยตั้งใจ (import runtime ข้ามไฟล์ไม่ได้ใน node test) — test ตรวจว่าตรงกัน
const BOTH: readonly AthleticsGender[] = ["ชาย", "หญิง"];
export const EVENT_RULES: Record<string, EventRule> = {
  "100m": { kind: "TRACK", genders: BOTH, min: 9, max: 20 },
  "200m": { kind: "TRACK", genders: BOTH, min: 18, max: 40 },
  "400m": { kind: "TRACK", genders: BOTH, min: 40, max: 90 },
  "800m": { kind: "TRACK", genders: BOTH, min: 95, max: 240 },
  "1500m": { kind: "TRACK", genders: BOTH, min: 200, max: 480 },
  "5000m": { kind: "TRACK", genders: BOTH, min: 750, max: 1800 },
  "10000m": { kind: "TRACK", genders: BOTH, min: 1600, max: 3600 },
  "100mH": { kind: "TRACK", genders: ["หญิง"], min: 11, max: 25 },
  "110mH": { kind: "TRACK", genders: ["ชาย"], min: 12, max: 25 },
  "400mH": { kind: "TRACK", genders: BOTH, min: 45, max: 100 },
  longJump: { kind: "FIELD", genders: BOTH, min: 2.5, max: 9.5 },
  tripleJump: { kind: "FIELD", genders: BOTH, min: 6, max: 19 },
  highJump: { kind: "FIELD", genders: BOTH, min: 0.8, max: 2.6 },
  poleVault: { kind: "FIELD", genders: BOTH, min: 1.5, max: 6.3 },
  shotPut: { kind: "FIELD", genders: BOTH, min: 5, max: 24 },
  discus: { kind: "FIELD", genders: BOTH, min: 15, max: 75 },
  javelin: { kind: "FIELD", genders: BOTH, min: 20, max: 95 },
  hammer: { kind: "FIELD", genders: BOTH, min: 20, max: 85 },
};
// ตรงกับ Group9TestKey / ATHLETICS_STATIONS (test ตรวจว่าตรงกัน)
export const VALID_STATION_KEYS = [
  "bodyFatPercent",
  "sitAndReachCm",
  "backExtensionCm",
  "gripStrengthRatio",
  "legStrengthRatio",
  "sitUps1Min",
  "pushUps1Min",
  "sprint40mSec",
  "wingatePowerWkg",
  "wingateCapacityWkg",
  "vo2maxMlKgMin",
] as const;
const RATINGS: readonly FitnessRating[] = ["ดีมาก", "ดี", "ปานกลาง", "ต่ำ", "ต่ำมาก"];
const STATUSES: readonly PlanStatus[] = ["ACTIVE", "COMPLETED", "CANCELLED"];
const MAX_PLAN_ITEMS = 10;

export const DEMO_ID_PREFIX = "demo-";

function fail(field: string, message: string): never {
  throw new ExcellenceValidationError(400, message, { [field]: message });
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("body", "ข้อมูลไม่ถูกต้อง");
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, field: string, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim()) fail(field, `กรุณาระบุ${label}`);
  const text = value.trim();
  if (text.length > max) fail(field, `${label}ยาวเกิน ${max} ตัวอักษร`);
  return text;
}

function optionalText(value: unknown, field: string, label: string, max: number): string | null {
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) return null;
  return requiredText(value, field, label, max);
}

function date(value: unknown, field: string, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(field, `${label}ต้องอยู่ในรูปแบบ YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(field, `${label}ไม่ถูกต้อง`);
  return value;
}

function demoGuard(id: string): string {
  if (id.startsWith(DEMO_ID_PREFIX)) throw new ExcellenceValidationError(400, "ข้อมูลสาธิตแก้ไขไม่ได้");
  return id;
}

function applicationId(value: unknown): string {
  return demoGuard(requiredText(value, "applicationId", "ใบสมัคร", 100));
}

function revision(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 0) fail("revision", "กรุณาระบุ revision ของข้อมูล");
  return Number(value);
}

export function eventKey(value: unknown, field = "event"): string {
  if (typeof value !== "string" || !Object.hasOwn(EVENT_RULES, value)) fail(field, "รายการแข่งขันไม่ถูกต้อง");
  return value;
}

export function gender(value: unknown, field = "gender"): AthleticsGender {
  if (value !== "ชาย" && value !== "หญิง") fail(field, "เพศไม่ถูกต้อง");
  return value;
}

export function assertEventForGender(event: string, athleteGender: AthleticsGender): void {
  if (!EVENT_RULES[event]?.genders.includes(athleteGender)) fail("event", "รายการนี้ไม่เปิดสำหรับเพศของนักกีฬา");
}

// ผลของรายการ: ลู่รับวินาที (ตัวเลข หรือ "10.85" / "1:58.32"), ลานรับเมตร (ตัวเลข หรือ "7.85") ตรวจช่วงตามรายการ
export function markValue(value: unknown, event: string, field = "mark"): number {
  const rule = EVENT_RULES[event];
  let parsed: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) parsed = value;
  if (typeof value === "string") {
    const text = value.trim();
    if (rule.kind === "TRACK") {
      const match = /^(?:(\d{1,2}):)?(\d{1,4}(?:\.\d{1,2})?)$/.exec(text);
      if (match && (match[1] === undefined || Number(match[2]) < 60)) {
        parsed = (match[1] === undefined ? 0 : Number(match[1]) * 60) + Number(match[2]);
      }
    } else if (/^\d{1,2}(?:\.\d{1,2})?$/.test(text)) {
      parsed = Number(text);
    }
  }
  if (parsed === null) fail(field, rule.kind === "TRACK" ? "เวลาต้องเป็นตัวเลข เช่น 10.85 หรือ 1:58.32" : "ระยะต้องเป็นเมตร เช่น 7.85");
  const rounded = Math.round(parsed * 100) / 100;
  if (rounded < rule.min || rounded > rule.max) {
    fail(field, rule.kind === "TRACK"
      ? `เวลาของรายการนี้ต้องอยู่ระหว่าง ${rule.min}–${rule.max} วินาที`
      : `ระยะของรายการนี้ต้องอยู่ระหว่าง ${rule.min}–${rule.max} เมตร`);
  }
  return rounded;
}

export type ResultFields = { event: string; mark: number; competedAt: string; stage: string | null };
export type ResultInput = ResultFields & { applicationId: string };

function resultFields(data: Record<string, unknown>): ResultFields {
  const event = eventKey(data.event);
  return {
    event,
    mark: markValue(data.mark, event),
    competedAt: date(data.competedAt, "competedAt", "วันที่แข่ง"),
    stage: optionalText(data.stage, "stage", "รอบการแข่งขัน", 100),
  };
}

export function validateResultInput(raw: unknown): ResultInput {
  const data = record(raw);
  return { applicationId: applicationId(data.applicationId), ...resultFields(data) };
}

// แก้ผลเดิม: ไม่รับ applicationId (ผลผูกกับนักกีฬาเดิม) ผลสาธิตแก้ไม่ได้
export function validateResultUpdateInput(raw: unknown): ResultFields {
  return resultFields(record(raw));
}

export function resultId(value: unknown): string {
  return demoGuard(requiredText(value, "resultId", "รหัสผลแข่ง", 100));
}

export type BatchResultInput = {
  event: string;
  competedAt: string;
  stage: string | null;
  entries: { applicationId: string; mark: number }[];
};

export const MAX_BATCH_ENTRIES = 200;

// บันทึกผลเป็นชุด (รายการเดียว วันเดียว รอบเดียว) ตรวจทุกแถวแล้วรายงานข้อผิดพลาดพร้อมกัน
// fieldErrors ใช้คีย์ entries.<applicationId> เพื่อให้หน้าจอชี้แถวที่ผิดได้
export function validateBatchResultInput(raw: unknown): BatchResultInput {
  const data = record(raw);
  const event = eventKey(data.event);
  const competedAt = date(data.competedAt, "competedAt", "วันที่แข่ง");
  const stage = optionalText(data.stage, "stage", "รอบการแข่งขัน", 100);
  if (!Array.isArray(data.entries) || data.entries.length === 0) fail("entries", "กรุณากรอกผลอย่างน้อย 1 คน");
  if (data.entries.length > MAX_BATCH_ENTRIES) fail("entries", `บันทึกได้ครั้งละไม่เกิน ${MAX_BATCH_ENTRIES} คน`);
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  const entries: { applicationId: string; mark: number }[] = [];
  data.entries.forEach((rawEntry, index) => {
    const entry = record(rawEntry);
    const id = typeof entry.applicationId === "string" ? entry.applicationId.trim() : "";
    const key = `entries.${id || index}`;
    if (!id) { errors[key] = "ไม่ระบุนักกีฬา"; return; }
    if (id.startsWith(DEMO_ID_PREFIX)) throw new ExcellenceValidationError(400, "ข้อมูลสาธิตแก้ไขไม่ได้");
    if (seen.has(id)) { errors[key] = "นักกีฬาซ้ำในชุดเดียวกัน"; return; }
    seen.add(id);
    try {
      entries.push({ applicationId: id, mark: markValue(entry.mark, event) });
    } catch (error) {
      if (!(error instanceof ExcellenceValidationError)) throw error;
      errors[key] = error.message;
    }
  });
  if (Object.keys(errors).length) {
    throw new ExcellenceValidationError(400, `ผลที่กรอกไม่ถูกต้อง ${Object.keys(errors).length} แถว`, errors);
  }
  return { event, competedAt, stage, entries };
}

export type BenchmarkInput = { event: string; gender: AthleticsGender; target: number | null };

// target = null คือยกเลิกเป้าของรายการนั้น
export function validateBenchmarkInput(raw: unknown): BenchmarkInput {
  const data = record(raw);
  const event = eventKey(data.event);
  const targetGender = gender(data.gender);
  assertEventForGender(event, targetGender);
  const empty = data.target === null || data.target === undefined || data.target === "";
  return { event, gender: targetGender, target: empty ? null : markValue(data.target, event, "target") };
}

export type PlanInput = {
  applicationId: string;
  revision: number;
  plan: {
    id: string | null;
    coachName: string;
    startDate: string;
    endDate: string;
    status: PlanStatus;
    items: { id: string | null; stationKey: string; activity: string }[];
    notes: string | null;
  };
};

export function validatePlanInput(raw: unknown): PlanInput {
  const data = record(raw);
  const plan = record(data.plan);
  const startDate = date(plan.startDate, "startDate", "วันที่เริ่ม");
  const endDate = date(plan.endDate, "endDate", "วันที่สิ้นสุด");
  if (endDate < startDate) fail("endDate", "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม");
  if (!STATUSES.includes(plan.status as PlanStatus)) fail("status", "สถานะแผนไม่ถูกต้อง");
  if (!Array.isArray(plan.items) || plan.items.length === 0) fail("items", "แผนต้องมีอย่างน้อย 1 ข้อ");
  if (plan.items.length > MAX_PLAN_ITEMS) fail("items", `แผนมีได้ไม่เกิน ${MAX_PLAN_ITEMS} ข้อ`);
  const items = plan.items.map((rawItem, index) => {
    const item = record(rawItem);
    if (!VALID_STATION_KEYS.includes(item.stationKey as typeof VALID_STATION_KEYS[number])) fail(`items.${index}.stationKey`, "กรุณาเลือกสถานีที่แผนข้อนี้ต้องการพัฒนา");
    return {
      id: optionalText(item.id, `items.${index}.id`, "รหัสข้อ", 60),
      stationKey: item.stationKey as string,
      activity: requiredText(item.activity, `items.${index}.activity`, "กิจกรรมฝึก", 300),
    };
  });
  return {
    applicationId: applicationId(data.applicationId),
    revision: revision(data.revision),
    plan: {
      id: optionalText(plan.id, "id", "รหัสแผน", 60),
      coachName: requiredText(plan.coachName, "coachName", "ชื่อโค้ชผู้รับผิดชอบ", 120),
      startDate,
      endDate,
      status: plan.status as PlanStatus,
      items,
      notes: optionalText(plan.notes, "notes", "หมายเหตุ", 1000),
    },
  };
}

export function retestId(value: unknown): string {
  return demoGuard(requiredText(value, "retestId", "รหัสผลทดสอบซ้ำ", 100));
}

// ยกเลิก (ลบ) ผลทดสอบซ้ำ ต้องส่ง applicationId และ revision ล่าสุด
export function validateRetestDeleteInput(raw: unknown): { applicationId: string; revision: number } {
  const data = record(raw);
  return { applicationId: applicationId(data.applicationId), revision: revision(data.revision) };
}

export type RetestInput = {
  applicationId: string;
  revision: number;
  retest: {
    planId: string | null;
    testedAt: string;
    ratings: Record<string, FitnessRating>;
    event: string | null;
    mark: number | null;
    notes: string | null;
  };
};

export function validateRetestInput(raw: unknown): RetestInput {
  const data = record(raw);
  const retest = record(data.retest);
  const rawRatings = retest.ratings === undefined ? {} : record(retest.ratings);
  const ratings: Record<string, FitnessRating> = {};
  for (const [key, value] of Object.entries(rawRatings)) {
    if (value === "" || value === null || value === undefined) continue;
    if (!VALID_STATION_KEYS.includes(key as typeof VALID_STATION_KEYS[number])) fail(`ratings.${key}`, "สถานีไม่ถูกต้อง");
    if (!RATINGS.includes(value as FitnessRating)) fail(`ratings.${key}`, "ระดับผลทดสอบไม่ถูกต้อง");
    ratings[key] = value as FitnessRating;
  }
  const hasEvent = retest.event !== undefined && retest.event !== null && retest.event !== "";
  const hasMark = retest.mark !== undefined && retest.mark !== null && retest.mark !== "";
  if (hasEvent !== hasMark) fail(hasEvent ? "mark" : "event", "ต้องระบุรายการและผล (เวลา/ระยะ) คู่กัน");
  const event = hasEvent ? eventKey(retest.event) : null;
  const mark = event ? markValue(retest.mark, event) : null;
  if (!Object.keys(ratings).length && mark === null) fail("ratings", "กรุณากรอกผลอย่างน้อย 1 สถานีหรือผลการแข่ง");
  return {
    applicationId: applicationId(data.applicationId),
    revision: revision(data.revision),
    retest: {
      planId: optionalText(retest.planId, "planId", "แผนพัฒนา", 60),
      testedAt: date(retest.testedAt, "testedAt", "วันที่ทดสอบซ้ำ"),
      ratings,
      event,
      mark,
      notes: optionalText(retest.notes, "notes", "หมายเหตุ", 1000),
    },
  };
}
