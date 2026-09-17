"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
};

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
  },
];

// ฟังก์ชันตรวจสอบคุณสมบัติอัตโนมัติตามระเบียบ กกมท. ครั้งที่ 52
function evaluateEligibility(a: AthleteApplication) {
  const issues: string[] = [];
  const gpa = parseFloat(a.gpaCumulative) || 0;

  // 1. ตรวจสอบ GPA
  if (gpa < 2.00) {
    issues.push(`เกรดเฉลี่ยสะสมต่ำกว่าเกณฑ์ (${gpa.toFixed(2)} < 2.00)`);
  }

  // 2. ตรวจสอบประวัติการเข้าแข่งขัน
  const prevCount = parseInt(a.previousBachelorCount || "0", 10) + parseInt(a.previousGraduateCount || "0", 10);
  if (prevCount >= 5) {
    issues.push(`เคยแข่งขันครบ 5 ครั้งแล้วตามระเบียบ กกมท. ข้อ 7.2`);
  }

  return {
    isEligible: issues.length === 0,
    issues,
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
  const [squadModalId, setSquadModalId] = useState<string | null>(null);
  const [squadChoice, setSquadChoice] = useState<"main" | "reserve" | "">("");
  const [rejectReasonInput, setRejectReasonInput] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const openSquadModal = (id: string) => {
    setSquadModalId(id);
    const current = applicants.find((a) => a.id === id);
    setSquadChoice(current?.squadType || "main");
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
      <div className="max-w-7xl mx-auto space-y-6">

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
            <button
              onClick={() => router.back()}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ย้อนกลับ
            </button>
            <LogoutButton />
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

                      {/* Rule Checker Badge */}
                      {ruleCheck.isEligible ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          คุณสมบัติตรงตามเกณฑ์ กกมท.
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          เสี่ยงผิดระเบียบ กกมท. ({ruleCheck.issues.join(", ")})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {a.faculty} · ตำแหน่ง: {a.category} · เกรดเฉลี่ยสะสม: <strong className={parseFloat(a.gpaCumulative) < 2 ? "text-rose-600" : "text-slate-800"}>{a.gpaCumulative}</strong>
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

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDetailId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
