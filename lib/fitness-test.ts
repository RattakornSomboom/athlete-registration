// lib/fitness-test.ts
// ฐานข้อมูลและเกณฑ์การประเมินสมรรถภาพทางกายนักกีฬา มหาวิทยาลัยพะเยา
// อ้างอิงตามเอกสารทางการ: "ใบบันทึกการทดสอบสมรรถภาพทางกาย (ชาย/หญิง) หลักสูตรวิทยาศาสตร์การออกกำลังกายและการกีฬา มหาวิทยาลัยพะเยา"
// และ "แบบบันทึกผลการทดสอบสมรรถภาพทางกายนักกีฬาและเกณฑ์การสังเคราะห์พลังงานแบบใช้ออกซิเจนและไม่ใช้ออกซิเจน (RSSA, RAST, Beep Test)"

export const FITNESS_GROUPS = [
  {
    id: 1,
    name: "กลุ่มกีฬาประเภททีมและสนามใหญ่",
    sports: ["ฟุตบอล", "ฟุตซอล", "บาสเกตบอล", "รักบี้ฟุตบอล", "ฮอกกี้", "แฮนด์บอล", "คอร์ฟบอล"],
    tests: {
      "องค์ประกอบทางร่างกาย": ["ปริมาณไขมันในร่างกาย", "ดัชนีมวลกาย (BMI)"],
      "ความอ่อนตัว": ["นั่งงอตัวไปข้างหน้า"],
      "ความแข็งแรงของกล้ามเนื้อ": ["แรงบีบมือที่ถนัด", "แรงเหยียดขา"],
      "พลังกล้ามเนื้อ": ["ยืนกระโดดสูง (Vertical Jump)", "ยืนกระโดดไกล"],
      "ความคล่องแคล่วว่องไว": ["T-Test", "วิ่ง Semo test", "5-10-5 Agility Test"],
      "ความเร็ว": ["วิ่งเร็ว 40 เมตร", "วิ่งสปีด 10/20 เมตร"],
      "สมรรถภาพพลังงานไม่ใช้ออกซิเจน": ["วิ่ง RAST test (6 เที่ยว)"],
      "สมรรถภาพพลังงานใช้ออกซิเจน": ["วิ่ง Beep Test (Multistage Fitness Test)"]
    }
  },
  {
    id: 2,
    name: "กลุ่มกีฬาตาข่ายและคอร์ท",
    sports: ["วอลเลย์บอล", "วอลเลย์บอลชายหาด", "เซปักตะกร้อ", "ตะกร้อลอดห่วง", "ซอฟท์บอล", "กาบัดดี้"],
    tests: {
      "องค์ประกอบทางร่างกาย": ["ปริมาณไขมันในร่างกาย"],
      "ความอ่อนตัว": ["นั่งงอตัวไปข้างหน้า"],
      "ความแข็งแรงของกล้ามเนื้อ": ["แรงบีบมือที่ถนัด", "แรงเหยียดขา", "ลุก-นั่ง 30 วินาที"],
      "พลังกล้ามเนื้อ": ["ยืนกระโดดสูง (Vertical Jump)"],
      "ความคล่องแคล่วว่องไว": ["ก้าวเต้น 20 วินาที", "กระโดด 6 เหลี่ยม"],
      "ความเร็ว": ["วิ่งเร็ว 40 เมตร"],
      "สมรรถภาพพลังงานใช้ออกซิเจน": ["วิ่ง Beep Test / ปั่นจักรยานวัดงาน"]
    }
  },
  {
    id: 3,
    name: "กลุ่มกีฬาแร็กเกตและบุคคล",
    sports: ["เทนนิส", "เทเบิลเทนนิส", "แบดมินตัน", "ลีลาศ", "เชียร์", "สควอช", "ซอฟท์เทนนิส", "พิกเคิลบอล", "จานร่อน", "ปีนหน้าผา"],
    tests: {
      "องค์ประกอบทางร่างกาย": ["ปริมาณไขมันในร่างกาย"],
      "ความอ่อนตัว": ["นั่งงอตัวไปข้างหน้า"],
      "ความแข็งแรงของกล้ามเนื้อ": ["แรงบีบมือที่ถนัด", "แรงเหยียดขา", "ลุก-นั่ง 30 วินาที", "ดันพื้น 30 วินาที"],
      "พลังกล้ามเนื้อ": ["ยืนกระโดดสูง"],
      "ความคล่องแคล่วว่องไว": ["วิ่ง Semo test", "กระโดด 6 เหลี่ยม"],
      "ความเร็ว": ["วิ่งเร็ว 40 เมตร"],
      "สมรรถภาพพลังงานใช้ออกซิเจน": ["วิ่ง Beep Test / ปั่นจักรยานวัดงาน"]
    }
  },
  {
    id: 4,
    name: "กลุ่มกีฬาต่อสู้และศิลปะป้องกันตัว",
    sports: ["เทควันโด", "ยูโด", "คาราเต้", "มวยสากลสมัครเล่น", "มวยไทยสมัครเล่น", "ฟันดาบสากล", "ดาบไทย", "ปันจักสีลัต", "ยูยิตสู", "ฮับกิโด", "คิกบ็อกซิ่ง", "วูซู"],
    tests: {
      "องค์ประกอบทางร่างกาย": ["ปริมาณไขมันในร่างกาย"],
      "ความอ่อนตัว": ["นั่งงอตัวไปข้างหน้า"],
      "ความแข็งแรงของกล้ามเนื้อ": ["แรงบีบมือที่ถนัด", "แรงเหยียดขา", "ลุก-นั่ง 30 วินาที", "ดันพื้น 30 วินาที"],
      "พลังกล้ามเนื้อ": ["ยืนกระโดดสูง", "ทุ่มบอล"],
      "ความคล่องแคล่วว่องไว": ["ก้าวเต้น 20 วินาที", "กระโดด 6 เหลี่ยม"],
      "สมรรถภาพพลังงานไม่ใช้ออกซิเจน": ["วิ่ง RAST test"],
      "สมรรถภาพพลังงานใช้ออกซิเจน": ["วิ่ง Beep Test"]
    }
  },
  {
    id: 5,
    name: "กลุ่มกีฬาความแม่นยำและกลยุทธ์",
    sports: ["เปตอง", "หมากรุกสากล", "บริดจ์", "หมากล้อม", "ยิงปืน", "อีสปอร์ต"],
    tests: {
      "องค์ประกอบทางร่างกาย": ["ปริมาณไขมันในร่างกาย"],
      "ความอ่อนตัว": ["นั่งงอตัวไปข้างหน้า"],
      "ความแข็งแรงของกล้ามเนื้อ": ["แรงบีบมือที่ถนัด", "แรงเหยียดขา"],
      "สมรรถภาพพลังงานใช้ออกซิเจน": ["ปั่นจักรยานวัดงาน / เดิน-วิ่ง 1.5 ไมล์"]
    }
  },
  {
    id: 6,
    name: "กลุ่มกีฬาทางน้ำและพาย",
    sports: ["เรือพาย", "ว่ายน้ำ", "กีฬาทางน้ำ"],
    tests: {
      "องค์ประกอบทางร่างกาย": ["ปริมาณไขมันในร่างกาย"],
      "ความอ่อนตัว": ["นั่งงอตัวไปข้างหน้า"],
      "ความแข็งแรงของกล้ามเนื้อ": ["แรงบีบมือที่ถนัด", "แรงเหยียดขา", "ลุก-นั่ง 30 วินาที", "ดันพื้น 30 วินาที"],
      "พลังกล้ามเนื้อ": ["ยืนกระโดดไกล"],
      "สมรรถภาพพลังงานไม่ใช้ออกซิเจน": ["RAST test / ปั่น Wingate test"],
      "สมรรถภาพพลังงานใช้ออกซิเจน": ["วิ่ง Beep Test"]
    }
  },
  {
    id: 7,
    name: "กลุ่มกรีฑาและวิ่งระยะต่างๆ",
    sports: ["กรีฑา", "วิ่งมินิมาราธอน"],
    tests: {
      "องค์ประกอบทางร่างกาย": ["ปริมาณไขมันในร่างกาย"],
      "ความอ่อนตัว": ["นั่งงอตัวไปข้างหน้า"],
      "ความแข็งแรงของกล้ามเนื้อ": ["แรงบีบมือที่ถนัด", "แรงเหยียดขา", "ลุก-นั่ง 30 วินาที"],
      "พลังกล้ามเนื้อ": ["ยืนกระโดดสูง", "ยืนกระโดดไกล"],
      "ความเร็ว": ["วิ่งเร็ว 40 เมตร"],
      "สมรรถภาพพลังงานไม่ใช้ออกซิเจน": ["RAST test"],
      "สมรรถภาพพลังงานใช้ออกซิเจน": ["วิ่ง Beep Test (Multistage Fitness Test)"]
    }
  }
];

export type NormLevel = "excellent" | "good" | "fair" | "low" | "very_low";

export interface NormEvaluation {
  level: NormLevel;
  label: string;
  isPassing: boolean; // ตามเกณฑ์ ม.พะเยา ต้องได้ระดับ "พอใช้" ขึ้นไป
}

/**
 * เกณฑ์การประเมิน 8 การทดสอบหลัก (อ้างอิงจากใบบันทึกการทดสอบสมรรถภาพ ม.พะเยา อายุ 20-29 ปี)
 */
export function evaluateGripStrength(ratio: number, gender: "ชาย" | "หญิง" = "ชาย"): NormEvaluation {
  if (gender === "ชาย") {
    if (ratio >= 0.84) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (ratio >= 0.79) return { level: "good", label: "ดี", isPassing: true };
    if (ratio >= 0.68) return { level: "fair", label: "พอใช้", isPassing: true };
    if (ratio >= 0.63) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  } else {
    if (ratio >= 0.65) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (ratio >= 0.58) return { level: "good", label: "ดี", isPassing: true };
    if (ratio >= 0.50) return { level: "fair", label: "พอใช้", isPassing: true };
    if (ratio >= 0.44) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  }
}

export function evaluateLegStrength(ratio: number, gender: "ชาย" | "หญิง" = "ชาย"): NormEvaluation {
  if (gender === "ชาย") {
    if (ratio >= 2.81) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (ratio >= 2.58) return { level: "good", label: "ดี", isPassing: true };
    if (ratio >= 2.11) return { level: "fair", label: "พอใช้", isPassing: true };
    if (ratio >= 1.88) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  } else {
    if (ratio >= 2.20) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (ratio >= 1.95) return { level: "good", label: "ดี", isPassing: true };
    if (ratio >= 1.60) return { level: "fair", label: "พอใช้", isPassing: true };
    if (ratio >= 1.35) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  }
}

export function evaluateFlexibility(cm: number, gender: "ชาย" | "หญิง" = "ชาย"): NormEvaluation {
  const bonus = gender === "หญิง" ? 2 : 0;
  if (cm >= 20 + bonus) return { level: "excellent", label: "ดีมาก", isPassing: true };
  if (cm >= 17 + bonus) return { level: "good", label: "ดี", isPassing: true };
  if (cm >= 6 + bonus) return { level: "fair", label: "พอใช้", isPassing: true };
  return { level: "low", label: "ต่ำ", isPassing: false };
}

export function evaluateSitUps30s(count: number, gender: "ชาย" | "หญิง" = "ชาย"): NormEvaluation {
  if (gender === "ชาย") {
    if (count >= 27) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (count >= 23) return { level: "good", label: "ดี", isPassing: true };
    if (count >= 18) return { level: "fair", label: "พอใช้", isPassing: true };
    if (count >= 14) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  } else {
    if (count >= 24) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (count >= 20) return { level: "good", label: "ดี", isPassing: true };
    if (count >= 15) return { level: "fair", label: "พอใช้", isPassing: true };
    if (count >= 11) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  }
}

export function evaluatePushUps30s(count: number, gender: "ชาย" | "หญิง" = "ชาย"): NormEvaluation {
  if (gender === "ชาย") {
    if (count >= 35) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (count >= 31) return { level: "good", label: "ดี", isPassing: true };
    if (count >= 27) return { level: "fair", label: "พอใช้", isPassing: true };
    if (count >= 23) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  } else {
    if (count >= 25) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (count >= 21) return { level: "good", label: "ดี", isPassing: true };
    if (count >= 16) return { level: "fair", label: "พอใช้", isPassing: true };
    if (count >= 12) return { level: "low", label: "ต่ำ", isPassing: false };
    return { level: "very_low", label: "ต่ำมาก", isPassing: false };
  }
}

export function evaluateBeepTest(level: number, gender: "ชาย" | "หญิง" = "ชาย"): NormEvaluation {
  if (gender === "ชาย") {
    if (level >= 11.0) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (level >= 9.5) return { level: "good", label: "ดี", isPassing: true };
    if (level >= 7.5) return { level: "fair", label: "พอใช้", isPassing: true };
    return { level: "low", label: "ต่ำกว่าเกณฑ์", isPassing: false };
  } else {
    if (level >= 9.0) return { level: "excellent", label: "ดีมาก", isPassing: true };
    if (level >= 7.5) return { level: "good", label: "ดี", isPassing: true };
    if (level >= 6.0) return { level: "fair", label: "พอใช้", isPassing: true };
    return { level: "low", label: "ต่ำกว่าเกณฑ์", isPassing: false };
  }
}

export function evaluateSprint40m(seconds: number): NormEvaluation {
  if (seconds <= 5.25) return { level: "excellent", label: "ดีมาก", isPassing: true };
  if (seconds <= 5.55) return { level: "good", label: "ดี", isPassing: true };
  if (seconds <= 6.05) return { level: "fair", label: "พอใช้", isPassing: true };
  return { level: "low", label: "ต่ำ", isPassing: false };
}

export interface AthleteFitnessRecord {
  id: string;
  studentId: string;
  fullName: string;
  gender: "ชาย" | "หญิง";
  faculty: string;
  sportName: string;
  round: "รอบคัดเลือก" | "รอบมหกรรม";
  testDate: string;
  bodyWeightKg: number;
  heightCm: number;
  bmi: number;
  restingPulseBpm: number;
  bloodPressure: string;
  bodyFatPercent: number;
  gripStrengthKg: number;
  gripRatio: number;
  legStrengthKg: number;
  legRatio: number;
  sitAndReachCm: number;
  sitUps30s: number;
  pushUps30s: number;
  sprint40mSec: number;
  beepTestLevel: number;
  beepTestShuttle: number;
  estimatedVo2Max: number;
  rastFatigueIndexPercent?: number;
  overallScore: number; // 0 - 100
  overallGrade: "ดีเยี่ยม" | "ดีมาก" | "ดี" | "ปานกลาง" | "ไม่ผ่านเกณฑ์";
  isEligible: boolean; // ผ่านเกณฑ์เข้าร่วม กกมท.
}

/**
 * ชุดข้อมูลตัวอย่างการทดสอบสมรรถภาพนักกีฬา ม.พะเยา จำลองตามแบบฟอร์มจริง
 */
export const MOCK_FITNESS_RECORDS: AthleteFitnessRecord[] = [
  {
    id: "fit-01",
    studentId: "66027012",
    fullName: "นายสมชาย ใจดี",
    gender: "ชาย",
    faculty: "คณะวิทยาศาสตร์",
    sportName: "ฟุตบอล",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 68,
    heightCm: 175,
    bmi: 22.2,
    restingPulseBpm: 58,
    bloodPressure: "118/76",
    bodyFatPercent: 11.2,
    gripStrengthKg: 58.5,
    gripRatio: 0.86,
    legStrengthKg: 195.0,
    legRatio: 2.87,
    sitAndReachCm: 22.0,
    sitUps30s: 29,
    pushUps30s: 38,
    sprint40mSec: 5.12,
    beepTestLevel: 12.4,
    beepTestShuttle: 6,
    estimatedVo2Max: 54.8,
    rastFatigueIndexPercent: 7.2,
    overallScore: 94,
    overallGrade: "ดีเยี่ยม",
    isEligible: true,
  },
  {
    id: "fit-02",
    studentId: "66028114",
    fullName: "นายกิตติศักดิ์ มั่นคง",
    gender: "ชาย",
    faculty: "คณะวิศวกรรมศาสตร์",
    sportName: "ฟุตบอล",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 72,
    heightCm: 178,
    bmi: 22.7,
    restingPulseBpm: 62,
    bloodPressure: "120/80",
    bodyFatPercent: 12.8,
    gripStrengthKg: 59.0,
    gripRatio: 0.82,
    legStrengthKg: 190.0,
    legRatio: 2.64,
    sitAndReachCm: 18.5,
    sitUps30s: 25,
    pushUps30s: 33,
    sprint40mSec: 5.35,
    beepTestLevel: 10.8,
    beepTestShuttle: 4,
    estimatedVo2Max: 49.6,
    rastFatigueIndexPercent: 8.5,
    overallScore: 86,
    overallGrade: "ดีมาก",
    isEligible: true,
  },
  {
    id: "fit-03",
    studentId: "66045002",
    fullName: "นางสาวนภา ฟ้าใส",
    gender: "หญิง",
    faculty: "คณะศิลปศาสตร์",
    sportName: "วอลเลย์บอล",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 61,
    heightCm: 174,
    bmi: 20.1,
    restingPulseBpm: 64,
    bloodPressure: "115/72",
    bodyFatPercent: 16.5,
    gripStrengthKg: 41.5,
    gripRatio: 0.68,
    legStrengthKg: 135.0,
    legRatio: 2.21,
    sitAndReachCm: 24.5,
    sitUps30s: 26,
    pushUps30s: 24,
    sprint40mSec: 5.62,
    beepTestLevel: 9.6,
    beepTestShuttle: 5,
    estimatedVo2Max: 45.8,
    overallScore: 89,
    overallGrade: "ดีมาก",
    isEligible: true,
  },
  {
    id: "fit-04",
    studentId: "65022119",
    fullName: "นายธนา มั่งมี",
    gender: "ชาย",
    faculty: "คณะวิทยาศาสตร์",
    sportName: "ว่ายน้ำ",
    round: "รอบมหกรรม",
    testDate: "1 ธ.ค. 2569",
    bodyWeightKg: 75,
    heightCm: 182,
    bmi: 22.6,
    restingPulseBpm: 52,
    bloodPressure: "116/74",
    bodyFatPercent: 9.8,
    gripStrengthKg: 66.0,
    gripRatio: 0.88,
    legStrengthKg: 215.0,
    legRatio: 2.87,
    sitAndReachCm: 25.0,
    sitUps30s: 31,
    pushUps30s: 42,
    sprint40mSec: 5.20,
    beepTestLevel: 13.2,
    beepTestShuttle: 8,
    estimatedVo2Max: 57.4,
    overallScore: 96,
    overallGrade: "ดีเยี่ยม",
    isEligible: true,
  },
  {
    id: "fit-05",
    studentId: "66014452",
    fullName: "นางสาวสมหญิง รักดี",
    gender: "หญิง",
    faculty: "คณะศิลปศาสตร์",
    sportName: "บาสเกตบอล",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 58,
    heightCm: 168,
    bmi: 20.5,
    restingPulseBpm: 66,
    bloodPressure: "114/75",
    bodyFatPercent: 17.2,
    gripStrengthKg: 38.0,
    gripRatio: 0.65,
    legStrengthKg: 128.0,
    legRatio: 2.20,
    sitAndReachCm: 21.0,
    sitUps30s: 23,
    pushUps30s: 22,
    sprint40mSec: 5.70,
    beepTestLevel: 9.2,
    beepTestShuttle: 3,
    estimatedVo2Max: 44.5,
    overallScore: 84,
    overallGrade: "ดีมาก",
    isEligible: true,
  },
  {
    id: "fit-06",
    studentId: "65088192",
    fullName: "นายสมศักดิ์ ยืนยง",
    gender: "ชาย",
    faculty: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ",
    sportName: "เปตอง",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 78,
    heightCm: 172,
    bmi: 26.4,
    restingPulseBpm: 70,
    bloodPressure: "125/82",
    bodyFatPercent: 21.4,
    gripStrengthKg: 56.0,
    gripRatio: 0.72,
    legStrengthKg: 175.0,
    legRatio: 2.24,
    sitAndReachCm: 12.0,
    sitUps30s: 20,
    pushUps30s: 28,
    sprint40mSec: 5.92,
    beepTestLevel: 8.0,
    beepTestShuttle: 2,
    estimatedVo2Max: 40.1,
    overallScore: 74,
    overallGrade: "ดี",
    isEligible: true,
  },
  {
    id: "fit-07",
    studentId: "67099411",
    fullName: "นายธนพล ดิจิทัล",
    gender: "ชาย",
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    sportName: "อีสปอร์ต",
    round: "รอบมหกรรม",
    testDate: "1 ธ.ค. 2569",
    bodyWeightKg: 65,
    heightCm: 170,
    bmi: 22.5,
    restingPulseBpm: 74,
    bloodPressure: "122/80",
    bodyFatPercent: 19.5,
    gripStrengthKg: 46.5,
    gripRatio: 0.71,
    legStrengthKg: 145.0,
    legRatio: 2.23,
    sitAndReachCm: 14.0,
    sitUps30s: 19,
    pushUps30s: 26,
    sprint40mSec: 6.00,
    beepTestLevel: 7.8,
    beepTestShuttle: 4,
    estimatedVo2Max: 39.5,
    overallScore: 72,
    overallGrade: "ดี",
    isEligible: true,
  },
  {
    id: "fit-08",
    studentId: "65044129",
    fullName: "นายพชร พยุหะ",
    gender: "ชาย",
    faculty: "คณะศิลปศาสตร์",
    sportName: "ดาบไทย",
    round: "รอบมหกรรม",
    testDate: "1 ธ.ค. 2569",
    bodyWeightKg: 70,
    heightCm: 176,
    bmi: 22.6,
    restingPulseBpm: 60,
    bloodPressure: "118/78",
    bodyFatPercent: 13.4,
    gripStrengthKg: 62.0,
    gripRatio: 0.88,
    legStrengthKg: 198.0,
    legRatio: 2.83,
    sitAndReachCm: 19.0,
    sitUps30s: 28,
    pushUps30s: 36,
    sprint40mSec: 5.30,
    beepTestLevel: 11.2,
    beepTestShuttle: 3,
    estimatedVo2Max: 50.8,
    overallScore: 91,
    overallGrade: "ดีเยี่ยม",
    isEligible: true,
  },
  {
    id: "fit-09",
    studentId: "68019931",
    fullName: "นายชานนท์ เรืองศิลป์",
    gender: "ชาย",
    faculty: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ",
    sportName: "ฟุตบอล",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 64,
    heightCm: 169,
    bmi: 22.4,
    restingPulseBpm: 68,
    bloodPressure: "122/82",
    bodyFatPercent: 15.0,
    gripStrengthKg: 45.0,
    gripRatio: 0.70,
    legStrengthKg: 140.0,
    legRatio: 2.18,
    sitAndReachCm: 11.0,
    sitUps30s: 18,
    pushUps30s: 25,
    sprint40mSec: 5.85,
    beepTestLevel: 7.2,
    beepTestShuttle: 2,
    estimatedVo2Max: 37.8,
    overallScore: 68,
    overallGrade: "ปานกลาง",
    isEligible: true,
  },
  {
    id: "fit-10",
    studentId: "65011982",
    fullName: "นายวรวุฒิ แสงเพชร",
    gender: "ชาย",
    faculty: "คณะนิติศาสตร์",
    sportName: "ฟุตบอล",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 82,
    heightCm: 171,
    bmi: 28.0,
    restingPulseBpm: 82,
    bloodPressure: "135/88",
    bodyFatPercent: 26.2,
    gripStrengthKg: 46.0,
    gripRatio: 0.56,
    legStrengthKg: 135.0,
    legRatio: 1.65,
    sitAndReachCm: 3.0,
    sitUps30s: 12,
    pushUps30s: 18,
    sprint40mSec: 6.45,
    beepTestLevel: 5.5,
    beepTestShuttle: 1,
    estimatedVo2Max: 31.5,
    overallScore: 48,
    overallGrade: "ไม่ผ่านเกณฑ์",
    isEligible: false,
  },
  {
    id: "fit-11",
    studentId: "67011988",
    fullName: "นางสาวกัลยา ศรีรัตน์",
    gender: "หญิง",
    faculty: "คณะสาธารณสุขศาสตร์",
    sportName: "วอลเลย์บอล",
    round: "รอบคัดเลือก",
    testDate: "2 ก.ย. 2569",
    bodyWeightKg: 56,
    heightCm: 170,
    bmi: 19.4,
    restingPulseBpm: 63,
    bloodPressure: "112/70",
    bodyFatPercent: 15.8,
    gripStrengthKg: 39.0,
    gripRatio: 0.70,
    legStrengthKg: 130.0,
    legRatio: 2.32,
    sitAndReachCm: 22.0,
    sitUps30s: 24,
    pushUps30s: 25,
    sprint40mSec: 5.55,
    beepTestLevel: 9.8,
    beepTestShuttle: 4,
    estimatedVo2Max: 46.2,
    overallScore: 88,
    overallGrade: "ดีมาก",
    isEligible: true,
  },
  {
    id: "fit-12",
    studentId: "66077812",
    fullName: "นางสาวพลอยไพลิน แก้วมณี",
    gender: "หญิง",
    faculty: "คณะแพทยศาสตร์",
    sportName: "ว่ายน้ำ",
    round: "รอบมหกรรม",
    testDate: "1 ธ.ค. 2569",
    bodyWeightKg: 55,
    heightCm: 167,
    bmi: 19.7,
    restingPulseBpm: 54,
    bloodPressure: "110/68",
    bodyFatPercent: 14.2,
    gripStrengthKg: 40.5,
    gripRatio: 0.73,
    legStrengthKg: 142.0,
    legRatio: 2.58,
    sitAndReachCm: 26.0,
    sitUps30s: 28,
    pushUps30s: 28,
    sprint40mSec: 5.40,
    beepTestLevel: 11.0,
    beepTestShuttle: 6,
    estimatedVo2Max: 50.4,
    overallScore: 95,
    overallGrade: "ดีเยี่ยม",
    isEligible: true,
  },
];

export interface FitnessSummaryStats {
  totalTested: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  averageScore: number;
  averageBmi: number;
  averageVo2Max: number;
  gradeCounts: {
    excellent: number;
    good: number;
    fair: number;
    failed: number;
  };
  dimensionAverages: {
    strength: number; // 0-100
    endurance: number; // 0-100
    flexibility: number; // 0-100
    speed: number; // 0-100
    aerobic: number; // 0-100
  };
}

export function computeFitnessSummary(records: AthleteFitnessRecord[] = MOCK_FITNESS_RECORDS): FitnessSummaryStats {
  const total = records.length;
  if (total === 0) {
    return {
      totalTested: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 0,
      averageScore: 0,
      averageBmi: 0,
      averageVo2Max: 0,
      gradeCounts: { excellent: 0, good: 0, fair: 0, failed: 0 },
      dimensionAverages: { strength: 0, endurance: 0, flexibility: 0, speed: 0, aerobic: 0 },
    };
  }

  const passedCount = records.filter(r => r.isEligible).length;
  const failedCount = total - passedCount;
  const passRate = (passedCount / total) * 100;
  const averageScore = records.reduce((s, r) => s + r.overallScore, 0) / total;
  const averageBmi = records.reduce((s, r) => s + r.bmi, 0) / total;
  const averageVo2Max = records.reduce((s, r) => s + r.estimatedVo2Max, 0) / total;

  const gradeCounts = {
    excellent: records.filter(r => r.overallGrade === "ดีเยี่ยม").length,
    good: records.filter(r => r.overallGrade === "ดีมาก" || r.overallGrade === "ดี").length,
    fair: records.filter(r => r.overallGrade === "ปานกลาง").length,
    failed: records.filter(r => r.overallGrade === "ไม่ผ่านเกณฑ์").length,
  };

  // คำนวณค่าเฉลี่ย 5 มิติ (แปลงเป็นสเกล 0-100)
  const strength = records.reduce((s, r) => {
    const gripPct = Math.min(100, (r.gripRatio / 0.84) * 100);
    const legPct = Math.min(100, (r.legRatio / 2.81) * 100);
    return s + (gripPct + legPct) / 2;
  }, 0) / total;

  const endurance = records.reduce((s, r) => {
    const sitPct = Math.min(100, (r.sitUps30s / 27) * 100);
    const pushPct = Math.min(100, (r.pushUps30s / 35) * 100);
    return s + (sitPct + pushPct) / 2;
  }, 0) / total;

  const flexibility = records.reduce((s, r) => Math.min(100, Math.max(20, (r.sitAndReachCm / 20) * 100)), 0) / total;

  const speed = records.reduce((s, r) => {
    // 5.00s = 100%, 6.50s = 50%
    const score = Math.max(40, 100 - (r.sprint40mSec - 5.0) * 40);
    return s + score;
  }, 0) / total;

  const aerobic = records.reduce((s, r) => Math.min(100, (r.estimatedVo2Max / 55) * 100), 0) / total;

  return {
    totalTested: total,
    passedCount,
    failedCount,
    passRate,
    averageScore,
    averageBmi,
    averageVo2Max,
    gradeCounts,
    dimensionAverages: {
      strength: Math.round(strength),
      endurance: Math.round(endurance),
      flexibility: Math.round(flexibility),
      speed: Math.round(speed),
      aerobic: Math.round(aerobic),
    },
  };
}
