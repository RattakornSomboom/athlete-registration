// Mirrors normalizeCalendarYear in rule-checker (kept local so this module stays importable by node:test without extensionless resolution).
const toCalendarYear = (year: number) => (year >= 2400 ? year - 543 : year);

export const EVIDENCE_ITEMS = ["STUDENT_STATUS", "GPAX", "COMPETITION_HISTORY", "FITNESS_TEST"] as const;
/** รายการหลักฐานที่ระบบบังคับว่าต้องได้ผล PASSED ก่อนส่งบัญชีรายชื่อ/อนุมัติ (ยกเว้น FITNESS_TEST ชั่วคราวให้สอดคล้องกับการซ่อนเอกสาร) */
export const REQUIRED_EVIDENCE_ITEMS = EVIDENCE_ITEMS.filter((item) => item !== "FITNESS_TEST");
export const EVIDENCE_RESULTS = ["PENDING", "PASSED", "REJECTED", "ACTION_REQUIRED"] as const;

export type EvidenceItem = (typeof EVIDENCE_ITEMS)[number];
export type EvidenceResult = (typeof EVIDENCE_RESULTS)[number];

export const EVIDENCE_ITEM_LABELS: Record<EvidenceItem, string> = {
  STUDENT_STATUS: "สถานภาพนิสิต / บัตรนิสิต",
  GPAX: "เกรดเฉลี่ยสะสม (GPAX)",
  COMPETITION_HISTORY: "ผลงานการแข่งขันย้อนหลัง",
  FITNESS_TEST: "ผลทดสอบสมรรถภาพทางกาย",
};

export const EVIDENCE_RESULT_LABELS: Record<EvidenceResult, string> = {
  PENDING: "รอตรวจ",
  PASSED: "ผ่าน",
  REJECTED: "ไม่ผ่าน",
  ACTION_REQUIRED: "ขอเอกสารเพิ่ม",
};

const PREFIX = "EVIDENCE";
export const RESULT_WINDOW_YEARS = 2;

export type EvidenceHistoryRow = { id: string; status: string; label: string; by: string; createdAt: Date | string };

export function encodeEvidenceStatus(item: EvidenceItem, result: EvidenceResult) {
  return `${PREFIX}:${item}:${result}`;
}

export function parseEvidenceStatus(status: string): { item: EvidenceItem; result: EvidenceResult } | null {
  const [prefix, item, result, ...rest] = status.split(":");
  if (prefix !== PREFIX || rest.length > 0) return null;
  const parsedItem = EVIDENCE_ITEMS.find((value) => value === item);
  const parsedResult = EVIDENCE_RESULTS.find((value) => value === result);
  return parsedItem && parsedResult ? { item: parsedItem, result: parsedResult } : null;
}

export const isEvidenceHistory = (status: string) => parseEvidenceStatus(status) !== null;

export function buildEvidenceLabel(item: EvidenceItem, result: EvidenceResult, reason?: string, reference?: string) {
  return `ตรวจหลักฐาน ${EVIDENCE_ITEM_LABELS[item]}: ${EVIDENCE_RESULT_LABELS[result]}`
    + (reason ? ` — ${reason}` : "")
    + (reference ? ` (อ้างอิง: ${reference})` : "");
}

export type EvidenceRecord = {
  item: EvidenceItem;
  result: EvidenceResult;
  label: string | null;
  by: string | null;
  createdAt: Date | string | null;
};

/** Latest review result per item; items never reviewed stay PENDING. */
export function summarizeEvidence(history: EvidenceHistoryRow[]): Record<EvidenceItem, EvidenceRecord> {
  const summary = Object.fromEntries(
    EVIDENCE_ITEMS.map((item) => [item, { item, result: "PENDING", label: null, by: null, createdAt: null } as EvidenceRecord]),
  ) as Record<EvidenceItem, EvidenceRecord>;
  const ordered = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const row of ordered) {
    const parsed = parseEvidenceStatus(row.status);
    if (parsed) summary[parsed.item] = { ...parsed, label: row.label, by: row.by, createdAt: row.createdAt };
  }
  return summary;
}

/** A result counts when it falls within RESULT_WINDOW_YEARS before (or in) the competition year. */
export function evaluateResultRecency(results: { year: string }[], competitionYear: number): {
  passed: boolean | null;
  recentCount: number;
  message: string;
} {
  if (results.length === 0) return { passed: null, recentCount: 0, message: "ผู้สมัครไม่ได้ระบุผลงานการแข่งขัน" };
  const base = toCalendarYear(competitionYear);
  const recentCount = results.filter((result) => {
    const year = Number.parseInt(result.year, 10);
    if (!Number.isFinite(year)) return false;
    const diff = base - toCalendarYear(year);
    return diff >= 0 && diff <= RESULT_WINDOW_YEARS;
  }).length;
  return recentCount > 0
    ? { passed: true, recentCount, message: `มีผลงานภายใน ${RESULT_WINDOW_YEARS} ปีก่อนปีแข่งขัน ${competitionYear} จำนวน ${recentCount} รายการ` }
    : { passed: false, recentCount, message: `ไม่มีผลงานอยู่ในช่วง ${RESULT_WINDOW_YEARS} ปีก่อนปีแข่งขัน ${competitionYear}` };
}

/** An athlete counts as verified when they listed results and staff/club marked COMPETITION_HISTORY as PASSED, or when results are recent and not rejected. */
export function hasVerifiedResults(app: {
  competitionResults: unknown[];
  statusHistory: EvidenceHistoryRow[];
  competition?: { year: number };
}) {
  if (app.competitionResults.length === 0) return false;
  const historyResult = summarizeEvidence(app.statusHistory).COMPETITION_HISTORY.result;
  if (historyResult === "PASSED") return true;
  if (historyResult === "PENDING" && app.competition) {
    const recency = evaluateResultRecency(
      app.competitionResults as { year: string }[],
      app.competition.year
    );
    return recency.passed === true;
  }
  return false;
}
