// โมดูลสู่ความเป็นเลิศ (Excellence) — กรีฑาประเภทลู่เท่านั้น
// ฟังก์ชันทั้งหมดเป็น pure และไม่ import ค่า runtime จากโมดูลอื่น เพื่อให้ unit test รันด้วย node ได้โดยตรง
// และใช้ร่วมกันทั้งฝั่ง server (lib/excellence-service.ts) และหน้า UI

export const EXCELLENCE_SPORT = "กรีฑา";
export const TRACK_CATEGORIES = { "ลู่ (ชาย)": "ชาย", "ลู่ (หญิง)": "หญิง" } as const;
export const TRACK_GENDERS = ["ชาย", "หญิง"] as const;
export type TrackGender = typeof TRACK_GENDERS[number];

export type TrackEvent = {
  key: string;
  label: string;
  genders: readonly TrackGender[];
  // ช่วงเวลาที่ยอมรับได้ (วินาที) กันการพิมพ์ผิด ไม่ใช่เกณฑ์คัดตัว
  minSeconds: number;
  maxSeconds: number;
};

const BOTH: readonly TrackGender[] = TRACK_GENDERS;

export const ATHLETICS_TRACK_EVENTS: readonly TrackEvent[] = [
  { key: "100m", label: "100 เมตร", genders: BOTH, minSeconds: 9, maxSeconds: 20 },
  { key: "200m", label: "200 เมตร", genders: BOTH, minSeconds: 18, maxSeconds: 40 },
  { key: "400m", label: "400 เมตร", genders: BOTH, minSeconds: 40, maxSeconds: 90 },
  { key: "800m", label: "800 เมตร", genders: BOTH, minSeconds: 95, maxSeconds: 240 },
  { key: "1500m", label: "1,500 เมตร", genders: BOTH, minSeconds: 200, maxSeconds: 480 },
  { key: "5000m", label: "5,000 เมตร", genders: BOTH, minSeconds: 750, maxSeconds: 1800 },
  { key: "10000m", label: "10,000 เมตร", genders: BOTH, minSeconds: 1600, maxSeconds: 3600 },
  { key: "100mH", label: "100 เมตรข้ามรั้ว", genders: ["หญิง"], minSeconds: 11, maxSeconds: 25 },
  { key: "110mH", label: "110 เมตรข้ามรั้ว", genders: ["ชาย"], minSeconds: 12, maxSeconds: 25 },
  { key: "400mH", label: "400 เมตรข้ามรั้ว", genders: BOTH, minSeconds: 45, maxSeconds: 100 },
];

export function findTrackEvent(key: string): TrackEvent | null {
  return ATHLETICS_TRACK_EVENTS.find(event => event.key === key) ?? null;
}

export function eventsForGender(gender: TrackGender): TrackEvent[] {
  return ATHLETICS_TRACK_EVENTS.filter(event => event.genders.includes(gender));
}

export function eventLabel(key: string): string {
  return findTrackEvent(key)?.label ?? key;
}

// เพศอ่านจากประเภทที่สมัคร ("ลู่ (ชาย)" / "ลู่ (หญิง)") เพราะ schema ไม่มีฟิลด์เพศ
export function parseTrackGender(category: string): TrackGender | null {
  return TRACK_CATEGORIES[category.trim() as keyof typeof TRACK_CATEGORIES] ?? null;
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

// แสดงเวลาแบบกรีฑา: ต่ำกว่า 60 วินาทีเป็น "10.85" ตั้งแต่ 60 วินาทีเป็น "1:58.32"
export function formatTrackTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return seconds.toFixed(2);
  const minutes = Math.floor(seconds / 60);
  const rest = round(seconds - minutes * 60, 2);
  return `${minutes}:${rest.toFixed(2).padStart(5, "0")}`;
}

// รับ "10.85", "1:58.32" หรือ "31:02.5" คืนค่าเป็นวินาที หรือ null เมื่อรูปแบบไม่ถูกต้อง
export function parseTrackTime(input: string): number | null {
  const text = input.trim();
  const match = /^(?:(\d{1,2}):)?(\d{1,4}(?:\.\d{1,2})?)$/.exec(text);
  if (!match) return null;
  const minutes = match[1] === undefined ? 0 : Number(match[1]);
  const seconds = Number(match[2]);
  if (match[1] !== undefined && seconds >= 60) return null;
  return round(minutes * 60 + seconds, 2);
}

export function formatSignedSeconds(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "0.00s";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}s`;
}

// ---------- สมรรถภาพ ----------

export const FITNESS_RATINGS = ["ดีมาก", "ดี", "ปานกลาง", "พอใช้", "ต่ำ", "ต่ำมาก"] as const;
export type FitnessRating = typeof FITNESS_RATINGS[number];

export const FITNESS_RATING_SCORES: Record<FitnessRating, number> = {
  "ดีมาก": 100,
  "ดี": 80,
  "ปานกลาง": 60,
  "พอใช้": 40,
  "ต่ำ": 20,
  "ต่ำมาก": 0,
};

// คะแนนต่ำกว่าหรือเท่านี้ถือเป็นจุดอ่อน (พอใช้ ต่ำ ต่ำมาก)
export const WEAK_STATION_MAX_SCORE = 40;

export function isFitnessRating(value: unknown): value is FitnessRating {
  return typeof value === "string" && (FITNESS_RATINGS as readonly string[]).includes(value);
}

export function ratingScore(rating: FitnessRating | null | undefined): number | null {
  return rating ? FITNESS_RATING_SCORES[rating] : null;
}

export type FitnessStation = { key: string; name: string; aliases: readonly string[] };

export const ATHLETICS_STATIONS: readonly FitnessStation[] = [
  { key: "sprint40m", name: "ความเร็วและอัตราเร่ง (วิ่ง 40 เมตร)", aliases: ["sprint40mSec", "40m Sprint", "วิ่ง 40 เมตร", "ความเร็ว", "speed"] },
  { key: "legPower", name: "แรงระเบิดกล้ามเนื้อขา (Leg Power)", aliases: ["Leg Power", "legStrength", "explosive", "แรงระเบิด", "พลังกล้ามเนื้อ"] },
  { key: "agility", name: "ความคล่องแคล่วว่องไว (Agility)", aliases: ["agility", "semo", "ความคล่องแคล่ว"] },
  { key: "flexibility", name: "ความอ่อนตัว (Sit & Reach)", aliases: ["sitAndReachCm", "Sit and Reach", "sit-and-reach", "นั่งงอตัว", "ความอ่อนตัว", "flexibility"] },
  { key: "grip", name: "แรงบีบมือ (Grip Strength)", aliases: ["Grip Strength", "gripStrength", "grip", "แรงบีบมือ", "strength"] },
  { key: "aerobic", name: "ความอดทนระบบหายใจ (Aerobic)", aliases: ["vo2max", "endurance", "aerobic", "beep test", "ความอดทน"] },
  { key: "body", name: "องค์ประกอบร่างกาย (Body Composition)", aliases: ["bodyFat", "Body Composition", "องค์ประกอบร่างกาย", "องค์ประกอบทางร่างกาย"] },
];

export function findStation(key: string): FitnessStation | null {
  return ATHLETICS_STATIONS.find(station => station.key === key) ?? null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_()./&-]+/g, "");
}

function ratingFromValue(value: unknown): FitnessRating | null {
  if (isFitnessRating(value)) return value;
  if (typeof value === "string" && isFitnessRating(value.trim())) return value.trim() as FitnessRating;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return ratingFromValue(record.rating) ?? ratingFromValue(record.level);
  }
  return null;
}

// อ่านระดับผลรายสถานีจาก FitnessTestResult.scores (รองรับทั้งแบบแบนและแบบมี items)
// คืนค่าเป็น key ของสถานีกรีฑา ค่าที่ไม่ใช่ระดับ (ตัวเลขดิบ) จะไม่ถูกเดาเป็นระดับ
export function extractStationRatings(scores: unknown): Record<string, FitnessRating> {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return {};
  const root = scores as Record<string, unknown>;
  const items = root.items && typeof root.items === "object" && !Array.isArray(root.items)
    ? root.items as Record<string, unknown>
    : root;
  const result: Record<string, FitnessRating> = {};
  for (const [rawKey, value] of Object.entries(items)) {
    if (rawKey.startsWith("_")) continue;
    const rating = ratingFromValue(value);
    if (!rating) continue;
    const key = normalizeKey(rawKey);
    const station = ATHLETICS_STATIONS.find(candidate =>
      normalizeKey(candidate.key) === key || candidate.aliases.some(alias => {
        const normalized = normalizeKey(alias);
        return key === normalized || key.includes(normalized);
      }),
    );
    if (station && !result[station.key]) result[station.key] = rating;
  }
  return result;
}

export type StationResult = { key: string; name: string; rating: FitnessRating; score: number; weak: boolean };

export function stationResults(ratings: Record<string, FitnessRating>): StationResult[] {
  return ATHLETICS_STATIONS.flatMap(station => {
    const rating = ratings[station.key];
    if (!rating) return [];
    const score = FITNESS_RATING_SCORES[rating];
    return [{ key: station.key, name: station.name, rating, score, weak: score <= WEAK_STATION_MAX_SCORE }];
  });
}

// จุดอ่อนเรียงจากคะแนนต่ำสุดก่อน (ลำดับสถานีเดิมเมื่อคะแนนเท่ากัน)
export function weakStations(ratings: Record<string, FitnessRating>): StationResult[] {
  return stationResults(ratings).filter(station => station.weak).sort((a, b) => a.score - b.score);
}

// ---------- Benchmark ----------

export type TrackBenchmark = { targetSeconds: number; updatedAt: string; updatedBy: string };
export type TrackBenchmarks = Record<string, TrackBenchmark>;

export function benchmarkKey(event: string, gender: TrackGender): string {
  return `${event}|${gender}`;
}

export function parseBenchmarks(value: unknown): TrackBenchmarks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: TrackBenchmarks = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const [event, gender] = key.split("|");
    const known = findTrackEvent(event);
    if (!known || !known.genders.includes(gender as TrackGender)) continue;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const record = raw as Record<string, unknown>;
    if (typeof record.targetSeconds !== "number" || !Number.isFinite(record.targetSeconds) || record.targetSeconds <= 0) continue;
    result[key] = {
      targetSeconds: record.targetSeconds,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
      updatedBy: typeof record.updatedBy === "string" ? record.updatedBy : "",
    };
  }
  return result;
}

export function targetFor(benchmarks: TrackBenchmarks, event: string, gender: TrackGender): number | null {
  return benchmarks[benchmarkKey(event, gender)]?.targetSeconds ?? null;
}

// ค่าบวก = ช้ากว่าเป้า, null = ยังไม่มีเวลาหรือยังไม่ตั้งเป้า
export function gapToTarget(timeSeconds: number | null, targetSeconds: number | null): number | null {
  if (timeSeconds === null || targetSeconds === null) return null;
  return round(timeSeconds - targetSeconds, 2);
}

export type TargetStatus = "AT_TARGET" | "BELOW_TARGET" | "NO_TARGET" | "NO_RESULT";

export function targetStatus(timeSeconds: number | null, targetSeconds: number | null): TargetStatus {
  if (timeSeconds === null) return "NO_RESULT";
  if (targetSeconds === null) return "NO_TARGET";
  return timeSeconds <= targetSeconds ? "AT_TARGET" : "BELOW_TARGET";
}

// ---------- ผลการแข่งขัน ----------

export type TrackResult = {
  id: string;
  event: string;
  timeSeconds: number;
  competedAt: string; // วันที่ YYYY-MM-DD
  competitionName: string;
  stage: string | null;
};

export type MarkedResult = TrackResult & { isPB: boolean; isSB: boolean };

function byDateThenId(a: TrackResult, b: TrackResult): number {
  return a.competedAt.localeCompare(b.competedAt) || a.id.localeCompare(b.id);
}

// PB = เวลาดีที่สุดของรายการนั้นทั้งหมด, SB = เวลาดีที่สุดของรายการนั้นในปีเดียวกัน
// เวลาเท่ากันให้เครื่องหมายแก่ครั้งที่ทำได้ก่อน คืนค่าเรียงใหม่สุดก่อน
export function markBests(results: TrackResult[]): MarkedResult[] {
  const ordered = [...results].sort(byDateThenId);
  const pbId = new Map<string, string>();
  const sbId = new Map<string, string>();
  const best = new Map<string, number>();
  const seasonBest = new Map<string, number>();
  for (const result of ordered) {
    const season = `${result.event}|${result.competedAt.slice(0, 4)}`;
    if (!best.has(result.event) || result.timeSeconds < (best.get(result.event) as number)) {
      best.set(result.event, result.timeSeconds);
      pbId.set(result.event, result.id);
    }
    if (!seasonBest.has(season) || result.timeSeconds < (seasonBest.get(season) as number)) {
      seasonBest.set(season, result.timeSeconds);
      sbId.set(season, result.id);
    }
  }
  return ordered
    .map(result => ({
      ...result,
      isPB: pbId.get(result.event) === result.id,
      isSB: sbId.get(`${result.event}|${result.competedAt.slice(0, 4)}`) === result.id,
    }))
    .reverse();
}

export function personalBest(results: TrackResult[], event: string): number | null {
  const times = results.filter(result => result.event === event).map(result => result.timeSeconds);
  return times.length ? Math.min(...times) : null;
}

// ---------- SWC (Smallest Worthwhile Change) ----------

// การเปลี่ยนแปลงที่น้อยกว่าเกณฑ์นี้ถือว่าอยู่ในช่วงคลาดเคลื่อนของการวัด
export const TIME_SWC = {
  minSeconds: 0.1, // ความคลาดเคลื่อนโดยประมาณของการจับเวลาด้วยมือ
  relative: 0.005, // 0.5% ของเวลาเดิม ใช้เมื่อมากกว่า minSeconds (เช่น 400 ม. 52s → 0.26s)
} as const;

export type MetricChange = "IMPROVED" | "WITHIN_SWC" | "DECLINED";

export function timeSwcSeconds(baselineSeconds: number): number {
  return round(Math.max(TIME_SWC.minSeconds, baselineSeconds * TIME_SWC.relative), 2);
}

// delta = หลัง - ก่อน; สำหรับเวลาให้ lowerIsBetter = true
export function classifyChange(delta: number, swc: number, lowerIsBetter = false): MetricChange {
  if (delta === 0 || Math.abs(delta) < swc) return "WITHIN_SWC";
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  return improved ? "IMPROVED" : "DECLINED";
}

// ---------- แผนพัฒนาและการทดสอบซ้ำ (เก็บใน FitnessTestResult.scores._excellence.v2) ----------

export const PLAN_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type PlanStatus = typeof PLAN_STATUSES[number];
export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  ACTIVE: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export type PlanItem = { id: string; stationKey: string; activity: string };

export type DevelopmentPlan = {
  id: string;
  coachName: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  items: PlanItem[];
  notes: string | null;
  updatedAt: string;
  updatedBy: string;
};

export type Retest = {
  id: string;
  planId: string | null;
  testedAt: string;
  ratings: Record<string, FitnessRating>;
  event: string | null;
  timeSeconds: number | null;
  notes: string | null;
  recordedAt: string;
  recordedBy: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type ExcellenceStorage = { revision: number; plans: DevelopmentPlan[]; retests: Retest[] };

export const EMPTY_STORAGE: ExcellenceStorage = { revision: 0, plans: [], retests: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readExcellenceStorage(scores: unknown): ExcellenceStorage {
  if (!isRecord(scores) || !isRecord(scores._excellence)) return { ...EMPTY_STORAGE };
  const v2 = scores._excellence.v2;
  if (!isRecord(v2)) return { ...EMPTY_STORAGE };
  return {
    revision: Number.isInteger(v2.revision) ? Number(v2.revision) : 0,
    plans: Array.isArray(v2.plans) ? v2.plans.filter(isRecord) as DevelopmentPlan[] : [],
    retests: Array.isArray(v2.retests) ? v2.retests.filter(isRecord) as Retest[] : [],
  };
}

// เขียนเฉพาะ _excellence.v2 คงคีย์อื่นของ scores และข้อมูล _excellence รุ่นเดิมไว้ทั้งหมด
export function writeExcellenceStorage(scores: unknown, storage: ExcellenceStorage): Record<string, unknown> {
  const root: Record<string, unknown> = isRecord(scores) ? { ...scores } : { items: scores ?? {} };
  const previous = isRecord(root._excellence) ? root._excellence : {};
  return { ...root, _excellence: { ...previous, v2: storage } };
}

export function latestPlan(plans: DevelopmentPlan[]): DevelopmentPlan | null {
  return [...plans].sort((a, b) => b.startDate.localeCompare(a.startDate) || b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

export type StationChange = {
  stationKey: string;
  stationName: string;
  before: FitnessRating | null;
  after: FitnessRating | null;
  change: "IMPROVED" | "NO_CHANGE" | "DECLINED" | "NOT_TESTED";
};

export type RetestComparison = {
  retestId: string;
  testedAt: string;
  planId: string | null;
  // แต่ละข้อของแผนกับสถานีที่ผูกไว้ (ว่างเมื่อการทดสอบซ้ำไม่ได้ผูกกับแผน)
  planItems: (StationChange & { itemId: string; activity: string })[];
  stations: StationChange[];
  time: {
    event: string;
    before: number | null;
    after: number;
    delta: number | null;
    swc: number | null;
    change: MetricChange | null;
  } | null;
  summary: string;
};

function stationChange(stationKey: string, before: FitnessRating | null, after: FitnessRating | null): StationChange {
  const name = findStation(stationKey)?.name ?? stationKey;
  if (!after) return { stationKey, stationName: name, before, after, change: "NOT_TESTED" };
  if (!before) return { stationKey, stationName: name, before, after, change: "NOT_TESTED" };
  const delta = FITNESS_RATING_SCORES[after] - FITNESS_RATING_SCORES[before];
  return { stationKey, stationName: name, before, after, change: delta > 0 ? "IMPROVED" : delta < 0 ? "DECLINED" : "NO_CHANGE" };
}

// เวลาก่อนหน้า = ผลแข่งล่าสุดของรายการเดียวกันที่วันที่ไม่เกินวันทดสอบซ้ำ
export function timeBefore(results: TrackResult[], event: string, onOrBefore: string): number | null {
  const candidates = results
    .filter(result => result.event === event && result.competedAt <= onOrBefore)
    .sort(byDateThenId);
  return candidates.length ? candidates[candidates.length - 1].timeSeconds : null;
}

// เทียบการทดสอบซ้ำกับค่าก่อนหน้า (ผลทดสอบซ้ำครั้งก่อน หรือผลทดสอบสมรรถภาพครั้งแรก)
export function compareRetest(input: {
  retest: Retest;
  baselineRatings: Record<string, FitnessRating>;
  plan: DevelopmentPlan | null;
  results: TrackResult[];
}): RetestComparison {
  const { retest, baselineRatings, plan, results } = input;
  const stations = ATHLETICS_STATIONS
    .filter(station => retest.ratings[station.key])
    .map(station => stationChange(station.key, baselineRatings[station.key] ?? null, retest.ratings[station.key]));
  const planItems = plan
    ? plan.items.map(item => ({
        itemId: item.id,
        activity: item.activity,
        ...stationChange(item.stationKey, baselineRatings[item.stationKey] ?? null, retest.ratings[item.stationKey] ?? null),
      }))
    : [];

  let time: RetestComparison["time"] = null;
  if (retest.event && retest.timeSeconds !== null) {
    const before = timeBefore(results, retest.event, retest.testedAt);
    const delta = before === null ? null : round(retest.timeSeconds - before, 2);
    const swc = before === null ? null : timeSwcSeconds(before);
    time = {
      event: retest.event,
      before,
      after: retest.timeSeconds,
      delta,
      swc,
      change: delta === null || swc === null ? null : classifyChange(delta, swc, true),
    };
  }

  const tested = planItems.filter(item => item.change !== "NOT_TESTED");
  const improved = tested.filter(item => item.change === "IMPROVED").length;
  const parts: string[] = [];
  if (plan) {
    parts.push(tested.length
      ? `จุดอ่อนตามแผนดีขึ้น ${improved} จาก ${tested.length} สถานีที่ทดสอบ`
      : "ยังไม่ได้ทดสอบสถานีที่อยู่ในแผน");
  }
  if (time?.change === "IMPROVED") parts.push(`เวลา ${eventLabel(time.event)} ดีขึ้นเกินช่วงคลาดเคลื่อน`);
  else if (time?.change === "DECLINED") parts.push(`เวลา ${eventLabel(time.event)} ช้าลงเกินช่วงคลาดเคลื่อน`);
  else if (time?.change === "WITHIN_SWC") parts.push(`เวลา ${eventLabel(time.event)} เปลี่ยนน้อยกว่าช่วงคลาดเคลื่อน (±${time.swc}s)`);
  else if (time) parts.push(`ยังไม่มีผลแข่ง ${eventLabel(time.event)} ก่อนหน้าให้เทียบเวลา`);

  return {
    retestId: retest.id,
    testedAt: retest.testedAt,
    planId: retest.planId,
    planItems,
    stations,
    time,
    summary: parts.join(" · ") || "บันทึกผลทดสอบซ้ำแล้ว",
  };
}

// ---------- มุมมองข้อมูลสำหรับหน้า UI ----------

// ข้อมูลนักกีฬา 1 คน ที่ service สร้างจากฐานข้อมูล (หรือชุดสาธิตสร้างขึ้นเอง) ในรูปแบบเดียวกัน
export type AthleteRecord = {
  applicationId: string;
  studentId: string;
  name: string;
  faculty: string;
  gender: TrackGender;
  competitionName: string;
  fitness: { testedAt: string | null; ratings: Record<string, FitnessRating> } | null;
  results: TrackResult[];
  storage: ExcellenceStorage;
};

export type OverviewRow = {
  rowId: string;
  applicationId: string;
  studentId: string;
  name: string;
  faculty: string;
  gender: TrackGender;
  event: string | null;
  bestSeconds: number | null;
  targetSeconds: number | null;
  gapSeconds: number | null;
  status: TargetStatus;
  weakestStation: string | null;
  planStatus: PlanStatus | null;
  retestCount: number;
};

// 1 แถวต่อ (นักกีฬา, รายการ) ที่มีผล นักกีฬาที่ยังไม่มีผลแข่งได้ 1 แถว
export function overviewRows(record: AthleteRecord, benchmarks: TrackBenchmarks): OverviewRow[] {
  const weakest = weakStations(record.fitness?.ratings ?? {})[0]?.name ?? null;
  const plan = latestPlan(record.storage.plans);
  const base = {
    applicationId: record.applicationId,
    studentId: record.studentId,
    name: record.name,
    faculty: record.faculty,
    gender: record.gender,
    weakestStation: weakest,
    planStatus: plan?.status ?? null,
    retestCount: record.storage.retests.length,
  };
  const events = ATHLETICS_TRACK_EVENTS.map(event => event.key).filter(key => record.results.some(result => result.event === key));
  if (!events.length) {
    return [{ ...base, rowId: `${record.applicationId}|-`, event: null, bestSeconds: null, targetSeconds: null, gapSeconds: null, status: "NO_RESULT" }];
  }
  return events.map(event => {
    const best = personalBest(record.results, event);
    const target = targetFor(benchmarks, event, record.gender);
    return {
      ...base,
      rowId: `${record.applicationId}|${event}`,
      event,
      bestSeconds: best,
      targetSeconds: target,
      gapSeconds: gapToTarget(best, target),
      status: targetStatus(best, target),
    };
  });
}

export type OverviewFilter = { event?: string; gender?: TrackGender; search?: string };

export function filterRows(rows: OverviewRow[], filter: OverviewFilter): OverviewRow[] {
  const query = filter.search?.trim().toLowerCase() ?? "";
  return rows.filter(row =>
    (!filter.event || row.event === filter.event)
    && (!filter.gender || row.gender === filter.gender)
    && (!query || row.name.toLowerCase().includes(query) || row.studentId.toLowerCase().includes(query) || row.faculty.toLowerCase().includes(query)),
  );
}

export type OverviewSummary = { athletes: number; atTarget: number; withPlan: number; retested: number };

// นับเป็นจำนวนคน (ไม่ใช่จำนวนแถว) ถึงเป้า = ถึงเป้าอย่างน้อย 1 รายการ
export function summarizeRows(rows: OverviewRow[]): OverviewSummary {
  const ids = (predicate: (row: OverviewRow) => boolean) => new Set(rows.filter(predicate).map(row => row.applicationId)).size;
  return {
    athletes: ids(() => true),
    atTarget: ids(row => row.status === "AT_TARGET"),
    withPlan: ids(row => row.planStatus !== null),
    retested: ids(row => row.retestCount > 0),
  };
}

export type TimelineEntry = { date: string; kind: "FITNESS" | "PLAN" | "RESULT" | "RETEST"; label: string };

export function buildTimeline(record: AthleteRecord): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  if (record.fitness?.testedAt) entries.push({ date: record.fitness.testedAt.slice(0, 10), kind: "FITNESS", label: "ทดสอบสมรรถภาพครั้งแรก" });
  for (const plan of record.storage.plans) entries.push({ date: plan.startDate, kind: "PLAN", label: `เริ่มแผนพัฒนา (${plan.items.length} ข้อ)` });
  for (const result of record.results) entries.push({ date: result.competedAt, kind: "RESULT", label: `${eventLabel(result.event)} ${formatTrackTime(result.timeSeconds)}` });
  for (const retest of record.storage.retests) entries.push({ date: retest.testedAt, kind: "RETEST", label: "ทดสอบซ้ำ" });
  const order: Record<TimelineEntry["kind"], number> = { FITNESS: 0, PLAN: 1, RESULT: 2, RETEST: 3 };
  return entries.sort((a, b) => a.date.localeCompare(b.date) || order[a.kind] - order[b.kind]);
}

export type AthleteDetail = {
  athlete: Omit<AthleteRecord, "results" | "storage">;
  revision: number;
  results: (MarkedResult & { targetSeconds: number | null; gapSeconds: number | null })[];
  stations: StationResult[];
  plans: DevelopmentPlan[];
  retests: (Retest & { comparison: RetestComparison })[];
  timeline: TimelineEntry[];
  events: TrackEvent[];
};

export function buildAthleteDetail(record: AthleteRecord, benchmarks: TrackBenchmarks): AthleteDetail {
  const baseline = record.fitness?.ratings ?? {};
  const plansById = new Map(record.storage.plans.map(plan => [plan.id, plan]));
  const retests = [...record.storage.retests].sort((a, b) => a.testedAt.localeCompare(b.testedAt) || a.recordedAt.localeCompare(b.recordedAt));
  let previous: Record<string, FitnessRating> = baseline;
  const compared = retests.map(retest => {
    const comparison = compareRetest({ retest, baselineRatings: previous, plan: retest.planId ? plansById.get(retest.planId) ?? null : null, results: record.results });
    previous = { ...previous, ...retest.ratings };
    return { ...retest, comparison };
  });
  const { results, storage, ...athlete } = record;
  return {
    athlete,
    revision: storage.revision,
    results: markBests(results).map(result => {
      const target = targetFor(benchmarks, result.event, record.gender);
      return { ...result, targetSeconds: target, gapSeconds: gapToTarget(result.timeSeconds, target) };
    }),
    stations: stationResults(baseline),
    plans: [...storage.plans].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    retests: compared.reverse(),
    timeline: buildTimeline(record),
    events: eventsForGender(record.gender),
  };
}
