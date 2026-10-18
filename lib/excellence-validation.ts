// ตรวจ input ของ API โมดูลสู่ความเป็นเลิศ (กรีฑาประเภทลู่)
// ไม่ import ค่า runtime จากโมดูลอื่นนอกจาก ./excellence-athletics.ts แบบ type-only เพื่อให้ node รัน unit test ได้โดยตรง
import type { FitnessRating, PlanStatus, TrackGender } from "./excellence-athletics";

export class ExcellenceValidationError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// ค่าคงที่ซ้ำกับ excellence-athletics.ts โดยตั้งใจ (import runtime ข้ามไฟล์ไม่ได้ใน node test) — test ตรวจว่าตรงกัน
export const VALID_EVENT_GENDERS: Record<string, readonly TrackGender[]> = {
  "100m": ["ชาย", "หญิง"],
  "200m": ["ชาย", "หญิง"],
  "400m": ["ชาย", "หญิง"],
  "800m": ["ชาย", "หญิง"],
  "1500m": ["ชาย", "หญิง"],
  "5000m": ["ชาย", "หญิง"],
  "10000m": ["ชาย", "หญิง"],
  "100mH": ["หญิง"],
  "110mH": ["ชาย"],
  "400mH": ["ชาย", "หญิง"],
};
export const EVENT_TIME_RANGES: Record<string, readonly [number, number]> = {
  "100m": [9, 20],
  "200m": [18, 40],
  "400m": [40, 90],
  "800m": [95, 240],
  "1500m": [200, 480],
  "5000m": [750, 1800],
  "10000m": [1600, 3600],
  "100mH": [11, 25],
  "110mH": [12, 25],
  "400mH": [45, 100],
};
export const VALID_STATION_KEYS = ["sprint40m", "legPower", "agility", "flexibility", "grip", "aerobic", "body"] as const;
const RATINGS: readonly FitnessRating[] = ["ดีมาก", "ดี", "ปานกลาง", "พอใช้", "ต่ำ", "ต่ำมาก"];
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

function applicationId(value: unknown): string {
  const id = requiredText(value, "applicationId", "ใบสมัคร", 100);
  if (id.startsWith(DEMO_ID_PREFIX)) throw new ExcellenceValidationError(400, "ข้อมูลสาธิตแก้ไขไม่ได้");
  return id;
}

function revision(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 0) fail("revision", "กรุณาระบุ revision ของข้อมูล");
  return Number(value);
}

export function eventKey(value: unknown, field = "event"): string {
  if (typeof value !== "string" || !VALID_EVENT_GENDERS[value]) fail(field, "รายการแข่งขันไม่ถูกต้อง");
  return value;
}

export function gender(value: unknown, field = "gender"): TrackGender {
  if (value !== "ชาย" && value !== "หญิง") fail(field, "เพศไม่ถูกต้อง");
  return value;
}

export function assertEventForGender(event: string, athleteGender: TrackGender): void {
  if (!VALID_EVENT_GENDERS[event]?.includes(athleteGender)) fail("event", "รายการนี้ไม่เปิดสำหรับเพศของนักกีฬา");
}

// รับวินาทีเป็นตัวเลข หรือข้อความ "10.85" / "1:58.32"
export function trackSeconds(value: unknown, event: string, field = "timeSeconds"): number {
  let seconds: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) seconds = value;
  if (typeof value === "string") {
    const match = /^(?:(\d{1,2}):)?(\d{1,4}(?:\.\d{1,2})?)$/.exec(value.trim());
    if (match && (match[1] === undefined || Number(match[2]) < 60)) {
      seconds = (match[1] === undefined ? 0 : Number(match[1]) * 60) + Number(match[2]);
    }
  }
  if (seconds === null) fail(field, "เวลาต้องเป็นตัวเลข เช่น 10.85 หรือ 1:58.32");
  const rounded = Math.round(seconds * 100) / 100;
  const [min, max] = EVENT_TIME_RANGES[event];
  if (rounded < min || rounded > max) fail(field, `เวลาของรายการนี้ต้องอยู่ระหว่าง ${min}–${max} วินาที`);
  return rounded;
}

export type ResultFields = { event: string; timeSeconds: number; competedAt: string; stage: string | null };
export type ResultInput = ResultFields & { applicationId: string };

function resultFields(data: Record<string, unknown>): ResultFields {
  const event = eventKey(data.event);
  return {
    event,
    timeSeconds: trackSeconds(data.timeSeconds, event),
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
  const id = requiredText(value, "resultId", "รหัสผลเวลา", 100);
  if (id.startsWith(DEMO_ID_PREFIX)) throw new ExcellenceValidationError(400, "ข้อมูลสาธิตแก้ไขไม่ได้");
  return id;
}

export type BenchmarkInput = { event: string; gender: TrackGender; targetSeconds: number | null };

// targetSeconds = null คือยกเลิกเป้าของรายการนั้น
export function validateBenchmarkInput(raw: unknown): BenchmarkInput {
  const data = record(raw);
  const event = eventKey(data.event);
  const targetGender = gender(data.gender);
  assertEventForGender(event, targetGender);
  const empty = data.targetSeconds === null || data.targetSeconds === undefined || data.targetSeconds === "";
  return { event, gender: targetGender, targetSeconds: empty ? null : trackSeconds(data.targetSeconds, event, "targetSeconds") };
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
  const id = requiredText(value, "retestId", "รหัสผลทดสอบซ้ำ", 100);
  if (id.startsWith(DEMO_ID_PREFIX)) throw new ExcellenceValidationError(400, "ข้อมูลสาธิตแก้ไขไม่ได้");
  return id;
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
    timeSeconds: number | null;
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
  const hasTime = retest.timeSeconds !== undefined && retest.timeSeconds !== null && retest.timeSeconds !== "";
  if (hasEvent !== hasTime) fail(hasEvent ? "timeSeconds" : "event", "ต้องระบุรายการและเวลาคู่กัน");
  const event = hasEvent ? eventKey(retest.event) : null;
  const timeSeconds = event ? trackSeconds(retest.timeSeconds, event) : null;
  if (!Object.keys(ratings).length && timeSeconds === null) fail("ratings", "กรุณากรอกผลอย่างน้อย 1 สถานีหรือเวลา");
  return {
    applicationId: applicationId(data.applicationId),
    revision: revision(data.revision),
    retest: {
      planId: optionalText(retest.planId, "planId", "แผนพัฒนา", 60),
      testedAt: date(retest.testedAt, "testedAt", "วันที่ทดสอบซ้ำ"),
      ratings,
      event,
      timeSeconds,
      notes: optionalText(retest.notes, "notes", "หมายเหตุ", 1000),
    },
  };
}
