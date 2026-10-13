/**
 * Rule Checker Engine for University Sports Competition Management System
 * Based on 52nd Thailand University Games regulations.
 */

export type RuleCheckResult = {
  isEligible: boolean;
  message: string;
  reasons: string[];
  issues: string[];
  rules: {
    gpax: {
      exempt?: boolean;
      passed: boolean;
      value: number | null;
      required: number;
      message?: string;
    };
    age: {
      passed: boolean;
      age: number;
      limit: number;
      birthDate: string;
      competitionYear: number;
      message?: string;
    };
    participationCount: {
      passed: boolean;
      previousCount: number;
      count: number;
      currentApplicationCount: number;
      maxAllowed: number;
      studentLevel: string;
      message?: string;
    };
  };
};

/**
 * Calculate exact age comparing year, month, and day
 */
export function calculateExactAge(birthDate: Date, referenceDate: Date = new Date()): number {
  if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) return NaN;
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validate GPAX string: must be formatted as number between minimum requirement and 4.00
 */
export function evaluateGpax(
  gpaCumulative: string | null | undefined,
  minGpax: number = 2.00,
): {
  passed: boolean;
  value: number | null;
  required: number;
  message?: string;
} {
  const required = minGpax;
  if (gpaCumulative === undefined || gpaCumulative === null || typeof gpaCumulative !== "string") {
    return { passed: false, value: null, required, message: "ไม่พบข้อมูลผลการเรียนสะสม (GPAX)" };
  }
  const trimmed = gpaCumulative.trim();
  if (!/^\d(?:\.\d{1,4})?$/.test(trimmed)) {
    return { passed: false, value: null, required, message: "รูปแบบเกรดเฉลี่ยสะสม (GPAX) ไม่ถูกต้อง" };
  }
  const val = parseFloat(trimmed);
  if (isNaN(val) || val < required || val > 4.00) {
    return {
      passed: false,
      value: val,
      required,
      message: `เกรดเฉลี่ยสะสม (GPAX) ต้องไม่ต่ำกว่า ${required.toFixed(2)} ตามเกณฑ์การแข่งขัน`,
    };
  }
  return { passed: true, value: val, required, message: `GPAX ${val.toFixed(2)} ผ่านเกณฑ์ขั้นต่ำ ${required.toFixed(2)}` };
}

/**
 * Previous participations that count toward the current level cap.
 * Bachelor counts only bachelor entries; graduate counts master + PhD together.
 */
export function countParticipationForLevel(
  counts: { bachelor?: number | null; master?: number | null; phd?: number | null },
  studentLevel: string = "BACHELOR",
): number {
  return String(studentLevel).toUpperCase() === "GRADUATE"
    ? (counts.master ?? 0) + (counts.phd ?? 0)
    : counts.bachelor ?? 0;
}

/**
 * Evaluate participation count:
 * Bachelor: <= 5 times
 * Graduate: <= 3 times
 */
export function evaluateParticipationCount(
  previousCount: number,
  studentLevel: string = "BACHELOR",
  customMaxAllowed?: number | null,
): { passed: boolean; previousCount: number; count: number; currentApplicationCount: number; maxAllowed: number; studentLevel: string; message?: string } {
  const isGraduate = String(studentLevel).toUpperCase() === "GRADUATE";
  const maxAllowed = customMaxAllowed ?? (isGraduate ? 3 : 5);
  const currentApplicationCount = 1;
  const count = previousCount + currentApplicationCount;
  if (typeof previousCount !== "number" || !Number.isSafeInteger(previousCount) || previousCount < 0 || !Number.isSafeInteger(count)) {
    return {
      passed: false,
      previousCount,
      count,
      currentApplicationCount,
      maxAllowed,
      studentLevel,
      message: "จำนวนครั้งที่เข้าร่วมไม่ถูกต้อง",
    };
  }
  if (count > maxAllowed) {
    const levelLabel = isGraduate ? "บัณฑิตศึกษา" : "ปริญญาตรี";
    return {
      passed: false,
      previousCount,
      count,
      currentApplicationCount,
      maxAllowed,
      studentLevel,
      message: `จำนวนครั้งการแข่งขันระดับ${levelLabel}เกิน ${maxAllowed} ครั้ง (การสมัครครั้งนี้เป็นครั้งที่ ${count})`,
    };
  }
  return {
    passed: true,
    previousCount,
    count,
    currentApplicationCount,
    maxAllowed,
    studentLevel,
    message: `การสมัครครั้งนี้เป็นครั้งที่ ${count} จากเกณฑ์ไม่เกิน ${maxAllowed} ครั้ง`,
  };
}

function normalizeCalendarYear(year: number): number {
  return year >= 2400 ? year - 543 : year;
}

/**
 * Evaluate athlete age by calendar year, normalizing Buddhist Era and Common Era years.
 */
export function evaluateAge(
  birthDate: Date,
  competitionYear: number,
  ageLimit: number = 28,
): { passed: boolean; age: number; limit: number; birthDate: string; competitionYear: number; message?: string } {
  const birthStr = birthDate instanceof Date && !isNaN(birthDate.getTime()) ? birthDate.toISOString().slice(0, 10) : "";
  const normalizedCompetitionYear = normalizeCalendarYear(competitionYear);
  const birthYear = birthDate instanceof Date && !isNaN(birthDate.getTime())
    ? normalizeCalendarYear(birthDate.getUTCFullYear())
    : NaN;
  const age = normalizedCompetitionYear - birthYear;
  if (!Number.isSafeInteger(competitionYear) || normalizedCompetitionYear <= 0 || isNaN(age) || age < 0) {
    return { passed: false, age, limit: ageLimit, birthDate: birthStr, competitionYear, message: "ปีการแข่งขันหรือวันเดือนปีเกิดไม่ถูกต้อง" };
  }
  if (age > ageLimit) {
    return {
      passed: false,
      age,
      limit: ageLimit,
      birthDate: birthStr,
      competitionYear,
      message: `อายุเกินตามปีมหกรรม ${competitionYear} (อายุ ${age} ปี เกณฑ์ไม่เกิน ${ageLimit} ปี)`,
    };
  }
  return {
    passed: true,
    age,
    limit: ageLimit,
    birthDate: birthStr,
    competitionYear,
    message: `อายุ ${age} ปีตามปีมหกรรม ${competitionYear} ผ่านเกณฑ์`,
  };
}

/**
 * Main Rule Checker
 */
export function isFirstSemesterGradeExempt(profile: {
  studentLevel?: string;
  year?: string | null;
  semester?: string | null;
  gpaSemester?: string | null;
  gpaCumulative?: string | null;
}): boolean {
  const missing = (value: unknown) => value === null || value === undefined || (typeof value === "string" && value.trim() === "");
  return profile.studentLevel?.toUpperCase() === "BACHELOR" && profile.year === "1" && profile.semester === "1"
    && missing(profile.gpaCumulative);
}

export function checkAthleteEligibility(params: {
  birthDate: Date;
  year?: string | null;
  semester?: string | null;
  gpaSemester?: string | null;
  gpaCumulative: string | null | undefined;
  competitionYear: number;
  studentLevel?: string;
  participationCount?: number;
  ageLimit?: number | null;
  minGpax?: number | null;
  maxBachelorParticipations?: number | null;
  maxGraduateParticipations?: number | null;
  allowFirstYearExempt?: boolean;
}): RuleCheckResult {
  const issues: string[] = [];
  const minGpax = params.minGpax ?? 2.00;
  const allowExempt = params.allowFirstYearExempt ?? true;

  const isExempt = allowExempt && isFirstSemesterGradeExempt(params);
  const gpaxRes = isExempt
    ? { passed: true, value: null, required: minGpax, exempt: true, message: "ยกเว้นเกณฑ์ GPAX: นิสิตปี 1 เทอม 1 ยังไม่มีผลการเรียนสะสม" }
    : evaluateGpax(params.gpaCumulative, minGpax);
  if (!gpaxRes.passed && gpaxRes.message) issues.push(gpaxRes.message);

  const ageRes = evaluateAge(params.birthDate, params.competitionYear, params.ageLimit ?? 28);
  if (!ageRes.passed && ageRes.message) issues.push(ageRes.message);

  const isGraduate = String(params.studentLevel).toUpperCase() === "GRADUATE";
  const customMax = isGraduate ? params.maxGraduateParticipations : params.maxBachelorParticipations;
  const partRes = evaluateParticipationCount(params.participationCount ?? 0, params.studentLevel ?? "BACHELOR", customMax);
  if (!partRes.passed && partRes.message) issues.push(partRes.message);

  const reasons = [gpaxRes.message, ageRes.message, partRes.message].filter((message): message is string => Boolean(message));
  const isEligible = issues.length === 0;
  return {
    isEligible,
    message: isEligible ? `ผ่านเกณฑ์คุณสมบัตินักกีฬา: ${reasons.join("; ")}` : issues.join("; "),
    reasons,
    issues,
    rules: {
      gpax: gpaxRes,
      age: ageRes,
      participationCount: partRes,
    },
  };
}