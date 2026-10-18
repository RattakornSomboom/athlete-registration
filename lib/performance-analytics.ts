export const FITNESS_RATING_SCORES = {
  "ดีมาก": 100,
  "ดี": 80,
  "ปานกลาง": 60,
  "พอใช้": 40,
  "ต่ำ": 20,
  "ต่ำมาก": 0,
} as const;

export type FitnessRating = keyof typeof FITNESS_RATING_SCORES;

export const STANDARD_SEVEN_STATIONS = [
  "ความอ่อนตัว (Sit & Reach)",
  "ความแข็งแรง (Grip Strength)",
  "แรงระเบิดกล้ามเนื้อ (Leg Power)",
  "ความคล่องแคล่วว่องไว (Agility)",
  "ความเร็วสปีด (40m Sprint)",
  "ความอดทนระบบหายใจ (Aerobic / Beep Test)",
  "องค์ประกอบร่างกาย (Body Composition)",
] as const;

export type StandardStationName = typeof STANDARD_SEVEN_STATIONS[number];

export type SportFitnessStation = {
  name: string;
  keys: readonly string[];
};

const SPRINT_STATION: SportFitnessStation = {
  name: "ความเร็วและอัตราเร่ง (วิ่ง 40 เมตร)",
  keys: ["sprint40mSec", "40m Sprint", "วิ่ง 40 เมตร", "ความเร็ว (40m Sprint)", "ความเร็วสปีด (40m Sprint)", "ความเร็ว", "speed"],
};
const LEG_POWER_STATION: SportFitnessStation = {
  name: "แรงระเบิดกล้ามเนื้อ (Leg Power)",
  keys: ["Leg Power", "explosive", "แรงระเบิด", "พลังกล้ามเนื้อ"],
};
const FLEXIBILITY_STATION: SportFitnessStation = {
  name: "ความอ่อนตัว (Sit & Reach)",
  keys: ["sitAndReachCm", "Sit and Reach", "sit-and-reach", "นั่งงอตัว", "นั่งงอตัวไปข้างหน้า", "ความอ่อนตัว", "flexibility"],
};
const GRIP_STATION: SportFitnessStation = {
  name: "ความแข็งแรง (Grip Strength)",
  keys: ["Grip Strength", "grip", "แรงบีบมือ", "ความแข็งแรง", "strength"],
};
const AEROBIC_STATION: SportFitnessStation = {
  name: "ความอดทนระบบหายใจ (Aerobic / Beep Test)",
  keys: ["endurance", "aerobic", "beep test", "ความอดทน", "ความอดทน (Beep test)"],
};
const BODY_STATION: SportFitnessStation = {
  name: "องค์ประกอบร่างกาย (Body Composition)",
  keys: ["Body Composition", "องค์ประกอบร่างกาย", "องค์ประกอบทางร่างกาย"],
};
const ATHLETICS_FITNESS_STATIONS: readonly SportFitnessStation[] = [
  SPRINT_STATION,
  LEG_POWER_STATION,
  { name: "ความคล่องแคล่วว่องไว (Agility)", keys: ["agility", "semo", "ความคล่องแคล่ว", "ความคล่องแคล่วว่องไว"] },
  FLEXIBILITY_STATION,
  GRIP_STATION,
  AEROBIC_STATION,
  BODY_STATION,
];
const AQUATICS_FITNESS_STATIONS: readonly SportFitnessStation[] = [
  GRIP_STATION,
  { name: "ดันพื้น 1 นาที (Push-ups)", keys: ["pushUps1Min", "ดันพื้น 1 นาที"] },
  { name: "ลุก-นั่ง 1 นาที (Sit-ups)", keys: ["sitUps1Min", "ลุก-นั่ง 1 นาที"] },
  LEG_POWER_STATION,
  FLEXIBILITY_STATION,
  { name: "นอนแอ่นหลัง (Back Extension)", keys: ["backExtensionCm", "นอนแอ่นหลัง", "Back Extension"] },
  AEROBIC_STATION,
  BODY_STATION,
];

// สถานีที่วัดสิ่งเดียวกับรายการแข่ง (เช่น วิ่ง 40 เมตรในชุดทดสอบ vs เวลาแข่ง 40 เมตร) ความสัมพันธ์จะสูงโดยอัตโนมัติ
export const RACE_PROXY_STATION_NAMES: Record<string, readonly string[]> = {
  "กรีฑา": [SPRINT_STATION.name],
};

export function getSportFitnessStations(sport: string): readonly SportFitnessStation[] {
  return sport === "กีฬาทางน้ำ" || sport === "ว่ายน้ำ" ? AQUATICS_FITNESS_STATIONS : ATHLETICS_FITNESS_STATIONS;
}

export function getSportFitnessLabel(sport: string): string {
  return sport === "กีฬาทางน้ำ" || sport === "ว่ายน้ำ" ? "กีฬาทางน้ำ / ว่ายน้ำ" : "กรีฑา";
}

export type AthletePerformanceInput = {
  applicationId: string;
  studentId: string;
  athleteName: string;
  sport: string;
  fitness: {
    totalScore: number | null;
    ratings: Record<string, FitnessRating>;
    testedAt: Date | null;
  } | null;
  benchmarkTargetScore?: number | null;
  matchResult: {
    score: number | null;
    timeSeconds: number | null;
    rank: number | null;
    outcome: string | null;
    isWinner: boolean;
    staffNotes: string | null;
    targetTimeSeconds?: number | null;
  } | null;
};

export type GapMetrics = {
  fitnessScoreGap: number; // Gap เทียบกับเกณฑ์มาตรฐาน 80% (คะแนนระดับ "ดี")
  timeGapSeconds: number | null; // Gap เวลาที่ทำได้จริง เทียบกับเวลาเป้าหมาย (ค่าบวก = ช้ากว่าเป้า)
  stationGaps: Record<string, number>; // Gap รายสถานีเทียบกับ 80 คะแนน
};

export type ExcellenceInsight = {
  performanceIndex: number;
  strengths: string[];
  weaknesses: string[];
  ruleRecommendations: string[];
  actionPlan: string;
  gaps: GapMetrics;
};

export type PerformanceAnalysis = ExcellenceInsight & {
  fitnessAverage: number | null;
  competitionScore: number | null;
  standardStations: { name: string; rating: FitnessRating; score: number }[];
};

export type FollowUpRetest = {
  id?: string;
  testedAt: string | null;
  weeksAfterBaseline: number;
  totalScore: number | null;
  ratings: Record<string, FitnessRating>;
  timeSeconds: number | null;
  targetTimeSeconds?: number | null;
  trainingPlan: string[];
  notes?: string | null;
  recordedBy?: string | null;
};

export type StationChange = {
  name: string;
  beforeRating: FitnessRating;
  afterRating: FitnessRating;
  beforeScore: number;
  afterScore: number;
  delta: number;
};

// Smallest Worthwhile Change (SWC): การเปลี่ยนแปลงที่น้อยกว่าเกณฑ์นี้ถือว่าอยู่ในช่วงคลาดเคลื่อนของการวัด
export const FOLLOW_UP_SWC = {
  timeMinSeconds: 0.1, // ความคลาดเคลื่อนโดยประมาณของการจับเวลาด้วยมือ
  timeRelative: 0.005, // 0.5% ของเวลาเดิม ใช้เมื่อมากกว่า timeMinSeconds (เช่น ว่ายน้ำ 27.5s → 0.14s)
  fitnessPoints: 3, // มากกว่าการขยับ 1 ระดับของสถานีเดียวในชุด 7 สถานี (~2.9 คะแนน)
} as const;

export type MetricChange = "IMPROVED" | "WITHIN_SWC" | "DECLINED";

export type FollowUpComparison = {
  status: "IMPROVED" | "NO_CHANGE" | "DECLINED";
  fitnessAverageBefore: number | null;
  fitnessAverageAfter: number | null;
  fitnessDelta: number | null;
  fitnessChange: MetricChange | null;
  timeBefore: number | null;
  timeAfter: number | null;
  timeDeltaSeconds: number | null; // ค่าลบ = เร็วขึ้นกว่าเดิม
  timeChange: MetricChange | null;
  swc: { timeSeconds: number | null; fitnessPoints: number };
  remainingGapSeconds: number | null; // ค่าบวก = ยังช้ากว่าเป้าหมาย
  stationChanges: StationChange[];
  improvedStations: string[];
  remainingWeaknesses: string[];
  summary: string;
};

const ENDURANCE_KEYS = ["endurance", "aerobic", "multistage", "beep test", "ความอดทน"];
const SPEED_KEYS = ["speed", "sprint", "40m sprint", "40 เมตร", "ความเร็ว"];
const EXPLOSIVE_KEYS = ["explosive", "leg extension", "power", "แรงระเบิด", "พลังกล้ามเนื้อ"];
const FLEXIBILITY_KEYS = ["flexibility", "sit and reach", "sit-and-reach", "นั่งงอตัว", "ความอ่อนตัว"];

export const EXCELLENCE_PILOT_SPORTS = ["กรีฑา", "กีฬาทางน้ำ"] as const;
export type ExcellencePilotSport = typeof EXCELLENCE_PILOT_SPORTS[number];

export const DEFAULT_SPORT_BENCHMARKS: Record<string, { targetTimeSeconds: number; targetScore: number }> = {
  "กรีฑา": { targetTimeSeconds: 5.2, targetScore: 85 },
  "กีฬาทางน้ำ": { targetTimeSeconds: 27.5, targetScore: 85 },
  "ว่ายน้ำ": { targetTimeSeconds: 27.5, targetScore: 85 },
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_()./-]+/g, "");
}

export function findRating(ratings: Record<string, FitnessRating>, keys: string[]): FitnessRating | null {
  const entries = Object.entries(ratings);
  const match = entries.find(([key]) => {
    const normalizedKey = normalizeKey(key);
    return keys.some(candidate => {
      const normalizedCandidate = normalizeKey(candidate);
      return normalizedKey === normalizedCandidate || normalizedKey.includes(normalizedCandidate);
    });
  });
  return match?.[1] ?? null;
}

export function ratingScore(rating: FitnessRating | null): number | null {
  return rating ? FITNESS_RATING_SCORES[rating] : null;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function isSuccessfulResult(input: AthletePerformanceInput): boolean {
  const result = input.matchResult;
  return Boolean(result && (result.isWinner || result.rank === 1 || result.outcome === "WIN" || result.outcome === "PODIUM"));
}

export function calculateFitnessAverage(input: AthletePerformanceInput): number | null {
  if (!input.fitness) return null;
  const stationScores = Object.values(input.fitness.ratings).map(rating => ratingScore(rating));
  const ratingAverage = average(stationScores.filter((score): score is number => score !== null));
  const totalScore = input.fitness.totalScore === null ? null : clamp(input.fitness.totalScore);

  if (ratingAverage === null) return totalScore;
  if (totalScore === null) return ratingAverage;
  return Math.round((ratingAverage + totalScore) / 2);
}

export function calculateCompetitionScore(input: AthletePerformanceInput): number | null {
  const result = input.matchResult;
  if (!result) return null;

  const components: number[] = [];
  if (result.rank !== null && result.rank >= 1) {
    components.push(result.rank === 1 ? 100 : result.rank === 2 ? 90 : result.rank === 3 ? 80 : 60);
  }
  if (result.isWinner || result.outcome === "WIN") components.push(100);
  else if (result.outcome === "PODIUM") components.push(85);
  else if (result.outcome === "LOSS") components.push(40);
  if (result.score !== null) components.push(clamp(result.score));

  return average(components);
}

export function calculateGapMetrics(input: AthletePerformanceInput, fitnessAverage: number | null): GapMetrics {
  const benchmarkFitness = input.benchmarkTargetScore ?? 80;
  const fitnessScoreGap = fitnessAverage !== null ? Math.round((benchmarkFitness - fitnessAverage) * 10) / 10 : 0;

  const ratings = input.fitness?.ratings ?? {};
  const stationGaps: Record<string, number> = {};
  for (const [station, rating] of Object.entries(ratings)) {
    const score = ratingScore(rating) ?? 0;
    stationGaps[station] = Math.round((benchmarkFitness - score) * 10) / 10;
  }

  let timeGapSeconds: number | null = null;
  if (input.matchResult && input.matchResult.timeSeconds !== null && input.matchResult.timeSeconds !== undefined) {
    const benchmarkTime = input.matchResult.targetTimeSeconds ?? DEFAULT_SPORT_BENCHMARKS[input.sport]?.targetTimeSeconds ?? 5.2;
    timeGapSeconds = Math.round((input.matchResult.timeSeconds - benchmarkTime) * 100) / 100;
  }

  return {
    fitnessScoreGap,
    timeGapSeconds,
    stationGaps,
  };
}

export function mapToStandardSevenStations(ratings: Record<string, FitnessRating>): { name: StandardStationName; rating: FitnessRating; score: number }[] {
  const mappings: { name: StandardStationName; keys: string[] }[] = [
    { name: "ความอ่อนตัว (Sit & Reach)", keys: FLEXIBILITY_KEYS },
    { name: "ความแข็งแรง (Grip Strength)", keys: ["strength", "grip", "แรงบีบมือ", "ความแข็งแรง"] },
    { name: "แรงระเบิดกล้ามเนื้อ (Leg Power)", keys: EXPLOSIVE_KEYS },
    { name: "ความคล่องแคล่วว่องไว (Agility)", keys: ["agility", "semo", "ว่องไว", "ความคล่องแคล่ว"] },
    { name: "ความเร็วสปีด (40m Sprint)", keys: SPEED_KEYS },
    { name: "ความอดทนระบบหายใจ (Aerobic / Beep Test)", keys: ENDURANCE_KEYS },
    { name: "องค์ประกอบร่างกาย (Body Composition)", keys: ["body", "fat", "ไขมัน", "องค์ประกอบทางร่างกาย"] },
  ];

  return mappings.map(m => {
    const found = findRating(ratings, m.keys);
    const rating: FitnessRating = found ?? "ปานกลาง";
    return {
      name: m.name,
      rating,
      score: FITNESS_RATING_SCORES[rating],
    };
  });
}


export function mapToSportFitnessStations(
  ratings: Record<string, FitnessRating>,
  sport: string,
): { name: string; rating: FitnessRating; score: number }[] {
  const entries = Object.entries(ratings);
  const sportStations = getSportFitnessStations(sport);
  const usedKeys = new Set<string>();

  const mapped = sportStations.flatMap(station => {
    const match = entries.find(([key]) => {
      if (usedKeys.has(key)) return false;
      const normalizedKey = normalizeKey(key);
      return [station.name, ...station.keys].some(candidate => {
        const normalizedCandidate = normalizeKey(candidate);
        return normalizedKey === normalizedCandidate;
      });
    });

    if (!match) return [];
    usedKeys.add(match[0]);
    const rating = match[1];
    return [{ name: station.name, rating, score: FITNESS_RATING_SCORES[rating] }];
  });

  return mapped;
}

export function analyzeAthletePerformance(input: AthletePerformanceInput): PerformanceAnalysis {
  const fitnessAverage = calculateFitnessAverage(input);
  const competitionScore = calculateCompetitionScore(input);
  const gaps = calculateGapMetrics(input, fitnessAverage);
  const standardStations = mapToSportFitnessStations(input.fitness?.ratings ?? {}, input.sport);

  const performanceIndex = clamp(
    fitnessAverage === null && competitionScore === null
      ? 0
      : fitnessAverage === null
        ? competitionScore ?? 0
        : competitionScore === null
          ? fitnessAverage
          : fitnessAverage * 0.6 + competitionScore * 0.4,
  );
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const ruleRecommendations: string[] = [];
  const ratings = input.fitness?.ratings ?? {};

  for (const station of standardStations) {
    if (station.rating === "ดีมาก" || station.rating === "ดี") strengths.push(station.name);
    if (station.rating === "ต่ำมาก" || station.rating === "ต่ำ" || station.rating === "พอใช้") weaknesses.push(station.name);
  }

  const endurance = ratingScore(findRating(ratings, ENDURANCE_KEYS));
  const speed = ratingScore(findRating(ratings, SPEED_KEYS));
  const explosive = ratingScore(findRating(ratings, EXPLOSIVE_KEYS));
  const flexibility = ratingScore(findRating(ratings, FLEXIBILITY_KEYS));
  const rank = input.matchResult?.rank;
  const lostOrLowRank = input.matchResult?.outcome === "LOSS" || (rank !== null && rank !== undefined && rank > 3);

  // กฎที่ 1: Endurance Deficit
  if (endurance !== null && endurance < 60 && lostOrLowRank) {
    if (input.sport === "กีฬาทางน้ำ" || input.sport === "ว่ายน้ำ") {
      ruleRecommendations.push("เพิ่มแบบฝึก Aerobic Swim Capacity และเซ็ต Interval สโตรกเรทเพื่อลดอาการล้าช่วง 15 เมตรสุดท้าย");
    } else {
      ruleRecommendations.push("เพิ่มโปรแกรม High-Intensity Interval Training (HIIT) เพื่อรักษาอัตราการเต้นหัวใจและความอึดในช่วงท้าย");
    }
  }

  // กฎที่ 2: Speed/Explosive Deficit เทียบเป้าหมายเวลา
  const isTimeSlowerThanTarget = gaps.timeGapSeconds !== null && gaps.timeGapSeconds > 0;
  if ((speed !== null && speed < 60) || (explosive !== null && explosive < 60)) {
    if (isTimeSlowerThanTarget) {
      if (input.sport === "กีฬาทางน้ำ" || input.sport === "ว่ายน้ำ") {
        ruleRecommendations.push("เพิ่มแบบฝึก Dryland Resistance Training และ Power Starts/Turns เพื่อเพิ่มแรงส่งจากขอบสระ");
      } else {
        ruleRecommendations.push("เพิ่มแบบฝึก Plyometrics และ Resistance Training สัปดาห์ละ 2-3 ครั้ง");
      }
    }
  }

  // กฎที่ 3: Benchmark Excellence
  if (standardStations.filter(station => station.rating === "ดีมาก").length > 4 && isSuccessfulResult(input)) {
    ruleRecommendations.push("รักษาสภาพความฟิต เน้นกลยุทธ์เฉพาะคู่แข่งขัน และการฟื้นฟูกล้ามเนื้อ (Active Recovery)");
  }

  // กฎพิเศษ: Flexibility Risk
  if (flexibility !== null && flexibility < 60) {
    weaknesses.push("ความเสี่ยงด้านความยืดหยุ่น");
    if (input.sport === "กีฬาทางน้ำ" || input.sport === "ว่ายน้ำ") {
      ruleRecommendations.push("เพิ่มโปรแกรมยืดเหยียดข้อต่อหัวไหล่และข้อเท้า (Shoulder & Ankle Mobility) เพื่อลดแรงต้านน้ำ");
    } else {
      ruleRecommendations.push("เพิ่มโปรแกรมยืดเหยียดและ mobility ก่อน-หลังซ้อมเพื่อลดความเสี่ยงการบาดเจ็บ");
    }
  }

  const uniqueStrengths = [...new Set(strengths)];
  const uniqueWeaknesses = [...new Set(weaknesses)];
  const actionPlan = ruleRecommendations.length
    ? ruleRecommendations.slice(0, 2).join(" ")
    : performanceIndex >= 70
      ? "คงโปรแกรมฝึกซ้อมปัจจุบันและทบทวนเป้าหมายเฉพาะการแข่งขันรอบถัดไป"
      : "กำหนดเป้าหมายพัฒนารายสถานีและติดตามผลสมรรถภาพก่อนการแข่งขันครั้งถัดไป";

  return {
    performanceIndex,
    fitnessAverage,
    competitionScore,
    strengths: uniqueStrengths,
    weaknesses: uniqueWeaknesses,
    ruleRecommendations: [...new Set(ruleRecommendations)],
    actionPlan,
    gaps,
    standardStations,
  };
}

export function timeSwcSeconds(baselineSeconds: number): number {
  return Math.round(Math.max(FOLLOW_UP_SWC.timeMinSeconds, baselineSeconds * FOLLOW_UP_SWC.timeRelative) * 100) / 100;
}

export function classifyChange(delta: number, swc: number, lowerIsBetter = false): MetricChange {
  if (delta === 0 || Math.abs(delta) < swc) return "WITHIN_SWC";
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  return improved ? "IMPROVED" : "DECLINED";
}

function trendOf(change: MetricChange | null): number {
  return change === "IMPROVED" ? 1 : change === "DECLINED" ? -1 : 0;
}

export function compareFollowUp(baseline: AthletePerformanceInput, followUp: FollowUpRetest): FollowUpComparison {
  const before = analyzeAthletePerformance(baseline);
  const baselineResult = baseline.matchResult;
  const afterInput: AthletePerformanceInput = {
    ...baseline,
    fitness: {
      totalScore: followUp.totalScore,
      ratings: followUp.ratings,
      testedAt: followUp.testedAt ? new Date(followUp.testedAt) : null,
    },
    matchResult: followUp.timeSeconds === null
      ? null
      : {
          score: null,
          timeSeconds: followUp.timeSeconds,
          targetTimeSeconds: followUp.targetTimeSeconds ?? baselineResult?.targetTimeSeconds ?? null,
          rank: null,
          outcome: null,
          isWinner: false,
          staffNotes: null,
        },
  };
  const after = analyzeAthletePerformance(afterInput);

  const fitnessDelta = before.fitnessAverage !== null && after.fitnessAverage !== null
    ? Math.round((after.fitnessAverage - before.fitnessAverage) * 10) / 10
    : null;
  const timeBefore = baselineResult?.timeSeconds ?? null;
  const timeAfter = followUp.timeSeconds;
  const timeDeltaSeconds = timeBefore !== null && timeAfter !== null
    ? Math.round((timeAfter - timeBefore) * 100) / 100
    : null;

  const stationChanges: StationChange[] = before.standardStations.flatMap(station => {
    const next = after.standardStations.find(candidate => candidate.name === station.name);
    if (!next) return [];
    return [{
      name: station.name,
      beforeRating: station.rating,
      afterRating: next.rating,
      beforeScore: station.score,
      afterScore: next.score,
      delta: next.score - station.score,
    }];
  });

  const swc = {
    timeSeconds: timeBefore === null ? null : timeSwcSeconds(timeBefore),
    fitnessPoints: FOLLOW_UP_SWC.fitnessPoints,
  };
  const fitnessChange = fitnessDelta === null ? null : classifyChange(fitnessDelta, swc.fitnessPoints);
  const timeChange = swc.timeSeconds === null || timeDeltaSeconds === null
    ? null
    : classifyChange(timeDeltaSeconds, swc.timeSeconds, true);
  const changes = [fitnessChange, timeChange];
  const trend = trendOf(fitnessChange) + trendOf(timeChange);
  const status: FollowUpComparison["status"] = trend > 0 ? "IMPROVED" : trend < 0 ? "DECLINED" : "NO_CHANGE";
  const hasTrivialDelta = (fitnessChange === "WITHIN_SWC" && fitnessDelta !== 0)
    || (timeChange === "WITHIN_SWC" && timeDeltaSeconds !== 0);
  const swcLabel = [
    swc.timeSeconds === null ? null : `เวลา ±${swc.timeSeconds}s`,
    `สมรรถภาพ ±${swc.fitnessPoints} คะแนน`,
  ].filter(Boolean).join(", ");
  const summary = status === "IMPROVED"
    ? "ผลทดสอบซ้ำดีขึ้นจากครั้งก่อน"
    : status === "DECLINED"
      ? "ผลทดสอบซ้ำต่ำกว่าครั้งก่อน ควรทบทวนแผนฝึกและตรวจปัจจัยอื่นร่วมด้วย"
      : changes.includes("IMPROVED") && changes.includes("DECLINED")
        ? "ผลทดสอบซ้ำมีทั้งด้านที่ดีขึ้นและลดลง ควรพิจารณารายด้านประกอบ"
        : hasTrivialDelta
          ? `ผลทดสอบซ้ำเปลี่ยนแปลงน้อยกว่าเกณฑ์ขั้นต่ำ (${swcLabel}) จึงยังไม่ถือว่าเปลี่ยนชัดเจน`
          : "ผลทดสอบซ้ำยังไม่เปลี่ยนชัดเจน";

  return {
    status,
    fitnessAverageBefore: before.fitnessAverage,
    fitnessAverageAfter: after.fitnessAverage,
    fitnessDelta,
    fitnessChange,
    timeBefore,
    timeAfter,
    timeDeltaSeconds,
    timeChange,
    swc,
    remainingGapSeconds: after.gaps.timeGapSeconds,
    stationChanges,
    improvedStations: stationChanges.filter(change => change.delta > 0).map(change => change.name),
    remainingWeaknesses: after.weaknesses,
    summary,
  };
}
