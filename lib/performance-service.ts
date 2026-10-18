import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { atomic, json } from "@/lib/phase4-server";
import {
  analyzeAthletePerformance,
  classifyChange,
  compareFollowUp,
  DEFAULT_SPORT_BENCHMARKS,
  EXCELLENCE_PILOT_SPORTS,
  FOLLOW_UP_SWC,
  getSportFitnessStations,
  RACE_PROXY_STATION_NAMES,
  timeSwcSeconds,
  type FollowUpComparison,
  type FollowUpRetest,
  type AthletePerformanceInput,
  type FitnessRating,
  type PerformanceAnalysis,
} from "./performance-analytics";
import {
  computeProgramAnalytics,
  type ProgramAnalytics,
  type ProgramAthleteInput,
  type ProgramChangeClassifier,
} from "./performance-program-analytics";
import { generateDemoCohort } from "./performance-program-demo";
import {
  PerformanceValidationError,
  validateActionPlanInput,
  validateBenchmarkInput,
  validateFollowUpRetestInput,
  validateMatchResultInput,
  type ActionPlanStatus,
  type ValidatedBenchmark,
} from "./performance-validation";

export type PerformanceFilter = {
  competitionId?: string;
  sport?: string;
  search?: string;
  includeDemo?: boolean;
};

export type AthleteExcellenceItem = {
  applicationId: string;
  studentId: string;
  athleteName: string;
  sport: string;
  competitionName: string;
  faculty: string;
  status: string;
  isDemo?: boolean;
  fitness: {
    totalScore: number | null;
    status: string | null;
    ratings: Record<string, FitnessRating>;
    testedAt: string | null;
    notes: string | null;
  } | null;
  matchResult: {
    entryId: string | null;
    matchId: string | null;
    stage: string | null;
    category: string | null;
    score: number | null;
    timeSeconds: number | null;
    targetTimeSeconds?: number | null;
    rank: number | null;
    outcome: string | null;
    isWinner: boolean;
    notes: string | null;
    staffNotes: string | null;
    recordedAt: string | null;
  } | null;
  analysis: PerformanceAnalysis;
  actionPlan?: ActionPlanRecord | null;
  followUps?: { retest: FollowUpRetest; comparison: FollowUpComparison }[];
  followUp?: { retest: FollowUpRetest; comparison: FollowUpComparison } | null;
};

export type ActionPlanRecord = {
  coachName: string;
  responsiblePerson: string;
  startDate: string;
  endDate: string;
  items: string[];
  status: ActionPlanStatus;
  notes: string | null;
  updatedAt: string;
  updatedBy: string;
};

export type ExcellenceBenchmark = {
  targetTimeSeconds: number;
  targetScore: number;
};

type ExcellenceStorage = {
  actionPlan?: ActionPlanRecord;
  retests?: FollowUpRetest[];
};

export type ExecutivePerformanceKpi = {
  totalAthletes: number;
  averageFitnessReadiness: number;
  successRate: number;
  urgentActionRequired: number;
};

export type PerformanceInsightsResponse = {
  kpi: ExecutivePerformanceKpi;
  sports: string[];
  athletes: AthleteExcellenceItem[];
  isDemoData: boolean;
  benchmarks: Record<string, ExcellenceBenchmark>;
  program: ProgramAnalytics;
};

const DEMO_FIXTURES: AthleteExcellenceItem[] = [
  {
    applicationId: "demo-track-1",
    studentId: "65020111",
    athleteName: "น.ส. กัญญารัตน์ จันทร์เพ็ญ (สาธิต: Benchmarking กรีฑา)",
    sport: "กรีฑา",
    competitionName: "กีฬาเชื่อมความสัมพันธ์ มหาวิทยาลัยพะเยา 2569",
    faculty: "คณะวิทยาศาสตร์การแพทย์",
    status: "FINAL_SELECTED",
    isDemo: true,
    fitness: {
      totalScore: 95,
      status: "PASSED",
      ratings: {
        "ความอ่อนตัว": "ดีมาก",
        "ความแข็งแรง": "ดีมาก",
        "พลังกล้ามเนื้อ": "ดีมาก",
        "ความคล่องแคล่วว่องไว": "ดีมาก",
        "ความเร็ว": "ดีมาก",
        "ความอดทน": "ดีมาก",
      },
      testedAt: "2026-10-10T09:00:00.000Z",
      notes: "สภาพร่างกายยอดเยี่ยม เกินเกณฑ์มาตรฐานทุกสถานี",
    },
    matchResult: {
      entryId: "demo-entry-1",
      matchId: "demo-match-1",
      stage: "รอบชิงชนะเลิศ วิ่ง 40 เมตร",
      category: "บุคคลหญิง",
      score: 100,
      timeSeconds: 5.1,
      targetTimeSeconds: 5.2,
      rank: 1,
      outcome: "WIN",
      isWinner: true,
      notes: "ทำเวลาได้เร็วกว่าเป้าหมายสาธิต 0.10 วินาที",
      staffNotes: "รักษามาตรฐานการฟื้นฟูกล้ามเนื้อและคงฟอร์ม",
      recordedAt: "2026-10-14T15:30:00.000Z",
    },
    analysis: analyzeAthletePerformance({
      applicationId: "demo-track-1",
      studentId: "65020111",
      athleteName: "น.ส. กัญญารัตน์ จันทร์เพ็ญ",
      sport: "กรีฑา",
      fitness: {
        totalScore: 95,
        ratings: {
          "ความอ่อนตัว": "ดีมาก",
          "ความแข็งแรง": "ดีมาก",
          "พลังกล้ามเนื้อ": "ดีมาก",
          "ความคล่องแคล่วว่องไว": "ดีมาก",
          "ความเร็ว": "ดีมาก",
          "ความอดทน": "ดีมาก",
        },
        testedAt: new Date("2026-10-10T09:00:00.000Z"),
      },
      matchResult: {
        score: 100,
        timeSeconds: 5.1,
        targetTimeSeconds: 5.2,
        rank: 1,
        outcome: "WIN",
        isWinner: true,
        staffNotes: "รักษามาตรฐานการฟื้นฟูกล้ามเนื้อและคงฟอร์ม",
      },
    }),
  },
  {
    applicationId: "demo-track-2",
    studentId: "65020222",
    athleteName: "นาย ภานุพงศ์ วงศ์สว่าง (สาธิต: Speed Gap กรีฑา)",
    sport: "กรีฑา",
    competitionName: "กีฬาเชื่อมความสัมพันธ์ มหาวิทยาลัยพะเยา 2569",
    faculty: "คณะวิศวกรรมศาสตร์",
    status: "STAFF_APPROVED",
    isDemo: true,
    fitness: {
      totalScore: 58,
      status: "PASSED",
      ratings: {
        "ความเร็ว (40m Sprint)": "ต่ำ",
        "แรงระเบิดกล้ามเนื้อ (Leg Power)": "ต่ำ",
        "ความอดทน (Beep test)": "ปานกลาง",
        "ความคล่องแคล่ว": "ดี",
      },
      testedAt: "2026-10-11T10:00:00.000Z",
      notes: "สปีดต้นและแรงถีบตัวต่ำกว่าเกณฑ์ ช้ากว่าเป้าหมายเวลา",
    },
    matchResult: {
      entryId: "demo-entry-2",
      matchId: "demo-match-2",
      stage: "รอบคัดเลือก วิ่ง 40 เมตร",
      category: "บุคคลชาย",
      score: 55,
      timeSeconds: 5.7,
      targetTimeSeconds: 5.2,
      rank: 5,
      outcome: "LOSS",
      isWinner: false,
      notes: "ออกตัวช้าและเร่งไม่ขึ้นในช่วง 30 เมตรแรก",
      staffNotes: "ต้องเสริม Plyometrics และ Resistance ด่วน",
      recordedAt: "2026-10-14T17:00:00.000Z",
    },
    analysis: analyzeAthletePerformance({
      applicationId: "demo-track-2",
      studentId: "65020222",
      athleteName: "นาย ภานุพงศ์ วงศ์สว่าง",
      sport: "กรีฑา",
      fitness: {
        totalScore: 58,
        ratings: {
          "ความเร็ว (40m Sprint)": "ต่ำ",
          "แรงระเบิดกล้ามเนื้อ (Leg Power)": "ต่ำ",
          "ความอดทน (Beep test)": "ปานกลาง",
          "ความคล่องแคล่ว": "ดี",
        },
        testedAt: new Date("2026-10-11T10:00:00.000Z"),
      },
      matchResult: {
        score: 55,
        timeSeconds: 5.7,
        targetTimeSeconds: 5.2,
        rank: 5,
        outcome: "LOSS",
        isWinner: false,
        staffNotes: "ต้องเสริม Plyometrics และ Resistance ด่วน",
      },
    }),
  },
  {
    applicationId: "demo-track-3",
    studentId: "65020333",
    athleteName: "นาย ธีรภัทร ศรีสุข (สาธิต: Flexibility Risk กรีฑา)",
    sport: "กรีฑา",
    competitionName: "กีฬาเชื่อมความสัมพันธ์ มหาวิทยาลัยพะเยา 2569",
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    status: "STAFF_APPROVED",
    isDemo: true,
    fitness: {
      totalScore: 65,
      status: "PASSED",
      ratings: {
        "ความอ่อนตัว (Sit & Reach)": "ต่ำ",
        "ความเร็ว (40m Sprint)": "ดี",
        "ความแข็งแรง": "ดี",
        "ความอดทน": "ดี",
      },
      testedAt: "2026-10-12T13:30:00.000Z",
      notes: "ความอ่อนตัวต่ำมาก เสี่ยงต่ออาการบาดเจ็บกล้ามเนื้อแฮมสตริง",
    },
    matchResult: {
      entryId: "demo-entry-3",
      matchId: "demo-match-3",
      stage: "รอบรองชนะเลิศ วิ่ง 40 เมตร",
      category: "บุคคลชาย",
      score: 78,
      timeSeconds: 5.25,
      targetTimeSeconds: 5.2,
      rank: 3,
      outcome: "PODIUM",
      isWinner: false,
      notes: "วิ่งเข้าอันดับ 3 แต่มีอาการกล้ามเนื้อตึงชัดเจนหลังเข้าเส้นชัย",
      staffNotes: "กำหนดให้ฝ่ายกายภาพทำ Mobility และยืดเหยียดก่อนแข่ง",
      recordedAt: "2026-10-14T19:00:00.000Z",
    },
    analysis: analyzeAthletePerformance({
      applicationId: "demo-track-3",
      studentId: "65020333",
      athleteName: "นาย ธีรภัทร ศรีสุข",
      sport: "กรีฑา",
      fitness: {
        totalScore: 65,
        ratings: {
          "ความอ่อนตัว (Sit & Reach)": "ต่ำ",
          "ความเร็ว (40m Sprint)": "ดี",
          "ความแข็งแรง": "ดี",
          "ความอดทน": "ดี",
        },
        testedAt: new Date("2026-10-12T13:30:00.000Z"),
      },
      matchResult: {
        score: 78,
        timeSeconds: 5.25,
        targetTimeSeconds: 5.2,
        rank: 3,
        outcome: "PODIUM",
        isWinner: false,
        staffNotes: "กำหนดให้ฝ่ายกายภาพทำ Mobility และยืดเหยียดก่อนแข่ง",
      },
    }),
  },
  {
    applicationId: "demo-swim-1",
    studentId: "65020444",
    athleteName: "นาย ชนาธิป สุวรรณรัตน์ (สาธิต: Benchmarking ว่ายน้ำ)",
    sport: "กีฬาทางน้ำ",
    competitionName: "กีฬาเชื่อมความสัมพันธ์ มหาวิทยาลัยพะเยา 2569",
    faculty: "คณะพยาบาลศาสตร์",
    status: "FINAL_SELECTED",
    isDemo: true,
    fitness: {
      totalScore: 92,
      status: "PASSED",
      ratings: {
        "ความอ่อนตัว": "ดีมาก",
        "ความแข็งแรง": "ดีมาก",
        "พลังกล้ามเนื้อ": "ดีมาก",
        "ความคล่องแคล่วว่องไว": "ดี",
        "ความเร็ว": "ดีมาก",
        "ความอดทน": "ดีมาก",
      },
      testedAt: "2026-10-10T10:00:00.000Z",
      notes: "สมรรถภาพยอดเยี่ยม ความจุปอดและความอดทนสูงมาก",
    },
    matchResult: {
      entryId: "demo-entry-swim-1",
      matchId: "demo-match-swim-1",
      stage: "รอบชิงชนะเลิศ ฟรีสไตล์ 50 เมตร",
      category: "บุคคลชาย",
      score: 95,
      timeSeconds: 26.8,
      targetTimeSeconds: 27.5,
      rank: 1,
      outcome: "WIN",
      isWinner: true,
      notes: "ว่ายแตะขอบสระเร็วกว่าเป้าหมาย 0.70 วินาที",
      staffNotes: "รักษาเทคนิคสโตรกเรทและโปรแกรมฟื้นตัว",
      recordedAt: "2026-10-14T16:00:00.000Z",
    },
    analysis: analyzeAthletePerformance({
      applicationId: "demo-swim-1",
      studentId: "65020444",
      athleteName: "นาย ชนาธิป สุวรรณรัตน์",
      sport: "กีฬาทางน้ำ",
      benchmarkTargetScore: 85,
      fitness: {
        totalScore: 92,
        ratings: {
          "ความอ่อนตัว": "ดีมาก",
          "ความแข็งแรง": "ดีมาก",
          "พลังกล้ามเนื้อ": "ดีมาก",
          "ความคล่องแคล่วว่องไว": "ดี",
          "ความเร็ว": "ดีมาก",
          "ความอดทน": "ดีมาก",
        },
        testedAt: new Date("2026-10-10T10:00:00.000Z"),
      },
      matchResult: {
        score: 95,
        timeSeconds: 26.8,
        targetTimeSeconds: 27.5,
        rank: 1,
        outcome: "WIN",
        isWinner: true,
        staffNotes: "รักษาเทคนิคสโตรกเรทและโปรแกรมฟื้นตัว",
      },
    }),
  },
  {
    applicationId: "demo-swim-2",
    studentId: "65020555",
    athleteName: "น.ส. อลิสา ชัยชนะ (สาธิต: Endurance/Pacing ว่ายน้ำ)",
    sport: "กีฬาทางน้ำ",
    competitionName: "กีฬาเชื่อมความสัมพันธ์ มหาวิทยาลัยพะเยา 2569",
    faculty: "คณะวิทยาศาสตร์",
    status: "STAFF_APPROVED",
    isDemo: true,
    fitness: {
      totalScore: 60,
      status: "PASSED",
      ratings: {
        "ความอ่อนตัว": "ดี",
        "ความแข็งแรง": "ปานกลาง",
        "พลังกล้ามเนื้อ": "พอใช้",
        "ความคล่องแคล่วว่องไว": "ดี",
        "ความเร็ว": "ดี",
        "ความอดทน": "ต่ำ",
      },
      testedAt: "2026-10-11T11:00:00.000Z",
      notes: "ความอดทนของระบบหายใจลดลงในช่วงท้าย สโตรกเรทตก",
    },
    matchResult: {
      entryId: "demo-entry-swim-2",
      matchId: "demo-match-swim-2",
      stage: "รอบคัดเลือก ฟรีสไตล์ 50 เมตร",
      category: "บุคคลหญิง",
      score: 62,
      timeSeconds: 29.8,
      targetTimeSeconds: 27.5,
      rank: 4,
      outcome: "LOSS",
      isWinner: false,
      notes: "ว่ายตามเป้าในช่วง 25 เมตรแรก แต่ความเร็วตกช่วง 15 เมตรสุดท้าย",
      staffNotes: "เสริม Aerobic capacity และ Core dryland",
      recordedAt: "2026-10-14T17:30:00.000Z",
    },
    analysis: analyzeAthletePerformance({
      applicationId: "demo-swim-2",
      studentId: "65020555",
      athleteName: "น.ส. อลิสา ชัยชนะ",
      sport: "กีฬาทางน้ำ",
      benchmarkTargetScore: 85,
      fitness: {
        totalScore: 60,
        ratings: {
          "ความอ่อนตัว": "ดี",
          "ความแข็งแรง": "ปานกลาง",
          "พลังกล้ามเนื้อ": "พอใช้",
          "ความคล่องแคล่วว่องไว": "ดี",
          "ความเร็ว": "ดี",
          "ความอดทน": "ต่ำ",
        },
        testedAt: new Date("2026-10-11T11:00:00.000Z"),
      },
      matchResult: {
        score: 62,
        timeSeconds: 29.8,
        targetTimeSeconds: 27.5,
        rank: 4,
        outcome: "LOSS",
        isWinner: false,
        staffNotes: "เสริม Aerobic capacity และ Core dryland",
      },
    }),
  },
];

const DEMO_FOLLOW_UPS: Record<string, FollowUpRetest> = {
  "demo-track-2": {
    testedAt: "2026-11-11T10:00:00.000Z",
    weeksAfterBaseline: 4,
    totalScore: 75,
    ratings: {
      "ความเร็ว (40m Sprint)": "ปานกลาง",
      "แรงระเบิดกล้ามเนื้อ (Leg Power)": "ปานกลาง",
      "ความอดทน (Beep test)": "ปานกลาง",
      "ความคล่องแคล่ว": "ดี",
    },
    timeSeconds: 5.4,
    targetTimeSeconds: 5.2,
    trainingPlan: [
      "Plyometrics สัปดาห์ละ 2 ครั้ง",
      "Resistance Training สัปดาห์ละ 2 ครั้ง",
      "ฝึกออกตัวและเร่งความเร็วช่วง 30 เมตรแรก",
    ],
  },
  "demo-swim-2": {
    testedAt: "2026-11-20T10:00:00.000Z",
    weeksAfterBaseline: 6,
    totalScore: 78,
    ratings: {
      "ความอ่อนตัว": "ดี",
      "ความแข็งแรง": "ดี",
      "พลังกล้ามเนื้อ": "ปานกลาง",
      "ความคล่องแคล่วว่องไว": "ดี",
      "ความเร็ว": "ดี",
      "ความอดทน": "ดี",
    },
    timeSeconds: 28.2,
    targetTimeSeconds: 27.5,
    trainingPlan: [
      "Aerobic Swim Drills 50m x 8 เที่ยว (สัปดาห์ละ 3 ครั้ง)",
      "Dryland Core & Resistance Training สัปดาห์ละ 2 ครั้ง",
      "ฝึกจังหวะ Stroke Rate ช่วง 15 เมตรสุดท้าย",
    ],
  },
};

function toBaselineInput(item: AthleteExcellenceItem): AthletePerformanceInput {
  return {
    applicationId: item.applicationId,
    studentId: item.studentId,
    athleteName: item.athleteName,
    sport: item.sport,
    fitness: item.fitness
      ? {
          totalScore: item.fitness.totalScore,
          ratings: item.fitness.ratings,
          testedAt: item.fitness.testedAt ? new Date(item.fitness.testedAt) : null,
        }
      : null,
    benchmarkTargetScore: DEFAULT_SPORT_BENCHMARKS[item.sport]?.targetScore ?? 80,
    matchResult: item.matchResult
      ? {
          score: item.matchResult.score,
          timeSeconds: item.matchResult.timeSeconds,
          targetTimeSeconds: item.matchResult.targetTimeSeconds ?? null,
          rank: item.matchResult.rank,
          outcome: item.matchResult.outcome,
          isWinner: item.matchResult.isWinner,
          staffNotes: item.matchResult.staffNotes,
        }
      : null,
  };
}

const PILOT_SPORTS = ["กรีฑา", "กีฬาทางน้ำ", "ว่ายน้ำ"];

function getStorage(scores: Prisma.JsonValue | null | undefined): ExcellenceStorage {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return {};
  const root = scores as Record<string, unknown>;
  const raw = root._excellence;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const value = raw as Record<string, unknown>;
  const actionPlan = value.actionPlan && typeof value.actionPlan === "object" && !Array.isArray(value.actionPlan)
    ? value.actionPlan as ActionPlanRecord
    : undefined;
  const retests = Array.isArray(value.retests) ? value.retests.filter(item => item && typeof item === "object") as FollowUpRetest[] : [];
  return { actionPlan, retests };
}

function mergeStorage(scores: Prisma.JsonValue | null | undefined, storage: ExcellenceStorage): Prisma.InputJsonValue {
  const root = scores && typeof scores === "object" && !Array.isArray(scores)
    ? { ...(scores as Record<string, unknown>) }
    : { items: scores ?? {} };
  return json({ ...root, _excellence: storage });
}

function mergeBenchmarks(value: Prisma.JsonValue | null | undefined): Record<string, ExcellenceBenchmark> {
  const result: Record<string, ExcellenceBenchmark> = { ...DEFAULT_SPORT_BENCHMARKS };
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [sport, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!PILOT_SPORTS.includes(sport)) continue;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const targetTimeSeconds = Number(item.targetTimeSeconds);
    const targetScore = Number(item.targetScore);
    if (Number.isFinite(targetTimeSeconds) && targetTimeSeconds > 0 && Number.isFinite(targetScore) && targetScore >= 0) {
      result[sport] = { targetTimeSeconds, targetScore };
    }
  }
  return result;
}

function withFollowUps(item: AthleteExcellenceItem, storage: ExcellenceStorage, benchmark: ExcellenceBenchmark): AthleteExcellenceItem {
  const baseline = toBaselineInput({ ...item, analysis: item.analysis });
  baseline.benchmarkTargetScore = benchmark.targetScore;
  if (baseline.matchResult) baseline.matchResult.targetTimeSeconds = benchmark.targetTimeSeconds;
  if (!storage.retests?.length) return { ...item, actionPlan: storage.actionPlan ?? null, followUps: [], followUp: null, analysis: analyzeAthletePerformance(baseline) };
  const followUps = storage.retests
    .slice()
    .sort((a, b) => String(a.testedAt).localeCompare(String(b.testedAt)))
    .map(retest => ({ retest, comparison: compareFollowUp(baseline, { ...retest, targetTimeSeconds: retest.targetTimeSeconds ?? benchmark.targetTimeSeconds }) }));
  return { ...item, actionPlan: storage.actionPlan ?? null, followUps, followUp: followUps.at(-1) ?? null, analysis: analyzeAthletePerformance(baseline) };
}

const DEMO_ATHLETES: AthleteExcellenceItem[] = DEMO_FIXTURES.map(item => {
  const retest = DEMO_FOLLOW_UPS[item.applicationId];
  if (!retest) return item;
  return { ...item, followUp: { retest, comparison: compareFollowUp(toBaselineInput(item), retest) } };
});

function extractRatings(scores: unknown): Record<string, FitnessRating> {
  if (!scores || typeof scores !== "object") return {};
  const root = scores as Record<string, unknown>;
  const rawItems = (root.items && typeof root.items === "object" ? root.items : root) as Record<string, unknown>;
  const ratings: Record<string, FitnessRating> = {};

  for (const [key, value] of Object.entries(rawItems)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (["ดีมาก", "ดี", "ปานกลาง", "พอใช้", "ต่ำ", "ต่ำมาก"].includes(trimmed)) {
        ratings[key] = trimmed as FitnessRating;
      }
    } else if (typeof value === "number") {
      const score = value;
      ratings[key] = score >= 80 ? "ดีมาก" : score >= 65 ? "ดี" : score >= 50 ? "ปานกลาง" : score >= 35 ? "พอใช้" : "ต่ำ";
    } else if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const cand = typeof obj.rating === "string" ? obj.rating.trim() : typeof obj.level === "string" ? obj.level.trim() : "";
      if (["ดีมาก", "ดี", "ปานกลาง", "พอใช้", "ต่ำ", "ต่ำมาก"].includes(cand)) {
        ratings[key] = cand as FitnessRating;
      }
    }
  }

  return ratings;
}

export function computeExecutiveKpi(athletes: AthleteExcellenceItem[]): ExecutivePerformanceKpi {
  if (!athletes.length) {
    return {
      totalAthletes: 0,
      averageFitnessReadiness: 0,
      successRate: 0,
      urgentActionRequired: 0,
    };
  }

  const fitnessValues = athletes
    .map(a => a.analysis.fitnessAverage ?? a.fitness?.totalScore ?? null)
    .filter((v): v is number => v !== null);

  const averageFitnessReadiness = fitnessValues.length
    ? Math.round(fitnessValues.reduce((sum, v) => sum + v, 0) / fitnessValues.length)
    : 0;

  const successfulCount = athletes.filter(a => {
    const r = a.matchResult;
    return Boolean(r && (r.isWinner || r.rank === 1 || r.outcome === "WIN" || r.outcome === "PODIUM"));
  }).length;

  const athletesWithMatch = athletes.filter(a => a.matchResult !== null).length;
  const successRate = athletesWithMatch ? Math.round((successfulCount / athletesWithMatch) * 100) : 0;

  const urgentActionRequired = athletes.filter(a => {
    const lowFitness = (a.analysis.fitnessAverage ?? 100) < 60;
    const hasBottlenecks = a.analysis.weaknesses.length > 0;
    const lostLate = a.matchResult?.outcome === "LOSS" || (a.matchResult?.rank ?? 0) > 3;
    return (lowFitness && lostLate) || hasBottlenecks;
  }).length;

  return {
    totalAthletes: athletes.length,
    averageFitnessReadiness,
    successRate,
    urgentActionRequired,
  };
}

export function toProgramInputs(athletes: AthleteExcellenceItem[]): ProgramAthleteInput[] {
  return athletes.map(athlete => {
    const latest = athlete.followUp ?? null;
    return {
      applicationId: athlete.applicationId,
      sport: athlete.sport,
      fitnessAverage: athlete.analysis.fitnessAverage,
      timeSeconds: athlete.matchResult?.timeSeconds ?? null,
      stations: athlete.analysis.standardStations.map(station => ({ name: station.name, score: station.score })),
      hasActionPlan: Boolean(athlete.actionPlan),
      followUp: latest
        ? { fitnessAverage: latest.comparison.fitnessAverageAfter, timeSeconds: latest.comparison.timeAfter }
        : null,
    };
  });
}

// ใช้เกณฑ์ SWC เดียวกับ compareFollowUp เพื่อให้ตัวนับระดับโปรแกรมตรงกับการ์ดรายคน
const SWC_CHANGE_CLASSIFIER: ProgramChangeClassifier = {
  time: (beforeSeconds, deltaSeconds) => classifyChange(deltaSeconds, timeSwcSeconds(beforeSeconds), true),
  fitness: delta => classifyChange(delta, FOLLOW_UP_SWC.fitnessPoints),
};

function buildProgram(inputs: ProgramAthleteInput[], benchmarks: Record<string, ExcellenceBenchmark>): ProgramAnalytics {
  return computeProgramAnalytics(inputs, benchmarks, RACE_PROXY_STATION_NAMES, SWC_CHANGE_CLASSIFIER);
}

// มุมมองโปรแกรมในโหมดสาธิตใช้ cohort จำลองแยกต่างหาก (ไม่ใช่ 5 กรณีรายบุคคล) เพื่อให้มี n พอสำหรับวิเคราะห์
function demoProgramInputs(sport: string | undefined): ProgramAthleteInput[] {
  const wantsAquatics = sport === "กีฬาทางน้ำ" || sport === "ว่ายน้ำ";
  const inputs: ProgramAthleteInput[] = [];
  if (!sport || sport === "กรีฑา") {
    inputs.push(...generateDemoCohort("กรีฑา", getSportFitnessStations("กรีฑา").map(s => s.name), DEFAULT_SPORT_BENCHMARKS["กรีฑา"]));
  }
  if (!sport || wantsAquatics) {
    inputs.push(...generateDemoCohort("กีฬาทางน้ำ", getSportFitnessStations("กีฬาทางน้ำ").map(s => s.name), DEFAULT_SPORT_BENCHMARKS["กีฬาทางน้ำ"]));
  }
  return inputs;
}

export async function getPerformanceInsights(filter: PerformanceFilter = {}): Promise<PerformanceInsightsResponse> {
  if (filter.includeDemo) {
    let athletes = DEMO_ATHLETES.filter(demo => {
      if (!filter.sport) return true;
      if (filter.sport === "กีฬาทางน้ำ" || filter.sport === "ว่ายน้ำ") {
        return demo.sport === "กีฬาทางน้ำ" || demo.sport === "ว่ายน้ำ";
      }
      return demo.sport === filter.sport;
    });

    if (filter.search) {
      const q = filter.search.trim().toLowerCase();
      athletes = athletes.filter(
        a =>
          a.athleteName.toLowerCase().includes(q) ||
          a.studentId.toLowerCase().includes(q) ||
          a.sport.toLowerCase().includes(q) ||
          a.faculty.toLowerCase().includes(q),
      );
    }

    return {
      kpi: computeExecutiveKpi(athletes),
      sports: [...EXCELLENCE_PILOT_SPORTS],
      athletes,
      isDemoData: true,
      benchmarks: { ...DEFAULT_SPORT_BENCHMARKS },
      program: buildProgram(demoProgramInputs(filter.sport), { ...DEFAULT_SPORT_BENCHMARKS }),
    };
  }

  const sportFilterCondition = filter.sport
    ? (filter.sport === "กีฬาทางน้ำ" || filter.sport === "ว่ายน้ำ"
        ? { in: ["กีฬาทางน้ำ", "ว่ายน้ำ"] }
        : filter.sport)
    : { in: PILOT_SPORTS };

  const whereClause: Prisma.ApplicationWhereInput = {
    status: { in: ["STAFF_APPROVED", "FINAL_SELECTED"] },
    sport: sportFilterCondition,
  };

  if (filter.competitionId) whereClause.competitionId = filter.competitionId;

  const records = await prisma.$transaction(async tx => {
    return tx.application.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            studentId: true,
            profile: {
              select: { firstName: true, lastName: true, faculty: true },
            },
          },
        },
        competition: {
          select: {
            name: true,
          },
        },
        fitnessTestResult: true,
        matchEntries: {
          include: {
            match: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  });

  const benchmarkSetting = await prisma.systemSetting.findUnique({ where: { key: "SPORT_BENCHMARKS" } });
  const benchmarks = mergeBenchmarks(benchmarkSetting?.value);

  let athletes: AthleteExcellenceItem[] = records.map(app => {
    const profile = app.user.profile;
    const firstName = profile?.firstName?.trim() ?? "";
    const lastName = profile?.lastName?.trim() ?? "";
    const athleteName = `${firstName} ${lastName}`.trim() || `ผู้สมัคร #${app.id.slice(-6)}`;
    const studentId = app.user.studentId ?? "-";
    const faculty = profile?.faculty?.trim() ?? "ไม่ระบุ";

    const ratings = extractRatings(app.fitnessTestResult?.scores);
    const fitness = app.fitnessTestResult
      ? {
          totalScore: app.fitnessTestResult.totalScore ?? null,
          status: app.fitnessTestResult.status,
          ratings,
          testedAt: app.fitnessTestResult.testedAt ? app.fitnessTestResult.testedAt.toISOString() : null,
          notes: app.fitnessTestResult.notes ?? null,
        }
      : null;

    const latestEntry = app.matchEntries[0] ?? null;
    const match = latestEntry?.match ?? null;

    const matchResult = latestEntry
      ? {
          entryId: latestEntry.id,
          matchId: latestEntry.matchId,
          stage: match?.stage ?? null,
          category: match?.category ?? "บุคคลทั่วไป",
          score: latestEntry.score ?? null,
          timeSeconds: latestEntry.timeSeconds ?? null,
          rank: latestEntry.rank ?? null,
          outcome: latestEntry.resultOutcome ?? null,
          isWinner: latestEntry.isWinner,
          notes: match?.notes ?? null,
          staffNotes: match?.notes ?? null,
          recordedAt: latestEntry.createdAt.toISOString(),
        }
      : null;

    const benchmark = benchmarks[app.sport] ?? { targetTimeSeconds: 5.2, targetScore: 80 };
    const input: AthletePerformanceInput = {
      applicationId: app.id,
      studentId,
      athleteName,
      sport: app.sport,
      fitness: fitness
        ? {
            totalScore: fitness.totalScore,
            ratings: fitness.ratings,
            testedAt: fitness.testedAt ? new Date(fitness.testedAt) : null,
          }
        : null,
      benchmarkTargetScore: benchmark.targetScore,
      matchResult: matchResult
        ? {
            score: matchResult.score,
            timeSeconds: matchResult.timeSeconds,
            targetTimeSeconds: benchmark.targetTimeSeconds,
            rank: matchResult.rank,
            outcome: matchResult.outcome,
            isWinner: matchResult.isWinner,
            staffNotes: matchResult.staffNotes,
          }
        : null,
    };

    const analysis = analyzeAthletePerformance(input);

    const athlete: AthleteExcellenceItem = {
      applicationId: app.id,
      studentId,
      athleteName,
      sport: app.sport,
      competitionName: app.competition?.name ?? "การแข่งขันกีฬา",
      faculty,
      status: String(app.status),
      isDemo: false,
      fitness,
      matchResult,
      analysis,
    };
    return withFollowUps(athlete, getStorage(app.fitnessTestResult?.scores), benchmark);
  });

  // ตัวเลขระดับโปรแกรมคำนวณก่อนกรองด้วยช่องค้นหา เพราะการค้นหาไว้หาตัวบุคคล ไม่ควรเปลี่ยนภาพรวม
  const program = buildProgram(toProgramInputs(athletes), benchmarks);

  if (filter.search) {
    const q = filter.search.trim().toLowerCase();
    athletes = athletes.filter(
      a =>
        a.athleteName.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.sport.toLowerCase().includes(q) ||
        a.faculty.toLowerCase().includes(q),
    );
  }

  const sports = [...EXCELLENCE_PILOT_SPORTS];
  const kpi = computeExecutiveKpi(athletes);

  return {
    kpi,
    sports,
    athletes,
    isDemoData: false,
    benchmarks,
    program,
  };
}

export async function saveAthleteActionPlan(rawPayload: unknown, actorId: string) {
  const validated = validateActionPlanInput(rawPayload);
  return atomic(async tx => {
    const application = await tx.application.findUnique({
      where: { id: validated.applicationId },
      include: { fitnessTestResult: true },
    });
    if (!application) throw new PerformanceValidationError(404, "ไม่พบข้อมูลใบสมัครนักกีฬา");
    if (!["STAFF_APPROVED", "FINAL_SELECTED"].includes(String(application.status))) {
      throw new PerformanceValidationError(400, "บันทึกแผนได้เฉพาะนักกีฬาที่ผ่านการคัดเลือกแล้ว");
    }
    if (!PILOT_SPORTS.includes(application.sport)) {
      throw new PerformanceValidationError(400, "โมดูลสู่ความเป็นเลิศรองรับเฉพาะชนิดกีฬานำร่อง (กรีฑา, กีฬาทางน้ำ/ว่ายน้ำ)");
    }
    const existing = getStorage(application.fitnessTestResult?.scores);
    const actionPlan: ActionPlanRecord = {
      coachName: validated.coachName,
      responsiblePerson: validated.responsiblePerson,
      startDate: validated.startDate,
      endDate: validated.endDate,
      items: validated.items,
      status: validated.status,
      notes: validated.notes,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
    };
    if (!application.fitnessTestResult) throw new PerformanceValidationError(400, "ต้องบันทึกผลทดสอบ Fitness พื้นฐานก่อนสร้างแผนพัฒนา");
    await tx.fitnessTestResult.update({
      where: { applicationId: application.id },
      data: { scores: mergeStorage(application.fitnessTestResult.scores, { ...existing, actionPlan }) },
    });
    await tx.statusHistory.create({
      data: { applicationId: application.id, status: String(application.status), label: `อัปเดตแผนพัฒนานักกีฬา: ${actionPlan.status}`, by: actorId },
    });
    return { success: true, actionPlan };
  });
}

export async function saveAthleteFollowUpRetest(rawPayload: unknown, actorId: string) {
  const validated = validateFollowUpRetestInput(rawPayload);
  return atomic(async tx => {
    const application = await tx.application.findUnique({
      where: { id: validated.applicationId },
      include: { fitnessTestResult: true },
    });
    if (!application) throw new PerformanceValidationError(404, "ไม่พบข้อมูลใบสมัครนักกีฬา");
    if (!["STAFF_APPROVED", "FINAL_SELECTED"].includes(String(application.status))) {
      throw new PerformanceValidationError(400, "บันทึกผลทดสอบซ้ำได้เฉพาะนักกีฬาที่ผ่านการคัดเลือกแล้ว");
    }
    if (!PILOT_SPORTS.includes(application.sport)) {
      throw new PerformanceValidationError(400, "โมดูลสู่ความเป็นเลิศรองรับเฉพาะชนิดกีฬานำร่อง (กรีฑา, กีฬาทางน้ำ/ว่ายน้ำ)");
    }
    if (!application.fitnessTestResult) throw new PerformanceValidationError(400, "ต้องบันทึกผลทดสอบ Fitness พื้นฐานก่อนบันทึกผลทดสอบซ้ำ");
    if (application.fitnessTestResult.testedAt && new Date(validated.testedAt) < application.fitnessTestResult.testedAt) {
      throw new PerformanceValidationError(400, "วันที่ทดสอบซ้ำต้องไม่ก่อนวันที่ทดสอบพื้นฐาน");
    }
    const existing = getStorage(application.fitnessTestResult.scores);
    const retest: FollowUpRetest = {
      id: crypto.randomUUID(),
      testedAt: validated.testedAt,
      weeksAfterBaseline: Math.max(0, Math.round((Date.parse(validated.testedAt) - (application.fitnessTestResult.testedAt?.getTime() ?? Date.parse(validated.testedAt))) / (7 * 86400000))),
      totalScore: validated.totalScore,
      ratings: validated.ratings as Record<string, FitnessRating>,
      timeSeconds: validated.timeSeconds,
      trainingPlan: existing.actionPlan?.items ?? [],
      notes: validated.notes,
      recordedBy: actorId,
    };
    await tx.fitnessTestResult.update({
      where: { applicationId: application.id },
      data: { scores: mergeStorage(application.fitnessTestResult.scores, { ...existing, retests: [...(existing.retests ?? []), retest] }) },
    });
    await tx.statusHistory.create({
      data: { applicationId: application.id, status: String(application.status), label: `บันทึกผลทดสอบสมรรถภาพซ้ำ ${new Date(validated.testedAt).toLocaleDateString("th-TH")}`, by: actorId },
    });
    return { success: true, retest };
  });
}

export async function saveSportBenchmark(rawPayload: unknown) {
  const validated: ValidatedBenchmark = validateBenchmarkInput(rawPayload);
  return atomic(async tx => {
    const current = await tx.systemSetting.findUnique({ where: { key: "SPORT_BENCHMARKS" } });
    const benchmarks = mergeBenchmarks(current?.value);
    benchmarks[validated.sport] = { targetTimeSeconds: validated.targetTimeSeconds, targetScore: validated.targetScore };
    if (validated.sport === "กีฬาทางน้ำ" || validated.sport === "ว่ายน้ำ") {
      benchmarks["กีฬาทางน้ำ"] = { targetTimeSeconds: validated.targetTimeSeconds, targetScore: validated.targetScore };
      benchmarks["ว่ายน้ำ"] = { targetTimeSeconds: validated.targetTimeSeconds, targetScore: validated.targetScore };
    }
    await tx.systemSetting.upsert({
      where: { key: "SPORT_BENCHMARKS" },
      update: { value: json(benchmarks) },
      create: { key: "SPORT_BENCHMARKS", value: json(benchmarks) },
    });
    return { success: true, benchmarks };
  });
}

export async function recordAthleteMatchResult(rawPayload: unknown, actorId: string) {
  const validated = validateMatchResultInput(rawPayload);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const app = await tx.application.findUnique({
      where: { id: validated.applicationId },
      include: {
        competition: true,
        user: {
          select: {
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!app) {
      throw new PerformanceValidationError(404, "ไม่พบข้อมูลใบสมัครนักกีฬา");
    }
    if (!["STAFF_APPROVED", "FINAL_SELECTED"].includes(String(app.status))) {
      throw new PerformanceValidationError(400, "บันทึกผลได้เฉพาะนักกีฬาที่ผ่านการคัดเลือกแล้ว");
    }
    if (!PILOT_SPORTS.includes(app.sport)) {
      throw new PerformanceValidationError(400, "โมดูลสู่ความเป็นเลิศรองรับเฉพาะชนิดกีฬานำร่อง (กรีฑา, กีฬาทางน้ำ/ว่ายน้ำ)");
    }

    let matchId = validated.matchId;

    if (!matchId) {
      const match = await tx.competitionMatch.create({
        data: {
          competitionId: app.competitionId,
          sport: app.sport,
          category: validated.category,
          eventType: "INDIVIDUAL_MATCH",
          stage: validated.stage ?? "รอบคัดเลือก/เก็บคะแนน",
          notes: validated.staffNotes ?? validated.notes ?? null,
          status: "COMPLETED",
        },
      });
      matchId = match.id;
    } else {
      const match = await tx.competitionMatch.findFirst({
        where: {
          id: matchId,
          competitionId: app.competitionId,
          sport: app.sport,
        },
        include: {
          _count: { select: { entries: true } },
        },
      });
      if (!match) {
        throw new PerformanceValidationError(404, "ไม่พบรายการแข่งขันของนักกีฬา");
      }
      if (validated.staffNotes && match._count.entries > 1) {
        throw new PerformanceValidationError(409, "ไม่สามารถแก้ไขหมายเหตุรายบุคคลในแมตช์ที่มีนักกีฬาหลายคนได้");
      }
      await tx.competitionMatch.update({
        where: { id: matchId },
        data: {
          notes: validated.staffNotes ?? validated.notes ?? undefined,
          status: "COMPLETED",
        },
      });
    }

    const existingEntry = await tx.competitionMatchEntry.findFirst({
      where: {
        matchId,
        applicationId: validated.applicationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const participantName = `${app.user.profile?.firstName ?? ""} ${app.user.profile?.lastName ?? ""}`.trim() || undefined;

    let entry;
    if (existingEntry) {
      entry = await tx.competitionMatchEntry.update({
        where: { id: existingEntry.id },
        data: {
          participantName: participantName ?? existingEntry.participantName,
          score: validated.score,
          timeSeconds: validated.timeSeconds,
          rank: validated.rank,
          resultOutcome: validated.resultOutcome,
          isWinner: validated.isWinner,
        },
      });
    } else {
      entry = await tx.competitionMatchEntry.create({
        data: {
          matchId,
          applicationId: validated.applicationId,
          clubId: app.clubId,
          participantName,
          side: validated.side ?? null,
          score: validated.score,
          timeSeconds: validated.timeSeconds,
          rank: validated.rank,
          resultOutcome: validated.resultOutcome,
          isWinner: validated.isWinner,
        },
      });
    }

    await tx.statusHistory.create({
      data: {
        applicationId: app.id,
        status: String(app.status),
        label: `บันทึกผลการแข่งขัน: ${validated.resultOutcome ?? "บันทึกผลแล้ว"} (อันดับ ${validated.rank ?? "-"} / คะแนน ${validated.score ?? "-"})`,
        by: actorId,
      },
    });

    return {
      success: true,
      entry,
      matchId,
    };
  });
}

export const saveIndividualMatchResult = recordAthleteMatchResult;

