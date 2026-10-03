// lib/team-official-store.ts
// ระบบฐานข้อมูลและการจัดการ Workflow เจ้าหน้าที่ทีมกีฬา (Team Official: ผู้จัดการทีม / ผู้ฝึกสอน)
// Workflow: ผู้สมัครยื่นคำขอ -> ประธานชมรมกีฬาตรวจสอบเอกสารและลงนามเสนอชื่อ -> กองกิจการนิสิตอนุมัติและออกรหัสขึ้นทะเบียน

export type OfficialPosition = "manager" | "coach" | "assistant_coach" | "other";

export const POSITION_LABEL: Record<OfficialPosition, string> = {
  manager: "ผู้จัดการทีม",
  coach: "ผู้ฝึกสอน",
  assistant_coach: "ผู้ช่วยผู้ฝึกสอน",
  other: "อื่นๆ",
};

export type OfficialDocType = "photo" | "id_card" | "name_change" | "training_plan";

export type ReviewStatus = "pending" | "approved" | "returned" | "rejected";

export interface OfficialDocument {
  id: string;
  type: OfficialDocType;
  title: string;
  category: string;
  filename: string;
  clubStatus: ReviewStatus;
  clubComment?: string;
  staffStatus: ReviewStatus;
  staffComment?: string;
  updatedAt?: string;
}

export type OfficialStage =
  | "submitted_to_club" // ยื่นเรื่องรอประธานชมรมตรวจ
  | "club_approved"     // ประธานชมรมตรวจผ่านและลงนามส่งกองกิจ
  | "club_returned"     // ประธานชมรมตีกลับให้ผู้สมัครแก้ไข
  | "club_rejected"     // ประธานชมรมปฏิเสธ
  | "staff_approved"    // กองกิจอนุมัติขึ้นทะเบียนเรียบร้อย (สำเร็จ)
  | "staff_returned"    // กองกิจตีกลับให้แก้ไข
  | "staff_rejected";   // กองกิจไม่อนุมัติ

export interface TeamOfficialApplication {
  id: string;
  regCode: string; // เช่น UP-OFF-2569-001
  clubId: string;  // e.g. "football", "basketball", "volleyball", "swimming"
  sportName: string; // e.g. "ฟุตบอล"
  appliedPosition: OfficialPosition;
  appliedPositionOther?: string;

  // Personal Info
  firstName: string;
  lastName: string;
  nationalId: string;
  nationality: string;
  birthDate: string;

  // Contact & Address
  addressNo: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;

  // Career / Experience
  workplace: string;
  workPosition: string;
  previousCount: string;

  // Workflow Timeline
  submittedAt: string;
  stage: OfficialStage;

  // Club President Review
  clubReviewedAt?: string;
  clubReviewedBy?: string;
  clubFeedback?: string;

  // Staff Review
  staffReviewedAt?: string;
  staffReviewedBy?: string;
  staffFeedback?: string;
  officialLicenseId?: string; // รหัสขึ้นทะเบียน กกมท. ครั้งที่ 52 เมื่อกองกิจอนุมัติ (เช่น KKMT52-OFF-FTB-001)

  // Documents
  documents: OfficialDocument[];
}

const STORAGE_KEY_OFFICIALS = "smed_team_officials_v1";

// ข้อมูลจำลองเริ่มต้นครอบคลุมทั้ง 4 สถานะหลัก
export const DEFAULT_TEAM_OFFICIALS: TeamOfficialApplication[] = [
  {
    id: "off-1",
    regCode: "UP-OFF-2569-001",
    clubId: "football",
    sportName: "ฟุตบอล",
    appliedPosition: "manager",
    firstName: "ดร.วิชัย",
    lastName: "เจริญสุข",
    nationalId: "1-5601-00234-56-1",
    nationality: "ไทย",
    birthDate: "1980-04-15",
    addressNo: "112/5",
    subDistrict: "แม่กา",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "081-999-1234",
    email: "wichai.c@up.ac.th",
    workplace: "คณะวิทยาการจัดการ มหาวิทยาลัยพะเยา",
    workPosition: "อาจารย์ประจำสาขาการจัดการกีฬา",
    previousCount: "3",
    submittedAt: "25 กันยายน 2569 09:30 น.",
    stage: "staff_approved",
    clubReviewedAt: "26 กันยายน 2569 14:15 น.",
    clubReviewedBy: "นายสมชาย ใจดี (ประธานชมรมฟุตบอล)",
    clubFeedback: "ผ่านการรับรองและเห็นชอบแผนการฝึกซ้อมจากชมรมฟุตบอลครบถ้วน",
    staffReviewedAt: "28 กันยายน 2569 11:00 น.",
    staffReviewedBy: "หัวหน้างานกีฬา กองกิจการนิสิต",
    staffFeedback: "อนุมัติขึ้นทะเบียนบุคลากรกีฬา กกมท. ครั้งที่ 52 อย่างเป็นทางการ",
    officialLicenseId: "KKMT52-OFF-FTB-001",
    documents: [
      {
        id: "doc-photo",
        type: "photo",
        title: "รูปถ่ายหน้าตรงชุดสุภาพ 1 นิ้ว",
        category: "ภาพถ่ายสำหรับทำบัตร AD Card",
        filename: "photo_wichai.jpg",
        clubStatus: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-idcard",
        type: "id_card",
        title: "สำเนาบัตรประจำตัวประชาชน",
        category: "เอกสารยืนยันตัวตน",
        filename: "idcard_wichai.pdf",
        clubStatus: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-namechange",
        type: "name_change",
        title: "สำเนาหลักฐานเปลี่ยนชื่อ - นามสกุล",
        category: "เอกสารทางกฎหมาย (ถ้ามี)",
        filename: "namechange_wichai.pdf",
        clubStatus: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-plan",
        type: "training_plan",
        title: "แผนการฝึกซ้อมกีฬาและเก็บตัว (1 เดือน)",
        category: "แผนงานและตารางฝึกซ้อม",
        filename: "training_plan_football_2569.pdf",
        clubStatus: "approved",
        staffStatus: "approved",
      },
    ],
  },
  {
    id: "off-2",
    regCode: "UP-OFF-2569-002",
    clubId: "football",
    sportName: "ฟุตบอล",
    appliedPosition: "coach",
    firstName: "นายธีระศักดิ์",
    lastName: "มั่นคง",
    nationalId: "1-5602-00345-67-2",
    nationality: "ไทย",
    birthDate: "1985-08-20",
    addressNo: "45/2",
    subDistrict: "บ้านต๋อม",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "082-888-5678",
    email: "teerasak.m@gmail.com",
    workplace: "สโมสรฟุตบอลสิงห์พะเยา อคาเดมี่",
    workPosition: "หัวหน้าผู้ฝึกสอน AFC B-License",
    previousCount: "2",
    submittedAt: "27 กันยายน 2569 13:00 น.",
    stage: "club_approved",
    clubReviewedAt: "28 กันยายน 2569 10:30 น.",
    clubReviewedBy: "นายสมชาย ใจดี (ประธานชมรมฟุตบอล)",
    clubFeedback: "มีคุณวุฒิผู้ฝึกสอนถูกต้อง แผนการฝึกซ้อมผ่านเกณฑ์ เสนอชื่อต่อกองกิจการนิสิต",
    documents: [
      {
        id: "doc-photo",
        type: "photo",
        title: "รูปถ่ายหน้าตรงชุดสุภาพ 1 นิ้ว",
        category: "ภาพถ่ายสำหรับทำบัตร AD Card",
        filename: "photo_teerasak.jpg",
        clubStatus: "approved",
        staffStatus: "pending",
      },
      {
        id: "doc-idcard",
        type: "id_card",
        title: "สำเนาบัตรประจำตัวประชาชน",
        category: "เอกสารยืนยันตัวตน",
        filename: "idcard_teerasak.pdf",
        clubStatus: "approved",
        staffStatus: "pending",
      },
      {
        id: "doc-namechange",
        type: "name_change",
        title: "สำเนาหลักฐานเปลี่ยนชื่อ - นามสกุล",
        category: "เอกสารทางกฎหมาย (ถ้ามี)",
        filename: "-",
        clubStatus: "approved",
        staffStatus: "pending",
      },
      {
        id: "doc-plan",
        type: "training_plan",
        title: "แผนการฝึกซ้อมกีฬาและเก็บตัว (1 เดือน)",
        category: "แผนงานและตารางฝึกซ้อม",
        filename: "football_tactical_plan_2569.pdf",
        clubStatus: "approved",
        staffStatus: "pending",
      },
    ],
  },
  {
    id: "off-3",
    regCode: "UP-OFF-2569-003",
    clubId: "football",
    sportName: "ฟุตบอล",
    appliedPosition: "assistant_coach",
    firstName: "นายพงศธร",
    lastName: "วงค์แก้ว",
    nationalId: "1-5603-00456-78-3",
    nationality: "ไทย",
    birthDate: "1992-11-05",
    addressNo: "89/1",
    subDistrict: "แม่ต๋ำ",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "083-777-9012",
    email: "pongsathorn.w@up.ac.th",
    workplace: "กองบริการการศึกษา มหาวิทยาลัยพะเยา",
    workPosition: "นักวิชาการศึกษา",
    previousCount: "0",
    submittedAt: "28 กันยายน 2569 16:45 น.",
    stage: "submitted_to_club",
    documents: [
      {
        id: "doc-photo",
        type: "photo",
        title: "รูปถ่ายหน้าตรงชุดสุภาพ 1 นิ้ว",
        category: "ภาพถ่ายสำหรับทำบัตร AD Card",
        filename: "photo_pongsathorn.jpg",
        clubStatus: "pending",
        staffStatus: "pending",
      },
      {
        id: "doc-idcard",
        type: "id_card",
        title: "สำเนาบัตรประจำตัวประชาชน",
        category: "เอกสารยืนยันตัวตน",
        filename: "idcard_pongsathorn.pdf",
        clubStatus: "pending",
        staffStatus: "pending",
      },
      {
        id: "doc-namechange",
        type: "name_change",
        title: "สำเนาหลักฐานเปลี่ยนชื่อ - นามสกุล",
        category: "เอกสารทางกฎหมาย (ถ้ามี)",
        filename: "-",
        clubStatus: "pending",
        staffStatus: "pending",
      },
      {
        id: "doc-plan",
        type: "training_plan",
        title: "แผนการฝึกซ้อมกีฬาและเก็บตัว (1 เดือน)",
        category: "แผนงานและตารางฝึกซ้อม",
        filename: "goalkeeper_drill_plan.pdf",
        clubStatus: "pending",
        staffStatus: "pending",
      },
    ],
  },
  {
    id: "off-4",
    regCode: "UP-OFF-2569-004",
    clubId: "basketball",
    sportName: "บาสเกตบอล",
    appliedPosition: "coach",
    firstName: "นายกิตติคุณ",
    lastName: "เลิศวิทยากุล",
    nationalId: "1-5604-00567-89-4",
    nationality: "ไทย",
    birthDate: "1988-02-14",
    addressNo: "220",
    subDistrict: "เวียง",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "084-666-3344",
    email: "kittikun.bball@gmail.com",
    workplace: "ชมรมบาสเกตบอลเยาวชนพะเยา",
    workPosition: "ผู้ฝึกสอนบาสเกตบอลระดับชาติ",
    previousCount: "1",
    submittedAt: "26 กันยายน 2569 11:20 น.",
    stage: "staff_returned",
    clubReviewedAt: "27 กันยายน 2569 09:00 น.",
    clubReviewedBy: "นางสาวสมหญิง รักดี (ประธานชมรมบาสเกตบอล)",
    clubFeedback: "ผ่านการพิจารณาเบื้องต้น",
    staffReviewedAt: "28 กันยายน 2569 14:00 น.",
    staffReviewedBy: "เจ้าหน้าที่งานกีฬา กองกิจการนิสิต",
    staffFeedback: "แผนการฝึกซ้อมกีฬาไม่ระบุสถานที่และตารางการเก็บตัว กรุณาแนบฉบับแก้ไขที่มีรายละเอียดครบถ้วน",
    documents: [
      {
        id: "doc-photo",
        type: "photo",
        title: "รูปถ่ายหน้าตรงชุดสุภาพ 1 นิ้ว",
        category: "ภาพถ่ายสำหรับทำบัตร AD Card",
        filename: "photo_kittikun.jpg",
        clubStatus: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-idcard",
        type: "id_card",
        title: "สำเนาบัตรประจำตัวประชาชน",
        category: "เอกสารยืนยันตัวตน",
        filename: "idcard_kittikun.pdf",
        clubStatus: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-namechange",
        type: "name_change",
        title: "สำเนาหลักฐานเปลี่ยนชื่อ - นามสกุล",
        category: "เอกสารทางกฎหมาย (ถ้ามี)",
        filename: "-",
        clubStatus: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-plan",
        type: "training_plan",
        title: "แผนการฝึกซ้อมกีฬาและเก็บตัว (1 เดือน)",
        category: "แผนงานและตารางฝึกซ้อม",
        filename: "basketball_training_plan_v1.pdf",
        clubStatus: "approved",
        staffStatus: "returned",
        staffComment: "แผนการฝึกซ้อมกีฬาไม่ระบุสถานที่และตารางการเก็บตัว กรุณาแนบฉบับแก้ไขที่มีรายละเอียดครบถ้วน",
      },
    ],
  },
];

// Helper Functions
export function getTeamOfficials(clubId?: string): TeamOfficialApplication[] {
  if (typeof window === "undefined") return DEFAULT_TEAM_OFFICIALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFICIALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_OFFICIALS, JSON.stringify(DEFAULT_TEAM_OFFICIALS));
      return clubId ? DEFAULT_TEAM_OFFICIALS.filter((o) => o.clubId === clubId) : DEFAULT_TEAM_OFFICIALS;
    }
    const list: TeamOfficialApplication[] = JSON.parse(raw);
    return clubId ? list.filter((o) => o.clubId === clubId) : list;
  } catch {
    return clubId ? DEFAULT_TEAM_OFFICIALS.filter((o) => o.clubId === clubId) : DEFAULT_TEAM_OFFICIALS;
  }
}

export function saveTeamOfficials(data: TeamOfficialApplication[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_OFFICIALS, JSON.stringify(data));
  } catch (err) {
    console.error("saveTeamOfficials error", err);
  }
}

export function getOfficialById(id: string): TeamOfficialApplication | undefined {
  const list = getTeamOfficials();
  return list.find((o) => o.id === id || o.regCode === id);
}

export function addOfficialApplication(
  payload: Omit<TeamOfficialApplication, "id" | "regCode" | "stage" | "submittedAt">
): TeamOfficialApplication {
  const list = getTeamOfficials();
  const nextNum = list.length + 1;
  const regCode = `UP-OFF-2569-${String(nextNum).padStart(3, "0")}`;
  const now = new Date();
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const dateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543} เวลา ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} น.`;

  const newApp: TeamOfficialApplication = {
    ...payload,
    id: `off-${Date.now()}`,
    regCode,
    stage: "submitted_to_club",
    submittedAt: dateStr,
  };

  const updated = [newApp, ...list];
  saveTeamOfficials(updated);
  return newApp;
}

// 1. Club President Actions
export function updateClubDocReview(
  officialId: string,
  docId: string,
  status: ReviewStatus,
  comment?: string
): TeamOfficialApplication[] {
  const list = getTeamOfficials();
  const updated = list.map((app) => {
    if (app.id !== officialId) return app;
    return {
      ...app,
      documents: app.documents.map((d) =>
        d.id === docId ? { ...d, clubStatus: status, clubComment: comment } : d
      ),
    };
  });
  saveTeamOfficials(updated);
  return updated;
}

export function updateClubReview(
  officialId: string,
  action: "approve" | "return" | "reject",
  feedback?: string,
  reviewerName = "ประธานชมรมกีฬา"
): TeamOfficialApplication[] {
  const list = getTeamOfficials();
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} น.`;

  const updated = list.map((app) => {
    if (app.id !== officialId) return app;
    const stage: OfficialStage =
      action === "approve"
        ? "club_approved"
        : action === "return"
        ? "club_returned"
        : "club_rejected";

    return {
      ...app,
      stage,
      clubReviewedAt: `วันนี้ ${timeStr}`,
      clubReviewedBy: reviewerName,
      clubFeedback: feedback,
    };
  });
  saveTeamOfficials(updated);
  return updated;
}

// 2. Staff Actions
export function updateStaffDocReview(
  officialId: string,
  docId: string,
  status: ReviewStatus,
  comment?: string
): TeamOfficialApplication[] {
  const list = getTeamOfficials();
  const updated = list.map((app) => {
    if (app.id !== officialId) return app;
    return {
      ...app,
      documents: app.documents.map((d) =>
        d.id === docId ? { ...d, staffStatus: status, staffComment: comment } : d
      ),
    };
  });
  saveTeamOfficials(updated);
  return updated;
}

export function updateStaffReview(
  officialId: string,
  action: "approve" | "return" | "reject",
  feedback?: string,
  reviewerName = "เจ้าหน้าที่งานกีฬา กองกิจการนิสิต"
): TeamOfficialApplication[] {
  const list = getTeamOfficials();
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} น.`;

  const updated = list.map((app) => {
    if (app.id !== officialId) return app;
    const stage: OfficialStage =
      action === "approve"
        ? "staff_approved"
        : action === "return"
        ? "staff_returned"
        : "staff_rejected";

    const licenseId =
      action === "approve"
        ? `KKMT52-OFF-${app.clubId.substring(0, 3).toUpperCase()}-${app.regCode.slice(-3)}`
        : app.officialLicenseId;

    return {
      ...app,
      stage,
      staffReviewedAt: `วันนี้ ${timeStr}`,
      staffReviewedBy: reviewerName,
      staffFeedback: feedback,
      officialLicenseId: licenseId,
    };
  });
  saveTeamOfficials(updated);
  return updated;
}
