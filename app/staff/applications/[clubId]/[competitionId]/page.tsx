"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { exportAthletesToCSV, AthleteExportRow } from "@/lib/export-helpers";

// ข้อมูลชมรม
const CLUB_INFO: Record<string, { name: string; sport: string }> = {
  football: { name: "ชมรมฟุตบอล", sport: "ฟุตบอล" },
  basketball: { name: "ชมรมบาสเกตบอล", sport: "บาสเกตบอล" },
  volleyball: { name: "ชมรมวอลเลย์บอล", sport: "วอลเลย์บอล" },
  swimming: { name: "ชมรมว่ายน้ำ", sport: "ว่ายน้ำ" },
};

const EVENT_NAMES: Record<string, string> = {
  "1": "ฟุตบอล 11 คน (ชาย)",
  "2": "ฟุตบอล 7 คน",
  "3": "บาสเกตบอล 5 คน",
  "4": "บาสเกตบอล 3x3",
  "5": "100 เมตร ผีเสื้อ",
  "6": "200 เมตร กบ",
  "7": "ผลัด 4×100 เมตร",
  "8": "วอลเลย์บอล 6 คน",
};

type CompetitionResult = {
  competitionName: string;
  year: string;
  result: string;
};

type StaffDocumentStatus = "pending" | "approved" | "returned";

type StaffDocument = {
  id: string;
  title: string;
  category: string;
  filename: string;
  staffStatus: StaffDocumentStatus;
  staffComment?: string;
};

type AthleteApplication = {
  id: string;
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
  category: string;
  division: string;
  hasPreviousEntry: "none" | "has";
  previousBachelorCount: string;
  previousGraduateCount: string;
  previousLastYear: string;
  competitions: CompetitionResult[];
  note: string;
  status: "pending" | "approved" | "rejected";
  squadType: "main" | "reserve" | "";
  rejectReason?: string;
  documents: StaffDocument[];
};

function createStaffDefaultDocuments(studentId: string): StaffDocument[] {
  return [
    {
      id: "doc-1",
      title: "สำเนาบัตรประจำตัวประชาชน",
      category: "เอกสารยืนยันตัวตน",
      filename: `id_card_${studentId}.pdf`,
      staffStatus: "approved",
    },
    {
      id: "doc-2",
      title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา",
      category: "เอกสารยืนยันสถานะนิสิต",
      filename: `student_card_${studentId}.pdf`,
      staffStatus: "approved",
    },
    {
      id: "doc-3",
      title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)",
      category: "เอกสารรับรองสภาพนิสิต กกมท.",
      filename: `UP02_cert_${studentId}.pdf`,
      staffStatus: "returned",
      staffComment: "เอกสาร UP 02 ขาดลายมือชื่อนายทะเบียนสถาบัน กรุณาแนบฉบับที่มีตราประทับและลายเซ็นสมบูรณ์",
    },
    {
      id: "doc-4",
      title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)",
      category: "ผลการทดสอบสมรรถภาพสถาบัน",
      filename: `fitness_test_${studentId}.pdf`,
      staffStatus: "approved",
    },
    {
      id: "doc-5",
      title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา",
      category: "วุฒิบัตร / ผลงานการแข่งขัน",
      filename: `UP_Academy_${studentId}.pdf`,
      staffStatus: "approved",
    },
  ];
}

const MOCK_APPLICANTS: AthleteApplication[] = [
  {
    id: "1", firstName: "สมชาย", lastName: "ใจดี", gender: "ชาย", studentId: "66027012",
    faculty: "คณะวิทยาศาสตร์", major: "สาขาวิทยาการคอมพิวเตอร์", year: "4", studentLevel: "bachelor",
    nationalId: "1-2345-67890-12-3", nationality: "ไทย", birthDate: "2003-05-12",
    gpaSemester: "3.45", gpaCumulative: "3.50",
    addressNo: "99/1", subDistrict: "แม่กา", district: "เมือง", province: "พะเยา", postalCode: "56000",
    phone: "081-234-5678", category: "กองหน้า", division: "-",
    hasPreviousEntry: "none", previousBachelorCount: "", previousGraduateCount: "", previousLastYear: "",
    competitions: [
      { competitionName: "ฟุตบอลกีฬาเขตภาคเหนือ / สมาคมกีฬาภาคเหนือ", year: "2568", result: "อันดับ 1" },
      { competitionName: "ฟุตบอลกีฬามหาวิทยาลัยฯ ครั้งที่ 51 / กกมท.", year: "2567", result: "เข้ารอบ 16 ทีม" },
    ],
    note: "", status: "pending", squadType: "",
    documents: createStaffDefaultDocuments("66027012"),
  },
  {
    id: "2", firstName: "สมหญิง", lastName: "รักดี", gender: "หญิง", studentId: "66027013",
    faculty: "คณะวิศวกรรมศาสตร์", major: "สาขาวิศวกรรมไฟฟ้า", year: "3", studentLevel: "bachelor",
    nationalId: "1-2345-67891-34-5", nationality: "ไทย", birthDate: "2004-02-20",
    gpaSemester: "1.95", gpaCumulative: "1.98",
    addressNo: "12", subDistrict: "บ้านต๋อม", district: "เมือง", province: "พะเยา", postalCode: "56000",
    phone: "082-345-6789", category: "กองกลาง", division: "-",
    hasPreviousEntry: "none", previousBachelorCount: "", previousGraduateCount: "", previousLastYear: "",
    competitions: [],
    note: "", status: "pending", squadType: "",
    documents: [
      { id: "doc-1", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน", filename: "id_card_66027013.pdf", staffStatus: "approved" },
      { id: "doc-2", title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา", category: "เอกสารยืนยันสถานะนิสิต", filename: "student_card_66027013.pdf", staffStatus: "approved" },
      { id: "doc-3", title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)", category: "เอกสารรับรองสภาพนิสิต กกมท.", filename: "UP02_cert_66027013.pdf", staffStatus: "pending" },
      { id: "doc-4", title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)", category: "ผลการทดสอบสมรรถภาพสถาบัน", filename: "fitness_test_66027013.pdf", staffStatus: "pending" },
      { id: "doc-5", title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา", category: "วุฒิบัตร / ผลงานการแข่งขัน", filename: "UP_Academy_66027013.pdf", staffStatus: "pending" },
    ],
  },
  {
    id: "3", firstName: "มานะ", lastName: "สู้งาน", gender: "ชาย", studentId: "65027001",
    faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", major: "สาขาการจัดการ", year: "4", studentLevel: "bachelor",
    nationalId: "1-2345-67892-56-7", nationality: "ไทย", birthDate: "2003-09-08",
    gpaSemester: "3.60", gpaCumulative: "3.55",
    addressNo: "45", subDistrict: "แม่ต๋ำ", district: "เมือง", province: "พะเยา", postalCode: "56000",
    phone: "083-456-7890", category: "ผู้รักษาประตู", division: "-",
    hasPreviousEntry: "has", previousBachelorCount: "2", previousGraduateCount: "", previousLastYear: "2567",
    competitions: [
      { competitionName: "ฟุตบอลกีฬาแห่งชาติ / กกท.", year: "2567", result: "เหรียญทอง" },
    ],
    note: "ผ่านการคัดเลือกระดับชาติ", status: "approved", squadType: "main",
    documents: [
      { id: "doc-1", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน", filename: "id_card_65027001.pdf", staffStatus: "approved" },
      { id: "doc-2", title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา", category: "เอกสารยืนยันสถานะนิสิต", filename: "student_card_65027001.pdf", staffStatus: "approved" },
      { id: "doc-3", title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)", category: "เอกสารรับรองสภาพนิสิต กกมท.", filename: "UP02_cert_65027001.pdf", staffStatus: "approved" },
      { id: "doc-4", title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)", category: "ผลการทดสอบสมรรถภาพสถาบัน", filename: "fitness_test_65027001.pdf", staffStatus: "approved" },
      { id: "doc-5", title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา", category: "วุฒิบัตร / ผลงานการแข่งขัน", filename: "UP_Academy_65027001.pdf", staffStatus: "approved" },
    ],
  },
  {
    id: "4", firstName: "ธนวัฒน์", lastName: "เก่งกาจ", gender: "ชาย", studentId: "63051011",
    faculty: "คณะนิติศาสตร์", major: "สาขานิติศาสตร์", year: "4", studentLevel: "bachelor",
    nationalId: "1-2345-67893-78-9", nationality: "ไทย", birthDate: "1996-03-10",
    gpaSemester: "2.80", gpaCumulative: "2.75",
    addressNo: "88", subDistrict: "แม่กา", district: "เมือง", province: "พะเยา", postalCode: "56000",
    phone: "089-999-8888", category: "กองหลัง", division: "-",
    hasPreviousEntry: "has", previousBachelorCount: "5", previousGraduateCount: "", previousLastYear: "2567",
    competitions: [
      { competitionName: "ฟุตบอลกีฬามหาวิทยาลัยฯ ครั้งที่ 47-51", year: "2563-2567", result: "เหรียญเงิน" },
    ],
    note: "เคยแข่งขันครบ 5 ครั้งแล้ว", status: "rejected", squadType: "",
    rejectReason: "เคยแข่งขันครบ 5 ครั้งแล้วตามระเบียบ กกมท. ข้อ 7.2 และอายุเกิน 28 ปี",
    documents: [
      { id: "doc-1", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน", filename: "id_card_63051011.pdf", staffStatus: "approved" },
      { id: "doc-2", title: "สำเนาบัตรประจำตัวนิสิต ม.พะเยา", category: "เอกสารยืนยันสถานะนิสิต", filename: "student_card_63051011.pdf", staffStatus: "approved" },
      { id: "doc-3", title: "ใบรับรองสภาพการเป็นนิสิต (UP 02)", category: "เอกสารรับรองสภาพนิสิต กกมท.", filename: "UP02_cert_63051011.pdf", staffStatus: "returned", staffComment: "พ้นสภาพการแข่งขันเนื่องจากอายุเกินกำหนด" },
      { id: "doc-4", title: "ผลการทดสอบสมรรถภาพทางกาย (Fitness Test)", category: "ผลการทดสอบสมรรถภาพสถาบัน", filename: "fitness_test_63051011.pdf", staffStatus: "approved" },
      { id: "doc-5", title: "ใบผ่านการอบรม UP Academy หรือประวัติผลงานกีฬา", category: "วุฒิบัตร / ผลงานการแข่งขัน", filename: "UP_Academy_63051011.pdf", staffStatus: "approved" },
    ],
  },
];

function calculateAthleteAge(birthDate: string): number {
  if (!birthDate) return 22;
  const birthYear = parseInt(birthDate.split("-")[0], 10);
  return 2026 - birthYear;
}

// ฟังก์ชันตรวจสอบคุณสมบัติอัตโนมัติตามระเบียบ กกมท. ครั้งที่ 52 (ข้อ 11)
function evaluateEligibility(a: AthleteApplication) {
  const gpa = parseFloat(a.gpaCumulative) || 0;
  const isGpaEligible = gpa >= 2.00;

  const prevCount = parseInt(a.previousBachelorCount || "0", 10) + parseInt(a.previousGraduateCount || "0", 10);
  const isCountEligible = prevCount < 5;

  const age = calculateAthleteAge(a.birthDate);
  const isAgeEligible = age <= 28;

  const isEligible = isGpaEligible && isCountEligible && isAgeEligible;

  const issues: string[] = [];
  if (!isGpaEligible) issues.push(`GPAX ${gpa.toFixed(2)} (< 2.00)`);
  if (!isCountEligible) issues.push(`แข่งครบ ${prevCount} ครั้ง`);
  if (!isAgeEligible) issues.push(`อายุ ${age} ปี (> 28)`);

  return {
    isEligible,
    issues,
    gpa,
    isGpaEligible,
    prevCount,
    isCountEligible,
    age,
    isAgeEligible,
  };
}

export default function StaffCompetitionApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const competitionId = params.competitionId as string;

  const club = CLUB_INFO[clubId];
  const eventName = EVENT_NAMES[competitionId] || "รายการแข่งขัน";

  const [applicants, setApplicants] = useState<AthleteApplication[]>(MOCK_APPLICANTS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; filename: string; category: string; athleteName: string } | null>(null);
  const [squadModalId, setSquadModalId] = useState<string | null>(null);
  const [squadChoice, setSquadChoice] = useState<"main" | "reserve" | "">("");
  const [rejectReasonInput, setRejectReasonInput] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  // Per-document review state (กองกิจตรวจเอกสารรายฉบับ)
  const [rejectingDoc, setRejectingDoc] = useState<{ athleteId: string; doc: StaffDocument } | null>(null);
  const [rejectDocComment, setRejectDocComment] = useState<string>("");

  const openSquadModal = (id: string) => {
    setSquadModalId(id);
    const current = applicants.find((a) => a.id === id);
    setSquadChoice(current?.squadType || "main");
  };

  // อนุมัติเอกสารรายฉบับ (กองกิจ)
  const handleApproveStaffDoc = (athleteId: string, docId: string) => {
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === athleteId
          ? {
              ...a,
              documents: a.documents.map((d) =>
                d.id === docId ? { ...d, staffStatus: "approved" as StaffDocumentStatus, staffComment: undefined } : d
              ),
            }
          : a
      )
    );
  };

  // เปิด Modal ตีกลับเอกสารรายฉบับ (กองกิจ)
  const openRejectStaffDocModal = (athleteId: string, doc: StaffDocument) => {
    setRejectingDoc({ athleteId, doc });
    setRejectDocComment(doc.staffComment || "");
  };

  // ยืนยันการตีกลับเอกสารรายฉบับ (กองกิจ)
  const confirmRejectStaffDoc = () => {
    if (!rejectingDoc) return;
    if (!rejectDocComment.trim()) {
      alert("กรุณาระบุเหตุผลที่ตีกลับ เพื่อให้ชมรมและนักกีฬาทราบและนำส่งเอกสารฉบับแก้ไข");
      return;
    }
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === rejectingDoc.athleteId
          ? {
              ...a,
              documents: a.documents.map((d) =>
                d.id === rejectingDoc.doc.id
                  ? { ...d, staffStatus: "returned" as StaffDocumentStatus, staffComment: rejectDocComment.trim() }
                  : d
              ),
            }
          : a
      )
    );
    setRejectingDoc(null);
    setRejectDocComment("");
  };

  const confirmApprove = () => {
    if (!squadModalId || !squadChoice) return;
    setApplicants((prev) =>
      prev.map((a) => (a.id === squadModalId ? { ...a, status: "approved", squadType: squadChoice } : a))
    );
    setSquadModalId(null);
    setSquadChoice("");
  };

  const handleReject = (id: string, reason: string) => {
    if (!reason.trim()) return;
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected", squadType: "", rejectReason: reason } : a))
    );
    setShowRejectInput(null);
    setRejectReasonInput((prev) => ({ ...prev, [id]: "" }));
  };

  const handleExportCSV = () => {
    const rows: AthleteExportRow[] = applicants.map((a, idx) => ({
      index: idx + 1,
      fullName: `${a.firstName} ${a.lastName}`,
      studentId: a.studentId,
      nationalId: a.nationalId,
      gender: a.gender,
      faculty: a.faculty,
      major: a.major,
      studentLevel: a.studentLevel === "bachelor" ? "ปริญญาตรี" : "บัณฑิตศึกษา",
      year: a.year,
      sportName: eventName,
      position: a.category,
      squadType: a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ยังไม่ได้ระบุ",
      status: a.status === "approved" ? "ผ่านการคัดเลือก" : a.status === "rejected" ? "ไม่ผ่านเกณฑ์" : "รอการพิจารณา",
      gpaCumulative: a.gpaCumulative,
      phone: a.phone,
    }));

    exportAthletesToCSV(`บัญชีรายชื่อนักกีฬา_${club?.name || "ชมรม"}_${eventName}`, rows);
  };

  const mainCount = applicants.filter((a) => a.squadType === "main").length;
  const reserveCount = applicants.filter((a) => a.squadType === "reserve").length;
  const pendingCount = applicants.filter((a) => a.status === "pending").length;
  const detailAthlete = applicants.find((a) => a.id === detailId);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · {club?.name}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{eventName}</h1>
            <p className="text-xs text-slate-500">
              ตัวจริง {mainCount} คน · ตัวสำรอง {reserveCount} คน · รอการพิจารณา {pendingCount} คน
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ดาวน์โหลดบัญชีรายชื่อ (Excel / CSV)
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-400 block">นักกีฬาตัวจริง</span>
            <span className="text-2xl font-bold text-blue-900">{mainCount} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-400 block">นักกีฬาตัวสำรอง</span>
            <span className="text-2xl font-bold text-emerald-800">{reserveCount} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-400 block">รอการพิจารณา</span>
            <span className="text-2xl font-bold text-slate-700">{pendingCount} คน</span>
          </div>
        </div>

        {/* Applicants List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              รายชื่อผู้สมัครเข้ารับการคัดเลือก
            </h2>
            <span className="text-xs text-slate-500">
              คลิกที่ชื่อเพื่อดูเอกสารประวัติแบบละเอียด
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {applicants.map((a) => {
              const ruleCheck = evaluateEligibility(a);
              return (
                <div key={a.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div
                    onClick={() => setDetailId(a.id)}
                    className="flex-1 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {a.firstName} {a.lastName}
                      </span>
                      <span className="font-mono text-xs text-slate-500">#{a.studentId}</span>

                      {/* Squad badge */}
                      {a.status === "approved" && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          a.squadType === "main" ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {a.squadType === "main" ? "ตัวจริง" : "ตัวสำรอง"}
                        </span>
                      )}

                      {a.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800">
                          ไม่ผ่านเกณฑ์
                        </span>
                      )}

                      {a.status === "pending" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          รอการพิจารณา
                        </span>
                      )}

                      {/* Rule Checker Badge (ข้อ 11) */}
                      {ruleCheck.isEligible ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ ผ่านเกณฑ์ กกมท. ครบ 3 ด้าน
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          เสี่ยงผิดระเบียบ กกมท. ({ruleCheck.issues.join(", ")})
                        </span>
                      )}
                    </div>

                    {/* รายละเอียดการตรวจสอบ 3 เกณฑ์ กกมท. (ข้อ 11: Rule Checker Badges) */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        ruleCheck.isGpaEligible ? "bg-slate-50 text-slate-700 border-slate-200" : "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                      }`}>
                        เกณฑ์ 1: GPAX {ruleCheck.gpa.toFixed(2)} ({ruleCheck.isGpaEligible ? "≥ 2.00 ผ่าน" : "ตกเกณฑ์"})
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        ruleCheck.isCountEligible ? "bg-slate-50 text-slate-700 border-slate-200" : "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                      }`}>
                        เกณฑ์ 2: แข่งสะสม {ruleCheck.prevCount}/5 ครั้ง ({ruleCheck.isCountEligible ? "≤ 5 ผ่าน" : "ครบโควตา"})
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        ruleCheck.isAgeEligible ? "bg-slate-50 text-slate-700 border-slate-200" : "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                      }`}>
                        เกณฑ์ 3: อายุ {ruleCheck.age} ปี ({ruleCheck.isAgeEligible ? "≤ 28 ปี ผ่าน" : "เกินเกณฑ์"})
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 pt-0.5">
                      {a.faculty} · ตำแหน่ง: <strong className="text-slate-700">{a.category}</strong> · เบอร์ติดต่อ: {a.phone}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {a.status === "pending" && (
                      <>
                        {showRejectInput === a.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="ระบุเหตุผลที่ไม่ผ่าน..."
                              value={rejectReasonInput[a.id] || ""}
                              onChange={(e) => setRejectReasonInput((prev) => ({ ...prev, [a.id]: e.target.value }))}
                              className="bg-slate-50 border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg outline-none w-48"
                            />
                            <button
                              onClick={() => handleReject(a.id, rejectReasonInput[a.id] || "")}
                              className="bg-rose-700 hover:bg-rose-800 text-white text-xs px-2.5 py-1.5 rounded-lg"
                            >
                              ยืนยัน
                            </button>
                            <button
                              onClick={() => setShowRejectInput(null)}
                              className="border border-slate-300 text-slate-600 text-xs px-2 py-1.5 rounded-lg"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setShowRejectInput(a.id)}
                              className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors"
                            >
                              ไม่ผ่าน
                            </button>
                            <button
                              onClick={() => openSquadModal(a.id)}
                              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
                            >
                              อนุมัติ
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {a.status === "approved" && (
                      <button
                        onClick={() => openSquadModal(a.id)}
                        className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        เปลี่ยนตัวจริง / สำรอง
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: เลือกสถานะตัวจริง / สำรอง */}
        {squadModalId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl border border-slate-300 max-w-sm w-full p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">กำหนดสถานะนักกีฬาตัวแทน</h3>
                <p className="text-xs text-slate-500 mt-0.5">เลือกประเภทบัญชีรายชื่อที่จะนำส่ง กกมท.</p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="squad"
                    value="main"
                    checked={squadChoice === "main"}
                    onChange={(e) => setSquadChoice("main")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">นักกีฬาตัวจริง (Main Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนในรายชื่อหลักที่เข้าแข่งขัน</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="squad"
                    value="reserve"
                    checked={squadChoice === "reserve"}
                    onChange={(e) => setSquadChoice("reserve")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนทดแทนกรณีตัวจริงสละสิทธิ์หรือบาดเจ็บ</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSquadModalId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmApprove}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md"
                >
                  บันทึกผล
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: รายละเอียดใบสมัครเต็ม */}
        {detailAthlete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl border border-slate-300 max-w-2xl w-full p-6 space-y-4 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-mono">รหัสนิสิต {detailAthlete.studentId}</span>
                  <h2 className="text-base font-bold text-slate-900">{detailAthlete.firstName} {detailAthlete.lastName}</h2>
                </div>
                <button onClick={() => setDetailId(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
              </div>

              {/* ข้อมูลทั่วไป */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">คณะ / สาขาวิชา</span>
                  <span className="font-semibold text-slate-900">{detailAthlete.faculty} · {detailAthlete.major}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เลขประจำตัวประชาชน</span>
                  <span className="font-semibold text-slate-900 font-mono">{detailAthlete.nationalId}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">ระดับการศึกษา / ชั้นปี</span>
                  <span className="font-semibold text-slate-900">{detailAthlete.studentLevel === "bachelor" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปีที่ {detailAthlete.year}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เกรดเฉลี่ยสะสม (GPAX)</span>
                  <span className="font-semibold text-slate-900 font-mono">{detailAthlete.gpaCumulative}</span>
                </div>
              </div>

              {/* ประวัติผลงานการแข่งขัน */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ประวัติผลงานการแข่งขันที่ผ่านมา</h4>
                {detailAthlete.competitions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลผลงานที่ระบุ</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailAthlete.competitions.map((c, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded text-xs flex justify-between">
                        <span className="font-medium text-slate-800">{c.competitionName} (ปี {c.year})</span>
                        <span className="font-semibold text-blue-900">{c.result}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ตรวจสอบเอกสารแนบรายบุคคล (ข้อ 12: หน้าตรวจเอกสารแนบรายฉบับ สำหรับกองกิจการนิสิต) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      เอกสารหลักฐานแนบประกอบการสมัคร (ตรวจสอบและอนุมัติแยกรายฉบับ)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      กองกิจการนิสิตสามารถเปิดพรีวิว และกดอนุมัติหรือตีกลับพร้อมระบุข้อบกพร่องเพื่อให้นำส่งเอกสารฉบับแก้ไข
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      อนุมัติแล้ว {detailAthlete.documents.filter((d) => d.staffStatus === "approved").length} / {detailAthlete.documents.length} ฉบับ
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {detailAthlete.documents.map((doc) => {
                    const isApproved = doc.staffStatus === "approved";
                    const isReturned = doc.staffStatus === "returned";
                    const isPending = doc.staffStatus === "pending" || !doc.staffStatus;

                    return (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isReturned
                            ? "bg-rose-50/60 border-rose-200"
                            : isApproved
                            ? "bg-white border-slate-200 shadow-2xs"
                            : "bg-amber-50/40 border-amber-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Document Title & Status */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">
                                {doc.title}
                              </span>

                              {/* Status Badge */}
                              {isApproved && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <span>✓</span>
                                  <span>ผ่านการอนุมัติ (กองกิจ)</span>
                                </span>
                              )}
                              {isReturned && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                  <span>✕</span>
                                  <span>ตีกลับแก้ไข / แจ้งให้ส่งใหม่</span>
                                </span>
                              )}
                              {isPending && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-900 border border-amber-200">
                                  รอการตรวจสอบ
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 font-mono">
                              ไฟล์: {doc.filename} · หมวดหมู่: {doc.category}
                            </p>
                          </div>

                          {/* Document Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  title: doc.title,
                                  filename: doc.filename,
                                  category: doc.category,
                                  athleteName: `${detailAthlete.firstName} ${detailAthlete.lastName}`,
                                })
                              }
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-300 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>ดูเอกสาร</span>
                            </button>

                            {/* Approve Single Document Button */}
                            <button
                              type="button"
                              onClick={() => handleApproveStaffDoc(detailAthlete.id, doc.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isApproved
                                  ? "bg-emerald-800 text-white shadow-2xs"
                                  : "border border-emerald-700 text-emerald-800 hover:bg-emerald-50"
                              }`}
                            >
                              ✓ อนุมัติเอกสาร
                            </button>

                            {/* Reject / Comment Single Document Button */}
                            <button
                              type="button"
                              onClick={() => openRejectStaffDocModal(detailAthlete.id, doc)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isReturned
                                  ? "bg-rose-700 text-white shadow-2xs"
                                  : "border border-rose-300 text-rose-700 hover:bg-rose-50"
                              }`}
                            >
                              ✕ ตีกลับ / ให้แก้ไข
                            </button>
                          </div>
                        </div>

                        {/* Comment Box if Returned */}
                        {isReturned && doc.staffComment && (
                          <div className="mt-2.5 p-2.5 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>ข้อความแจ้งชมรมและผู้สมัครเพื่อนำส่งเอกสารใหม่:</span>
                            </span>
                            <p className="leading-relaxed pl-3 font-medium">
                              &quot;{doc.staffComment}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  {detailAthlete.documents.every((d) => d.staffStatus === "approved") ? (
                    <span className="text-emerald-800 font-bold">
                      ✓ เอกสารแนบผ่านการอนุมัติครบถ้วน {detailAthlete.documents.length}/{detailAthlete.documents.length} ฉบับ
                    </span>
                  ) : detailAthlete.documents.some((d) => d.staffStatus === "returned") ? (
                    <span className="text-rose-800 font-medium">
                      * มีเอกสารที่ตีกลับ กรุณาแจ้งให้ชมรมและนักกีฬานำส่งฉบับแก้ไข
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      * ยังมีเอกสารที่รอการตรวจสอบ โปรดตรวจสอบให้ครบถ้วน
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDetailId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Drawer/Modal (ข้อ 12: ตรวจสอบเอกสาร) */}
        {previewDoc && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl border border-slate-300 max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    ระบบตรวจสอบเอกสารราชการออนไลน์ · มหาวิทยาลัยพะเยา
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{previewDoc.title}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{previewDoc.filename}</p>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Simulated Official Document Sheet */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-lg space-y-4 relative overflow-hidden text-xs font-sans">
                <div className="text-center border-b border-slate-200 pb-3">
                  <div className="w-9 h-9 bg-blue-900 text-white rounded flex items-center justify-center font-bold text-xs mx-auto mb-1">
                    UP
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{previewDoc.title}</h4>
                  <p className="text-[11px] text-slate-500">มหาวิทยาลัยพะเยา · University of Phayao</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>รหัสนิสิต: <strong className="font-mono text-slate-900">{detailAthlete?.studentId}</strong></div>
                  <div>ชื่อ - นามสกุล: <strong className="text-slate-900">{previewDoc.athleteName || `${detailAthlete?.firstName} ${detailAthlete?.lastName}`}</strong></div>
                  <div>คณะ: <strong className="text-slate-900">{detailAthlete?.faculty}</strong></div>
                  <div>สาขาวิชา: <strong className="text-slate-900">{detailAthlete?.major}</strong></div>
                  <div>เกรดเฉลี่ยสะสม (GPAX): <strong className="font-mono text-blue-900">{detailAthlete?.gpaCumulative}</strong></div>
                  <div>หมวดหมู่เอกสาร: <strong className="text-slate-800">{previewDoc.category}</strong></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded text-center text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-800">เอกสารนี้ได้รับการรับรองผ่านระบบสารสนเทศทะเบียนกลาง มหาวิทยาลัยพะเยา</p>
                  <p className="text-[10px] text-slate-400 font-mono">Doc Reference: UP-KKMT52-{detailAthlete?.studentId}-VERIFIED</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  ✓ เอกสารถูกต้องตามเกณฑ์ กกมท. ครั้งที่ 52
                </span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  ปิดหน้าต่างพรีวิว
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== POPUP: กองกิจระบุเหตุผลตีกลับเอกสาร (Comment Modal) ===== */}
        {rejectingDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-70">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  แจ้งตีกลับเอกสารเพื่อให้นำส่งใหม่ (กองกิจการนิสิต)
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {rejectingDoc.doc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  โปรดระบุข้อบกพร่องของเอกสาร เพื่อให้ชมรมและนักกีฬาทราบและอัปโหลดส่งใหม่ได้ถูกต้อง
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลและคำแนะนำในการแก้ไข (Comment) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectDocComment}
                  onChange={(e) => setRejectDocComment(e.target.value)}
                  placeholder="เช่น ภาพถ่ายสำเนาไม่ชัดเจน ไม่สามารถอ่านเลขบัตรประชาชนได้ หรือ เอกสาร UP 02 ขาดลายเซ็นนายทะเบียนสถาบัน..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  เหตุผลยอดนิยม (คลิกเพื่อเลือกด่วน):
                </span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    "ภาพถ่ายเอกสารไม่ชัดเจน / เบลอ โปรดสแกนใหม่",
                    "เอกสารยังไม่ได้ลงนามรับรองสำเนาถูกต้อง",
                    "เอกสาร UP 02 ขาดลายมือชื่อหรือตราประทับนายทะเบียน",
                    "ผลการทดสอบสมรรถภาพทางกายหมดอายุหรือไม่สมบูรณ์",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectDocComment(preset)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingDoc(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmRejectStaffDoc}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs"
                >
                  บันทึกและแจ้งตีกลับ
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
