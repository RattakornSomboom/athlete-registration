export class ValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>, message = "กรุณาตรวจสอบข้อมูลที่ส่งมา") {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export function nonNegativeInteger(value: unknown, field: string, min = 0, max = 2147483647): number {
  if ((typeof value !== "number" && typeof value !== "string") || value === ""
    || (typeof value === "string" && !/^\d+$/.test(value))
    || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) {
    throw new ValidationError({ [field]: "ต้องเป็นจำนวนเต็มในช่วงที่กำหนด" });
  }
  return Number(value);
}

export const APPLICATION_STATUSES = ["SUBMITTED", "CLUB_APPROVED", "CLUB_REJECTED", "STAFF_APPROVED", "STAFF_REJECTED", "FINAL_SELECTED"] as const;
export function applicationStatus(value: string | null) {
  if (!value) return undefined;
  const status = APPLICATION_STATUSES.find(item => item === value);
  if (!status) throw new ValidationError({ status: "สถานะไม่ถูกต้อง" });
  return status;
}

export function competitionInput(data: Record<string, unknown>, partial = false) {
  const text = (value: unknown, field: string) => {
    if (typeof value !== "string" || !value.trim() || value.length > 200) throw new ValidationError({ [field]: "ข้อมูลไม่ถูกต้อง" });
    return value.trim();
  };
  const result: {
    name?: string; round?: string; year?: number; deadline?: Date | null;
    status?: "OPEN" | "CLOSED" | "COMPLETED";
    quotas?: { sport: string; maxStarters: number; maxSubstitutes: number; ageLimit: number | null }[];
  } = {};
  for (const key of ["name", "round"] as const) if (!partial || data[key] !== undefined) result[key] = text(data[key], key);
  if (!partial || data.year !== undefined) result.year = nonNegativeInteger(data.year, "year", 1, 9999);
  if (!partial || data.deadline !== undefined) {
    if (data.deadline === null || data.deadline === undefined || data.deadline === "") result.deadline = null;
    else {
      if (typeof data.deadline !== "string" || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(data.deadline)
        || !Number.isFinite(Date.parse(data.deadline))) throw new ValidationError({ deadline: "วันที่ต้องถูกต้องและระบุเขตเวลา" });
      const day = data.deadline.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(day + "T00:00:00Z").toISOString().slice(0, 10) !== day) throw new ValidationError({ deadline: "วันที่ไม่ถูกต้อง" });
      result.deadline = new Date(data.deadline);
    }
  }
  if (!partial || data.status !== undefined) {
    const status = data.status ?? "CLOSED";
    if (status !== "OPEN" && status !== "CLOSED" && status !== "COMPLETED") throw new ValidationError({ status: "สถานะไม่ถูกต้อง" });
    result.status = status;
  }
  if (!partial || data.quotas !== undefined) {
    if (!Array.isArray(data.quotas) || data.quotas.length > 100) throw new ValidationError({ quotas: "กรุณาระบุโควตากีฬา" });
    result.quotas = data.quotas.map((value: unknown) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError({ quotas: "โควตาไม่ถูกต้อง" });
      const q = value as Record<string, unknown>;
      return {
        sport: text(q.sport, "sport"), maxStarters: nonNegativeInteger(q.maxStarters, "maxStarters"),
        maxSubstitutes: nonNegativeInteger(q.maxSubstitutes, "maxSubstitutes"),
        ageLimit: q.ageLimit === "" || q.ageLimit === null || q.ageLimit === undefined ? null : nonNegativeInteger(q.ageLimit, "ageLimit", 1, 150),
      };
    });
    if (new Set(result.quotas.map(q => q.sport)).size !== result.quotas.length) throw new ValidationError({ quotas: "กีฬาซ้ำในรายการแข่งขัน" });
  }
  if (!Object.keys(result).length) throw new ValidationError({ competition: "ไม่มีข้อมูลที่จะแก้ไข" });
  return result;
}

export function athleteApplicationInput(data: Record<string, unknown>) {
  const text = (value: unknown, field: string, required = true, max = 200) => {
    if (!required && (value === null || value === undefined || value === "")) return "";
    if (typeof value !== "string" || (required && !value.trim()) || value.length > max) throw new ValidationError({ [field]: "ข้อมูลไม่ถูกต้อง" });
    return value.trim();
  };
  if (data.status !== undefined || data.userId !== undefined) throw new ValidationError({ status: "ไม่อนุญาตให้กำหนดผู้สมัครหรือสถานะ" });
  const rows = (value: unknown, field: string, max: number) => {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > max || value.some(r => !r || typeof r !== "object" || Array.isArray(r))) throw new ValidationError({ [field]: "รายการไม่ถูกต้อง" });
    return value as Record<string, unknown>[];
  };
  return {
    competitionId: text(data.competitionId, "competitionId"), sport: text(data.sport, "sport"), category: text(data.category, "category"),
    division: text(data.division, "division", false) || null, note: text(data.note, "note", false, 4000) || null,
    supervisorName: text(data.supervisorName, "supervisorName", false) || null,
    supervisorPosition: text(data.supervisorPosition, "supervisorPosition", false) || null,
    previousBachelorCount: nonNegativeInteger(data.previousBachelorCount ?? 0, "previousBachelorCount"),
    previousGraduateCount: nonNegativeInteger(data.previousGraduateCount ?? 0, "previousGraduateCount"),
    sportEntries: rows(data.sportEntries, "sportEntries", 4).map(r => ({ sport: text(r.sport, "sport"), category: text(r.category, "category"), division: text(r.division, "division", false) || null })),
    competitionResults: rows(data.competitionResults, "competitionResults", 100).map(r => ({ competitionName: text(r.competitionName, "competitionName"), year: String(nonNegativeInteger(r.year, "year", 1, 9999)), result: text(r.result, "result") })),
  };
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
  if (typeof data.password !== "string" || !data.password) errors.credentials = "กรุณาระบุรหัสผ่าน";
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

export const ALLOWED_INTERNAL_ROLES = ["STAFF", "ADMIN", "TEAM_OFFICIAL"] as const;
export type InternalRole = typeof ALLOWED_INTERNAL_ROLES[number];

export const ALLOWED_ALL_ROLES = ["ATHLETE", "STAFF", "ADMIN", "CLUB", "TEAM_OFFICIAL"] as const;
export type AllRole = typeof ALLOWED_ALL_ROLES[number];

export function validateAccountAccessChange(input: {
  actorId: string;
  targetId: string;
  currentRole: AllRole | "CLUB";
  currentActive: boolean;
  nextRole?: AllRole;
  nextActive?: boolean;
  activeAdminCount: number;
}): void {
  const role = input.nextRole ?? input.currentRole;
  const active = input.nextActive ?? input.currentActive;
  if (input.actorId === input.targetId && role !== input.currentRole) {
    throw new ValidationError({ role: "ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้" });
  }
  if (input.actorId === input.targetId && !active && input.currentActive) {
    throw new ValidationError({ isActive: "ไม่สามารถระงับบัญชีของตนเองได้" });
  }
  if (input.currentActive && ["ADMIN"].includes(input.currentRole)
    && (!active || !["ADMIN"].includes(role)) && input.activeAdminCount <= 1) {
    throw new ValidationError({ user: "ระบบต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 บัญชี" });
  }
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: InternalRole;
  phone?: string;
  isActive: boolean;
};

export function validateCreateUserInput(data: Record<string, unknown>): CreateUserInput {
  const errors: Record<string, string> = {};

  // Name validation
  if (typeof data.name !== "string" || !data.name.trim()) {
    errors.name = "กรุณาระบุชื่อ-นามสกุล";
  } else if (data.name.trim().length > 200) {
    errors.name = "ชื่อยาวเกินกำหนด (ไม่เกิน 200 ตัวอักษร)";
  }

  // Email validation
  let normalizedEmail = "";
  try {
    normalizedEmail = normalizeEmail(data.email);
  } catch {
    errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
  }

  // Password validation
  if (typeof data.password !== "string" || data.password.length < 8) {
    errors.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
  } else if (Buffer.byteLength(data.password, "utf8") > 72) {
    errors.password = "รหัสผ่านยาวเกิน 72 ไบต์";
  }

  // Role validation
  const roleStr = typeof data.role === "string" ? data.role.toUpperCase() : "";
  if (!ALLOWED_INTERNAL_ROLES.includes(roleStr as InternalRole)) {
    errors.role = `สิทธิ์ไม่ถูกต้อง อนุญาตเฉพาะ: ${ALLOWED_INTERNAL_ROLES.join(", ")}`;
  }

  // Phone validation
  let phone: string | undefined = undefined;
  if (data.phone !== undefined && data.phone !== null && data.phone !== "") {
    if (typeof data.phone !== "string" || data.phone.trim().length > 50) {
      errors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง";
    } else {
      phone = data.phone.trim();
    }
  }

  // isActive validation
  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    errors.isActive = "สถานะ isActive ต้องเป็น boolean";
  }
  const isActive = data.isActive === undefined ? true : data.isActive === true;

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return {
    name: (data.name as string).trim(),
    email: normalizedEmail,
    password: data.password as string,
    role: roleStr as InternalRole,
    phone,
    isActive,
  };
}

export type UpdateUserInput = {
  clubId?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  role?: AllRole;
  isActive?: boolean;
};

export function validateUpdateUserInput(data: Record<string, unknown>): UpdateUserInput {
  const errors: Record<string, string> = {};
  const output: UpdateUserInput = {};
  if (data.clubId !== undefined) {
    if (data.clubId !== null && (typeof data.clubId !== "string" || !data.clubId.trim() || data.clubId.length > 200)) errors.clubId = "ชมรมไม่ถูกต้อง";
    else output.clubId = data.clubId as string | null;
  }

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      errors.name = "ชื่อ-นามสกุลต้องไม่ว่าง";
    } else if (data.name.trim().length > 200) {
      errors.name = "ชื่อยาวเกินกำหนด (ไม่เกิน 200 ตัวอักษร)";
    } else {
      output.name = data.name.trim();
    }
  }

  if (data.email !== undefined) {
    try {
      output.email = normalizeEmail(data.email);
    } catch {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
  }

  if (data.phone !== undefined && data.phone !== null) {
    if (data.phone === "") {
      output.phone = "";
    } else if (typeof data.phone !== "string" || data.phone.trim().length > 50) {
      errors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง";
    } else {
      output.phone = data.phone.trim();
    }
  }

  if (data.role !== undefined) {
    const roleStr = typeof data.role === "string" ? data.role.toUpperCase() : "";
    if (!ALLOWED_ALL_ROLES.includes(roleStr as AllRole)) {
      errors.role = `สิทธิ์ไม่ถูกต้อง อนุญาตเฉพาะ: ${ALLOWED_ALL_ROLES.join(", ")}`;
    } else {
      output.role = roleStr as AllRole;
    }
  }

  if (data.isActive !== undefined) {
    if (typeof data.isActive !== "boolean") {
      errors.isActive = "สถานะ isActive ต้องเป็น boolean";
    } else {
      output.isActive = data.isActive;
    }
  }

  if (Object.keys(output).length === 0 && Object.keys(errors).length === 0) {
    throw new ValidationError({ user: "ไม่มีข้อมูลที่ต้องการแก้ไข" });
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return output;
}

export const FITNESS_TEST_STATUSES = ["PENDING", "PASSED", "FAILED"] as const;
export type FitnessTestStatusType = (typeof FITNESS_TEST_STATUSES)[number];

export function validateFitnessTestStatus(value: unknown): FitnessTestStatusType {
  if (typeof value !== "string" || !FITNESS_TEST_STATUSES.includes(value as FitnessTestStatusType)) {
    throw new ValidationError({ status: "สถานะการทดสอบสมรรถภาพไม่ถูกต้อง (ต้องเป็น PENDING, PASSED หรือ FAILED)" });
  }
  return value as FitnessTestStatusType;
}

export type ValidatedFitnessInput = {
  applicationId: string;
  status: FitnessTestStatusType;
  totalScore?: number | null;
  scores?: Record<string, unknown> | null;
  notes?: string | null;
  testedAt?: Date | null;
};

export function validateFitnessTestItem(item: unknown, index?: number): ValidatedFitnessInput {
  const prefix = index !== undefined ? "items[" + index + "]." : "";
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new ValidationError({ [prefix ? prefix + "item" : "item"]: "ข้อมูลผลการทดสอบต้องเป็น object" });
  }

  const data = item as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (typeof data.applicationId !== "string" || !data.applicationId.trim() || data.applicationId.trim().length > 200) {
    errors[prefix + "applicationId"] = "กรุณาระบุรหัสใบสมัคร (applicationId)";
  }

  const rawStatus = typeof data.status === "string" ? data.status.trim().toUpperCase() : "";
  if (!FITNESS_TEST_STATUSES.includes(rawStatus as FitnessTestStatusType)) {
    errors[prefix + "status"] = "สถานะต้องเป็น PENDING, PASSED หรือ FAILED";
  }

  let totalScore: number | null = null;
  if (data.totalScore !== undefined && data.totalScore !== null && data.totalScore !== "") {
    const parsed = Number(data.totalScore);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10000) {
      errors[prefix + "totalScore"] = "คะแนนรวมต้องเป็นตัวเลขที่ถูกต้อง (0 - 10000)";
    } else {
      totalScore = parsed;
    }
  }

  let scores: Record<string, unknown> | null = null;
  if (data.scores !== undefined && data.scores !== null) {
    if (typeof data.scores !== "object" || Array.isArray(data.scores)) {
      errors[prefix + "scores"] = "คะแนนรายข้อต้องเป็น object";
    } else {
      scores = data.scores as Record<string, unknown>;
    }
  }

  let notes: string | null = null;
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== "string") {
      errors[prefix + "notes"] = "หมายเหตุต้องเป็นข้อความ";
    } else if (data.notes.trim().length > 1000) {
      errors[prefix + "notes"] = "หมายเหตุต้องไม่เกิน 1,000 ตัวอักษร";
    } else {
      notes = data.notes.trim() || null;
    }
  }

  let testedAt: Date | null = null;
  if (data.testedAt !== undefined && data.testedAt !== null && data.testedAt !== "") {
    const date = new Date(String(data.testedAt));
    if (Number.isNaN(date.getTime())) {
      errors[prefix + "testedAt"] = "วันที่ทดสอบไม่ถูกต้อง";
    } else {
      testedAt = date;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return {
    applicationId: (data.applicationId as string).trim(),
    status: rawStatus as FitnessTestStatusType,
    totalScore,
    scores,
    notes,
    testedAt,
  };
}
