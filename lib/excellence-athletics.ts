// โมดูลสู่ความเป็นเลิศ (Excellence) — กรีฑา ประเภทลู่ (วัดเวลา ยิ่งน้อยยิ่งดี) และประเภทลาน (วัดระยะ ยิ่งมากยิ่งดี)
// สถานีและระดับสมรรถภาพตามเกณฑ์กลุ่ม 9 (กกมท.): 11 รายการทดสอบ 5 ระดับ ดีมาก/ดี/ปานกลาง/ต่ำ/ต่ำมาก
// ฟังก์ชันทั้งหมดเป็น pure และไม่ import ค่า runtime จากโมดูลอื่น เพื่อให้ unit test รันด้วย node ได้โดยตรง
// และใช้ร่วมกันทั้งฝั่ง server (lib/excellence-service.ts) และหน้า UI
// "ผล" (mark) ของลู่เป็นวินาที ของลานเป็นเมตร ทิศทางของค่าที่ดีกว่าดูจาก kind ของรายการ

export const EXCELLENCE_SPORT = "กรีฑา";
// เพศอ่านจากประเภทที่สมัคร เพราะ schema ไม่มีฟิลด์เพศ
export const ATHLETICS_CATEGORIES = {
  "ลู่ (ชาย)": "ชาย",
  "ลู่ (หญิง)": "หญิง",
  "ลาน (ชาย)": "ชาย",
  "ลาน (หญิง)": "หญิง",
} as const;
export const ATHLETICS_CATEGORY_NAMES: string[] = Object.keys(ATHLETICS_CATEGORIES);
export const ATHLETICS_GENDERS = ["ชาย", "หญิง"] as const;
export type AthleticsGender = typeof ATHLETICS_GENDERS[number];

export type EventKind = "TRACK" | "FIELD";

export type AthleticsEvent = {
  key: string;
  label: string;
  kind: EventKind;
  genders: readonly AthleticsGender[];
  // ช่วงผลที่ยอมรับได้ (ลู่ = วินาที, ลาน = เมตร) กันการพิมพ์ผิด ไม่ใช่เกณฑ์คัดตัว
  min: number;
  max: number;
};

const BOTH: readonly AthleticsGender[] = ATHLETICS_GENDERS;

export const ATHLETICS_EVENTS: readonly AthleticsEvent[] = [
  { key: "100m", label: "100 เมตร", kind: "TRACK", genders: BOTH, min: 9, max: 20 },
  { key: "200m", label: "200 เมตร", kind: "TRACK", genders: BOTH, min: 18, max: 40 },
  { key: "400m", label: "400 เมตร", kind: "TRACK", genders: BOTH, min: 40, max: 90 },
  { key: "800m", label: "800 เมตร", kind: "TRACK", genders: BOTH, min: 95, max: 240 },
  { key: "1500m", label: "1,500 เมตร", kind: "TRACK", genders: BOTH, min: 200, max: 480 },
  { key: "5000m", label: "5,000 เมตร", kind: "TRACK", genders: BOTH, min: 750, max: 1800 },
  { key: "10000m", label: "10,000 เมตร", kind: "TRACK", genders: BOTH, min: 1600, max: 3600 },
  { key: "100mH", label: "100 เมตรข้ามรั้ว", kind: "TRACK", genders: ["หญิง"], min: 11, max: 25 },
  { key: "110mH", label: "110 เมตรข้ามรั้ว", kind: "TRACK", genders: ["ชาย"], min: 12, max: 25 },
  { key: "400mH", label: "400 เมตรข้ามรั้ว", kind: "TRACK", genders: BOTH, min: 45, max: 100 },
  { key: "longJump", label: "กระโดดไกล", kind: "FIELD", genders: BOTH, min: 2.5, max: 9.5 },
  { key: "tripleJump", label: "กระโดดสามชั้น", kind: "FIELD", genders: BOTH, min: 6, max: 19 },
  { key: "highJump", label: "กระโดดสูง", kind: "FIELD", genders: BOTH, min: 0.8, max: 2.6 },
  { key: "poleVault", label: "กระโดดค้ำถ่อ", kind: "FIELD", genders: BOTH, min: 1.5, max: 6.3 },
  { key: "shotPut", label: "ทุ่มน้ำหนัก", kind: "FIELD", genders: BOTH, min: 5, max: 24 },
  { key: "discus", label: "ขว้างจักร", kind: "FIELD", genders: BOTH, min: 15, max: 75 },
  { key: "javelin", label: "พุ่งแหลน", kind: "FIELD", genders: BOTH, min: 20, max: 95 },
  { key: "hammer", label: "ขว้างค้อน", kind: "FIELD", genders: BOTH, min: 20, max: 85 },
];

export function findEvent(key: string): AthleticsEvent | null {
  return ATHLETICS_EVENTS.find(event => event.key === key) ?? null;
}

export function eventsForGender(gender: AthleticsGender): AthleticsEvent[] {
  return ATHLETICS_EVENTS.filter(event => event.genders.includes(gender));
}

export function eventLabel(key: string): string {
  return findEvent(key)?.label ?? key;
}

export function eventKind(key: string): EventKind {
  return findEvent(key)?.kind ?? "TRACK";
}

// ลู่: เวลาน้อยกว่าดีกว่า / ลาน: ระยะมากกว่าดีกว่า
export function lowerIsBetter(key: string): boolean {
  return eventKind(key) === "TRACK";
}

export function parseAthleticsGender(category: string): AthleticsGender | null {
  return ATHLETICS_CATEGORIES[category.trim() as keyof typeof ATHLETICS_CATEGORIES] ?? null;
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

// รับระยะเป็นเมตร "7.85" (ทศนิยมไม่เกิน 2 ตำแหน่ง)
export function parseFieldDistance(input: string): number | null {
  const match = /^(\d{1,2}(?:\.\d{1,2})?)$/.exec(input.trim());
  return match ? round(Number(match[1]), 2) : null;
}

export function parseMark(event: string, input: string): number | null {
  return eventKind(event) === "TRACK" ? parseTrackTime(input) : parseFieldDistance(input);
}

// ลู่ = "10.85" / "1:58.32", ลาน = "7.85 ม."
export function formatMark(event: string, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return eventKind(event) === "TRACK" ? formatTrackTime(value) : `${value.toFixed(2)} ม.`;
}

// ข้อความสำหรับใส่ในช่องกรอก (ไม่มีหน่วย) ให้ parseMark อ่านกลับได้
export function formatMarkInput(event: string, value: number): string {
  return eventKind(event) === "TRACK" ? formatTrackTime(value) : value.toFixed(2);
}

// ส่วนต่างมีเครื่องหมาย เช่น "+0.48s" / "−0.02s" / "+0.15 ม."
export function formatSignedMark(event: string, value: number | null): string {
  if (value === null) return "—";
  const unit = eventKind(event) === "TRACK" ? "s" : " ม.";
  if (value === 0) return `0.00${unit}`;
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}${unit}`;
}

// ---------- สมรรถภาพ (เกณฑ์สมรรถภาพทางกาย กลุ่ม 9 กกมท.) ----------

// 5 ระดับตามเกณฑ์กลุ่ม 9 ("ปานกลาง" คือระดับกลาง; ระดับ "พอใช้" ของเกณฑ์ทั่วไปรุ่นเดิมอ่านเป็น "ปานกลาง")
export const FITNESS_RATINGS = ["ดีมาก", "ดี", "ปานกลาง", "ต่ำ", "ต่ำมาก"] as const;
export type FitnessRating = typeof FITNESS_RATINGS[number];

export const FITNESS_RATING_SCORES: Record<FitnessRating, number> = {
  "ดีมาก": 100,
  "ดี": 75,
  "ปานกลาง": 50,
  "ต่ำ": 25,
  "ต่ำมาก": 0,
};

// คะแนนไม่เกินนี้ถือเป็นจุดอ่อน (ต่ำ, ต่ำมาก) ระดับ "ปานกลาง" ไม่นับเป็นจุดอ่อน
export const WEAK_STATION_MAX_SCORE = 25;

export function isFitnessRating(value: unknown): value is FitnessRating {
  return typeof value === "string" && (FITNESS_RATINGS as readonly string[]).includes(value);
}

// อ่านชื่อระดับจากข้อความ (รองรับ "พอใช้" ของเกณฑ์ทั่วไปรุ่นเดิม = ระดับกลาง = "ปานกลาง")
export function normalizeRating(value: unknown): FitnessRating | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "พอใช้") return "ปานกลาง";
  return isFitnessRating(text) ? text : null;
}

export function ratingScore(rating: FitnessRating | null | undefined): number | null {
  return rating ? FITNESS_RATING_SCORES[rating] : null;
}

export type FitnessStation = { key: string; name: string; aliases: readonly string[] };

// สถานี = รายการทดสอบของกลุ่ม 9 ครบ 11 รายการ (key ตรงกับ Group9TestKey ใน fitness-group9-norms.ts)
export const ATHLETICS_STATIONS: readonly FitnessStation[] = [
  { key: "bodyFatPercent", name: "องค์ประกอบร่างกาย (ปริมาณไขมัน)", aliases: ["bodyFat", "Body Composition", "องค์ประกอบร่างกาย", "องค์ประกอบทางร่างกาย", "ปริมาณไขมัน", "ไขมัน"] },
  { key: "sitAndReachCm", name: "ความอ่อนตัว (นั่งงอตัว)", aliases: ["sitAndReach", "Sit and Reach", "sit-and-reach", "นั่งงอตัว"] },
  { key: "backExtensionCm", name: "ความอ่อนตัว (นอนแอ่นหลัง)", aliases: ["backExtension", "Back Extension", "นอนแอ่นหลัง"] },
  { key: "gripStrengthRatio", name: "ความแข็งแรง (แรงบีบมือ)", aliases: ["gripStrength", "Grip Strength", "grip", "แรงบีบมือ"] },
  { key: "legStrengthRatio", name: "ความแข็งแรง (แรงเหยียดขา)", aliases: ["legStrength", "Leg Strength", "แรงเหยียดขา"] },
  { key: "sitUps1Min", name: "ความแข็งแรง (ลุก-นั่ง 1 นาที)", aliases: ["sitUps", "Sit-ups", "ลุก-นั่ง", "ลุกนั่ง"] },
  { key: "pushUps1Min", name: "ความแข็งแรง (ดันพื้น 1 นาที)", aliases: ["pushUps", "Push-ups", "ดันพื้น"] },
  { key: "sprint40mSec", name: "ความเร็ว (วิ่งเร็ว 40 เมตร)", aliases: ["sprint40m", "40m Sprint", "วิ่งเร็ว 40", "วิ่ง 40", "40 เมตร"] },
  { key: "wingatePowerWkg", name: "พลังงานแบบไม่ใช้ออกซิเจน (Wingate power)", aliases: ["wingatePower", "Wingate Anaerobic Power", "anaerobic power"] },
  { key: "wingateCapacityWkg", name: "พลังงานแบบไม่ใช้ออกซิเจน (Wingate capacity)", aliases: ["wingateCapacity", "Wingate Anaerobic Capacity", "anaerobic capacity"] },
  { key: "vo2maxMlKgMin", name: "พลังงานแบบใช้ออกซิเจน (Multistage)", aliases: ["vo2max", "Multistage", "Beep test", "aerobic", "endurance", "ความอดทน"] },
];

export function findStation(key: string): FitnessStation | null {
  return ATHLETICS_STATIONS.find(station => station.key === key) ?? null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_()./&-]+/g, "");
}

function ratingFromValue(value: unknown): FitnessRating | null {
  const direct = normalizeRating(value);
  if (direct) return direct;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return ratingFromValue(record.rating) ?? ratingFromValue(record.level);
  }
  return null;
}

// ตัดสินระดับจากตัวเลขดิบของสถานี (ตามเกณฑ์กลุ่ม 9 ของเพศนั้น) คืน null เมื่อไม่ตัดสิน
export type StationRater = (stationKey: string, value: number) => string | null;

// อ่านระดับผลรายสถานีจาก FitnessTestResult.scores (รองรับทั้งแบบแบนและแบบมี items) คืนค่าเป็น key ของสถานีกลุ่ม 9
// 1) ระดับที่เป็นข้อความ (จับคู่ชื่อสถานีได้หลายแบบ) 2) ตัวเลขดิบใต้ key ของสถานีตรง ๆ จะตัดสินด้วย rater (เกณฑ์กลุ่ม 9)
// ตัวเลขใต้ชื่ออื่น (หน่วยไม่แน่ชัด เช่น แรงบีบมือเป็น กก.) ไม่ถูกเดา
export function extractStationRatings(scores: unknown, rate?: StationRater): Record<string, FitnessRating> {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return {};
  const root = scores as Record<string, unknown>;
  const items = root.items && typeof root.items === "object" && !Array.isArray(root.items)
    ? root.items as Record<string, unknown>
    : root;
  const result: Record<string, FitnessRating> = {};
  for (const [rawKey, value] of Object.entries(items)) {
    if (rawKey.startsWith("_")) continue;
    const key = normalizeKey(rawKey);
    const exact = ATHLETICS_STATIONS.find(candidate => normalizeKey(candidate.key) === key);
    let rating = ratingFromValue(value);
    if (!rating && exact && rate && typeof value === "number" && Number.isFinite(value)) {
      rating = normalizeRating(rate(exact.key, value));
    }
    if (!rating) continue;
    const station = exact ?? ATHLETICS_STATIONS.find(candidate => candidate.aliases.some(alias => {
      const normalized = normalizeKey(alias);
      return key === normalized || key.includes(normalized);
    }));
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

export type Benchmark = { target: number; updatedAt: string; updatedBy: string };
export type Benchmarks = Record<string, Benchmark>;

export function benchmarkKey(event: string, gender: AthleticsGender): string {
  return `${event}|${gender}`;
}

export function parseBenchmarks(value: unknown): Benchmarks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Benchmarks = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const [event, gender] = key.split("|");
    const known = findEvent(event);
    if (!known || !known.genders.includes(gender as AthleticsGender)) continue;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const record = raw as Record<string, unknown>;
    // รุ่นแรกเก็บเป็น targetSeconds (ลู่เท่านั้น) อ่านต่อได้
    const target = typeof record.target === "number" ? record.target : record.targetSeconds;
    if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) continue;
    result[key] = {
      target,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
      updatedBy: typeof record.updatedBy === "string" ? record.updatedBy : "",
    };
  }
  return result;
}

export function targetFor(benchmarks: Benchmarks, event: string, gender: AthleticsGender): number | null {
  return benchmarks[benchmarkKey(event, gender)]?.target ?? null;
}

// ค่าบวก = ตามหลังเป้า (ลู่: ช้ากว่าเป้า, ลาน: สั้น/ต่ำกว่าเป้า), null = ยังไม่มีผลหรือยังไม่ตั้งเป้า
export function gapToTarget(event: string, mark: number | null, target: number | null): number | null {
  if (mark === null || target === null) return null;
  return round(lowerIsBetter(event) ? mark - target : target - mark, 2);
}

// ร้อยละของเป้า: 100 = เท่าเป้า, มากกว่า 100 = ดีกว่าเป้า (ลู่ = เป้า ÷ เวลา, ลาน = ระยะ ÷ เป้า)
// ใช้เทียบข้ามรายการได้เพราะอยู่บนสเกลเดียวกัน แต่เป็นสัดส่วนต่อเป้าที่เจ้าหน้าที่ตั้ง ไม่ใช่คะแนนทางการของสหพันธ์
export function percentOfTarget(event: string, mark: number | null, target: number | null): number | null {
  if (mark === null || target === null || mark <= 0 || target <= 0) return null;
  return round((lowerIsBetter(event) ? target / mark : mark / target) * 100, 1);
}

export type TargetStatus = "AT_TARGET" | "BELOW_TARGET" | "NO_TARGET" | "NO_RESULT";

export function targetStatus(event: string, mark: number | null, target: number | null): TargetStatus {
  if (mark === null) return "NO_RESULT";
  if (target === null) return "NO_TARGET";
  return (lowerIsBetter(event) ? mark <= target : mark >= target) ? "AT_TARGET" : "BELOW_TARGET";
}

// a ดีกว่า b อย่างเคร่งครัดหรือไม่
function isBetter(event: string, a: number, b: number): boolean {
  return lowerIsBetter(event) ? a < b : a > b;
}

// ---------- ผลการแข่งขัน ----------

export type EventResult = {
  id: string;
  event: string;
  mark: number; // ลู่ = วินาที, ลาน = เมตร
  competedAt: string; // วันที่ YYYY-MM-DD
  competitionName: string;
  stage: string | null;
};

export type MarkedResult = EventResult & { isPB: boolean; isSB: boolean };

export type ProgressionPoint = { id: string; date: string; mark: number; isPB: boolean };
export type ProgressionSeries = { event: string; kind: EventKind; target: number | null; points: ProgressionPoint[] };

// กราฟพัฒนาการ: 1 ชุดต่อรายการ เรียงเก่า → ใหม่ แสดงเฉพาะรายการที่มีผลตั้งแต่ 2 ครั้งขึ้นไป
export function progressionSeries(results: (MarkedResult & { target: number | null })[]): ProgressionSeries[] {
  return ATHLETICS_EVENTS
    .map(event => {
      const rows = results
        .filter(result => result.event === event.key)
        .sort((a, b) => a.competedAt.localeCompare(b.competedAt) || a.id.localeCompare(b.id));
      return {
        event: event.key,
        kind: event.kind,
        target: rows[0]?.target ?? null,
        points: rows.map(row => ({ id: row.id, date: row.competedAt, mark: row.mark, isPB: row.isPB })),
      };
    })
    .filter(series => series.points.length >= 2);
}

function byDateThenId(a: EventResult, b: EventResult): number {
  return a.competedAt.localeCompare(b.competedAt) || a.id.localeCompare(b.id);
}

// PB = ผลดีที่สุดของรายการนั้นทั้งหมด, SB = ผลดีที่สุดของรายการนั้นในปีเดียวกัน
// ผลเท่ากันให้เครื่องหมายแก่ครั้งที่ทำได้ก่อน คืนค่าเรียงใหม่สุดก่อน
export function markBests(results: EventResult[]): MarkedResult[] {
  const ordered = [...results].sort(byDateThenId);
  const pbId = new Map<string, string>();
  const sbId = new Map<string, string>();
  const best = new Map<string, number>();
  const seasonBest = new Map<string, number>();
  for (const result of ordered) {
    const season = `${result.event}|${result.competedAt.slice(0, 4)}`;
    if (!best.has(result.event) || isBetter(result.event, result.mark, best.get(result.event) as number)) {
      best.set(result.event, result.mark);
      pbId.set(result.event, result.id);
    }
    if (!seasonBest.has(season) || isBetter(result.event, result.mark, seasonBest.get(season) as number)) {
      seasonBest.set(season, result.mark);
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

export function personalBest(results: EventResult[], event: string): number | null {
  const marks = results.filter(result => result.event === event).map(result => result.mark);
  if (!marks.length) return null;
  return lowerIsBetter(event) ? Math.min(...marks) : Math.max(...marks);
}

// ---------- SWC (Smallest Worthwhile Change) ----------

// การเปลี่ยนแปลงที่น้อยกว่าเกณฑ์นี้ถือว่าอยู่ในช่วงคลาดเคลื่อนของการวัด
export const MARK_SWC = {
  trackMinSeconds: 0.1, // ความคลาดเคลื่อนโดยประมาณของการจับเวลาด้วยมือ
  fieldMinMeters: 0.02, // ความละเอียดของการวัดระยะ
  relative: 0.005, // 0.5% ของผลเดิม ใช้เมื่อมากกว่าค่าต่ำสุด (เช่น 400 ม. 52s → 0.26s, พุ่งแหลน 60 ม. → 0.30 ม.)
} as const;

export type MetricChange = "IMPROVED" | "WITHIN_SWC" | "DECLINED";

export function markSwc(event: string, baseline: number): number {
  const floor = eventKind(event) === "TRACK" ? MARK_SWC.trackMinSeconds : MARK_SWC.fieldMinMeters;
  return round(Math.max(floor, baseline * MARK_SWC.relative), 2);
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
  mark: number | null; // ลู่ = วินาที, ลาน = เมตร
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
    retests: Array.isArray(v2.retests) ? v2.retests.filter(isRecord).map(normalizeRetest) : [],
  };
}

// รุ่นแรกเก็บเวลาไว้ที่ timeSeconds (ลู่เท่านั้น) อ่านเป็น mark ต่อได้
function normalizeRetest(raw: Record<string, unknown>): Retest {
  const legacy = typeof raw.timeSeconds === "number" ? raw.timeSeconds : null;
  const { timeSeconds: _legacy, ...rest } = raw;
  void _legacy;
  const ratings: Record<string, FitnessRating> = {};
  if (isRecord(raw.ratings)) {
    for (const [key, value] of Object.entries(raw.ratings)) {
      const rating = normalizeRating(value);
      if (rating) ratings[key] = rating;
    }
  }
  return { ...rest, ratings, mark: typeof raw.mark === "number" ? raw.mark : legacy } as Retest;
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
  mark: {
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

// ผลก่อนหน้า = ผลแข่งล่าสุดของรายการเดียวกันที่วันที่ไม่เกินวันทดสอบซ้ำ
export function markBefore(results: EventResult[], event: string, onOrBefore: string): number | null {
  const candidates = results
    .filter(result => result.event === event && result.competedAt <= onOrBefore)
    .sort(byDateThenId);
  return candidates.length ? candidates[candidates.length - 1].mark : null;
}

// เทียบการทดสอบซ้ำกับค่าก่อนหน้า (ผลทดสอบซ้ำครั้งก่อน หรือผลทดสอบสมรรถภาพครั้งแรก)
export function compareRetest(input: {
  retest: Retest;
  baselineRatings: Record<string, FitnessRating>;
  plan: DevelopmentPlan | null;
  results: EventResult[];
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

  let mark: RetestComparison["mark"] = null;
  if (retest.event && retest.mark !== null) {
    const before = markBefore(results, retest.event, retest.testedAt);
    const delta = before === null ? null : round(retest.mark - before, 2);
    const swc = before === null ? null : markSwc(retest.event, before);
    mark = {
      event: retest.event,
      before,
      after: retest.mark,
      delta,
      swc,
      change: delta === null || swc === null ? null : classifyChange(delta, swc, lowerIsBetter(retest.event)),
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
  if (mark) {
    const noun = eventKind(mark.event) === "TRACK" ? "เวลา" : "ระยะ";
    const unit = eventKind(mark.event) === "TRACK" ? "s" : " ม.";
    if (mark.change === "IMPROVED") parts.push(`${noun} ${eventLabel(mark.event)} ดีขึ้นเกินช่วงคลาดเคลื่อน`);
    else if (mark.change === "DECLINED") parts.push(`${noun} ${eventLabel(mark.event)} แย่ลงเกินช่วงคลาดเคลื่อน`);
    else if (mark.change === "WITHIN_SWC") parts.push(`${noun} ${eventLabel(mark.event)} เปลี่ยนน้อยกว่าช่วงคลาดเคลื่อน (±${mark.swc}${unit})`);
    else parts.push(`ยังไม่มีผลแข่ง ${eventLabel(mark.event)} ก่อนหน้าให้เทียบ${noun}`);
  }

  return {
    retestId: retest.id,
    testedAt: retest.testedAt,
    planId: retest.planId,
    planItems,
    stations,
    mark,
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
  gender: AthleticsGender;
  competitionName: string;
  fitness: { testedAt: string | null; ratings: Record<string, FitnessRating> } | null;
  results: EventResult[];
  storage: ExcellenceStorage;
};

export type OverviewRow = {
  rowId: string;
  applicationId: string;
  studentId: string;
  name: string;
  faculty: string;
  gender: AthleticsGender;
  event: string | null;
  bestMark: number | null;
  targetMark: number | null;
  gapMark: number | null;
  percentOfTarget: number | null;
  status: TargetStatus;
  weakestStation: string | null;
  planStatus: PlanStatus | null;
  retestCount: number;
};

// 1 แถวต่อ (นักกีฬา, รายการ) ที่มีผล นักกีฬาที่ยังไม่มีผลแข่งได้ 1 แถว
export function overviewRows(record: AthleteRecord, benchmarks: Benchmarks): OverviewRow[] {
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
  const events = ATHLETICS_EVENTS.map(event => event.key).filter(key => record.results.some(result => result.event === key));
  if (!events.length) {
    return [{ ...base, rowId: `${record.applicationId}|-`, event: null, bestMark: null, targetMark: null, gapMark: null, percentOfTarget: null, status: "NO_RESULT" }];
  }
  return events.map(event => {
    const best = personalBest(record.results, event);
    const target = targetFor(benchmarks, event, record.gender);
    return {
      ...base,
      rowId: `${record.applicationId}|${event}`,
      event,
      bestMark: best,
      targetMark: target,
      gapMark: gapToTarget(event, best, target),
      percentOfTarget: percentOfTarget(event, best, target),
      status: targetStatus(event, best, target),
    };
  });
}

export type OverviewFilter = { event?: string; gender?: AthleticsGender; search?: string };

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
  for (const result of record.results) entries.push({ date: result.competedAt, kind: "RESULT", label: `${eventLabel(result.event)} ${formatMark(result.event, result.mark)}` });
  for (const retest of record.storage.retests) entries.push({ date: retest.testedAt, kind: "RETEST", label: "ทดสอบซ้ำ" });
  const order: Record<TimelineEntry["kind"], number> = { FITNESS: 0, PLAN: 1, RESULT: 2, RETEST: 3 };
  return entries.sort((a, b) => a.date.localeCompare(b.date) || order[a.kind] - order[b.kind]);
}

export type AthleteDetail = {
  athlete: Omit<AthleteRecord, "results" | "storage">;
  revision: number;
  results: (MarkedResult & { target: number | null; gap: number | null; percentOfTarget: number | null })[];
  stations: StationResult[];
  plans: DevelopmentPlan[];
  retests: (Retest & { comparison: RetestComparison })[];
  timeline: TimelineEntry[];
  events: AthleticsEvent[];
};

export function buildAthleteDetail(record: AthleteRecord, benchmarks: Benchmarks): AthleteDetail {
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
      return { ...result, target, gap: gapToTarget(result.event, result.mark, target), percentOfTarget: percentOfTarget(result.event, result.mark, target) };
    }),
    stations: stationResults(baseline),
    plans: [...storage.plans].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    retests: compared.reverse(),
    timeline: buildTimeline(record),
    events: eventsForGender(record.gender),
  };
}

// ---------- Heatmap ทีม × สถานี ----------

export type HeatmapCell = { rating: FitnessRating; score: number; weak: boolean };

export type HeatmapRow = {
  applicationId: string;
  studentId: string;
  name: string;
  faculty: string;
  gender: AthleticsGender;
  events: string[];
  cells: Record<string, HeatmapCell | null>;
  weakCount: number;
  testedCount: number;
};

export type HeatmapStation = { key: string; name: string; tested: number; weak: number; averageScore: number | null };
export type Heatmap = { stations: HeatmapStation[]; rows: HeatmapRow[] };

// 1 แถวต่อนักกีฬา (กรองตามเพศ/ค้นหา และรายการที่นักกีฬามีผลแข่ง) เรียงคนที่มีจุดอ่อนมากสุดก่อน
// สรุปรายสถานีนับเฉพาะคนที่มีผลสถานีนั้น ไม่นับคนที่ยังไม่ได้ทดสอบเป็นจุดอ่อน
export function buildHeatmap(records: AthleteRecord[], filter: OverviewFilter): Heatmap {
  const query = filter.search?.trim().toLowerCase() ?? "";
  const rows: HeatmapRow[] = records
    .filter(record =>
      (!filter.gender || record.gender === filter.gender)
      && (!filter.event || record.results.some(result => result.event === filter.event))
      && (!query || record.name.toLowerCase().includes(query) || record.studentId.toLowerCase().includes(query) || record.faculty.toLowerCase().includes(query)),
    )
    .map(record => {
      const results = stationResults(record.fitness?.ratings ?? {});
      const byKey = new Map(results.map(result => [result.key, result]));
      const cells: Record<string, HeatmapCell | null> = {};
      for (const station of ATHLETICS_STATIONS) {
        const result = byKey.get(station.key);
        cells[station.key] = result ? { rating: result.rating, score: result.score, weak: result.weak } : null;
      }
      return {
        applicationId: record.applicationId,
        studentId: record.studentId,
        name: record.name,
        faculty: record.faculty,
        gender: record.gender,
        events: ATHLETICS_EVENTS.map(event => event.key).filter(key => record.results.some(result => result.event === key)),
        cells,
        weakCount: results.filter(result => result.weak).length,
        testedCount: results.length,
      };
    })
    .sort((a, b) => b.weakCount - a.weakCount || a.name.localeCompare(b.name, "th"));
  const stations = ATHLETICS_STATIONS.map(station => {
    const cells = rows.flatMap(row => row.cells[station.key] ? [row.cells[station.key] as HeatmapCell] : []);
    return {
      key: station.key,
      name: station.name,
      tested: cells.length,
      weak: cells.filter(cell => cell.weak).length,
      averageScore: cells.length ? round(cells.reduce((sum, cell) => sum + cell.score, 0) / cells.length, 0) : null,
    };
  });
  return { stations, rows };
}
