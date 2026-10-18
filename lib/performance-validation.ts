export class PerformanceValidationError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "PerformanceValidationError";
    this.status = status;
    this.details = details;
  }
}

export type MatchResultInput = {
  applicationId: string;
  matchId?: string;
  stage?: string;
  category?: string;
  side?: string;
  score?: number | null;
  timeSeconds?: number | null;
  rank?: number | null;
  resultOutcome?: string | null;
  isWinner?: boolean;
  notes?: string | null;
  staffNotes?: string | null;
};

export type ValidatedMatchResult = {
  applicationId: string;
  matchId?: string;
  stage?: string;
  category: string;
  side?: string;
  score: number | null;
  timeSeconds: number | null;
  rank: number | null;
  resultOutcome: string | null;
  isWinner: boolean;
  notes: string | null;
  staffNotes: string | null;
};

export const ACTION_PLAN_STATUSES = ["DRAFT", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type ActionPlanStatus = typeof ACTION_PLAN_STATUSES[number];

export type ValidatedActionPlan = {
  applicationId: string;
  coachName: string;
  responsiblePerson: string;
  startDate: string;
  endDate: string;
  items: string[];
  status: ActionPlanStatus;
  notes: string | null;
};

export type ValidatedFollowUpRetest = {
  applicationId: string;
  testedAt: string;
  totalScore: number | null;
  ratings: Record<string, string>;
  timeSeconds: number | null;
  notes: string | null;
};

const ALLOWED_OUTCOMES = new Set(["WIN", "LOSS", "DRAW", "PODIUM", "DNF", "DQ"]);

function sanitizeString(value: unknown, maxLength = 500): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new PerformanceValidationError(400, "รูปแบบข้อความไม่ถูกต้อง");
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cleaned = trimmed
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .slice(0, maxLength);
  return cleaned;
}

function requiredString(value: unknown, label: string, maxLength: number): string {
  const result = sanitizeString(value, maxLength);
  if (!result) throw new PerformanceValidationError(400, `กรุณาระบุ${label}`);
  return result;
}

function validateDate(value: unknown, label: string): string {
  const result = requiredString(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00.000Z`))) {
    throw new PerformanceValidationError(400, `${label}ไม่ถูกต้อง`);
  }
  return result;
}

function optionalNumber(value: unknown, label: string, min: number, max: number): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new PerformanceValidationError(400, `${label}ต้องเป็นตัวเลขระหว่าง ${min} ถึง ${max}`);
  }
  return Math.round(parsed * 100) / 100;
}

export function validateActionPlanInput(raw: unknown): ValidatedActionPlan {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PerformanceValidationError(400, "ข้อมูลแผนพัฒนาต้องเป็น Object");
  }
  const data = raw as Record<string, unknown>;
  if (typeof data.applicationId !== "string" || !data.applicationId.trim()) {
    throw new PerformanceValidationError(400, "กรุณาระบุ applicationId ของนักกีฬา");
  }
  const startDate = validateDate(data.startDate, "วันที่เริ่มแผน");
  const endDate = validateDate(data.endDate, "วันที่สิ้นสุดแผน");
  if (endDate < startDate) throw new PerformanceValidationError(400, "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มแผน");
  if (!Array.isArray(data.items)) throw new PerformanceValidationError(400, "กรุณาระบุรายการฝึกอย่างน้อย 1 รายการ");
  const items = data.items
    .map(item => sanitizeString(item, 300))
    .filter((item): item is string => item !== null)
    .slice(0, 30);
  if (!items.length) throw new PerformanceValidationError(400, "กรุณาระบุรายการฝึกอย่างน้อย 1 รายการ");
  const status = typeof data.status === "string" ? data.status.trim().toUpperCase() : "DRAFT";
  if (!ACTION_PLAN_STATUSES.includes(status as ActionPlanStatus)) {
    throw new PerformanceValidationError(400, "สถานะแผนพัฒนาไม่ถูกต้อง");
  }
  return {
    applicationId: data.applicationId.trim(),
    coachName: requiredString(data.coachName, "ชื่อโค้ช", 150),
    responsiblePerson: requiredString(data.responsiblePerson, "ผู้รับผิดชอบ", 150),
    startDate,
    endDate,
    items,
    status: status as ActionPlanStatus,
    notes: sanitizeString(data.notes, 1000),
  };
}

const ALLOWED_RATINGS = new Set(["ดีมาก", "ดี", "ปานกลาง", "พอใช้", "ต่ำ", "ต่ำมาก"]);

export function validateFollowUpRetestInput(raw: unknown): ValidatedFollowUpRetest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PerformanceValidationError(400, "ข้อมูลผลทดสอบซ้ำต้องเป็น Object");
  }
  const data = raw as Record<string, unknown>;
  if (typeof data.applicationId !== "string" || !data.applicationId.trim()) {
    throw new PerformanceValidationError(400, "กรุณาระบุ applicationId ของนักกีฬา");
  }
  const testedAt = requiredString(data.testedAt, "วันที่ทดสอบซ้ำ", 30);
  if (Number.isNaN(Date.parse(testedAt))) throw new PerformanceValidationError(400, "วันที่ทดสอบซ้ำไม่ถูกต้อง");
  const rawRatings = data.ratings;
  if (!rawRatings || typeof rawRatings !== "object" || Array.isArray(rawRatings)) {
    throw new PerformanceValidationError(400, "กรุณาระบุผลการทดสอบสมรรถภาพ");
  }
  const ratings: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawRatings as Record<string, unknown>)) {
    const rating = sanitizeString(value, 20);
    if (rating && ALLOWED_RATINGS.has(rating)) ratings[key.slice(0, 120)] = rating;
  }
  if (Object.keys(ratings).length === 0) throw new PerformanceValidationError(400, "กรุณาระบุผลอย่างน้อย 1 สถานี");
  return {
    applicationId: data.applicationId.trim(),
    testedAt: new Date(testedAt).toISOString(),
    totalScore: optionalNumber(data.totalScore, "คะแนนรวม", 0, 100),
    ratings,
    timeSeconds: optionalNumber(data.timeSeconds, "เวลาทดสอบ", 0.01, 86400),
    notes: sanitizeString(data.notes, 1000),
  };
}

export type ValidatedBenchmark = {
  sport: string;
  targetTimeSeconds: number;
  targetScore: number;
};

const ALLOWED_BENCHMARK_SPORTS = new Set(["กรีฑา", "กีฬาทางน้ำ", "ว่ายน้ำ"]);

export function validateBenchmarkInput(raw: unknown): ValidatedBenchmark {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new PerformanceValidationError(400, "ข้อมูล Benchmark ไม่ถูกต้อง");
  const data = raw as Record<string, unknown>;
  const sport = requiredString(data.sport, "ชื่อกีฬา", 100);
  if (!ALLOWED_BENCHMARK_SPORTS.has(sport)) {
    throw new PerformanceValidationError(400, "โมดูลสู่ความเป็นเลิศรองรับเฉพาะชนิดกีฬานำร่อง (กรีฑา, กีฬาทางน้ำ/ว่ายน้ำ)");
  }
  return {
    sport,
    targetTimeSeconds: optionalNumber(data.targetTimeSeconds, "เวลาเป้าหมาย", 0.01, 86400) ?? 0,
    targetScore: optionalNumber(data.targetScore, "คะแนนเป้าหมาย", 0, 100) ?? 0,
  };
}

export function validateMatchResultInput(raw: unknown): ValidatedMatchResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PerformanceValidationError(400, "ข้อมูลผลการแข่งขันต้องเป็น Object");
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.applicationId !== "string" || !data.applicationId.trim()) {
    throw new PerformanceValidationError(400, "กรุณาระบุ applicationId ของนักกีฬา");
  }

  const applicationId = data.applicationId.trim();
  const matchId = typeof data.matchId === "string" && data.matchId.trim() ? data.matchId.trim() : undefined;
  const stage = sanitizeString(data.stage, 100) ?? undefined;
  const category = sanitizeString(data.category, 100) ?? "บุคคลทั่วไป";
  const side = sanitizeString(data.side, 50) ?? undefined;

  let score: number | null = null;
  if (data.score !== undefined && data.score !== null && data.score !== "") {
    const parsedScore = Number(data.score);
    if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 10000) {
      throw new PerformanceValidationError(400, "คะแนนต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0");
    }
    score = Math.round(parsedScore * 100) / 100;
  }

  let timeSeconds: number | null = null;
  if (data.timeSeconds !== undefined && data.timeSeconds !== null && data.timeSeconds !== "") {
    const parsedTime = Number(data.timeSeconds);
    if (!Number.isFinite(parsedTime) || parsedTime <= 0 || parsedTime > 86400) {
      throw new PerformanceValidationError(400, "เวลาที่ใช้ต้องเป็นตัวเลขมากกว่า 0 วินาที");
    }
    timeSeconds = Math.round(parsedTime * 100) / 100;
  }

  let rank: number | null = null;
  if (data.rank !== undefined && data.rank !== null && data.rank !== "") {
    const parsedRank = Number(data.rank);
    if (!Number.isInteger(parsedRank) || parsedRank < 1 || parsedRank > 500) {
      throw new PerformanceValidationError(400, "อันดับต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
    }
    rank = parsedRank;
  }

  let resultOutcome: string | null = null;
  if (data.resultOutcome !== undefined && data.resultOutcome !== null && data.resultOutcome !== "") {
    if (typeof data.resultOutcome !== "string") {
      throw new PerformanceValidationError(400, "รูปแบบผลการแข่งขันไม่ถูกต้อง");
    }
    const outcome = data.resultOutcome.trim().toUpperCase();
    if (!ALLOWED_OUTCOMES.has(outcome)) {
      throw new PerformanceValidationError(400, "ผลการแข่งขันต้องเป็น WIN, LOSS, DRAW, PODIUM, DNF หรือ DQ");
    }
    resultOutcome = outcome;
  }

  const isWinner = Boolean(
    data.isWinner === true ||
    resultOutcome === "WIN" ||
    (rank === 1 && resultOutcome !== "LOSS")
  );

  const notes = sanitizeString(data.notes, 500);
  const staffNotes = sanitizeString(data.staffNotes, 1000);

  return {
    applicationId,
    matchId,
    stage,
    category,
    side,
    score,
    timeSeconds,
    rank,
    resultOutcome,
    isWinner,
    notes,
    staffNotes,
  };
}
