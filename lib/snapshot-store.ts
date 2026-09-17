import { DashboardMetrics, SportComparisonItem } from "./analytics-data";

export interface AnalyticsSnapshot {
  id: string;
  title: string;
  academicYear: string;
  roundName: string;
  timestamp: string; // ISO string
  authorName: string;
  metrics: DashboardMetrics;
  notes: string;
  sportsSummary: {
    sportName: string;
    applicants: number;
    approved: number;
    quota: number;
  }[];
}

const STORAGE_KEY = "athlete_analytics_snapshots_v1";

const DEFAULT_SNAPSHOTS: AnalyticsSnapshot[] = [
  {
    id: "snap-2567-final",
    title: "สรุปผลการคัดเลือกนักกีฬาตัวแทนมหาวิทยาลัย ประจำปีการศึกษา 2567 (รอบสุดท้าย)",
    academicYear: "2567",
    roundName: "กีฬามหาวิทยาลัย ครั้งที่ 51",
    timestamp: "2025-11-20T14:30:00.000Z",
    authorName: "นายเจ้าหน้าที่ กองกิจการนิสิต",
    metrics: {
      totalApplicants: 98,
      approvedCount: 76,
      mainSquadCount: 62,
      reserveSquadCount: 14,
      pendingCount: 0,
      rejectedCount: 22,
      acceptanceRate: 78,
      totalSports: 8,
      totalQuota: 96,
      quotaFilledPercentage: 79,
      totalBudgetAllocated: 220000,
      totalBudgetUsed: 215000,
      budgetUtilizationRate: 98,
    },
    notes: "การคัดเลือกเสร็จสิ้นสมบูรณ์ นักกีฬาตัวแทนเข้าฝึกซ้อมตามแผน ผลการแข่งขันได้เหรียญทอง 3 เหรียญ",
    sportsSummary: [
      { sportName: "ฟุตบอล", applicants: 28, approved: 22, quota: 22 },
      { sportName: "บาสเกตบอล", applicants: 19, approved: 12, quota: 12 },
      { sportName: "วอลเลย์บอล", applicants: 15, approved: 12, quota: 14 },
      { sportName: "ว่ายน้ำ", applicants: 14, approved: 12, quota: 16 },
      { sportName: "เปตอง", applicants: 12, approved: 8, quota: 8 },
    ],
  },
  {
    id: "snap-2568-r1",
    title: "สรุปผลคัดเลือกรอบแรก ประจำปีการศึกษา 2568 (รอบภาคเหนือ)",
    academicYear: "2568",
    roundName: "กีฬามหาวิทยาลัย ครั้งที่ 52 รอบคัดเลือก",
    timestamp: "2026-08-15T09:15:00.000Z",
    authorName: "นายเจ้าหน้าที่ กองกิจการนิสิต",
    metrics: {
      totalApplicants: 112,
      approvedCount: 68,
      mainSquadCount: 54,
      reserveSquadCount: 14,
      pendingCount: 30,
      rejectedCount: 14,
      acceptanceRate: 61,
      totalSports: 8,
      totalQuota: 96,
      quotaFilledPercentage: 71,
      totalBudgetAllocated: 232000,
      totalBudgetUsed: 141700,
      budgetUtilizationRate: 61,
    },
    notes: "รอบแรกกำลังอยู่ระหว่างการประกาศผลตัวจริงและทดสอบสมรรถภาพทางกายภาพ",
    sportsSummary: [
      { sportName: "ฟุตบอล", applicants: 24, approved: 18, quota: 22 },
      { sportName: "บาสเกตบอล", applicants: 18, approved: 10, quota: 12 },
      { sportName: "วอลเลย์บอล", applicants: 12, approved: 8, quota: 14 },
      { sportName: "ว่ายน้ำ", applicants: 14, approved: 10, quota: 16 },
    ],
  },
];

export function getSnapshots(): AnalyticsSnapshot[] {
  if (typeof window === "undefined") {
    return DEFAULT_SNAPSHOTS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SNAPSHOTS));
      return DEFAULT_SNAPSHOTS;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read snapshots from localStorage:", error);
    return DEFAULT_SNAPSHOTS;
  }
}

export function saveSnapshot(snapshot: Omit<AnalyticsSnapshot, "id" | "timestamp">): AnalyticsSnapshot {
  const newSnapshot: AnalyticsSnapshot = {
    ...snapshot,
    id: `snap-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = getSnapshots();
      const updated = [newSnapshot, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save snapshot to localStorage:", error);
    }
  }

  return newSnapshot;
}

export function deleteSnapshot(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getSnapshots();
    const updated = current.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Failed to delete snapshot:", error);
    return false;
  }
}
