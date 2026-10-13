export type FitnessOutcome = "PASSED" | "FAILED" | null;
export type FitnessStatus = "PENDING" | "PASSED" | "FAILED";

export type FitnessTestDefinition = {
  id: string;
  label: string;
};

export type FitnessProtocol = {
  id: string;
  sport: string;
  label: string;
  tests: FitnessTestDefinition[];
};

export type FitnessConfiguration = {
  version: string;
  thresholdPercent: number;
  supported: boolean;
  requiresProtocolSelection: boolean;
  protocols: FitnessProtocol[];
};

export type FitnessEvaluation = {
  version: string;
  protocolId: string;
  sport: string;
  thresholdPercent: number;
  requiredCount: number;
  completedCount: number;
  passedCount: number;
  failedCount: number;
  missingCount: number;
  missingItems: string[];
  minimumPassedCount: number;
  passPercentage: number | null;
  status: FitnessStatus;
  items: Record<string, FitnessOutcome>;
};

export type FitnessCandidate = {
  applicationId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  faculty: string;
  major: string;
  year: string;
  phone: string;
  competitionId: string;
  competitionName: string;
  competitionYear: string;
  sport: string;
  category: string;
  division: string;
  squadType: "main" | "reserve" | null;
  clubName: string | null;
  applicationStatus: string;
  fitnessConfiguration?: FitnessConfiguration;
  fitnessGroup?: {
    id: number;
    sports: string[];
    tests: Record<string, string[]>;
  } | null;
  fitnessResult: {
    id: string | null;
    status: FitnessStatus;
    totalScore: number | null;
    scores: unknown;
    notes: string | null;
    testedAt: string | null;
    recordedBy: string | null;
    updatedAt: string | null;
    needsReassessment?: boolean;
  } | null;
};

export type FitnessListResponse = {
  candidates: FitnessCandidate[];
  stats: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    mainSquad: number;
    reserveSquad: number;
  };
};

export type FitnessApiError = Error & {
  fieldErrors?: Record<string, string>;
};

export const fitnessLabels = {
  PASSED: "ผ่านเกณฑ์ กกมท.",
  FAILED: "ไม่ผ่านเกณฑ์",
  PENDING: "รอผลครบ",
} satisfies Record<FitnessStatus, string>;

export async function fitnessRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const result = (await response.json()) as {
    error?: string;
    fieldErrors?: Record<string, string>;
  } & T;
  if (!response.ok) {
    const error = new Error(result.error || "ทำรายการไม่สำเร็จ") as FitnessApiError;
    error.fieldErrors = result.fieldErrors;
    throw error;
  }
  return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function storedEvaluation(value: unknown): FitnessEvaluation | null {
  if (!isObject(value) || value.version !== "summary-v1" || typeof value.protocolId !== "string") return null;
  if (!isObject(value.items) || !["PENDING", "PASSED", "FAILED"].includes(String(value.status))) return null;

  const items: Record<string, FitnessOutcome> = {};
  for (const [key, outcome] of Object.entries(value.items)) {
    if (outcome !== null && outcome !== "PASSED" && outcome !== "FAILED") return null;
    items[key] = outcome;
  }

  const numericKeys = [
    "thresholdPercent",
    "requiredCount",
    "completedCount",
    "passedCount",
    "failedCount",
    "missingCount",
    "minimumPassedCount",
  ] as const;
  if (numericKeys.some((key) => typeof value[key] !== "number")) return null;
  if (value.passPercentage !== null && typeof value.passPercentage !== "number") return null;
  if (!Array.isArray(value.missingItems) || value.missingItems.some((item) => typeof item !== "string")) return null;

  return {
    version: "summary-v1",
    protocolId: value.protocolId,
    sport: typeof value.sport === "string" ? value.sport : "",
    thresholdPercent: value.thresholdPercent as number,
    requiredCount: value.requiredCount as number,
    completedCount: value.completedCount as number,
    passedCount: value.passedCount as number,
    failedCount: value.failedCount as number,
    missingCount: value.missingCount as number,
    missingItems: value.missingItems as string[],
    minimumPassedCount: value.minimumPassedCount as number,
    passPercentage: value.passPercentage as number | null,
    status: value.status as FitnessStatus,
    items,
  };
}


const testLabels: Record<string, string> = {
  bodyFat: "ปริมาณไขมัน", sitAndReach: "นั่งงอตัว", gripStrength: "แรงบีบมือด้านถนัด",
  legStrength: "แรงเหยียดขา", verticalJump: "ยืนกระโดดสูง", cycleErgometer: "ปั่นจักรยาน",
  standingBroadJump: "ยืนกระโดดไกล", semo: "วิ่ง Semo", sprint40m: "วิ่งเร็ว 40 เมตร",
  rast: "วิ่ง RAST", multistage: "วิ่ง Multistage fitness test",
};

export function fitnessNeedsReassessment(candidate: FitnessCandidate): boolean {
  if (!candidate.fitnessResult) return false;
  return candidate.fitnessResult.needsReassessment === true ||
    Boolean(candidate.fitnessResult.id && !storedEvaluation(candidate.fitnessResult.scores));
}

export function fitnessProtocols(candidate: FitnessCandidate): FitnessProtocol[] {
  if (candidate.fitnessConfiguration) return candidate.fitnessConfiguration.protocols;
  const evaluation = storedEvaluation(candidate.fitnessResult?.scores);
  if (!evaluation) return [];
  return [{
    id: evaluation.protocolId,
    sport: candidate.sport,
    label: evaluation.protocolId,
    tests: Object.keys(evaluation.items).map(id => ({ id, label: testLabels[id] ?? id })),
  }];
}

export function fitnessColumns(candidates: FitnessCandidate[]): FitnessTestDefinition[] {
  const columns = new Map<string, FitnessTestDefinition>();
  for (const candidate of candidates) {
    for (const protocol of fitnessProtocols(candidate)) {
      for (const test of protocol.tests) columns.set(test.id, test);
    }
  }
  return [...columns.values()];
}

export function fitnessCell(candidate: FitnessCandidate, itemId: string): string {
  if (fitnessNeedsReassessment(candidate)) return "รอประเมินใหม่";
  const evaluation = storedEvaluation(candidate.fitnessResult?.scores);
  const protocols = fitnessProtocols(candidate);
  const protocol = evaluation ? protocols.find(item => item.id === evaluation.protocolId) : protocols.length === 1 ? protocols[0] : undefined;
  if (protocol && !protocol.tests.some(test => test.id === itemId)) return "ไม่ใช้รายการนี้";
  const outcome = evaluation?.items[itemId];
  return outcome === "PASSED" ? "ผ่าน" : outcome === "FAILED" ? "ไม่ผ่าน" : "รอผล";
}

export function detectGender(candidate: { fullName: string; studentId?: string | null }): "ชาย" | "หญิง" | "ไม่ระบุ" {
  const name = candidate.fullName.trim();
  if (name.startsWith("นางสาว") || name.startsWith("น.ส.") || name.startsWith("นาง") || name.startsWith("เด็กหญิง") || name.startsWith("ด.ญ.")) {
    return "หญิง";
  }
  if (name.startsWith("นาย") || name.startsWith("เด็กชาย") || name.startsWith("ด.ช.")) {
    return "ชาย";
  }
  return "ไม่ระบุ";
}

function csvValue(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const text = /^\s*[=+@-]/.test(raw) ? "'" + raw : raw;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function fitnessCsv(candidates: FitnessCandidate[]): string {
  const columns = fitnessColumns(candidates);
  const headers = [
    "รหัสนิสิต",
    "ชื่อ-นามสกุล",
    "ชนิดกีฬา",
    "ประเภททีม",
    "คณะ",
    ...columns.map((column) => column.label),
    "ผ่าน/ทั้งหมด",
    "ร้อยละที่ผ่าน",
    "สถานะ กกมท.",
    "วันที่ทดสอบ",
    "หมายเหตุ",
  ];

  const rows = candidates.map((candidate) => {
    const evaluation = fitnessNeedsReassessment(candidate) ? null : storedEvaluation(candidate.fitnessResult?.scores);
    const status = fitnessNeedsReassessment(candidate)
      ? "ผลเดิมรอประเมินใหม่"
      : candidate.fitnessResult
      ? fitnessLabels[candidate.fitnessResult.status]
      : "รอผลครบ";
    return [
      candidate.studentId,
      candidate.fullName,
      candidate.sport,
      candidate.squadType === "main" ? "ตัวจริง" : candidate.squadType === "reserve" ? "ตัวสำรอง" : "ยังไม่ระบุ",
      candidate.faculty,
      ...columns.map((column) => fitnessCell(candidate, column.id)),
      evaluation ? (evaluation.passedCount + "/" + evaluation.requiredCount) : "",
      evaluation?.passPercentage === null || evaluation?.passPercentage === undefined ? "" : evaluation.passPercentage,
      status,
      candidate.fitnessResult?.testedAt ?? "",
      candidate.fitnessResult?.notes ?? "",
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}
