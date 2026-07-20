"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  "1": "ฟุตบอล 11 คน",
  "2": "ฟุตบอล 7 คน",
  "3": "บาสเกตบอล 5 คน",
  "4": "บาสเกตบอล 3x3",
};

// TODO: ดึงจาก database จริงตอน Backend พร้อม
const MOCK_APPLICANTS: AthleteApplication[] = [
  {
    id: "1", firstName: "สมชาย", lastName: "ใจดี", studentId: "66027012", faculty: "วิทยาศาสตร์", major: "วิทยาการคอมพิวเตอร์", year: "4", studentLevel: "bachelor",
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
    id: "2", firstName: "สมหญิง", lastName: "รักดี", studentId: "66027013", faculty: "วิศวกรรมศาสตร์", major: "วิศวกรรมไฟฟ้า", year: "3", studentLevel: "bachelor",
    nationalId: "1-2345-67891-34-5", nationality: "ไทย", birthDate: "2004-02-20", gpaSemester: "3.10", gpaCumulative: "3.05",
    addressNo: "12", subDistrict: "บ้านต๋อม", district: "เมือง", province: "พะเยา", postalCode: "56000", phone: "082-345-6789",
    category: "กองกลาง", division: "-", hasPreviousEntry: "none", previousBachelorCount: "", previousGraduateCount: "", previousLastYear: "",
    competitions: [],
    note: "", status: "pending", squadType: "",
  },
  {
    id: "3", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "บริหาร", major: "การจัดการ", year: "4", studentLevel: "bachelor",
    nationalId: "1-2345-67892-56-7", nationality: "ไทย", birthDate: "2003-09-08", gpaSemester: "3.60", gpaCumulative: "3.55",
    addressNo: "45", subDistrict: "แม่ต๋ำ", district: "เมือง", province: "พะเยา", postalCode: "56000", phone: "083-456-7890",
    category: "ผู้รักษาประตู", division: "-", hasPreviousEntry: "has", previousBachelorCount: "2", previousGraduateCount: "", previousLastYear: "2567",
    competitions: [
      { competitionName: "ฟุตบอลกีฬาแห่งชาติ / กกท.", year: "2567", result: "เหรียญทอง" },
    ],
    note: "ผ่านการคัดเลือกระดับชาติ", status: "approved", squadType: "main",
  },
];

const ROUND_LABEL = { qualifier: "รอบคัดเลือก", final: "รอบมหกรรม" };

export default function ClubCompetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventName = EVENT_NAMES[params.id as string] || "ไม่พบรายการแข่งขัน";

  const [rejectReasonInput, setRejectReasonInput] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const handlePrint = () => window.print();

  const [applicants, setApplicants] = useState<AthleteApplication[]>(MOCK_APPLICANTS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [squadModalId, setSquadModalId] = useState<string | null>(null);
  const [squadChoice, setSquadChoice] = useState<"main" | "reserve" | "">("");

  const openSquadModal = (id: string) => {
    setSquadModalId(id);
    const current = applicants.find((a) => a.id === id);
    setSquadChoice(current?.squadType || "");
  };

  const confirmApprove = () => {
    if (!squadModalId || !squadChoice) return;
    setApplicants((prev) => prev.map((a) => a.id === squadModalId ? { ...a, status: "approved", squadType: squadChoice } : a));
    setSquadModalId(null);
    setSquadChoice("");
  };

  const handleReject = (id: string, reason: string) => {
    if (!reason.trim()) return;
    setApplicants((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected", squadType: "", rejectReason: reason } : a));
    setShowRejectInput(null);
    setRejectReasonInput((prev) => ({ ...prev, [id]: "" }));
  };

  const mainCount = applicants.filter((a) => a.squadType === "main").length;
  const reserveCount = applicants.filter((a) => a.squadType === "reserve").length;
  const pendingCount = applicants.filter((a) => a.status === "pending").length;

  const detailAthlete = applicants.find((a) => a.id === detailId);

  return (
    <>
      <style>{`
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; }
        .print-modal { position: static !important; background: white !important; padding: 0 !important; }
        .print-card { box-shadow: none !important; border: none !important; max-height: none !important; overflow: visible !important; }
      }
    `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-full lg:max-w-7xl mx-auto">

          <div className="mb-6">
            <button onClick={() => router.push("/club/competitions")} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">← กลับไปรายการแข่งขัน</button>
            <h1 className="text-2xl font-semibold text-gray-900">{eventName}</h1>
            <p className="text-gray-500 text-sm mt-1">
              ตัวจริง {mainCount} คน · ตัวสำรอง {reserveCount} คน · รอพิจารณา {pendingCount} คน
            </p>
          </div>

          <div className="space-y-3">
            {applicants.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => setDetailId(a.id)} className="flex-1 text-left hover:bg-gray-50 -m-1 p-1 rounded-lg transition-colors">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-900">{a.firstName} {a.lastName}</span>
                      <span className="text-gray-400 text-sm">#{a.studentId}</span>
                      {a.status === "pending" && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800">รอพิจารณา</span>}
                      {a.status === "approved" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.squadType === "main" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-700"}`}>
                          {a.squadType === "main" ? "ตัวจริง" : "ตัวสำรอง"}
                        </span>
                      )}
                      {a.status === "rejected" && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800">ไม่ผ่าน</span>}
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      <p>{a.faculty} — {a.category}{a.division !== "-" && ` (รุ่น ${a.division})`}</p>
                    </div>
                  </button>

                  {a.status === "pending" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      {showRejectInput === a.id ? (
                        <div className="flex flex-col gap-2 min-w-48">
                          <input
                            className="w-full px-3 py-1.5 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            placeholder="ระบุเหตุผล (เอกสารไม่ครบ, ฯลฯ)"
                            value={rejectReasonInput[a.id] || ""}
                            onChange={(e) => setRejectReasonInput((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setShowRejectInput(null)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors">ยกเลิก</button>
                            <button onClick={() => handleReject(a.id, rejectReasonInput[a.id] || "")} disabled={!rejectReasonInput[a.id]} className="flex-1 px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs transition-colors">ยืนยัน</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setShowRejectInput(a.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                          <button onClick={() => openSquadModal(a.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                        </div>
                      )}
                    </div>
                  )}
                  {a.status === "rejected" && a.rejectReason && (
                    <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs text-red-600 w-full">
                      เหตุผล: {a.rejectReason}
                    </div>
                  )}
                  {a.status === "approved" && (
                    <button onClick={() => openSquadModal(a.id)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors shrink-0">เปลี่ยนตัวจริง/สำรอง</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal รายละเอียดใบสมัครเต็ม */}
        {detailAthlete && (
          <div className="print-modal fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto print-card">
              <div className="flex items-start justify-between mb-4 no-print">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{detailAthlete.firstName} {detailAthlete.lastName}</h2>
                  <p className="text-gray-500 text-sm">#{detailAthlete.studentId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
                    🖨️ พิมพ์ PDF
                  </button>
                  <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
              </div>

              {/* หัวเรื่องสำหรับตอนพิมพ์เท่านั้น */}
              <div className="hidden print:block mb-4 text-center border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">ใบสมัครนักกีฬา — {detailAthlete.firstName} {detailAthlete.lastName}</h2>
                <p className="text-gray-500 text-sm">รหัสนิสิต {detailAthlete.studentId} · {eventName} · กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52</p>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ข้อมูลส่วนตัว</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-gray-500">คณะ</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.faculty}</p></div>
                    <div><span className="text-gray-500">สาขา</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.major}</p></div>
                    <div><span className="text-gray-500">ระดับ/ชั้นปี</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.studentLevel === "bachelor" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปี {detailAthlete.year}</p></div>
                    <div><span className="text-gray-500">เลขบัตรประชาชน</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.nationalId}</p></div>
                    <div><span className="text-gray-500">สัญชาติ</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.nationality}</p></div>
                    <div><span className="text-gray-500">วันเกิด</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.birthDate}</p></div>
                    <div><span className="text-gray-500">เกรดเฉลี่ย (ภาคล่าสุด)</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.gpaSemester || "-"}</p></div>
                    <div><span className="text-gray-500">เกรดเฉลี่ยสะสม</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.gpaCumulative || "-"}</p></div>
                    <div><span className="text-gray-500">เบอร์โทรศัพท์</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.phone}</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ที่อยู่ปัจจุบัน</h3>
                  <p className="text-sm text-gray-900">
                    {detailAthlete.addressNo} ตำบล{detailAthlete.subDistrict} อำเภอ{detailAthlete.district} จังหวัด{detailAthlete.province} {detailAthlete.postalCode}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ข้อมูลการสมัคร</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-gray-500">ตำแหน่ง/ประเภท</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.category}</p></div>
                    <div><span className="text-gray-500">รุ่น</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.division}</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ประวัติเข้าร่วมกีฬามหาวิทยาลัยฯ</h3>
                  {detailAthlete.hasPreviousEntry === "none" ? (
                    <p className="text-sm text-gray-900">ไม่เคยเข้าร่วมมาก่อน (เป็นนักศึกษาแรกเข้า)</p>
                  ) : (
                    <p className="text-sm text-gray-900">
                      เคยเข้าร่วม ระดับปริญญาตรี {detailAthlete.previousBachelorCount || 0} ครั้ง · ระดับโท/เอก {detailAthlete.previousGraduateCount || 0} ครั้ง · ครั้งล่าสุดปี พ.ศ. {detailAthlete.previousLastYear || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ประวัติผลงานการแข่งขัน (ไม่เกิน 2 ปี)</h3>
                  {detailAthlete.competitions.length === 0 ? (
                    <p className="text-sm text-gray-400">ไม่มีผลงานที่บันทึกไว้</p>
                  ) : (
                    <div className="space-y-2">
                      {detailAthlete.competitions.map((c, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <p className="font-medium text-gray-900">{c.competitionName}</p>
                          <p className="text-gray-500 text-xs mt-0.5">พ.ศ. {c.year} · ผลการแข่งขัน: {c.result}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {detailAthlete.note && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">หมายเหตุ</h3>
                    <p className="text-sm text-gray-900">{detailAthlete.note}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 no-print">
                {detailAthlete.status === "pending" && (
                  <>
                    {showRejectInput === detailAthlete.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                          placeholder="ระบุเหตุผลที่ไม่ผ่าน (เอกสารไม่ครบ, ฯลฯ)"
                          value={rejectReasonInput[detailAthlete.id] || ""}
                          onChange={(e) => setRejectReasonInput((prev) => ({ ...prev, [detailAthlete.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setShowRejectInput(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm transition-colors">ยกเลิก</button>
                          <button onClick={() => { handleReject(detailAthlete.id, rejectReasonInput[detailAthlete.id] || ""); setDetailId(null); }} disabled={!rejectReasonInput[detailAthlete.id]} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm transition-colors">ยืนยันไม่ผ่าน</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setShowRejectInput(detailAthlete.id)} className="flex-1 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                        <button onClick={() => { setDetailId(null); openSquadModal(detailAthlete.id); }} className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                      </>
                    )}
                  </>
                )}
                {detailAthlete.status !== "pending" && (
                  <button onClick={() => setDetailId(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">ปิด</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal เลือกตัวจริง/ตัวสำรอง */}
        {squadModalId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">เลือกสถานะนักกีฬา</h2>
              <p className="text-gray-500 text-sm mb-4">
                {applicants.find((a) => a.id === squadModalId)?.firstName} {applicants.find((a) => a.id === squadModalId)?.lastName}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button type="button" onClick={() => setSquadChoice("main")} className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${squadChoice === "main" ? "bg-green-600 text-white border-green-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ตัวจริง</button>
                <button type="button" onClick={() => setSquadChoice("reserve")} className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${squadChoice === "reserve" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ตัวสำรอง</button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setSquadModalId(null); setSquadChoice(""); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ยกเลิก</button>
                <button onClick={confirmApprove} disabled={!squadChoice} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">ยืนยัน</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}