// ชุดข้อมูลสาธิตของโมดูลสู่ความเป็นเลิศ (กรีฑาประเภทลู่และลาน) — ข้อมูลจำลอง ไม่ใช่ผลจริง
// ใช้รูปแบบ AthleteRecord เดียวกับข้อมูลจริง ภาพรวมและหน้ารายคนจึงแสดงชุดเดียวกันทั้งหมด
import type {
  AthleteRecord,
  AthleticsGender,
  Benchmarks,
  DevelopmentPlan,
  EventResult,
  FitnessRating,
  Retest,
} from "./excellence-athletics";

const DEMO_AT = "2026-01-05T00:00:00.000Z";
const DEMO_BY = "demo";

export const DEMO_BENCHMARKS: Benchmarks = {
  "100m|ชาย": { target: 11, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "100m|หญิง": { target: 12.6, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "400m|ชาย": { target: 50.5, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "400m|หญิง": { target: 60, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "longJump|ชาย": { target: 7.2, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  "shotPut|หญิง": { target: 13, updatedAt: DEMO_AT, updatedBy: DEMO_BY },
  // 200 เมตรตั้งใจไม่ตั้งเป้า เพื่อแสดงสถานะ "ยังไม่ตั้งเป้า"
};

type ResultSeed = [event: string, mark: number, competedAt: string, competitionName: string];

function results(id: string, seeds: ResultSeed[]): EventResult[] {
  return seeds.map(([event, mark, competedAt, competitionName], index) => ({
    id: `${id}-r${index + 1}`,
    event,
    mark,
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

function retest(id: string, planId: string | null, testedAt: string, ratings: Record<string, FitnessRating>, event: string | null, mark: number | null): Retest {
  return { id, planId, testedAt, ratings, event, mark, notes: null, recordedAt: `${testedAt}T00:00:00.000Z`, recordedBy: DEMO_BY };
}

function athlete(
  index: number,
  name: string,
  gender: AthleticsGender,
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

// สถานีตามเกณฑ์กลุ่ม 9 ครบ 11 รายการ เริ่มจากระดับ "ปานกลาง" แล้วกำหนดเฉพาะรายการที่ต่างออกไปของแต่ละคน
const MIDDLE: Record<string, FitnessRating> = {
  bodyFatPercent: "ปานกลาง",
  sitAndReachCm: "ปานกลาง",
  backExtensionCm: "ปานกลาง",
  gripStrengthRatio: "ปานกลาง",
  legStrengthRatio: "ปานกลาง",
  sitUps1Min: "ปานกลาง",
  pushUps1Min: "ปานกลาง",
  sprint40mSec: "ปานกลาง",
  wingatePowerWkg: "ปานกลาง",
  wingateCapacityWkg: "ปานกลาง",
  vo2maxMlKgMin: "ปานกลาง",
};
const ratings = (overrides: Record<string, FitnessRating>): Record<string, FitnessRating> => ({ ...MIDDLE, ...overrides });

const STRONG = ratings({
  bodyFatPercent: "ดีมาก", sitAndReachCm: "ดี", backExtensionCm: "ดี", gripStrengthRatio: "ดี", legStrengthRatio: "ดีมาก",
  sitUps1Min: "ดี", pushUps1Min: "ดี", sprint40mSec: "ดีมาก", wingatePowerWkg: "ดี", wingateCapacityWkg: "ดี", vo2maxMlKgMin: "ดี",
});

export function getDemoAthletes(): AthleteRecord[] {
  return [
    athlete(1, "นายกฤษดา วงศ์ชัย", "ชาย", "คณะวิทยาศาสตร์การกีฬา", STRONG, [
      ["100m", 11.35, "2025-11-20", "คัดตัวภายในมหาวิทยาลัย 2568"],
      ["100m", 11.12, "2026-03-14", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
      ["100m", 10.98, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(2, "นายภานุวัฒน์ ศรีสุข", "ชาย", "คณะวิศวกรรมศาสตร์",
      ratings({ sprint40mSec: "ต่ำ", legStrengthRatio: "ต่ำ", bodyFatPercent: "ดี" }),
      [
        ["100m", 11.62, "2026-03-14", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["100m", 11.48, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-2-p1", "2026-08-25", "2026-10-20", "ACTIVE", [
        ["legStrengthRatio", "Squat และ plyometrics (box jump, bounding) สัปดาห์ละ 2 ครั้ง"],
        ["sprint40mSec", "ฝึกออกตัวจากบล็อกและเร่งความเร็วช่วง 30 เมตรแรก"],
      ])],
      [retest("demo-2-t1", "demo-2-p1", "2026-10-05", { sprint40mSec: "ปานกลาง", legStrengthRatio: "ปานกลาง" }, "100m", 11.3)],
    ),
    athlete(3, "นางสาวพิมพ์ชนก แก้วมณี", "หญิง", "คณะพยาบาลศาสตร์",
      ratings({ sprint40mSec: "ดี", legStrengthRatio: "ดี", sitAndReachCm: "ต่ำ", vo2maxMlKgMin: "ดี", bodyFatPercent: "ดี" }),
      [
        ["100m", 12.95, "2026-03-14", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["100m", 12.88, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-3-p1", "2026-08-25", "2026-10-20", "ACTIVE", [
        ["sitAndReachCm", "ยืดเหยียดสะโพกและต้นขาด้านหลังก่อน-หลังซ้อมทุกวัน"],
      ])],
      [retest("demo-3-t1", "demo-3-p1", "2026-10-05", { sitAndReachCm: "ปานกลาง" }, "100m", 12.84)],
    ),
    athlete(4, "นางสาวณัฐธิดา บุญมา", "หญิง", "คณะแพทยศาสตร์", STRONG, [
      ["100m", 12.55, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(5, "นายธนกร มีสุข", "ชาย", "คณะเกษตรศาสตร์",
      ratings({ sprint40mSec: "ดี", legStrengthRatio: "ดี", gripStrengthRatio: "ดี", bodyFatPercent: "ดี", vo2maxMlKgMin: "ต่ำ" }),
      [
        ["400m", 51.8, "2026-03-15", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["400m", 50.9, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-5-p1", "2026-08-25", "2026-10-30", "ACTIVE", [
        ["vo2maxMlKgMin", "Tempo run 6×300 เมตร พักเดิน 90 วินาที สัปดาห์ละ 2 ครั้ง"],
      ])],
      [retest("demo-5-t1", "demo-5-p1", "2026-10-06", { vo2maxMlKgMin: "ปานกลาง" }, "400m", 50.4)],
    ),
    athlete(6, "นายอภิสิทธิ์ ทองดี", "ชาย", "คณะบริหารธุรกิจ",
      ratings({ legStrengthRatio: "ต่ำ", sitUps1Min: "ต่ำ" }),
      [["400m", 53.2, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"]],
      // แผนเลยกำหนดแล้วแต่ยังไม่ทดสอบซ้ำ (ตัวอย่างของ "ต้องติดตาม")
      [plan("demo-6-p1", "2026-08-25", "2026-09-30", "ACTIVE", [
        ["legStrengthRatio", "Squat และ lunge แบบมีน้ำหนัก สัปดาห์ละ 2 ครั้ง"],
      ])],
    ),
    athlete(7, "นางสาวกมลชนก สายทอง", "หญิง", "คณะศิลปศาสตร์", STRONG, [
      ["400m", 61.2, "2025-11-21", "คัดตัวภายในมหาวิทยาลัย 2568"],
      ["400m", 59.4, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(8, "นางสาวสุภาวดี จันทร์หอม", "หญิง", "คณะวิทยาศาสตร์",
      ratings({ legStrengthRatio: "ต่ำ", sitAndReachCm: "ดี", vo2maxMlKgMin: "ดี", bodyFatPercent: "ดี" }),
      [
        ["400m", 62.3, "2026-03-15", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["400m", 61.8, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-8-p1", "2026-08-25", "2026-10-30", "ACTIVE", [
        ["legStrengthRatio", "Squat และ lunge แบบมีน้ำหนัก สัปดาห์ละ 2 ครั้ง"],
      ])],
      [retest("demo-8-t1", "demo-8-p1", "2026-10-06", { legStrengthRatio: "ต่ำ" }, "400m", 62.1)],
    ),
    athlete(9, "นายวรเมธ คำแก้ว", "ชาย", "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", STRONG, [
      ["200m", 22.4, "2026-08-24", "กีฬามหาวิทยาลัยรอบมหกรรม"],
    ]),
    athlete(10, "นางสาวอรอุมา ปัญญาดี", "หญิง", "คณะนิติศาสตร์",
      ratings({ gripStrengthRatio: "ต่ำ", sprint40mSec: "ดี", sitAndReachCm: "ดี", bodyFatPercent: "ดี" }),
      [],
    ),
    // รายการลาน (วัดระยะ ยิ่งมากยิ่งดี)
    athlete(11, "นายปฏิภาณ เจริญสุข", "ชาย", "คณะสาธารณสุขศาสตร์",
      ratings({ legStrengthRatio: "ต่ำ", sprint40mSec: "ดี", gripStrengthRatio: "ดี", bodyFatPercent: "ดี" }),
      [
        ["longJump", 6.85, "2025-11-20", "คัดตัวภายในมหาวิทยาลัย 2568"],
        ["longJump", 7.05, "2026-03-14", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["longJump", 7.18, "2026-08-22", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-11-p1", "2026-08-25", "2026-10-20", "ACTIVE", [
        ["legStrengthRatio", "Squat หนัก และ jump squat สัปดาห์ละ 2 ครั้ง"],
      ])],
      [retest("demo-11-t1", "demo-11-p1", "2026-10-05", { legStrengthRatio: "ปานกลาง" }, "longJump", 7.3)],
    ),
    athlete(12, "นางสาวชลธิชา แสงทอง", "หญิง", "คณะรัฐศาสตร์และสังคมศาสตร์",
      ratings({ gripStrengthRatio: "ต่ำ", sitAndReachCm: "ดี", bodyFatPercent: "ดี" }),
      [
        ["shotPut", 12.1, "2026-03-15", "กีฬามหาวิทยาลัยรอบคัดเลือก"],
        ["shotPut", 12.8, "2026-08-23", "กีฬามหาวิทยาลัยรอบมหกรรม"],
      ],
      [plan("demo-12-p1", "2026-08-25", "2026-10-30", "ACTIVE", [
        ["gripStrengthRatio", "ฝึกแรงบีบมือและแรงดึง สัปดาห์ละ 2 ครั้ง"],
      ])],
      [retest("demo-12-t1", "demo-12-p1", "2026-10-06", { gripStrengthRatio: "ปานกลาง" }, "shotPut", 12.82)],
    ),
  ];
}
