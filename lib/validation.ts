export class ValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>, message = "กรุณาตรวจสอบข้อมูลที่ส่งมา") {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}
export async function parseJsonObject(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try { value = await request.json(); }
  catch { throw new ValidationError({}, "JSON ไม่ถูกต้อง"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError({}, "ข้อมูลต้องเป็น JSON object");
  }
  return value as Record<string, unknown>;
}
export function loginInput(data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  if (typeof data.username !== "string" || !data.username.trim()) errors.username = "กรุณาระบุชื่อผู้ใช้งาน";
  if (typeof data.password !== "string" || !data.password) errors.password = "กรุณาระบุรหัสผ่าน";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { username: (data.username as string).trim().toLowerCase(), password: data.password as string };
}
export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string" || value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new ValidationError({ email: "รูปแบบอีเมลไม่ถูกต้อง" });
  }
  return value.trim().toLowerCase();
}

export const REQUIRED_PROFILE_FIELDS = ["firstName", "lastName", "faculty", "major", "year", "nationalId", "birthDate", "addressNo", "subDistrict", "district", "province", "postalCode", "phone"] as const;
const strings = [...REQUIRED_PROFILE_FIELDS.filter(k => k !== "birthDate"), "nationality"] as readonly string[];
const optionalStrings = ["gpaSemester", "gpaCumulative", "photoUrl", "firstSport", "lastParticipateYear"];
const counts = ["participateCountBachelor", "participateCountMaster", "participateCountPhd"];
const flags = ["hasParticipated", "isNationalTeam"];
export type ProfileInput = {
  firstName: string; lastName: string; faculty: string; major: string; year: string;
  nationalId: string; nationality: string; birthDate: Date; addressNo: string;
  subDistrict: string; district: string; province: string; postalCode: string; phone: string;
  studentLevel: "BACHELOR" | "GRADUATE";
  gpaSemester: string | null; gpaCumulative: string | null; photoUrl: string | null;
  firstSport: string | null; lastParticipateYear: string | null;
  participateCountBachelor: number | null; participateCountMaster: number | null; participateCountPhd: number | null;
  hasParticipated: boolean; isNationalTeam: boolean;
  pastCompetitions: null | Record<string, string | number | boolean | null>[];
};
export function validateProfile(data: Record<string, unknown>, creating: boolean): Partial<ProfileInput> {
  const output: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const allowed = new Set([...strings, ...optionalStrings, ...counts, ...flags, "birthDate", "studentLevel", "pastCompetitions"]);
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key)) { errors[key] = "ไม่อนุญาตให้แก้ฟิลด์นี้"; continue; }
    if (strings.includes(key)) {
      if (typeof value !== "string" || !value.trim() || value.length > 1000) errors[key] = "ต้องเป็นข้อความที่ไม่ว่าง";
      else output[key] = value.trim();
    } else if (optionalStrings.includes(key)) {
      if (value !== null && typeof value !== "string") errors[key] = "ต้องเป็นข้อความหรือ null";
      else if (typeof value === "string" && value.length > 2000) errors[key] = "ข้อความยาวเกินกำหนด";
      else output[key] = typeof value === "string" ? value.trim() || null : null;
    } else if (counts.includes(key)) {
      if (value !== null && (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 2147483647)) errors[key] = "ต้องเป็นจำนวนเต็มที่ไม่ติดลบหรือ null";
      else output[key] = value;
    } else if (flags.includes(key)) {
      if (typeof value !== "boolean") errors[key] = "ต้องเป็น true หรือ false";
      else output[key] = value;
    } else if (key === "studentLevel") {
      const level = typeof value === "string" ? value.toUpperCase() : "";
      if (level !== "BACHELOR" && level !== "GRADUATE") errors[key] = "ระดับการศึกษาไม่ถูกต้อง";
      else output[key] = level;
    } else if (key === "birthDate") {
      const datePart = typeof value === "string" ? value.slice(0, 10) : "";
      const date = new Date(typeof value === "string" ? value : "");
      if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(typeof value === "string" ? value : "") || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== datePart || date > new Date()) errors[key] = "วันเกิดไม่ถูกต้อง";
      else output[key] = date;
    } else if (key === "pastCompetitions") {
      if (value !== null && (!Array.isArray(value) || !value.every(row => row && typeof row === "object" && !Array.isArray(row) && Object.values(row).every(v => v === null || ["string", "number", "boolean"].includes(typeof v))))) errors[key] = "ประวัติต้องเป็นรายการข้อมูลหรือ null";
      else output[key] = value;
    }
  }
  if (creating) for (const key of REQUIRED_PROFILE_FIELDS) if (!(key in data)) errors[key] = "จำเป็นต้องระบุเมื่อสร้างประวัติ";
  if (!creating && !Object.keys(data).length) errors.profile = "ไม่มีข้อมูลที่ต้องการแก้ไข";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return output as Partial<ProfileInput>;
}
