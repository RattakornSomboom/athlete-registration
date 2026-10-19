import type { FitnessRatingLevel } from "./fitness-calculation";

type Group9RatingLevel = Extract<FitnessRatingLevel, "ดีมาก" | "ดี" | "ปานกลาง" | "ต่ำ" | "ต่ำมาก">;

const GROUP9_LEVEL_SCORE: Record<Group9RatingLevel, number> = {
  ดีมาก: 5,
  ดี: 4,
  ปานกลาง: 3,
  ต่ำ: 2,
  ต่ำมาก: 1,
};

function levelScore(level: FitnessRatingLevel): number {
  return level === "พอใช้" ? 3 : GROUP9_LEVEL_SCORE[level];
}

/** ผ่านเกณฑ์เมื่ออยู่ระดับ ปานกลาง ขึ้นไป (สอดคล้องกับ isLevelPassing ใน fitness-calculation) */
function isLevelPassing(level: FitnessRatingLevel): boolean {
  return levelScore(level) >= 3;
}

/**
 * เกณฑ์สมรรถภาพทางกายกลุ่ม 9 (กกมท.)
 * ใช้กับ: ว่ายน้ำระยะกลาง/ไกล และ วิ่งระยะกลาง/ไกล
 * 5 ระดับ: ดีมาก / ดี / ปานกลาง / ต่ำ / ต่ำมาก
 */

export type Group9Gender = "ชาย" | "หญิง";

export type Group9TestKey =
  | "bodyFatPercent"
  | "sitAndReachCm"
  | "backExtensionCm"
  | "gripStrengthRatio"
  | "legStrengthRatio"
  | "sitUps1Min"
  | "pushUps1Min"
  | "sprint40mSec"
  | "wingatePowerWkg"
  | "wingateCapacityWkg"
  | "vo2maxMlKgMin";

type Group9Norm = {
  name: string;
  unit: string;
  /** true = ค่าน้อยดีกว่า (ใช้เพดานบนของแต่ละระดับ), false = ค่ามากดีกว่า (ใช้ขอบล่าง) */
  lowerIsBetter: boolean;
  /** [ดีมาก, ดี, ปานกลาง, ต่ำ] ส่วนที่เหลือคือ ต่ำมาก */
  thresholds: readonly [number, number, number, number];
  min: number;
  max: number;
};

export const GROUP9_TEST_KEYS: readonly Group9TestKey[] = [
  "bodyFatPercent",
  "sitAndReachCm",
  "backExtensionCm",
  "gripStrengthRatio",
  "legStrengthRatio",
  "sitUps1Min",
  "pushUps1Min",
  "sprint40mSec",
  "wingatePowerWkg",
  "wingateCapacityWkg",
  "vo2maxMlKgMin",
];

export const GROUP9_NORMS: Record<Group9Gender, Record<Group9TestKey, Group9Norm>> = {
  ชาย: {
    bodyFatPercent: { name: "เปอร์เซ็นต์ไขมัน", unit: "%", lowerIsBetter: true, thresholds: [9.2, 11.3, 14.0, 18.8], min: 1, max: 60 },
    sitAndReachCm: { name: "นั่งงอตัวไปข้างหน้า", unit: "ซม.", lowerIsBetter: false, thresholds: [28, 22, 17, 10], min: -30, max: 60 },
    backExtensionCm: { name: "นอนแอ่นหลัง", unit: "ซม.", lowerIsBetter: false, thresholds: [60, 54, 50, 45], min: 0, max: 120 },
    gripStrengthRatio: { name: "แรงบีบมือ", unit: "กก./กก.", lowerIsBetter: false, thresholds: [0.84, 0.78, 0.72, 0.63], min: 0, max: 3 },
    legStrengthRatio: { name: "แรงเหยียดขา", unit: "กก./กก.", lowerIsBetter: false, thresholds: [3.58, 3.14, 2.58, 2.16], min: 0, max: 8 },
    sitUps1Min: { name: "ลุก-นั่ง 1 นาที", unit: "ครั้ง", lowerIsBetter: false, thresholds: [61, 53, 47, 40], min: 0, max: 150 },
    pushUps1Min: { name: "ดันพื้น 1 นาที", unit: "ครั้ง", lowerIsBetter: false, thresholds: [56, 48, 40, 30], min: 0, max: 150 },
    sprint40mSec: { name: "วิ่ง 40 เมตร", unit: "วินาที", lowerIsBetter: true, thresholds: [5.46, 5.59, 5.98, 6.59], min: 3, max: 15 },
    wingatePowerWkg: { name: "Wingate Anaerobic Power", unit: "W/kg", lowerIsBetter: false, thresholds: [12.0, 10.9, 10.1, 8.5], min: 0, max: 30 },
    wingateCapacityWkg: { name: "Wingate Anaerobic Capacity", unit: "W/kg", lowerIsBetter: false, thresholds: [9.7, 9.0, 8.0, 6.4], min: 0, max: 25 },
    vo2maxMlKgMin: { name: "Multistage Fitness (VO2max)", unit: "มล./กก./นาที", lowerIsBetter: false, thresholds: [53.1, 47.1, 43.2, 36.4], min: 10, max: 95 },
  },
  หญิง: {
    bodyFatPercent: { name: "เปอร์เซ็นต์ไขมัน", unit: "%", lowerIsBetter: true, thresholds: [21.5, 23.8, 28.8, 33.8], min: 1, max: 60 },
    sitAndReachCm: { name: "นั่งงอตัวไปข้างหน้า", unit: "ซม.", lowerIsBetter: false, thresholds: [26, 22, 17, 10], min: -30, max: 60 },
    backExtensionCm: { name: "นอนแอ่นหลัง", unit: "ซม.", lowerIsBetter: false, thresholds: [63, 53, 47, 44], min: 0, max: 120 },
    gripStrengthRatio: { name: "แรงบีบมือ", unit: "กก./กก.", lowerIsBetter: false, thresholds: [0.68, 0.61, 0.57, 0.52], min: 0, max: 3 },
    legStrengthRatio: { name: "แรงเหยียดขา", unit: "กก./กก.", lowerIsBetter: false, thresholds: [3.14, 2.77, 2.09, 1.76], min: 0, max: 8 },
    sitUps1Min: { name: "ลุก-นั่ง 1 นาที", unit: "ครั้ง", lowerIsBetter: false, thresholds: [58, 50, 44, 35], min: 0, max: 150 },
    pushUps1Min: { name: "ดันพื้น 1 นาที", unit: "ครั้ง", lowerIsBetter: false, thresholds: [45, 41, 33, 26], min: 0, max: 150 },
    sprint40mSec: { name: "วิ่ง 40 เมตร", unit: "วินาที", lowerIsBetter: true, thresholds: [6.20, 6.89, 7.28, 8.13], min: 3, max: 15 },
    wingatePowerWkg: { name: "Wingate Anaerobic Power", unit: "W/kg", lowerIsBetter: false, thresholds: [9.1, 8.6, 7.8, 6.8], min: 0, max: 30 },
    wingateCapacityWkg: { name: "Wingate Anaerobic Capacity", unit: "W/kg", lowerIsBetter: false, thresholds: [7.3, 6.8, 6.3, 5.3], min: 0, max: 25 },
    vo2maxMlKgMin: { name: "Multistage Fitness (VO2max)", unit: "มล./กก./นาที", lowerIsBetter: false, thresholds: [42.2, 38.1, 32.1, 27.8], min: 10, max: 95 },
  },
};

const LEVELS: readonly FitnessRatingLevel[] = ["ดีมาก", "ดี", "ปานกลาง", "ต่ำ"];

export function rateGroup9Value(gender: Group9Gender, key: Group9TestKey, value: number): FitnessRatingLevel {
  const norm = GROUP9_NORMS[gender][key];
  for (let index = 0; index < norm.thresholds.length; index += 1) {
    const threshold = norm.thresholds[index];
    if (norm.lowerIsBetter ? value <= threshold : value >= threshold) return LEVELS[index];
  }
  return "ต่ำมาก";
}

export type Group9Inputs = Partial<Record<Group9TestKey, number>>;

export type Group9ResultItem = {
  key: Group9TestKey;
  name: string;
  unit: string;
  rawValue: number;
  rating: FitnessRatingLevel;
  score: number;
  passed: boolean;
};

export type Group9Evaluation = {
  gender: Group9Gender;
  items: Group9ResultItem[];
  missing: Group9TestKey[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallRating: FitnessRatingLevel;
  passed: boolean;
};

export class Group9ValidationError extends Error {}

export function isGroup9Gender(value: unknown): value is Group9Gender {
  return value === "ชาย" || value === "หญิง";
}

/** แปลงแรง (กก.) เป็นอัตราส่วนต่อน้ำหนักตัว (กก./กก.) */
export function toBodyWeightRatio(forceKg: number, weightKg: number): number {
  if (!Number.isFinite(forceKg) || !Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Group9ValidationError("น้ำหนักตัวต้องมากกว่า 0 เพื่อคำนวณอัตราส่วนต่อน้ำหนักตัว");
  }
  return Math.round((forceKg / weightKg) * 100) / 100;
}

export function evaluateGroup9Fitness(inputs: Group9Inputs, gender: Group9Gender): Group9Evaluation {
  const norms = GROUP9_NORMS[gender];
  const items: Group9ResultItem[] = [];
  const missing: Group9TestKey[] = [];

  for (const key of GROUP9_TEST_KEYS) {
    const value = inputs[key];
    if (value === undefined) {
      missing.push(key);
      continue;
    }
    const norm = norms[key];
    if (!Number.isFinite(value) || value < norm.min || value > norm.max) {
      throw new Group9ValidationError(`ค่า ${norm.name} ต้องอยู่ระหว่าง ${norm.min} ถึง ${norm.max} ${norm.unit}`);
    }
    const rating = rateGroup9Value(gender, key, value);
    items.push({
      key,
      name: norm.name,
      unit: norm.unit,
      rawValue: value,
      rating,
      score: levelScore(rating),
      passed: isLevelPassing(rating),
    });
  }

  if (items.length === 0) {
    throw new Group9ValidationError("กรุณาระบุผลทดสอบอย่างน้อย 1 รายการ");
  }

  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const maxScore = items.length * 5;
  const percentage = Math.round((totalScore / maxScore) * 1000) / 10;
  let overallRating: FitnessRatingLevel = "ต่ำมาก";
  if (percentage >= 85) overallRating = "ดีมาก";
  else if (percentage >= 70) overallRating = "ดี";
  else if (percentage >= 50) overallRating = "ปานกลาง";
  else if (percentage >= 35) overallRating = "ต่ำ";

  return {
    gender,
    items,
    missing,
    totalScore,
    maxScore,
    percentage,
    overallRating,
    passed: items.every((item) => item.passed),
  };
}
