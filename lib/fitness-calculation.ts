/**
 * Fitness Calculation and Evaluation Engine
 * Based on University of Phayao Sports Science Standards (หลักสูตรวิทยาศาสตร์การออกกำลังกายและการกีฬา ม.พะเยา)
 */

export type FitnessRatingLevel = "ดีมาก" | "ดี" | "ปานกลาง" | "พอใช้" | "ต่ำ" | "ต่ำมาก";

export type AgeGroup = "20-29" | "30-39" | "40-49" | "50-59";

export type GeneralFitnessInputs = {
  age?: number;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number;
  gripStrengthKg?: number;
  vitalCapacityCc?: number;
  standingBroadJumpCm?: number;
  legStrengthKg?: number;
  flexibilityCm?: number;
  sitUps30Sec?: number;
  pushUps30Sec?: number;
};

export type GeneralFitnessResultItem = {
  name: string;
  rawValue: number | null;
  normalizedValue?: number | null;
  unit: string;
  rating: FitnessRatingLevel | null;
  passed: boolean;
};

export type GeneralFitnessEvaluation = {
  items: Record<string, GeneralFitnessResultItem>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallRating: FitnessRatingLevel;
  passed: boolean; // True if no item is "ต่ำ" or "ต่ำมาก"
};

export function getAgeGroup(age: number = 22): AgeGroup {
  if (age >= 50) return "50-59";
  if (age >= 40) return "40-49";
  if (age >= 30) return "30-39";
  return "20-29";
}

/**
 * 1. % Body Fat Rating (Male)
 */
export function rateBodyFat(percent: number): { rating: FitnessRatingLevel; label: string; passed: boolean } {
  if (percent <= 5) return { rating: "ดีมาก", label: "Essential Fat (มีไขมันค่อนข้างน้อย เท่าที่จำเป็น)", passed: true };
  if (percent <= 13) return { rating: "ดีมาก", label: "Athletes (มีไขมันพอประมาณ กลุ่มนักกีฬา)", passed: true };
  if (percent <= 17) return { rating: "ดี", label: "Fitness (มีไขมันพอประมาณ ออกกำลังกายเป็นประจำ)", passed: true };
  if (percent <= 25) return { rating: "พอใช้", label: "Acceptable (มีไขมันพอประมาณ อยู่เกณฑ์พอดี กลุ่มคนทั่วไป)", passed: true };
  return { rating: "ต่ำมาก", label: "Obese (มีไขมันมากเกินไป ควรลดปริมาณไขมัน)", passed: false };
}

/**
 * 2. Grip Strength (กก./นน.ตัว) - Male
 */
export function rateGripStrength(ratio: number, ageGroup: AgeGroup = "20-29"): FitnessRatingLevel {
  const table: Record<AgeGroup, [number, number, number, number]> = {
    "20-29": [0.84, 0.79, 0.68, 0.63],
    "30-39": [0.81, 0.76, 0.65, 0.60],
    "40-49": [0.77, 0.72, 0.61, 0.56],
    "50-59": [0.72, 0.67, 0.56, 0.51],
  };
  const [exc, gd, fr, pr] = table[ageGroup];
  if (ratio >= exc) return "ดีมาก";
  if (ratio >= gd) return "ดี";
  if (ratio >= fr) return "พอใช้";
  if (ratio >= pr) return "ต่ำ";
  return "ต่ำมาก";
}

/**
 * 3. Vital Capacity (ลบ.ซม./นน.ตัว) - Male
 */
export function rateVitalCapacity(ratio: number, ageGroup: AgeGroup = "20-29"): FitnessRatingLevel {
  const table: Record<AgeGroup, [number, number, number, number]> = {
    "20-29": [60.3, 56.1, 47.6, 43.4],
    "30-39": [57.2, 52.5, 43.0, 38.3],
    "40-49": [52.3, 48.1, 39.6, 35.4],
    "50-59": [47.6, 43.4, 34.9, 30.7],
  };
  const [exc, gd, fr, pr] = table[ageGroup];
  if (ratio >= exc) return "ดีมาก";
  if (ratio >= gd) return "ดี";
  if (ratio >= fr) return "พอใช้";
  if (ratio >= pr) return "ต่ำ";
  return "ต่ำมาก";
}

/**
 * 4. Standing Broad Jump (ซม./ส่วนสูง) - Male
 */
export function rateStandingBroadJump(ratio: number, ageGroup: AgeGroup = "20-29"): FitnessRatingLevel {
  const table: Record<AgeGroup, [number, number, number, number]> = {
    "20-29": [1.45, 1.37, 1.20, 1.12],
    "30-39": [1.30, 1.22, 1.05, 0.97],
    "40-49": [1.19, 1.07, 0.82, 0.70],
    "50-59": [1.17, 1.07, 0.86, 0.76],
  };
  const [exc, gd, fr, pr] = table[ageGroup];
  if (ratio >= exc) return "ดีมาก";
  if (ratio >= gd) return "ดี";
  if (ratio >= fr) return "พอใช้";
  if (ratio >= pr) return "ต่ำ";
  return "ต่ำมาก";
}

/**
 * 5. Leg Strength (กก./นน.ตัว) - Male
 */
export function rateLegStrength(ratio: number, ageGroup: AgeGroup = "20-29"): FitnessRatingLevel {
  const table: Record<AgeGroup, [number, number, number, number]> = {
    "20-29": [2.81, 2.58, 2.11, 1.88],
    "30-39": [2.60, 2.04, 1.99, 1.79],
    "40-49": [2.43, 2.23, 1.82, 1.62],
    "50-59": [2.18, 2.00, 1.63, 1.45],
  };
  const [exc, gd, fr, pr] = table[ageGroup];
  if (ratio >= exc) return "ดีมาก";
  if (ratio >= gd) return "ดี";
  if (ratio >= fr) return "พอใช้";
  if (ratio >= pr) return "ต่ำ";
  return "ต่ำมาก";
}

/**
 * 6. Flexibility (ซม.) - Male
 */
export function rateFlexibility(cm: number, ageGroup: AgeGroup = "20-29"): FitnessRatingLevel {
  const table: Record<AgeGroup, [number, number, number, number]> = {
    "20-29": [20, 17, 9, 6],
    "30-39": [19, 15, 6, 2],
    "40-49": [17, 13, 5, 1],
    "50-59": [17, 13, 4, 0],
  };
  const [exc, gd, fr, pr] = table[ageGroup];
  if (cm >= exc) return "ดีมาก";
  if (cm >= gd) return "ดี";
  if (cm >= fr) return "พอใช้";
  if (cm >= pr) return "ต่ำ";
  return "ต่ำมาก";
}

/**
 * 7. Sit-ups 30 sec (ครั้ง) - Male
 */
export function rateSitUps(count: number, ageGroup: AgeGroup = "20-29"): FitnessRatingLevel {
  const table: Record<AgeGroup, [number, number, number, number]> = {
    "20-29": [27, 23, 18, 14],
    "30-39": [24, 20, 15, 11],
    "40-49": [22, 19, 13, 9],
    "50-59": [19, 16, 10, 6],
  };
  const [exc, gd, fr, pr] = table[ageGroup];
  if (count >= exc) return "ดีมาก";
  if (count >= gd) return "ดี";
  if (count >= fr) return "พอใช้";
  if (count >= pr) return "ต่ำ";
  return "ต่ำมาก";
}

/**
 * 8. Push-ups 30 sec (ครั้ง) - Male
 */
export function ratePushUps(count: number, ageGroup: AgeGroup = "20-29"): FitnessRatingLevel {
  const table: Record<AgeGroup, [number, number, number, number]> = {
    "20-29": [35, 31, 27, 23],
    "30-39": [30, 26, 22, 18],
    "40-49": [25, 21, 17, 13],
    "50-59": [20, 16, 12, 8],
  };
  const [exc, gd, fr, pr] = table[ageGroup];
  if (count >= exc) return "ดีมาก";
  if (count >= gd) return "ดี";
  if (count >= fr) return "พอใช้";
  if (count >= pr) return "ต่ำ";
  return "ต่ำมาก";
}

export function levelScore(level: FitnessRatingLevel): number {
  switch (level) {
    case "ดีมาก": return 5;
    case "ดี": return 4;
    case "ปานกลาง":
    case "พอใช้": return 3;
    case "ต่ำ": return 2;
    case "ต่ำมาก": return 1;
  }
}

export function isLevelPassing(level: FitnessRatingLevel): boolean {
  return level === "ดีมาก" || level === "ดี" || level === "ปานกลาง" || level === "พอใช้";
}

/**
 * General 8-item Fitness Evaluation Engine
 */
export function evaluateGeneralFitness(inputs: GeneralFitnessInputs): GeneralFitnessEvaluation {
  const ageGroup = getAgeGroup(inputs.age ?? 21);
  const weight = inputs.weightKg && inputs.weightKg > 0 ? inputs.weightKg : null;
  const height = inputs.heightCm && inputs.heightCm > 0 ? inputs.heightCm : null;

  const items: Record<string, GeneralFitnessResultItem> = {};

  // 1. Body fat
  if (typeof inputs.bodyFatPercent === "number") {
    const bf = rateBodyFat(inputs.bodyFatPercent);
    items.bodyFat = {
      name: "ปริมาณไขมันในร่างกาย",
      rawValue: inputs.bodyFatPercent,
      unit: "%",
      rating: bf.rating,
      passed: bf.passed,
    };
  }

  // 2. Grip strength
  if (typeof inputs.gripStrengthKg === "number" && weight) {
    const ratio = Math.round((inputs.gripStrengthKg / weight) * 100) / 100;
    const rating = rateGripStrength(ratio, ageGroup);
    items.gripStrength = {
      name: "แรงบีบมือ",
      rawValue: inputs.gripStrengthKg,
      normalizedValue: ratio,
      unit: "กก./นน.ตัว",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 3. Vital capacity
  if (typeof inputs.vitalCapacityCc === "number" && weight) {
    const ratio = Math.round((inputs.vitalCapacityCc / weight) * 10) / 10;
    const rating = rateVitalCapacity(ratio, ageGroup);
    items.vitalCapacity = {
      name: "ความจุปอด",
      rawValue: inputs.vitalCapacityCc,
      normalizedValue: ratio,
      unit: "ลบ.ซม./นน.ตัว",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 4. Standing broad jump
  if (typeof inputs.standingBroadJumpCm === "number" && height) {
    const ratio = Math.round((inputs.standingBroadJumpCm / height) * 100) / 100;
    const rating = rateStandingBroadJump(ratio, ageGroup);
    items.standingBroadJump = {
      name: "ยืนกระโดดไกล",
      rawValue: inputs.standingBroadJumpCm,
      normalizedValue: ratio,
      unit: "ซม./ส่วนสูง",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 5. Leg strength
  if (typeof inputs.legStrengthKg === "number" && weight) {
    const ratio = Math.round((inputs.legStrengthKg / weight) * 100) / 100;
    const rating = rateLegStrength(ratio, ageGroup);
    items.legStrength = {
      name: "แรงเหยียดขา",
      rawValue: inputs.legStrengthKg,
      normalizedValue: ratio,
      unit: "กก./นน.ตัว",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 6. Flexibility
  if (typeof inputs.flexibilityCm === "number") {
    const rating = rateFlexibility(inputs.flexibilityCm, ageGroup);
    items.flexibility = {
      name: "ความอ่อนตัว (นั่งงอตัว)",
      rawValue: inputs.flexibilityCm,
      unit: "ซม.",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 7. Sit-ups
  if (typeof inputs.sitUps30Sec === "number") {
    const rating = rateSitUps(inputs.sitUps30Sec, ageGroup);
    items.sitUps = {
      name: "ลุก-นั่ง 30 วินาที",
      rawValue: inputs.sitUps30Sec,
      unit: "ครั้ง",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 8. Push-ups
  if (typeof inputs.pushUps30Sec === "number") {
    const rating = ratePushUps(inputs.pushUps30Sec, ageGroup);
    items.pushUps = {
      name: "ดันพื้น 30 วินาที",
      rawValue: inputs.pushUps30Sec,
      unit: "ครั้ง",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  const ratedItems = Object.values(items).filter((i) => i.rating !== null);
  const totalScore = ratedItems.reduce((acc, curr) => acc + levelScore(curr.rating!), 0);
  const maxScore = Math.max(ratedItems.length * 5, 1);
  const percentage = Math.round((totalScore / maxScore) * 1000) / 10;
  const allPassed = ratedItems.length > 0 && ratedItems.every((i) => i.passed);

  let overallRating: FitnessRatingLevel = "พอใช้";
  if (percentage >= 85) overallRating = "ดีมาก";
  else if (percentage >= 70) overallRating = "ดี";
  else if (percentage >= 50) overallRating = "พอใช้";
  else if (percentage >= 35) overallRating = "ต่ำ";
  else overallRating = "ต่ำมาก";

  return {
    items,
    totalScore,
    maxScore,
    percentage,
    overallRating,
    passed: allPassed,
  };
}

// =================================================================
// Sport-Specific Calculation Helpers (e.g. Football / Team Sports)
// =================================================================

/**
 * Vertical Jump Test
 * diff = jumpReachCm - standingReachCm
 */
export function calcVerticalJump(standingReachCm: number, jumpReachCm: number): {
  standingReachCm: number;
  jumpReachCm: number;
  jumpHeightCm: number;
} {
  const jumpHeightCm = Math.max(0, Math.round((jumpReachCm - standingReachCm) * 10) / 10);
  return {
    standingReachCm,
    jumpReachCm,
    jumpHeightCm,
  };
}

/**
 * Repeated-Shuttle Sprint Ability (RSSA)
 * Runs 1 to 6 (seconds)
 * RSSA decrement = [(RSSA mean / RSSA best) * 100] - 100
 */
export function calcRSSA(runs: number[]): {
  runs: number[];
  rssaBest: number;
  rssaMean: number;
  decrementPercent: number;
} {
  const valid = runs.filter((r) => typeof r === "number" && r > 0);
  if (valid.length === 0) {
    return { runs, rssaBest: 0, rssaMean: 0, decrementPercent: 0 };
  }
  const rssaBest = Math.min(...valid);
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  const rssaMean = Math.round((sum / valid.length) * 1000) / 1000;
  const decrementPercent = Math.round((((rssaMean / rssaBest) * 100) - 100) * 100) / 100;

  return {
    runs: valid,
    rssaBest,
    rssaMean,
    decrementPercent,
  };
}

/**
 * Running-based Anaerobic Sprint Test (RAST)
 * Watts = (weightKg * distanceM^2) / (timeSec^3)
 * Fatigue Index = (maxWatts - minWatts) / totalTimeSec
 * default distance per sprint = 35 meters
 */
export function calcRAST(weightKg: number, timesSec: number[], distanceM: number = 35): {
  powersWatts: number[];
  maxPower: number;
  minPower: number;
  avgPower: number;
  totalTime: number;
  fatigueIndex: number;
} {
  if (!weightKg || weightKg <= 0) {
    throw new Error("น้ำหนักตัวต้องมากกว่า 0 สำหรับการคำนวณ RAST");
  }
  const validTimes = timesSec.filter((t) => typeof t === "number" && t > 0);
  if (validTimes.length === 0) {
    throw new Error("ต้องมีเวลาการวิ่งอย่างน้อย 1 เที่ยว");
  }

  const powersWatts = validTimes.map((t) => {
    const power = (weightKg * Math.pow(distanceM, 2)) / Math.pow(t, 3);
    return Math.round(power * 100) / 100;
  });

  const maxPower = Math.max(...powersWatts);
  const minPower = Math.min(...powersWatts);
  const sumPower = powersWatts.reduce((acc, curr) => acc + curr, 0);
  const avgPower = Math.round((sumPower / powersWatts.length) * 100) / 100;
  const totalTime = Math.round(validTimes.reduce((acc, curr) => acc + curr, 0) * 100) / 100;
  const fatigueIndex = totalTime > 0 ? Math.round(((maxPower - minPower) / totalTime) * 100) / 100 : 0;

  return {
    powersWatts,
    maxPower,
    minPower,
    avgPower,
    totalTime,
    fatigueIndex,
  };
}


// =================================================================
// Football-Specific Fitness Evaluation Engine (เกณฑ์เฉพาะชนิดกีฬาฟุตบอล ม.พะเยา)
// =================================================================

export type FootballFitnessCategory =
  | "ความเร็ว"
  | "ความคล่องแคล่วว่องไว"
  | "พลังกล้ามเนื้อ"
  | "สมรรถภาพแบบไม่ใช้ออกซิเจน"
  | "สมรรถภาพแบบใช้ออกซิเจน";

export type FootballFitnessInputs = {
  // ความเร็ว (Speed)
  sprint10mSec?: number;
  sprint20mSec?: number;
  sprint40mSec?: number;

  // ความคล่องแคล่วว่องไว (Agility)
  tTestSec?: number;
  fafSlalomSec?: number;
  semoTestSec?: number;

  // พลังกล้ามเนื้อ (Muscle Power)
  verticalJumpCm?: number;
  standingBroadJumpCm?: number;

  // สมรรถภาพแบบไม่ใช้ออกซิเจน (Anaerobic)
  rssaBestSec?: number;
  rssaMeanSec?: number;
  rssaDecrementPercent?: number;
  rastMaxPowerWatts?: number;
  rastMinPowerWatts?: number;
  rastAvgPowerWatts?: number;
  rastFatigueIndex?: number;

  // สมรรถภาพแบบใช้ออกซิเจน (Aerobic)
  vo2maxMlKgMin?: number;
};

export type FootballFitnessResultItem = {
  name: string;
  category: FootballFitnessCategory;
  rawValue: number | null;
  unit: string;
  rating: FitnessRatingLevel | null;
  passed: boolean;
};

export type FootballFitnessEvaluation = {
  sport: "ฟุตบอล";
  items: Record<string, FootballFitnessResultItem>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallRating: FitnessRatingLevel;
  passed: boolean;
};

export function rateFootballLowerIsBetter(
  val: number,
  thresholds: [number, number, number, number] // [excMax, goodMax, modMax, lowMax]
): FitnessRatingLevel {
  const [excMax, goodMax, modMax, lowMax] = thresholds;
  if (val < excMax) return "ดีมาก";
  if (val <= goodMax) return "ดี";
  if (val <= modMax) return "ปานกลาง";
  if (val <= lowMax) return "ต่ำ";
  return "ต่ำมาก";
}

export function rateFootballHigherIsBetter(
  val: number,
  thresholds: [number, number, number, number] // [excMin, goodMin, modMin, lowMin]
): FitnessRatingLevel {
  const [excMin, goodMin, modMin, lowMin] = thresholds;
  if (val > excMin) return "ดีมาก";
  if (val >= goodMin) return "ดี";
  if (val >= modMin) return "ปานกลาง";
  if (val >= lowMin) return "ต่ำ";
  return "ต่ำมาก";
}

/**
 * Football-specific Fitness Evaluation Engine (เกณฑ์มาตรฐานเฉพาะชนิดกีฬาฟุตบอล ม.พะเยา)
 */
export function evaluateFootballFitness(inputs: FootballFitnessInputs): FootballFitnessEvaluation {
  const items: Record<string, FootballFitnessResultItem> = {};

  // 1. ความเร็ว (Speed)
  if (typeof inputs.sprint10mSec === "number" && inputs.sprint10mSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.sprint10mSec, [1.61, 1.67, 1.75, 1.83]);
    items.sprint10m = {
      name: "วิ่ง 10 เมตร",
      category: "ความเร็ว",
      rawValue: inputs.sprint10mSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.sprint20mSec === "number" && inputs.sprint20mSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.sprint20mSec, [2.81, 2.89, 2.99, 3.09]);
    items.sprint20m = {
      name: "วิ่ง 20 เมตร",
      category: "ความเร็ว",
      rawValue: inputs.sprint20mSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.sprint40mSec === "number" && inputs.sprint40mSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.sprint40mSec, [5.07, 5.22, 5.39, 5.56]);
    items.sprint40m = {
      name: "วิ่ง 40 เมตร",
      category: "ความเร็ว",
      rawValue: inputs.sprint40mSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 2. ความคล่องแคล่วว่องไว (Agility)
  if (typeof inputs.tTestSec === "number" && inputs.tTestSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.tTestSec, [9.01, 9.50, 9.99, 10.49]);
    items.tTest = {
      name: "T-Test",
      category: "ความคล่องแคล่วว่องไว",
      rawValue: inputs.tTestSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.fafSlalomSec === "number" && inputs.fafSlalomSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.fafSlalomSec, [7.84, 8.34, 8.86, 9.38]);
    items.fafSlalom = {
      name: "FAF's Slalom test",
      category: "ความคล่องแคล่วว่องไว",
      rawValue: inputs.fafSlalomSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.semoTestSec === "number" && inputs.semoTestSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.semoTestSec, [11.31, 11.81, 12.32, 12.83]);
    items.semoTest = {
      name: "Semo test",
      category: "ความคล่องแคล่วว่องไว",
      rawValue: inputs.semoTestSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 3. พลังกล้ามเนื้อ (Muscle Power)
  if (typeof inputs.verticalJumpCm === "number" && inputs.verticalJumpCm > 0) {
    const rating = rateFootballHigherIsBetter(inputs.verticalJumpCm, [62.0, 56.9, 51.6, 46.4]);
    items.verticalJump = {
      name: "Vertical jump test",
      category: "พลังกล้ามเนื้อ",
      rawValue: inputs.verticalJumpCm,
      unit: "ซม.",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.standingBroadJumpCm === "number" && inputs.standingBroadJumpCm > 0) {
    const rating = rateFootballHigherIsBetter(inputs.standingBroadJumpCm, [264.0, 252.1, 239.1, 227.0]);
    items.standingBroadJump = {
      name: "Standing broad jump",
      category: "พลังกล้ามเนื้อ",
      rawValue: inputs.standingBroadJumpCm,
      unit: "ซม.",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 4. สมรรถภาพแบบไม่ใช้ออกซิเจน (Anaerobic)
  if (typeof inputs.rssaBestSec === "number" && inputs.rssaBestSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.rssaBestSec, [5.55, 5.69, 5.85, 6.00]);
    items.rssaBest = {
      name: "RSSA Best time",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rssaBestSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rssaMeanSec === "number" && inputs.rssaMeanSec > 0) {
    const rating = rateFootballLowerIsBetter(inputs.rssaMeanSec, [5.73, 5.89, 6.05, 6.22]);
    items.rssaMean = {
      name: "RSSA Mean time",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rssaMeanSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rssaDecrementPercent === "number" && inputs.rssaDecrementPercent >= 0) {
    const rating = rateFootballLowerIsBetter(inputs.rssaDecrementPercent, [3.10, 4.09, 5.10, 6.00]);
    items.rssaDecrement = {
      name: "RSSA Decrement",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rssaDecrementPercent,
      unit: "%",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastMaxPowerWatts === "number" && inputs.rastMaxPowerWatts > 0) {
    const rating = rateFootballHigherIsBetter(inputs.rastMaxPowerWatts, [817.7, 715.1, 612.4, 509.8]);
    items.rastMaxPower = {
      name: "RAST Max Power",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastMaxPowerWatts,
      unit: "วัตต์ (W)",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastMinPowerWatts === "number" && inputs.rastMinPowerWatts > 0) {
    const rating = rateFootballHigherIsBetter(inputs.rastMinPowerWatts, [527.2, 458.7, 390.0, 321.4]);
    items.rastMinPower = {
      name: "RAST Min Power",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastMinPowerWatts,
      unit: "วัตต์ (W)",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastAvgPowerWatts === "number" && inputs.rastAvgPowerWatts > 0) {
    const rating = rateFootballHigherIsBetter(inputs.rastAvgPowerWatts, [673.5, 593.7, 513.7, 433.8]);
    items.rastAvgPower = {
      name: "RAST Avg Power",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastAvgPowerWatts,
      unit: "วัตต์ (W)",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastFatigueIndex === "number" && inputs.rastFatigueIndex >= 0) {
    const rating = rateFootballLowerIsBetter(inputs.rastFatigueIndex, [7.65, 10.95, 14.27, 17.58]);
    items.rastFatigueIndex = {
      name: "RAST Fatigue Index",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastFatigueIndex,
      unit: "W/s",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 5. สมรรถภาพแบบใช้ออกซิเจน (Aerobic)
  if (typeof inputs.vo2maxMlKgMin === "number" && inputs.vo2maxMlKgMin > 0) {
    const rating = rateFootballHigherIsBetter(inputs.vo2maxMlKgMin, [59.3, 54.6, 49.7, 45.4]);
    items.vo2max = {
      name: "VO2max",
      category: "สมรรถภาพแบบใช้ออกซิเจน",
      rawValue: inputs.vo2maxMlKgMin,
      unit: "มล./กก./นาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  const ratedItems = Object.values(items).filter((i) => i.rating !== null);
  const totalScore = ratedItems.reduce((acc, curr) => acc + levelScore(curr.rating!), 0);
  const maxScore = Math.max(ratedItems.length * 5, 1);
  const percentage = Math.round((totalScore / maxScore) * 1000) / 10;
  const allPassed = ratedItems.length > 0 && ratedItems.every((i) => i.passed);

  let overallRating: FitnessRatingLevel = "ปานกลาง";
  if (percentage >= 85) overallRating = "ดีมาก";
  else if (percentage >= 70) overallRating = "ดี";
  else if (percentage >= 50) overallRating = "ปานกลาง";
  else if (percentage >= 35) overallRating = "ต่ำ";
  else overallRating = "ต่ำมาก";

  return {
    sport: "ฟุตบอล",
    items,
    totalScore,
    maxScore,
    percentage,
    overallRating,
    passed: allPassed,
  };
}


// =================================================================
// Basketball-specific Fitness Evaluation (เกณฑ์มาตรฐานเฉพาะชนิดกีฬาบาสเกตบอล ม.พะเยา)
// =================================================================

export type BasketballFitnessCategory =
  | "ความเร็ว"
  | "ความคล่องแคล่วว่องไว"
  | "พลังกล้ามเนื้อ"
  | "สมรรถภาพแบบไม่ใช้ออกซิเจน"
  | "สมรรถภาพแบบใช้ออกซิเจน";

export type BasketballFitnessInputs = {
  // ความเร็ว (Speed)
  sprint10mSec?: number;
  sprint20mSec?: number;

  // ความคล่องแคล่วว่องไว (Agility)
  tTestSec?: number;
  edgrenSideStepCount?: number;
  semoTestSec?: number;

  // พลังกล้ามเนื้อ (Muscle Power)
  verticalJumpCm?: number;
  standingBroadJumpCm?: number;
  medicineBallTossM?: number;

  // สมรรถภาพแบบไม่ใช้ออกซิเจน (Anaerobic)
  rssaBestSec?: number;
  rssaMeanSec?: number;
  rssaDecrementPercent?: number;
  rastMaxPowerWatts?: number;
  rastMinPowerWatts?: number;
  rastAvgPowerWatts?: number;
  rastFatigueIndex?: number;

  // สมรรถภาพแบบใช้ออกซิเจน (Aerobic)
  vo2maxMlKgMin?: number;
};

export type BasketballFitnessResultItem = {
  name: string;
  category: BasketballFitnessCategory;
  rawValue: number | null;
  unit: string;
  rating: FitnessRatingLevel | null;
  passed: boolean;
};

export type BasketballFitnessEvaluation = {
  sport: "บาสเกตบอล";
  items: Record<string, BasketballFitnessResultItem>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallRating: FitnessRatingLevel;
  passed: boolean;
};

export const rateBasketballLowerIsBetter = rateFootballLowerIsBetter;
export const rateBasketballHigherIsBetter = rateFootballHigherIsBetter;

/**
 * Basketball-specific Fitness Evaluation Engine (เกณฑ์มาตรฐานเฉพาะชนิดกีฬาบาสเกตบอล ม.พะเยา)
 */
export function evaluateBasketballFitness(inputs: BasketballFitnessInputs): BasketballFitnessEvaluation {
  const items: Record<string, BasketballFitnessResultItem> = {};

  // 1. ด้านความเร็ว (Speed)
  if (typeof inputs.sprint10mSec === "number" && inputs.sprint10mSec > 0) {
    const rating = rateBasketballLowerIsBetter(inputs.sprint10mSec, [1.62, 1.68, 1.76, 1.84]);
    items.sprint10m = {
      name: "วิ่ง 10 เมตร",
      category: "ความเร็ว",
      rawValue: inputs.sprint10mSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.sprint20mSec === "number" && inputs.sprint20mSec > 0) {
    const rating = rateBasketballLowerIsBetter(inputs.sprint20mSec, [2.82, 2.90, 3.00, 3.10]);
    items.sprint20m = {
      name: "วิ่ง 20 เมตร",
      category: "ความเร็ว",
      rawValue: inputs.sprint20mSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 2. ด้านความคล่องแคล่วว่องไว (Agility)
  if (typeof inputs.tTestSec === "number" && inputs.tTestSec > 0) {
    const rating = rateBasketballLowerIsBetter(inputs.tTestSec, [9.05, 9.55, 10.05, 10.55]);
    items.tTest = {
      name: "T-Test",
      category: "ความคล่องแคล่วว่องไว",
      rawValue: inputs.tTestSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.edgrenSideStepCount === "number" && inputs.edgrenSideStepCount >= 0) {
    const rating = rateBasketballHigherIsBetter(inputs.edgrenSideStepCount, [41, 37, 32, 27]);
    items.edgrenSideStep = {
      name: "Edgren Side Step test",
      category: "ความคล่องแคล่วว่องไว",
      rawValue: inputs.edgrenSideStepCount,
      unit: "ครั้ง",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.semoTestSec === "number" && inputs.semoTestSec > 0) {
    const rating = rateBasketballLowerIsBetter(inputs.semoTestSec, [11.35, 11.85, 12.35, 12.85]);
    items.semoTest = {
      name: "Semo test",
      category: "ความคล่องแคล่วว่องไว",
      rawValue: inputs.semoTestSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 3. ด้านพลังกล้ามเนื้อ (Muscle Power)
  if (typeof inputs.verticalJumpCm === "number" && inputs.verticalJumpCm > 0) {
    const rating = rateBasketballHigherIsBetter(inputs.verticalJumpCm, [60.5, 55.4, 50.1, 44.9]);
    items.verticalJump = {
      name: "Vertical jump test",
      category: "พลังกล้ามเนื้อ",
      rawValue: inputs.verticalJumpCm,
      unit: "ซม.",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.standingBroadJumpCm === "number" && inputs.standingBroadJumpCm > 0) {
    const rating = rateBasketballHigherIsBetter(inputs.standingBroadJumpCm, [260.0, 248.1, 235.1, 223.0]);
    items.standingBroadJump = {
      name: "Standing broad jump",
      category: "พลังกล้ามเนื้อ",
      rawValue: inputs.standingBroadJumpCm,
      unit: "ซม.",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.medicineBallTossM === "number" && inputs.medicineBallTossM > 0) {
    const rating = rateBasketballHigherIsBetter(inputs.medicineBallTossM, [6.10, 5.61, 5.10, 4.60]);
    items.medicineBallToss = {
      name: "Seated Medicine Ball Toss (ลูกบอล 3 กก.)",
      category: "พลังกล้ามเนื้อ",
      rawValue: inputs.medicineBallTossM,
      unit: "เมตร",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 4. ด้านสมรรถภาพแบบไม่ใช้ออกซิเจน (Anaerobic)
  if (typeof inputs.rssaBestSec === "number" && inputs.rssaBestSec > 0) {
    const rating = rateBasketballLowerIsBetter(inputs.rssaBestSec, [5.60, 5.75, 5.90, 6.05]);
    items.rssaBest = {
      name: "RSSA Best time",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rssaBestSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rssaMeanSec === "number" && inputs.rssaMeanSec > 0) {
    const rating = rateBasketballLowerIsBetter(inputs.rssaMeanSec, [5.78, 5.95, 6.10, 6.28]);
    items.rssaMean = {
      name: "RSSA Mean time",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rssaMeanSec,
      unit: "วินาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rssaDecrementPercent === "number" && inputs.rssaDecrementPercent >= 0) {
    const rating = rateBasketballLowerIsBetter(inputs.rssaDecrementPercent, [3.15, 4.15, 5.15, 6.05]);
    items.rssaDecrement = {
      name: "RSSA Decrement",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rssaDecrementPercent,
      unit: "%",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastMaxPowerWatts === "number" && inputs.rastMaxPowerWatts > 0) {
    const rating = rateBasketballHigherIsBetter(inputs.rastMaxPowerWatts, [805.0, 702.5, 600.0, 497.5]);
    items.rastMaxPower = {
      name: "RAST Max Power",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastMaxPowerWatts,
      unit: "วัตต์ (W)",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastMinPowerWatts === "number" && inputs.rastMinPowerWatts > 0) {
    const rating = rateBasketballHigherIsBetter(inputs.rastMinPowerWatts, [515.0, 446.5, 378.0, 309.5]);
    items.rastMinPower = {
      name: "RAST Min Power",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastMinPowerWatts,
      unit: "วัตต์ (W)",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastAvgPowerWatts === "number" && inputs.rastAvgPowerWatts > 0) {
    const rating = rateBasketballHigherIsBetter(inputs.rastAvgPowerWatts, [660.0, 580.0, 500.0, 420.0]);
    items.rastAvgPower = {
      name: "RAST Avg Power",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastAvgPowerWatts,
      unit: "วัตต์ (W)",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  if (typeof inputs.rastFatigueIndex === "number" && inputs.rastFatigueIndex >= 0) {
    const rating = rateBasketballLowerIsBetter(inputs.rastFatigueIndex, [7.80, 11.20, 14.60, 18.00]);
    items.rastFatigueIndex = {
      name: "RAST Fatigue Index",
      category: "สมรรถภาพแบบไม่ใช้ออกซิเจน",
      rawValue: inputs.rastFatigueIndex,
      unit: "W/s",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  // 5. ด้านสมรรถภาพแบบใช้ออกซิเจน (Aerobic)
  if (typeof inputs.vo2maxMlKgMin === "number" && inputs.vo2maxMlKgMin > 0) {
    const rating = rateBasketballHigherIsBetter(inputs.vo2maxMlKgMin, [58.0, 53.0, 48.0, 43.5]);
    items.vo2max = {
      name: "VO2max",
      category: "สมรรถภาพแบบใช้ออกซิเจน",
      rawValue: inputs.vo2maxMlKgMin,
      unit: "มล./กก./นาที",
      rating,
      passed: isLevelPassing(rating),
    };
  }

  const ratedItems = Object.values(items).filter((i) => i.rating !== null);
  const totalScore = ratedItems.reduce((acc, curr) => acc + levelScore(curr.rating!), 0);
  const maxScore = Math.max(ratedItems.length * 5, 1);
  const percentage = Math.round((totalScore / maxScore) * 1000) / 10;
  const allPassed = ratedItems.length > 0 && ratedItems.every((i) => i.passed);

  let overallRating: FitnessRatingLevel = "ปานกลาง";
  if (percentage >= 85) overallRating = "ดีมาก";
  else if (percentage >= 70) overallRating = "ดี";
  else if (percentage >= 50) overallRating = "ปานกลาง";
  else if (percentage >= 35) overallRating = "ต่ำ";
  else overallRating = "ต่ำมาก";

  return {
    sport: "บาสเกตบอล",
    items,
    totalScore,
    maxScore,
    percentage,
    overallRating,
    passed: allPassed,
  };
}
