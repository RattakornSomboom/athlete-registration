// ชุดข้อมูลสาธิตของโมดูลสู่ความเป็นเลิศ (กรีฑาประเภทลู่) — ข้อมูลจำลอง ไม่ใช่ผลจริง
// ใช้รูปแบบ AthleteRecord เดียวกับข้อมูลจริง ภาพรวมและหน้ารายคนจึงแสดงชุดเดียวกันทั้งหมด
import type {
  AthleteRecord,
  DevelopmentPlan,
  FitnessRating,
  Retest,
  TrackBenchmarks,
  TrackGender,
  TrackResult,
} from "./excellence-athletics";

const DEMO_AT = "2026-01-05T00:00:00.000Z";
const DEMO_BY = "demo";

export const DEMO_BENCHMARKS: TrackBenchmarks = {
  "100m|ชาย": { targetSeconds: 11, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "100m|หญิง": { targetSeconds: 12.6, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "400m|ชาย": { targetSeconds: 50.5, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "400m|หญิง": { targetSeconds: 60, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  // 200 เมตรตั้งใจไม่ตั้งเป้า เพื่อแสดงสถานะ "ยังไม่ตั้งเป้า"
};

type ResultSeed = [event: string, timeSeconds: number, competedAt: string, competitionName: string];

function results(id: string, seeds: ResultSeed[]): TrackResult[] {
  return seeds.map(([event, timeSeconds, competedAt, competitionName], index) => ({
    id: `${id}-r${index + 1}`,
    event,
    timeSeconds,
    competedAt,
    competitionName,
    stage: "รอบชิงชนะเลิศ",
  }));
}

function plan(id: string, startDate: string, endDate: string, status: DevelopmentPlan["status"], items: [stationKey: string, activity: string][]): DevelopmentPlan {
  return {
    id,
    coachName: "อ.สมชาย ใจดี (โค้ชกรีฑา)",
    startDate,
    endDate,
    status,
    items: items.map(([stationKey, activity], index) => ({ id: `${id}-i${index + 1}`, stationKey, activity })),
    notes: null,
    updatedAt: `${startDate}T00:00:00.000Z`,
    updatedBy: DEMO_BY,
  };
}

function retest(id: string, planId: string | null, testedAt: string, ratings: Record<string, FitnessRating>, event: string | null, timeSeconds: number | null): Retest {
  return { id, planId, testedAt, ratings, event, timeSeconds, notes: null, recordedAt: `${testedAt}T00:00:00.000Z`, recordedBy: DEMO_BY };
}

function athlete(
  index: number,
  name: string,
  gender: TrackGender,
  faculty: string,
  ratings: Record<string, FitnessRating>,
  seeds: ResultSeed[],
  plans: DevelopmentPlan[] = [],
  retests: Retest[] = [],
): AthleteRecord {
  const applicationId = `demo-${index}`;
  return {
    applicationId,
    studentId: `6602${String(index).padStart(4, "0")}`,
    name,
    faculty,
    gender,
    competitionName: "กีฬามหาวิทยาลัยแห่งประเทศไทย (สาธิต)",
    fitness: { testedAt: "2026-02-10", ratings },
    results: results(applicationId, seeds),
    storage: { revision: plans.length + retests.length, plans, retests },
  };
}

const STRONG: Record<string, FitnessRating> = {
  sprint40m: "ดีมาก", legPower: "ดีมาก", agility: "ดี", flexibility: "ดี", grip: "ดี", aerobic: "ดี", body: "ดีมาก",
};

export function getDemoAthletes(): AthleteRecord[] {
  return [
    athlete(1, "นายกฤษดา วงศ์ชัย", "ชาย", "คณะวิทยาศาสตร์การกีฬา", STRONG, [
      ["100m", 11.35, "2025-11-20", "คัดตัวภายในมหาวิทยาลัย 2568"],
      ["100m", 11.12, "2026-03-14", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
      ["100m", 10.98, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(2, "นายภานุวัฒน์ ศรีสุข", "ชาย", "คณะวิศวกรรมศาสตร์",
      { sprint40m: "พอใช้", legPower: "ต่ำ", agility: "ดี", flexibility: "ปานกลาง", grip: "ปานกลาง", aerobic: "ปานกลาง", body: "ดี" },
      [
        ["100m", 11.62, "2026-03-14", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["100m", 11.48, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-2-p1", "2026-08-25", "2026-10-20", "ACTIVE", [
        ["legPower", "Plyometrics (box jump, bounding) สัปดาห์ละ 2 ครั้ง"],
        ["sprint40m", "ฝึกออกตัวจากบล็อกและเร่งความเร็วช่วง 30 เมตรแรก"],
      ])],
      [retest("demo-2-t1", "demo-2-p1", "2026-10-05", { sprint40m: "ปานกลาง", legPower: "ปานกลาง" }, "100m", 11.3)],
    ),
    athlete(3, "นางสาวพิมพ์ชนก แก้วมณี", "หญิง", "คณะพยาบาลศาสตร์",
      { sprint40m: "ดี", legPower: "ดี", agility: "ปานกลาง", flexibility: "ต่ำ", grip: "ปานกลาง", aerobic: "ดี", body: "ดี" },
      [
        ["100m", 12.95, "2026-03-14", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["100m", 12.88, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-3-p1", "2026-08-25", "2026-10-20", "ACTIVE", [
        ["flexibility", "ยืดเหยียดสะโพกและต้นขาด้านหลังก่อน-หลังซ้อมทุกวัน"],
      ])],
      [retest("demo-3-t1", "demo-3-p1", "2026-10-05", { flexibility: "พอใช้" }, "100m", 12.84)],
    ),
    athlete(4, "นางสาวณัฐธิดา บุญมา", "หญิง", "คณะแพทยศาสตร์", STRONG, [
      ["100m", 12.55, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(5, "นายธนกร มีสุข", "ชาย", "คณะเกษตรศาสตร์",
      { sprint40m: "ดี", legPower: "ดี", agility: "ดี", flexibility: "ปานกลาง", grip: "ดี", aerobic: "ต่ำ", body: "ดี" },
      [
        ["400m", 51.8, "2026-03-15", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["400m", 50.9, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-5-p1", "2026-08-25", "2026-10-30", "ACTIVE", [
        ["aerobic", "Tempo run 6×300 เมตร พักเดิน 90 วินาที สัปดาห์ละ 2 ครั้ง"],
      ])],
      [retest("demo-5-t1", "demo-5-p1", "2026-10-06", { aerobic: "ปานกลาง" }, "400m", 50.4)],
    ),
    athlete(6, "นายอภิสิทธิ์ ทองดี", "ชาย", "คณะบริหารธุรกิจ",
      { sprint40m: "ปานกลาง", legPower: "พอใช้", agility: "ต่ำ", flexibility: "ปานกลาง", grip: "ปานกลาง", aerobic: "ปานกลาง", body: "ปานกลาง" },
      [["400m", 53.2, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"]],
    ),
    athlete(7, "นางสาวกมลชนก สายทอง", "หญิง", "คณะศิลปศาสตร์", STRONG, [
      ["400m", 61.2, "2025-11-21", "คัดตัวภายในมหาวิทยาลัย 2568"],
      ["400m", 59.4, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(8, "นางสาวสุภาวดี จันทร์หอม", "หญิง", "คณะวิทยาศาสตร์",
      { sprint40m: "ปานกลาง", legPower: "พอใช้", agility: "ปานกลาง", flexibility: "ดี", grip: "ปานกลาง", aerobic: "ดี", body: "ดี" },
      [
        ["400m", 62.3, "2026-03-15", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["400m", 61.8, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-8-p1", "2026-08-25", "2026-10-30", "ACTIVE", [
        ["legPower", "Squat และ lunge แบบมีน้ำหนัก สัปดาห์ละ 2 ครั้ง"],
      ])],
      [retest("demo-8-t1", "demo-8-p1", "2026-10-06", { legPower: "พอใช้" }, "400m", 62.1)],
    ),
    athlete(9, "นายวรเมธ คำแก้ว", "ชาย", "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", STRONG, [
      ["200m", 22.4, "2026-08-24", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(10, "นางสาวอรอุมา ปัญญาดี", "หญิง", "คณะนิติศาสตร์",
      { sprint40m: "ดี", legPower: "ปานกลาง", agility: "ดี", flexibility: "ดี", grip: "พอใช้", aerobic: "ปานกลาง", body: "ดี" },
      [],
    ),
  ];
}
