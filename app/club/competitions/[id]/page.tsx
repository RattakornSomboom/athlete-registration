"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

type CompetitionResult = {
  competitionName: string;
  year: string;
  result: string;
};

type AthleteApplication = {
  id: string;
  firstName: string;
  lastName: string;
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
  category: string; // ประเภท/ตำแหน่ง
  division: string; // รุ่น
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

const EVENT_NAMES: Record<string, string> = {
  "1": "ฟุตบอล 11 คน (ชาย)",
  "2": "ฟุตบอล 7 คน",
  "3": "บาสเกตบอล 5 คน",
  "4": "บาสเกตบอล 3x3",
};

const MOCK_APPLICANTS: AthleteApplication[] = [
  {
    id: "1", firstName: "สมชาย", lastName: "ใจดี", studentId: "66027012", faculty: "คณะวิทยาศาสตร์", major: "วิทยาการคอมพิวเตอร์", year: "4", studentLevel: "bachelor",
    nationalId: "1-2345-67890-12-3", nationality: "ไทย", birthDate: "2003-05-12", gpaSemester: "3.45", gpaCumulative: "3.50",
    addressNo: "99/1", subDistrict: "แม่กา", district: "เมือง", province: "พะเยา", postalCode: "56000", phone: "081-234-5678",
    category: "กองหน้า", division: "-", hasPreviousEntry: "none", previousBachelorCount: "", previousGraduateCount: "", previousLastYear: "",
    competitions: [
      { competitionName: "ฟุตบอลกีฬาเขตภาคเหนือ / สมาคมกีฬาภาคเหนือ", year: "2568", result: "อันดับ 1" },
      { competitionName: "ฟุตบอลกีฬามหาวิทยาลัยฯ ครั้งที่ 51 / กกมท.", year: "2567", result: "เข้ารอบ 16 ทีม" },
    ],
    note: "", status: "pending", squadType: "",
  },
  {
    id: "2", firstName: "สมหญิง", lastName: "รักดี", studentId: "66027013", faculty: "คณะวิศวกรรมศาสตร์", major: "วิศวกรรมไฟฟ้า", year: "3", studentLevel: "bachelor",
    nationalId: "1-2345-67891-34-5", nationality: "ไทย", birthDate: "2004-02-20", gpaSemester: "3.10", gpaCumulative: "3.05",
    addressNo: "12", subDistrict: "บ้านต๋อม", district: "เมือง", province: "พะเยา", postalCode: "56000", phone: "082-345-6789",
    category: "กองกลาง", division: "-", hasPreviousEntry: "none", previousBachelorCount: "", previousGraduateCount: "", previousLastYear: "",
    competitions: [],
    note: "", status: "pending", squadType: "",
  },
  {
    id: "3", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", major: "การจัดการ", year: "4", studentLevel: "bachelor",
    nationalId: "1-2345-67892-56-7", nationality: "ไทย", birthDate: "2003-09-08", gpaSemester: "3.60", gpaCumulative: "3.55",
    addressNo: "45", subDistrict: "แม่ต๋ำ", district: "เมือง", province: "พะเยา", postalCode: "56000", phone: "083-456-7890",
    category: "ผู้รักษาประตู", division: "-", hasPreviousEntry: "has", previousBachelorCount: "2", previousGraduateCount: "", previousLastYear: "2567",
    competitions: [
      { competitionName: "ฟุตบอลกีฬาแห่งชาติ / กกท.", year: "2567", result: "เหรียญทอง" },
    ],
    note: "ผ่านการคัดเลือกระดับชาติ", status: "approved", squadType: "main",
  },
];

export default function ClubCompetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id as string;
  const eventName = EVENT_NAMES[competitionId] || "รายการแข่งขันของชมรม";

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
      prev.map((a) => a.id === squadModalId ? { ...a, status: "approved", squadType: squadChoice } : a)
    );
    setSquadModalId(null);
    setSquadChoice("");
  };

  const handleReject = (id: string, reason: string) => {
    if (!reason.trim()) return;
    setApplicants((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: "rejected", squadType: "", rejectReason: reason } : a)
    );
    setShowRejectInput(null);
    setRejectReasonInput((prev) => ({ ...prev, [id]: "" }));
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
          <BackButton href="/club/competitions" label="กลับรายการแข่งขัน" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{eventName}</h1>
            <p className="text-xs text-slate-500">
              ตัวจริง {mainCount} คน · ตัวสำรอง {reserveCount} คน · รอการพิจารณาคัดเลือก {pendingCount} คน
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/review")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              จัดทำบัญชีรายชื่อส่งกองกิจ
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
              รายชื่อผู้สมัครเข้ารับการคัดเลือกตัวแทนชมรม
            </h2>
            <span className="text-xs text-slate-500">
              คลิกที่ชื่อเพื่อดูเอกสารประวัติแบบละเอียด
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {applicants.map((a) => (
              <div key={a.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div
                  onClick={() => setDetailId(a.id)}
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{a.firstName} {a.lastName}</span>
                    <span className="font-mono text-xs text-slate-500">#{a.studentId}</span>
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
                  </div>
                  <p className="text-xs text-slate-500">
                    {a.faculty} · ตำแหน่ง: {a.category} · เกรดเฉลี่ยสะสม: <strong className="text-slate-800">{a.gpaCumulative}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {a.status === "pending" && (
                    <>
                      {showRejectInput === a.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="ระบุเหตุผล..."
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
                            ผ่านคัดเลือก
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
                      ปรับตัวจริง / สำรอง
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal เลือกสถานะตัวจริง/สำรอง */}
        {squadModalId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl border border-slate-300 max-w-sm w-full p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">กำหนดสถานะนักกีฬาตัวแทนชมรม</h3>
                <p className="text-xs text-slate-500 mt-0.5">เลือกประเภทบัญชีรายชื่อที่จะส่งต่อให้กองกิจการนิสิต</p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="squad"
                    value="main"
                    checked={squadChoice === "main"}
                    onChange={() => setSquadChoice("main")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">นักกีฬาตัวจริง (Main Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนในบัญชีรายชื่อหลัก</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="squad"
                    value="reserve"
                    checked={squadChoice === "reserve"}
                    onChange={() => setSquadChoice("reserve")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนทดแทนกรณีตัวจริงสละสิทธิ์</span>
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

        {/* Modal รายละเอียดใบสมัคร */}
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

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">คณะ / สาขาวิชา</span>
                  <span className="font-semibold text-slate-900">{detailAthlete.faculty} · {detailAthlete.major}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">ระดับการศึกษา / ชั้นปี</span>
                  <span className="font-semibold text-slate-900">{detailAthlete.studentLevel === "bachelor" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปีที่ {detailAthlete.year}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เกรดเฉลี่ยสะสม (GPAX)</span>
                  <span className="font-semibold text-slate-900 font-mono">{detailAthlete.gpaCumulative}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เบอร์โทรศัพท์ติดต่อ</span>
                  <span className="font-semibold text-slate-900">{detailAthlete.phone}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ประวัติผลงานการแข่งขัน</h4>
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer"
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
