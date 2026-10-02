// lib/club-store.ts
// ฐานข้อมูลและกลไกการจัดการ Workflow ของประธานชมรมกีฬา (Club President Workflow)
// 1. ซิงค์สถานะเปิด/ปิดรับสมัครกับกองกิจการนิสิต
// 2. ตรวจสอบเอกสารรายฉบับ พร้อมระบบอนุมัติ / ปฏิเสธ และ Comment แจ้งเตือนผู้สมัคร
// 3. ติดตามสถานะการส่งรายชื่อให้กองกิจการนิสิต และการตีกลับเอกสารเพื่อแก้ไข

export type DocumentStatus = "pending" | "approved" | "rejected";
export type StaffReviewStatus = "pending" | "approved" | "returned";

export interface ApplicantDocument {
  id: string;
  title: string;
  category: string;
  filename: string;
  status: DocumentStatus;
  comment?: string; // เหตุผลที่ชมรมปฏิเสธหรือแจ้งให้ผู้สมัครส่งใหม่
  updatedAt?: string;
  staffStatus?: StaffReviewStatus; // สถานะที่กองกิจการนิสิตตรวจ
  staffComment?: string; // ความเห็น / เหตุผลที่กองกิจการนิสิตตีกลับมา
  resubmitted?: boolean; // มีการส่งเอกสารฉบับแก้ไขกลับไปแล้วหรือไม่
  resubmittedFile?: string;
}

export interface ClubAthleteApplication {
  id: string;
  competitionId: string;
  firstName: string;
  lastName: string;
  gender: "ชาย" | "หญิง";
  studentId: string;
  faculty: string;
  major: string;
  year: string;
  studentLevel: "bachelor" | "graduate";
  nationalId: string;
  nationality: string;
  birthDate: string;
  gpaSemester: string;
  gpaCumulative: string;
  addressNo: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  category: string; // ตำแหน่ง / ประเภท
  division: string;
  hasPreviousEntry: "none" | "has";
  competitions: { competitionName: string; year: string; result: string }[];
  note: string;
  status: "pending" | "approved" | "rejected"; // สถานะการพิจารณาของชมรม
  squadType: "main" | "reserve" | "";
  rejectReason?: string;
  documents: ApplicantDocument[];
  staffStatus?: "pending" | "approved" | "returned"; // สถานะภาพรวมจากกองกิจ
  staffFeedback?: string;
}

export interface ClubCompetition {
  id: string;
  sport: string;
  eventName: string;
  category: string;
  round: "qualifier" | "final";
  totalApplicants: number;
  pendingCount: number;
  isOpen: boolean; // ซิงค์กับที่กองกิจการนิสิตเปิดรับสมัคร
  closedReason?: string;
  submissionStatus: "not_submitted" | "submitted_pending" | "action_required" | "approved";
  submittedAt?: string;
  approvedCount?: number;
  returnedCount?: number;
}

const STORAGE_KEY_COMPETITIONS = "smed_club_competitions_v1";
const STORAGE_KEY_APPLICANTS = "smed_club_applicants_v1";

// ข้อมูลเริ่มต้นของรายการแข่งขันชมรม (ซิงค์สถานะกับกองกิจ)
// เช่น ชมรมฟุตบอล มีรายการที่เปิดรับ และรายการที่กองกิจยังไม่เปิดรับ (แสดงเป็นแถบสีเทา)
export const DEFAULT_CLUB_COMPETITIONS: ClubCompetition[] = [
  {
    id: "1",
    sport: "ฟุตบอล",
    eventName: "ฟุตบอล 11 คน (ทีมชาย)",
    category: "กีฬาบังคับ",
    round: "qualifier",
    totalApplicants: 24,
    pendingCount: 5,
    isOpen: true,
    submissionStatus: "submitted_pending",
    submittedAt: "28 กันยายน 2569 เวลา 14:30 น.",
    approvedCount: 18,
    returnedCount: 2,
  },
  {
    id: "2",
    sport: "ฟุตบอล",
    eventName: "ฟุตบอล 7 คน (ทีมชาย)",
    category: "กีฬาบังคับ",
    round: "qualifier",
    totalApplicants: 12,
    pendingCount: 2,
    isOpen: true,
    submissionStatus: "not_submitted",
    approvedCount: 10,
    returnedCount: 0,
  },
  {
    id: "3",
    sport: "ฟุตบอล",
    eventName: "ฟุตบอล 11 คน (ทีมหญิง)",
    category: "กีฬาบังคับ",
    round: "qualifier",
    totalApplicants: 0,
    pendingCount: 0,
    isOpen: false, // ปิดรับสมัคร / กองกิจยังไม่เปิดรับ
    closedReason: "กองกิจการนิสิตยังไม่เปิดรับสมัครประเภทนี้ในรอบคัดเลือกเขตภาคเหนือ",
    submissionStatus: "not_submitted",
  },
  {
    id: "4",
    sport: "ฟุตบอล",
    eventName: "ฟุตซอล 5 คน (กีฬาเลือกสากล)",
    category: "กีฬาเลือกสากล",
    round: "final",
    totalApplicants: 0,
    pendingCount: 0,
    isOpen: false, // ปิดรับสมัคร
    closedReason: "อยู่ในการกำกับดูแลของชมรมฟุตซอล (แยกชมรมจัดตั้ง)",
    submissionStatus: "not_submitted",
  },
];

// รายการเอกสารมาตรฐาน 5 ฉบับ
export function createDefaultDocuments(studentId: string): ApplicantDocument[] {
  return [
    {
      id: "doc-1",
      title: "สำเนาบัตรประจำตัวประชาชน",
      category: "เอกสารยืนยันตัวตน",
      filename: `id_card_${studentId}.pdf`,
      status: "approved",
      staffStatus: "approved",
    },
    {
      id: "doc-2",
      title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา",
      category: "เอกสารยืนยันสถานะนิสิต",
      filename: `student_card_${studentId}.pdf`,
      status: "approved",
      staffStatus: "approved",
    },
    {
      id: "doc-3",
      title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)",
      category: "เอกสารรับรองสภาพนิสิต กกมท.",
      filename: `UP02_cert_${studentId}.pdf`,
      status: "approved",
      staffStatus: "returned",
      staffComment: "เอกสาร UP 02 ขาดลายมือชื่อนายทะเบียนสถาบัน กรุณาแนบฉบับที่มีตราประทับและลายเซ็นสมบูรณ์",
    },
    {
      id: "doc-4",
      title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)",
      category: "ผลการทดสอบสมรรถภาพสถาบัน",
      filename: `fitness_test_${studentId}.pdf`,
      status: "approved",
      staffStatus: "approved",
    },
    {
      id: "doc-5",
      title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา",
      category: "วุฒิบัตร / ผลงานการแข่งขัน",
      filename: `UP_Academy_${studentId}.pdf`,
      status: "approved",
      staffStatus: "approved",
    },
  ];
}

export const DEFAULT_CLUB_APPLICANTS: ClubAthleteApplication[] = [
  {
    id: "app-1",
    competitionId: "1",
    firstName: "สมชาย",
    lastName: "ใจดี",
    gender: "ชาย",
    studentId: "66027012",
    faculty: "คณะวิทยาศาสตร์",
    major: "สาขาวิทยาการคอมพิวเตอร์",
    year: "4",
    studentLevel: "bachelor",
    nationalId: "1-2345-67890-12-3",
    nationality: "ไทย",
    birthDate: "2003-05-12",
    gpaSemester: "3.45",
    gpaCumulative: "3.50",
    addressNo: "99/1",
    subDistrict: "แม่กา",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "081-234-5678",
    category: "กองหน้า (Forward)",
    division: "-",
    hasPreviousEntry: "none",
    competitions: [
      { competitionName: "ฟุตบอลกีฬาเขตภาคเหนือ / สมาคมกีฬาภาคเหนือ", year: "2568", result: "อันดับ 1" },
      { competitionName: "ฟุตบอลกีฬามหาวิทยาลัยฯ ครั้งที่ 51 / กกมท.", year: "2567", result: "เข้ารอบ 16 ทีม" },
    ],
    note: "ทักษะการจบสกอร์ยอดเยี่ยม ผ่านเกณฑ์สมรรถภาพระดับดีมาก",
    status: "approved",
    squadType: "main",
    documents: [
      {
        id: "doc-1",
        title: "สำเนาบัตรประจำตัวประชาชน",
        category: "เอกสารยืนยันตัวตน",
        filename: "id_card_66027012.pdf",
        status: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-2",
        title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา",
        category: "เอกสารยืนยันสถานะนิสิต",
        filename: "student_card_66027012.pdf",
        status: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-3",
        title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)",
        category: "เอกสารรับรองสภาพนิสิต กกมท.",
        filename: "UP02_cert_66027012.pdf",
        status: "approved",
        staffStatus: "returned",
        staffComment: "เอกสาร UP 02 ขาดลายมือชื่อนายทะเบียนสถาบัน กรุณาแนบฉบับที่มีตราประทับและลายเซ็นสมบูรณ์",
      },
      {
        id: "doc-4",
        title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)",
        category: "ผลการทดสอบสมรรถภาพสถาบัน",
        filename: "fitness_test_66027012.pdf",
        status: "approved",
        staffStatus: "approved",
      },
      {
        id: "doc-5",
        title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา",
        category: "วุฒิบัตร / ผลงานการแข่งขัน",
        filename: "UP_Academy_66027012.pdf",
        status: "approved",
        staffStatus: "approved",
      },
    ],
    staffStatus: "returned",
    staffFeedback: "มีเอกสาร UP 02 ถูกตีกลับ 1 ฉบับ ต้องดำเนินการแก้ไขก่อนส่งรายชื่อรอบสุดท้าย",
  },
  {
    id: "app-2",
    competitionId: "1",
    firstName: "สมหญิง",
    lastName: "รักดี",
    gender: "หญิง",
    studentId: "66027013",
    faculty: "คณะวิศวกรรมศาสตร์",
    major: "สาขาวิศวกรรมไฟฟ้า",
    year: "3",
    studentLevel: "bachelor",
    nationalId: "1-2345-67891-34-5",
    nationality: "ไทย",
    birthDate: "2004-02-20",
    gpaSemester: "3.10",
    gpaCumulative: "3.05",
    addressNo: "12",
    subDistrict: "บ้านต๋อม",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "082-345-6789",
    category: "กองกลาง (Midfielder)",
    division: "-",
    hasPreviousEntry: "none",
    competitions: [],
    note: "มีความฟิตสูง วิ่งทดสอบ Multistage ผ่านเกณฑ์ดี",
    status: "pending",
    squadType: "",
    documents: [
      {
        id: "doc-1",
        title: "สำเนาบัตรประจำตัวประชาชน",
        category: "เอกสารยืนยันตัวตน",
        filename: "id_card_66027013.pdf",
        status: "approved",
      },
      {
        id: "doc-2",
        title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา",
        category: "เอกสารยืนยันสถานะนิสิต",
        filename: "student_card_66027013.pdf",
        status: "approved",
      },
      {
        id: "doc-3",
        title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)",
        category: "เอกสารรับรองสภาพนิสิต กกมท.",
        filename: "UP02_cert_66027013.pdf",
        status: "rejected",
        comment: "ไฟล์ที่แนบมาหน้ากระดาษเบลอ ไม่สามารถอ่านข้อความและเลขประจำตัวได้ ชัดเจน โปรดถ่ายสแกนใหม่",
      },
      {
        id: "doc-4",
        title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)",
        category: "ผลการทดสอบสมรรถภาพสถาบัน",
        filename: "fitness_test_66027013.pdf",
        status: "approved",
      },
      {
        id: "doc-5",
        title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา",
        category: "วุฒิบัตร / ผลงานการแข่งขัน",
        filename: "UP_Academy_66027013.pdf",
        status: "pending",
      },
    ],
  },
  {
    id: "app-3",
    competitionId: "1",
    firstName: "มานะ",
    lastName: "สู้งาน",
    gender: "ชาย",
    studentId: "65027001",
    faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์",
    major: "สาขาการจัดการ",
    year: "4",
    studentLevel: "bachelor",
    nationalId: "1-2345-67892-56-7",
    nationality: "ไทย",
    birthDate: "2003-09-08",
    gpaSemester: "3.60",
    gpaCumulative: "3.55",
    addressNo: "45",
    subDistrict: "แม่ต๋ำ",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "083-456-7890",
    category: "ผู้รักษาประตู (Goalkeeper)",
    division: "-",
    hasPreviousEntry: "has",
    competitions: [
      { competitionName: "ฟุตบอลกีฬาแห่งชาติ / กกท.", year: "2567", result: "เหรียญทอง" },
    ],
    note: "นักกีฬาดีเด่นสถาบัน",
    status: "approved",
    squadType: "main",
    documents: [
      { id: "doc-1", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน", filename: "id_card_65027001.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-2", title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา", category: "เอกสารยืนยันสถานะนิสิต", filename: "student_card_65027001.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-3", title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)", category: "เอกสารรับรองสภาพนิสิต กกมท.", filename: "UP02_cert_65027001.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-4", title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)", category: "ผลการทดสอบสมรรถภาพสถาบัน", filename: "fitness_test_65027001.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-5", title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา", category: "วุฒิบัตร / ผลงานการแข่งขัน", filename: "UP_Academy_65027001.pdf", status: "approved", staffStatus: "approved" },
    ],
    staffStatus: "approved",
  },
  {
    id: "app-4",
    competitionId: "1",
    firstName: "กิตติศักดิ์",
    lastName: "มั่นคง",
    gender: "ชาย",
    studentId: "66028114",
    faculty: "คณะวิศวกรรมศาสตร์",
    major: "สาขาวิศวกรรมเครื่องกล",
    year: "3",
    studentLevel: "bachelor",
    nationalId: "1-2345-67893-90-1",
    nationality: "ไทย",
    birthDate: "2004-07-15",
    gpaSemester: "3.12",
    gpaCumulative: "3.18",
    addressNo: "77/4",
    subDistrict: "แม่กา",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "084-567-8901",
    category: "กองกลาง (Midfielder)",
    division: "-",
    hasPreviousEntry: "has",
    competitions: [
      { competitionName: "รองชนะเลิศฟุตบอลถ้วย ก / กกท.", year: "2567", result: "เหรียญเงิน" },
    ],
    note: "เล่นตำแหน่งปีกขวาและกองกลางตัวรุก",
    status: "approved",
    squadType: "main",
    documents: [
      { id: "doc-1", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน", filename: "id_card_66028114.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-2", title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา", category: "เอกสารยืนยันสถานะนิสิต", filename: "student_card_66028114.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-3", title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)", category: "เอกสารรับรองสภาพนิสิต กกมท.", filename: "UP02_cert_66028114.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-4", title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)", category: "ผลการทดสอบสมรรถภาพสถาบัน", filename: "fitness_test_66028114.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-5", title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา", category: "วุฒิบัตร / ผลงานการแข่งขัน", filename: "UP_Academy_66028114.pdf", status: "approved", staffStatus: "approved" },
    ],
    staffStatus: "approved",
  },
  {
    id: "app-5",
    competitionId: "1",
    firstName: "ณัฐพล",
    lastName: "ศรีกุล",
    gender: "ชาย",
    studentId: "65039201",
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    major: "สาขาเทคโนโลยีสารสนเทศ",
    year: "4",
    studentLevel: "bachelor",
    nationalId: "1-2345-67894-12-3",
    nationality: "ไทย",
    birthDate: "2003-11-22",
    gpaSemester: "2.85",
    gpaCumulative: "2.90",
    addressNo: "105/2",
    subDistrict: "ท่าวังทอง",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "085-678-9012",
    category: "กองหลัง (Defender)",
    division: "-",
    hasPreviousEntry: "has",
    competitions: [
      { competitionName: "แชมป์เยาวชนระดับจังหวัด พะเยาคัพ", year: "2566", result: "ชนะเลิศ" },
    ],
    note: "กองหลังตัวกลาง รูปร่างสูงใหญ่ 185 ซม.",
    status: "approved",
    squadType: "reserve",
    documents: [
      { id: "doc-1", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน", filename: "id_card_65039201.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-2", title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา", category: "เอกสารยืนยันสถานะนิสิต", filename: "student_card_65039201.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-3", title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)", category: "เอกสารรับรองสภาพนิสิต กกมท.", filename: "UP02_cert_65039201.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-4", title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)", category: "ผลการทดสอบสมรรถภาพสถาบัน", filename: "fitness_test_65039201.pdf", status: "approved", staffStatus: "approved" },
      { id: "doc-5", title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา", category: "วุฒิบัตร / ผลงานการแข่งขัน", filename: "UP_Academy_65039201.pdf", status: "approved", staffStatus: "approved" },
    ],
    staffStatus: "approved",
  },
  {
    id: "app-6",
    competitionId: "1",
    firstName: "ภานุวัฒน์",
    lastName: "สุขสวัสดิ์",
    gender: "ชาย",
    studentId: "67041022",
    faculty: "คณะวิทยาการจัดการ",
    major: "สาขาการตลาดดิจิทัล",
    year: "2",
    studentLevel: "bachelor",
    nationalId: "1-2345-67895-34-5",
    nationality: "ไทย",
    birthDate: "2005-01-18",
    gpaSemester: "2.75",
    gpaCumulative: "2.80",
    addressNo: "33",
    subDistrict: "เวียง",
    district: "เมือง",
    province: "พะเยา",
    postalCode: "56000",
    phone: "086-789-0123",
    category: "ผู้รักษาประตู (Goalkeeper)",
    division: "-",
    hasPreviousEntry: "none",
    competitions: [],
    note: "ผู้รักษาประตูดาวรุ่งชั้นปี 2",
    status: "pending",
    squadType: "",
    documents: [
      { id: "doc-1", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน", filename: "id_card_67041022.pdf", status: "approved" },
      { id: "doc-2", title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา", category: "เอกสารยืนยันสถานะนิสิต", filename: "student_card_67041022.pdf", status: "approved" },
      { id: "doc-3", title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)", category: "เอกสารรับรองสภาพนิสิต กกมท.", filename: "UP02_cert_67041022.pdf", status: "pending" },
      { id: "doc-4", title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)", category: "ผลการทดสอบสมรรถภาพสถาบัน", filename: "fitness_test_67041022.pdf", status: "rejected", comment: "ผลการทดสอบสมรรถภาพทางกายยังไม่ได้ลงนามรับรองจากศูนย์ทดสอบสมรรถภาพ มพ." },
      { id: "doc-5", title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา", category: "วุฒิบัตร / ผลงานการแข่งขัน", filename: "UP_Academy_67041022.pdf", status: "pending" },
    ],
  },
];

// Helper functions สำหรับอ่านและบันทึก
export function getClubCompetitions(): ClubCompetition[] {
  if (typeof window === "undefined") return DEFAULT_CLUB_COMPETITIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPETITIONS);
    if (!raw) return DEFAULT_CLUB_COMPETITIONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CLUB_COMPETITIONS;
  }
}

export function saveClubCompetitions(data: ClubCompetition[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_COMPETITIONS, JSON.stringify(data));
  } catch (err) {
    console.error("saveClubCompetitions error", err);
  }
}

export function getClubApplicants(competitionId?: string): ClubAthleteApplication[] {
  if (typeof window === "undefined") {
    return competitionId ? DEFAULT_CLUB_APPLICANTS.filter((a) => a.competitionId === competitionId) : DEFAULT_CLUB_APPLICANTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICANTS);
    const list: ClubAthleteApplication[] = raw ? JSON.parse(raw) : DEFAULT_CLUB_APPLICANTS;
    return competitionId ? list.filter((a) => a.competitionId === competitionId) : list;
  } catch {
    return competitionId ? DEFAULT_CLUB_APPLICANTS.filter((a) => a.competitionId === competitionId) : DEFAULT_CLUB_APPLICANTS;
  }
}

export function saveClubApplicants(data: ClubAthleteApplication[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_APPLICANTS, JSON.stringify(data));
  } catch (err) {
    console.error("saveClubApplicants error", err);
  }
}

/**
 * อัปเดตสถานะเอกสารของผู้สมัคร (อนุมัติ / ปฏิเสธ พร้อม Comment)
 */
export function updateDocumentApproval(
  athleteId: string,
  documentId: string,
  newStatus: DocumentStatus,
  comment?: string
): ClubAthleteApplication[] {
  const currentList = getClubApplicants();
  const updated = currentList.map((ath) => {
    if (ath.id !== athleteId) return ath;
    const docs = ath.documents.map((d) => {
      if (d.id !== documentId) return d;
      return {
        ...d,
        status: newStatus,
        comment: newStatus === "rejected" ? comment || "เอกสารไม่ผ่านเกณฑ์ โปรดส่งใหม่" : undefined,
        updatedAt: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
    });
    return { ...ath, documents: docs };
  });
  saveClubApplicants(updated);
  return updated;
}

/**
 * ดำเนินการส่งเอกสารฉบับแก้ไขกลับไปยังกองกิจการนิสิต
 */
export function resubmitDocumentToStaff(
  athleteId: string,
  documentId: string,
  newFilename: string
): ClubAthleteApplication[] {
  const currentList = getClubApplicants();
  const updated = currentList.map((ath) => {
    if (ath.id !== athleteId) return ath;
    const docs = ath.documents.map((d) => {
      if (d.id !== documentId) return d;
      return {
        ...d,
        filename: newFilename,
        resubmitted: true,
        resubmittedFile: newFilename,
        staffStatus: "pending" as StaffReviewStatus,
        staffComment: `(ส่งฉบับแก้ไขแล้ว: ${newFilename} - รอเจ้าหน้าที่กองกิจตรวจซ้ำ)`,
      };
    });
    return { ...ath, documents: docs };
  });
  saveClubApplicants(updated);
  return updated;
}
