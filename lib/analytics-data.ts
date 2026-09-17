export interface RawApplicant {
  id: string;
  firstName: string;
  lastName: string;
  gender: "ชาย" | "หญิง";
  studentId: string;
  faculty: string;
  sportId: string;
  sportName: string;
  category: string; // เช่น กองหน้า, ตัวรับ, รุ่นน้ำหนัก
  studentLevel: "bachelor" | "graduate";
  year: string;
  gpaCumulative: number;
  status: "pending" | "approved" | "rejected";
  squadType: "main" | "reserve" | "unassigned";
}

export interface SportQuotaInfo {
  id: string;
  name: string;
  categoryType: "mandatory" | "international" | "general" | "thai" | "demonstration";
  categoryLabel: string;
  maxAthletes: number;
  clubName: string;
  budgetAllocated: number;
  budgetUsed: number;
}

export const SPORTS_CATALOG: SportQuotaInfo[] = [
  {
    id: "football",
    name: "ฟุตบอล",
    categoryType: "mandatory",
    categoryLabel: "กีฬาบังคับ",
    maxAthletes: 22,
    clubName: "ชมรมฟุตบอล",
    budgetAllocated: 50000,
    budgetUsed: 38500,
  },
  {
    id: "basketball",
    name: "บาสเกตบอล",
    categoryType: "mandatory",
    categoryLabel: "กีฬาบังคับ",
    maxAthletes: 12,
    clubName: "ชมรมบาสเกตบอล",
    budgetAllocated: 40000,
    budgetUsed: 29000,
  },
  {
    id: "volleyball",
    name: "วอลเลย์บอล",
    categoryType: "mandatory",
    categoryLabel: "กีฬาบังคับ",
    maxAthletes: 14,
    clubName: "ชมรมวอลเลย์บอล",
    budgetAllocated: 35000,
    budgetUsed: 22000,
  },
  {
    id: "swimming",
    name: "ว่ายน้ำ",
    categoryType: "mandatory",
    categoryLabel: "กีฬาบังคับ",
    maxAthletes: 16,
    clubName: "ชมรมว่ายน้ำ",
    budgetAllocated: 30000,
    budgetUsed: 18500,
  },
  {
    id: "petanque",
    name: "เปตอง",
    categoryType: "international",
    categoryLabel: "กีฬาเลือกสากล",
    maxAthletes: 8,
    clubName: "ชมรมเปตอง",
    budgetAllocated: 15000,
    budgetUsed: 9200,
  },
  {
    id: "badminton",
    name: "แบดมินตัน",
    categoryType: "international",
    categoryLabel: "กีฬาเลือกสากล",
    maxAthletes: 10,
    clubName: "ชมรมแบดมินตัน",
    budgetAllocated: 25000,
    budgetUsed: 21000,
  },
  {
    id: "thaifencing",
    name: "ดาบไทย",
    categoryType: "thai",
    categoryLabel: "กีฬาไทย",
    maxAthletes: 6,
    clubName: "ชมรมกีฬาไทย",
    budgetAllocated: 12000,
    budgetUsed: 7500,
  },
  {
    id: "esports",
    name: "อีสปอร์ต",
    categoryType: "demonstration",
    categoryLabel: "กีฬาสาธิต",
    maxAthletes: 8,
    clubName: "ชมรมอีสปอร์ต",
    budgetAllocated: 20000,
    budgetUsed: 14000,
  },
];

export const MOCK_ALL_APPLICANTS: RawApplicant[] = [
  // ฟุตบอล (22 quota, 24 applicants)
  { id: "fb-1", firstName: "สมชาย", lastName: "ใจดี", gender: "ชาย", studentId: "66027012", faculty: "วิทยาศาสตร์", sportId: "football", sportName: "ฟุตบอล", category: "กองหน้า", studentLevel: "bachelor", year: "4", gpaCumulative: 3.50, status: "approved", squadType: "main" },
  { id: "fb-2", firstName: "กิตติศักดิ์", lastName: "มั่นคง", gender: "ชาย", studentId: "66028114", faculty: "วิศวกรรมศาสตร์", sportId: "football", sportName: "ฟุตบอล", category: "กองกลาง", studentLevel: "bachelor", year: "3", gpaCumulative: 3.12, status: "approved", squadType: "main" },
  { id: "fb-3", firstName: "ณัฐพล", lastName: "ศรีกุล", gender: "ชาย", studentId: "65039201", faculty: "เทคโนโลยีสารสนเทศ", sportId: "football", sportName: "ฟุตบอล", category: "กองหลัง", studentLevel: "bachelor", year: "4", gpaCumulative: 2.85, status: "approved", squadType: "main" },
  { id: "fb-4", firstName: "ภานุวัฒน์", lastName: "สุขสวัสดิ์", gender: "ชาย", studentId: "67041022", faculty: "วิทยาการจัดการ", sportId: "football", sportName: "ฟุตบอล", category: "ผู้รักษาประตู", studentLevel: "bachelor", year: "2", gpaCumulative: 3.40, status: "approved", squadType: "main" },
  { id: "fb-5", firstName: "ธนกฤต", lastName: "วงศ์สว่าง", gender: "ชาย", studentId: "67015520", faculty: "วิศวกรรมศาสตร์", sportId: "football", sportName: "ฟุตบอล", category: "กองหน้า", studentLevel: "bachelor", year: "2", gpaCumulative: 2.95, status: "approved", squadType: "reserve" },
  { id: "fb-6", firstName: "ชานนท์", lastName: "เรืองศิลป์", gender: "ชาย", studentId: "68019931", faculty: "เกษตรศาสตร์", sportId: "football", sportName: "ฟุตบอล", category: "กองกลาง", studentLevel: "bachelor", year: "1", gpaCumulative: 3.20, status: "pending", squadType: "unassigned" },
  { id: "fb-7", firstName: "วีระ", lastName: "ชูชาติ", gender: "ชาย", studentId: "66088211", faculty: "รัฐศาสตร์", sportId: "football", sportName: "ฟุตบอล", category: "กองหลัง", studentLevel: "bachelor", year: "3", gpaCumulative: 2.70, status: "pending", squadType: "unassigned" },
  { id: "fb-8", firstName: "วรวุฒิ", lastName: "แสงเพชร", gender: "ชาย", studentId: "65011982", faculty: "นิติศาสตร์", sportId: "football", sportName: "ฟุตบอล", category: "กองหน้า", studentLevel: "bachelor", year: "4", gpaCumulative: 2.45, status: "rejected", squadType: "unassigned" },

  // บาสเกตบอล (12 quota, 18 applicants)
  { id: "bb-1", firstName: "สมหญิง", lastName: "รักดี", gender: "หญิง", studentId: "66014452", faculty: "มนุษยศาสตร์", sportId: "basketball", sportName: "บาสเกตบอล", category: "Point Guard", studentLevel: "bachelor", year: "3", gpaCumulative: 3.65, status: "approved", squadType: "main" },
  { id: "bb-2", firstName: "เอกชัย", lastName: "ทองดี", gender: "ชาย", studentId: "65099812", faculty: "ศึกษาศาสตร์", sportId: "basketball", sportName: "บาสเกตบอล", category: "Center", studentLevel: "bachelor", year: "4", gpaCumulative: 3.25, status: "approved", squadType: "main" },
  { id: "bb-3", firstName: "ศิริชัย", lastName: "พุ่มพวง", gender: "ชาย", studentId: "67023341", faculty: "วิทยาศาสตร์", sportId: "basketball", sportName: "บาสเกตบอล", category: "Shooting Guard", studentLevel: "bachelor", year: "2", gpaCumulative: 3.10, status: "approved", squadType: "reserve" },
  { id: "bb-4", firstName: "วาสนา", lastName: "งามเนตร", gender: "หญิง", studentId: "66055419", faculty: "พยาบาลศาสตร์", sportId: "basketball", sportName: "บาสเกตบอล", category: "Small Forward", studentLevel: "bachelor", year: "3", gpaCumulative: 3.75, status: "pending", squadType: "unassigned" },
  { id: "bb-5", firstName: "อนุชา", lastName: "ชาญวิทย์", gender: "ชาย", studentId: "68033211", faculty: "วิทยาการจัดการ", sportId: "basketball", sportName: "บาสเกตบอล", category: "Power Forward", studentLevel: "bachelor", year: "1", gpaCumulative: 2.80, status: "pending", squadType: "unassigned" },
  { id: "bb-6", firstName: "ดวงพร", lastName: "มีสุข", gender: "หญิง", studentId: "65044231", faculty: "มนุษยศาสตร์", sportId: "basketball", sportName: "บาสเกตบอล", category: "Point Guard", studentLevel: "graduate", year: "1", gpaCumulative: 3.85, status: "approved", squadType: "main" },

  // วอลเลย์บอล (14 quota, 12 applicants)
  { id: "vb-1", firstName: "นภา", lastName: "ฟ้าใส", gender: "หญิง", studentId: "66045002", faculty: "มนุษยศาสตร์", sportId: "volleyball", sportName: "วอลเลย์บอล", category: "ตัวรับ", studentLevel: "bachelor", year: "3", gpaCumulative: 3.55, status: "approved", squadType: "main" },
  { id: "vb-2", firstName: "กัลยา", lastName: "ศรีรัตน์", gender: "หญิง", studentId: "67011988", faculty: "สาธารณสุขศาสตร์", sportId: "volleyball", sportName: "วอลเลย์บอล", category: "ตัวเซต", studentLevel: "bachelor", year: "2", gpaCumulative: 3.30, status: "approved", squadType: "main" },
  { id: "vb-3", firstName: "วิโรจน์", lastName: "บุญส่ง", gender: "ชาย", studentId: "66099182", faculty: "วิศวกรรมศาสตร์", sportId: "volleyball", sportName: "วอลเลย์บอล", category: "ตัวรุก", studentLevel: "bachelor", year: "3", gpaCumulative: 2.90, status: "approved", squadType: "reserve" },
  { id: "vb-4", firstName: "ประภาส", lastName: "จันทร์ดี", gender: "ชาย", studentId: "68022134", faculty: "วิทยาศาสตร์", sportId: "volleyball", sportName: "วอลเลย์บอล", category: "ตัวต้าน", studentLevel: "bachelor", year: "1", gpaCumulative: 3.15, status: "pending", squadType: "unassigned" },

  // ว่ายน้ำ (16 quota, 14 applicants)
  { id: "sw-1", firstName: "ธนา", lastName: "มั่งมี", gender: "ชาย", studentId: "65022119", faculty: "วิทยาศาสตร์การกีฬา", sportId: "swimming", sportName: "ว่ายน้ำ", category: "100m ฟรีสไตล์", studentLevel: "bachelor", year: "4", gpaCumulative: 3.42, status: "approved", squadType: "main" },
  { id: "sw-2", firstName: "พลอยไพลิน", lastName: "แก้วมณี", gender: "หญิง", studentId: "66077812", faculty: "แพทยศาสตร์", sportId: "swimming", sportName: "ว่ายน้ำ", category: "50m ผีเสื้อ", studentLevel: "bachelor", year: "3", gpaCumulative: 3.90, status: "approved", squadType: "main" },
  { id: "sw-3", firstName: "รัชชานนท์", lastName: "สุขเกษม", gender: "ชาย", studentId: "67044321", faculty: "วิศวกรรมศาสตร์", sportId: "swimming", sportName: "ว่ายน้ำ", category: "200m กบ", studentLevel: "bachelor", year: "2", gpaCumulative: 3.05, status: "pending", squadType: "unassigned" },
  { id: "sw-4", firstName: "สุภัสสรา", lastName: "คงทอง", gender: "หญิง", studentId: "68011244", faculty: "มนุษยศาสตร์", sportId: "swimming", sportName: "ว่ายน้ำ", category: "100m กรรเชียง", studentLevel: "bachelor", year: "1", gpaCumulative: 3.25, status: "pending", squadType: "unassigned" },

  // เปตอง (8 quota, 10 applicants)
  { id: "pt-1", firstName: "สมศักดิ์", lastName: "ยืนยง", gender: "ชาย", studentId: "65088192", faculty: "เกษตรศาสตร์", sportId: "petanque", sportName: "เปตอง", category: "มือตี", studentLevel: "bachelor", year: "4", gpaCumulative: 2.95, status: "approved", squadType: "main" },
  { id: "pt-2", firstName: "ดวงใจ", lastName: "คำดี", gender: "หญิง", studentId: "66033419", faculty: "ศึกษาศาสตร์", sportId: "petanque", sportName: "เปตอง", category: "มือวาง", studentLevel: "bachelor", year: "3", gpaCumulative: 3.60, status: "approved", squadType: "main" },
  { id: "pt-3", firstName: "ธีรเดช", lastName: "พรประเสริฐ", gender: "ชาย", studentId: "67099231", faculty: "นิติศาสตร์", sportId: "petanque", sportName: "เปตอง", category: "มือตี", studentLevel: "bachelor", year: "2", gpaCumulative: 2.85, status: "pending", squadType: "unassigned" },

  // แบดมินตัน (10 quota, 15 applicants)
  { id: "bm-1", firstName: "กิตติพงษ์", lastName: "โสภณ", gender: "ชาย", studentId: "66011299", faculty: "วิทยาการจัดการ", sportId: "badminton", sportName: "แบดมินตัน", category: "ชายเดี่ยว", studentLevel: "bachelor", year: "3", gpaCumulative: 3.48, status: "approved", squadType: "main" },
  { id: "bm-2", firstName: "ชนกนันท์", lastName: "วิริยะ", gender: "หญิง", studentId: "67088123", faculty: "วิทยาศาสตร์", sportId: "badminton", sportName: "แบดมินตัน", category: "หญิงเดี่ยว", studentLevel: "bachelor", year: "2", gpaCumulative: 3.72, status: "approved", squadType: "main" },
  { id: "bm-3", firstName: "ปัณณธร", lastName: "เจริญสุข", gender: "ชาย", studentId: "68055431", faculty: "เทคโนโลยีสารสนเทศ", sportId: "badminton", sportName: "แบดมินตัน", category: "คู่ผสม", studentLevel: "bachelor", year: "1", gpaCumulative: 3.00, status: "pending", squadType: "unassigned" },

  // ดาบไทย (6 quota, 7 applicants)
  { id: "tf-1", firstName: "พชร", lastName: "พยุหะ", gender: "ชาย", studentId: "65044129", faculty: "ศิลปศาสตร์", sportId: "thaifencing", sportName: "ดาบไทย", category: "ดาบสองมือ", studentLevel: "graduate", year: "2", gpaCumulative: 3.80, status: "approved", squadType: "main" },
  { id: "tf-2", firstName: "อรรถพล", lastName: "กล้าหาญ", gender: "ชาย", studentId: "67011922", faculty: "ศึกษาศาสตร์", sportId: "thaifencing", sportName: "ดาบไทย", category: "ดาบเดี่ยว", studentLevel: "bachelor", year: "2", gpaCumulative: 3.10, status: "approved", squadType: "main" },

  // อีสปอร์ต (8 quota, 16 applicants)
  { id: "es-1", firstName: "ธนพล", lastName: "ดิจิทัล", gender: "ชาย", studentId: "67099411", faculty: "เทคโนโลยีสารสนเทศ", sportId: "esports", sportName: "อีสปอร์ต", category: "MOBA", studentLevel: "bachelor", year: "2", gpaCumulative: 3.35, status: "approved", squadType: "main" },
  { id: "es-2", firstName: "อารียา", lastName: "เกมมิ่ง", gender: "หญิง", studentId: "68022819", faculty: "สถาปัตยกรรมศาสตร์", sportId: "esports", sportName: "อีสปอร์ต", category: "FPS", studentLevel: "bachelor", year: "1", gpaCumulative: 3.50, status: "approved", squadType: "main" },
  { id: "es-3", firstName: "ก้องภพ", lastName: "สกิลเทพ", gender: "ชาย", studentId: "66011844", faculty: "วิศวกรรมศาสตร์", sportId: "esports", sportName: "อีสปอร์ต", category: "MOBA", studentLevel: "bachelor", year: "3", gpaCumulative: 2.90, status: "pending", squadType: "unassigned" },
];

export interface DashboardMetrics {
  totalApplicants: number;
  approvedCount: number;
  mainSquadCount: number;
  reserveSquadCount: number;
  pendingCount: number;
  rejectedCount: number;
  acceptanceRate: number;
  totalSports: number;
  totalQuota: number;
  quotaFilledPercentage: number;
  totalBudgetAllocated: number;
  totalBudgetUsed: number;
  budgetUtilizationRate: number;
}

export function computeMetrics(applicants: RawApplicant[], sports: SportQuotaInfo[] = SPORTS_CATALOG): DashboardMetrics {
  const totalApplicants = applicants.length;
  const approvedCount = applicants.filter((a) => a.status === "approved").length;
  const mainSquadCount = applicants.filter((a) => a.squadType === "main").length;
  const reserveSquadCount = applicants.filter((a) => a.squadType === "reserve").length;
  const pendingCount = applicants.filter((a) => a.status === "pending").length;
  const rejectedCount = applicants.filter((a) => a.status === "rejected").length;
  const acceptanceRate = totalApplicants > 0 ? Math.round((approvedCount / totalApplicants) * 100) : 0;

  const totalSports = sports.length;
  const totalQuota = sports.reduce((sum, s) => sum + s.maxAthletes, 0);
  const quotaFilledPercentage = totalQuota > 0 ? Math.round((approvedCount / totalQuota) * 100) : 0;

  const totalBudgetAllocated = sports.reduce((sum, s) => sum + s.budgetAllocated, 0);
  const totalBudgetUsed = sports.reduce((sum, s) => sum + s.budgetUsed, 0);
  const budgetUtilizationRate = totalBudgetAllocated > 0 ? Math.round((totalBudgetUsed / totalBudgetAllocated) * 100) : 0;

  return {
    totalApplicants,
    approvedCount,
    mainSquadCount,
    reserveSquadCount,
    pendingCount,
    rejectedCount,
    acceptanceRate,
    totalSports,
    totalQuota,
    quotaFilledPercentage,
    totalBudgetAllocated,
    totalBudgetUsed,
    budgetUtilizationRate,
  };
}

export interface SportComparisonItem {
  sportName: string;
  categoryLabel: string;
  applicants: number;
  approved: number;
  quota: number;
  pending: number;
  fillRate: number;
}

export function getSportComparisonData(applicants: RawApplicant[], sports: SportQuotaInfo[] = SPORTS_CATALOG): SportComparisonItem[] {
  return sports.map((s) => {
    const apps = applicants.filter((a) => a.sportId === s.id);
    const approved = apps.filter((a) => a.status === "approved").length;
    const pending = apps.filter((a) => a.status === "pending").length;
    const fillRate = s.maxAthletes > 0 ? Math.round((approved / s.maxAthletes) * 100) : 0;
    return {
      sportName: s.name,
      categoryLabel: s.categoryLabel,
      applicants: apps.length,
      approved,
      quota: s.maxAthletes,
      pending,
      fillRate,
    };
  });
}

export interface FacultyDistributionItem {
  faculty: string;
  total: number;
  approved: number;
  male: number;
  female: number;
}

export function getFacultyDistribution(applicants: RawApplicant[]): FacultyDistributionItem[] {
  const map = new Map<string, FacultyDistributionItem>();

  applicants.forEach((a) => {
    const existing = map.get(a.faculty) || {
      faculty: a.faculty,
      total: 0,
      approved: 0,
      male: 0,
      female: 0,
    };
    existing.total += 1;
    if (a.status === "approved") existing.approved += 1;
    if (a.gender === "ชาย") existing.male += 1;
    if (a.gender === "หญิง") existing.female += 1;
    map.set(a.faculty, existing);
  });

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export interface GenderRatioItem {
  name: string;
  value: number;
  color: string;
}

export function getGenderDistribution(applicants: RawApplicant[]): GenderRatioItem[] {
  const male = applicants.filter((a) => a.gender === "ชาย").length;
  const female = applicants.filter((a) => a.gender === "หญิง").length;
  return [
    { name: "ชาย", value: male, color: "#3B82F6" },
    { name: "หญิง", value: female, color: "#EC4899" },
  ];
}

export interface StatusDistributionItem {
  name: string;
  value: number;
  color: string;
}

export function getStatusDistribution(applicants: RawApplicant[]): StatusDistributionItem[] {
  const approved = applicants.filter((a) => a.status === "approved").length;
  const pending = applicants.filter((a) => a.status === "pending").length;
  const rejected = applicants.filter((a) => a.status === "rejected").length;
  return [
    { name: "ผ่านการคัดเลือก", value: approved, color: "#10B981" },
    { name: "รอการพิจารณา", value: pending, color: "#F59E0B" },
    { name: "ไม่ผ่านเกณฑ์", value: rejected, color: "#EF4444" },
  ];
}

export interface CategoryComplianceItem {
  category: string;
  label: string;
  count: number;
  required: number;
  status: "complete" | "in_progress" | "pending";
}

export function getCategoryCompliance(sports: SportQuotaInfo[] = SPORTS_CATALOG): CategoryComplianceItem[] {
  const counts: Record<string, number> = {
    mandatory: 0,
    international: 0,
    general: 0,
    thai: 0,
    demonstration: 0,
  };

  sports.forEach((s) => {
    counts[s.categoryType] = (counts[s.categoryType] || 0) + 1;
  });

  return [
    { category: "mandatory", label: "กีฬาบังคับ (ข้อ 9.1)", count: counts.mandatory, required: 6, status: counts.mandatory >= 4 ? "in_progress" : "pending" },
    { category: "international", label: "กีฬาเลือกสากล (ข้อ 9.2)", count: counts.international, required: 17, status: "in_progress" },
    { category: "thai", label: "กีฬาไทย (ข้อ 9.4)", count: counts.thai, required: 1, status: counts.thai >= 1 ? "complete" : "pending" },
    { category: "demonstration", label: "กีฬาสาธิต (ข้อ 9.6)", count: counts.demonstration, required: 1, status: counts.demonstration >= 1 ? "complete" : "pending" },
  ];
}
