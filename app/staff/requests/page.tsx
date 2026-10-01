"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

type RequestType = "no_club" | "club_waiver";

type SpecialRequest = {
  id: string;
  type: RequestType;
  studentName?: string;
  studentId?: string;
  faculty?: string;
  sport: string;
  clubName?: string;
  title: string;
  reason: string;
  supervisorName: string;
  supervisorPosition: string;
  date: string;
  document: string;
  status: "pending" | "approved" | "rejected";
  assignedOfficer?: string;
  rejectReason?: string;
};

const INITIAL_REQUESTS: SpecialRequest[] = [
  {
    id: "nc-1",
    type: "no_club",
    studentName: "นายพีรพัฒน์ ศิริวัฒน์",
    studentId: "66051234",
    faculty: "คณะวิทยาศาสตร์",
    sport: "ยิงปืน (ระบบไม่มีชมรมจัดตั้ง)",
    title: "ขออนุญาตเข้าร่วมการคัดเลือกนักกีฬาตัวแทนสถาบัน (กรณีไม่มีชมรมกีฬาในสังกัด)",
    reason: "มหาวิทยาลัยพะเยายังไม่มีชมรมกีฬายิงปืนจัดตั้งอย่างเป็นทางการ แต่นักศึกษามีผลงานระดับเยาวชนทีมชาติและมีความประสงค์เป็นตัวแทนสถาบันในการแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย โดยมีอาจารย์ประจำสาขาวิชารับรองความประพฤติและรับผิดชอบการดูแลทีม",
    supervisorName: "ผศ.ดร.เกียรติศักดิ์ พงษ์ศิริ",
    supervisorPosition: "อาจารย์ประจำคณะวิทยาศาสตร์ มหาวิทยาลัยพะเยา",
    date: "25 ส.ค. 2569",
    document: "หนังสือขออนุญาตเข้าร่วมการแข่งขัน_ยิงปืน_66051234.pdf",
    status: "pending",
  },
  {
    id: "nc-2",
    type: "no_club",
    studentName: "นางสาวมัณฑนา สุขสมบูรณ์",
    studentId: "65078901",
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    sport: "ยูยิตสู (ระบบไม่มีชมรมจัดตั้ง)",
    title: "ขออนุญาตเข้าร่วมการคัดเลือกนักกีฬาตัวแทนสถาบัน ประเภทกีฬายูยิตสู",
    reason: "นักศึกษาผ่านการแข่งขันระดับชิงแชมป์ประเทศไทย มีสมรรถภาพทางกายในเกณฑ์ดีเยี่ยม ประสงค์ขอส่งตัวแทนสถาบันในนามมหาวิทยาลัยพะเยา",
    supervisorName: "ดร.ณัฐนนท์ มั่นคง",
    supervisorPosition: "รองคณบดีฝ่ายพัฒนานิสิต คณะ ICT",
    date: "28 ส.ค. 2569",
    document: "หนังสือรับรองและคำขอ_ยูยิตสู_65078901.pdf",
    status: "approved",
    assignedOfficer: "นายอภิสิทธิ์ วงศ์ใหญ่ (งานกีฬา กองกิจการนิสิต)",
  },
  {
    id: "cw-1",
    type: "club_waiver",
    clubName: "ชมรมฟุตบอล",
    sport: "ฟุตบอล",
    title: "ขอผ่อนผันเกณฑ์ผลงานการแข่งขันย้อนหลัง 2 ปี",
    reason: "นักกีฬามีผลงานเกิน 2 ปีย้อนหลังเล็กน้อยเนื่องจากติดภารกิจฟื้นฟูสภาพร่างกายจากการบาดเจ็บ ปัจจุบันผ่านการทดสอบสมรรถภาพทางกายระดับดีเยี่ยมและมีความพร้อมเต็มที่",
    supervisorName: "ดร.พิเชษฐ์ ชัยเลิศ",
    supervisorPosition: "อาจารย์ที่ปรึกษาชมรมฟุตบอล",
    date: "20 ส.ค. 2569",
    document: "หนังสือขอผ่อนผันเกณฑ์_ชมรมฟุตบอล_01.pdf",
    status: "pending",
  },
];

const STATUS_BADGE = {
  pending: { label: "รอการพิจารณา", className: "bg-amber-50 text-amber-800 border-amber-200" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-rose-50 text-rose-800 border-rose-200" },
};

export default function StaffRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SpecialRequest[]>(INITIAL_REQUESTS);
  const [activeTab, setActiveTab] = useState<"no_club" | "club_waiver">("no_club");
  const [selectedDoc, setSelectedDoc] = useState<SpecialRequest | null>(null);

  // Reject State
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Approve State (สำหรับกรณีไม่มีชมรม สามารถแต่งตั้งเจ้าหน้าที่ได้)
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState("งานกีฬา กองกิจการนิสิต");

  const noClubRequests = requests.filter((r) => r.type === "no_club");
  const clubWaivers = requests.filter((r) => r.type === "club_waiver");

  const pendingNoClub = noClubRequests.filter((r) => r.status === "pending").length;
  const pendingWaivers = clubWaivers.filter((r) => r.status === "pending").length;

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved",
              assignedOfficer: officerName,
            }
          : r
      )
    );
    setApprovingId(null);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "rejected",
              rejectReason: rejectReason,
            }
          : r
      )
    );
    setRejectingId(null);
    setRejectReason("");
  };

  const currentList = activeTab === "no_club" ? noClubRequests : clubWaivers;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/staff/applications" label="กลับหน้ารายการใบสมัคร" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · งานกีฬาและนันทนาการ
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การพิจารณาคำร้องกรณีพิเศษและนักศึกษาไม่มีชมรม
            </h1>
            <p className="text-xs text-slate-500">
              ระบบตรวจสอบคำขอเข้าร่วมการคัดเลือกตัวแทนสถาบันที่ส่งตรงถึงกองกิจการนิสิต
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/applications")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              รายการใบสมัครรวม
            </button>
            <button
              onClick={() => router.push("/staff/analytics")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แดชบอร์ดวิเคราะห์ผล
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">คำร้องทั้งหมด</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{requests.length} ฉบับ</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-amber-600 font-medium block">ไม่มีชมรม (รอพิจารณา)</span>
            <span className="text-2xl font-bold text-amber-700 mt-0.5 block">{pendingNoClub} ฉบับ</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-blue-900 font-medium block">ขอผ่อนผันชมรม (รอพิจารณา)</span>
            <span className="text-2xl font-bold text-blue-900 mt-0.5 block">{pendingWaivers} ฉบับ</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-emerald-700 font-medium block">อนุมัติแล้ว</span>
            <span className="text-2xl font-bold text-emerald-800 mt-0.5 block">
              {requests.filter((r) => r.status === "approved").length} ฉบับ
            </span>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("no_club")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "no_club"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>คำร้องนักศึกษาไม่มีชมรม (ส่งตรงถึงกองกิจ)</span>
            {pendingNoClub > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
                {pendingNoClub}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("club_waiver")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "club_waiver"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>คำร้องขอผ่อนผันจากชมรมกีฬา</span>
            {pendingWaivers > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
                {pendingWaivers}
              </span>
            )}
          </button>
        </div>

        {/* Info Notification Banner */}
        {activeTab === "no_club" ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
              i
            </span>
            <div className="space-y-1">
              <p className="font-bold">แนวปฏิบัติสำหรับนักกีฬาที่ไม่มีชมรมกีฬาจัดตั้งในมหาวิทยาลัย (ระเบียบ กกมท.)</p>
              <p className="text-blue-800 leading-relaxed">
                นิสิตที่มีความสามารถด้านกีฬาแต่ไม่มีชมรมต้นสังกัดจัดตั้ง จะต้องทำหนังสือขออนุญาตพร้อมมีบุคลากรในสังกัดมหาวิทยาลัยพะเยาอย่างน้อย 1 คน
                ลงนามรับรองความประพฤติและรับผิดชอบทีม โดยกองกิจการนิสิตจะพิจารณาอนุมัติและแต่งตั้งเจ้าหน้าที่รับผิดชอบแยกต่างหากเพื่อส่งชื่อเข้าร่วมการแข่งขัน
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
              i
            </span>
            <p className="leading-relaxed">
              คำร้องขอผ่อนผันเกณฑ์คุณสมบัติจากชมรมกีฬา เช่น เกณฑ์ผลงานย้อนหลัง หรือเงื่อนไขความจำเป็นพิเศษ
              เพื่อเสนอต่อคณะกรรมการพิจารณาคุณสมบัตินักกีฬาตัวแทนสถาบัน
            </p>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-3">
          {currentList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
              ไม่มีคำร้องในหมวดหมู่นี้
            </div>
          ) : (
            currentList.map((r) => {
              const badge = STATUS_BADGE[r.status];
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-100 text-slate-700">
                          รหัส: {r.id}
                        </span>
                        <h2 className="font-bold text-slate-900 text-sm">{r.title}</h2>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-blue-900 font-semibold">
                        ชนิดกีฬา: {r.sport}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      ยื่นคำร้องเมื่อ: {r.date}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Left: รายละเอียดและเหตุผล */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-700 block">เหตุผลและความจำเป็น:</span>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                        {r.reason}
                      </p>
                      {r.rejectReason && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 space-y-1">
                          <span className="font-bold block">เหตุผลที่ไม่อนุมัติ:</span>
                          <p>{r.rejectReason}</p>
                        </div>
                      )}
                      {r.assignedOfficer && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-800">
                          <span className="font-bold">เจ้าหน้าที่รับผิดชอบทีมที่แต่งตั้ง:</span> {r.assignedOfficer}
                        </div>
                      )}
                    </div>

                    {/* Right: ข้อมูลผู้ยื่นและผู้รับรอง */}
                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      {r.studentName && (
                        <div className="pb-2 border-b border-slate-200/70">
                          <span className="text-slate-400 block text-[11px]">นักศึกษาผู้ยื่นคำร้อง</span>
                          <p className="font-semibold text-slate-900 mt-0.5">
                            {r.studentName} <span className="font-mono text-slate-500 font-normal">({r.studentId})</span>
                          </p>
                          <p className="text-slate-500 text-[11px]">{r.faculty}</p>
                        </div>
                      )}
                      {r.clubName && (
                        <div className="pb-2 border-b border-slate-200/70">
                          <span className="text-slate-400 block text-[11px]">ชมรมต้นสังกัด</span>
                          <p className="font-semibold text-slate-900 mt-0.5">{r.clubName}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block text-[11px]">อาจารย์ / บุคลากรผู้รับรองทีม</span>
                        <p className="font-semibold text-slate-900 mt-0.5">{r.supervisorName}</p>
                        <p className="text-slate-500 text-[11px]">{r.supervisorPosition}</p>
                      </div>
                    </div>
                  </div>

                  {/* เอกสารแนบ & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(r)}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-900 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="underline">{r.document}</span>
                      <span className="text-[10px] text-slate-400 font-normal">(คลิกเปิดดูเอกสาร)</span>
                    </button>

                    {/* Action buttons when pending */}
                    {r.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(r.id);
                            setApprovingId(null);
                          }}
                          className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          ไม่อนุมัติ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setApprovingId(r.id);
                            setRejectingId(null);
                          }}
                          className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          อนุมัติคำร้อง
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Rejection Box */}
                  {rejectingId === r.id && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3 mt-3">
                      <p className="text-xs font-bold text-rose-900">ระบุเหตุผลที่ไม่อนุมัติคำร้องฉบับนี้</p>
                      <textarea
                        rows={2}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="กรุณากรอกเหตุผลทางระเบียบหรือความเห็นของกองกิจการนิสิต..."
                        className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason("");
                          }}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs rounded-lg hover:bg-white"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(r.id)}
                          disabled={!rejectReason.trim()}
                          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white text-xs font-medium rounded-lg"
                        >
                          ยืนยันไม่อนุมัติ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Approval Box (แต่งตั้งผู้ดูแล) */}
                  {approvingId === r.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 mt-3">
                      <p className="text-xs font-bold text-blue-950">อนุมัติคำร้องและมอบหมายผู้รับผิดชอบดูแลทีม</p>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          เจ้าหน้าที่กองกิจการนิสิตผู้รับผิดชอบทีม:
                        </label>
                        <input
                          type="text"
                          value={officerName}
                          onChange={(e) => setOfficerName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setApprovingId(null)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs rounded-lg hover:bg-white"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(r.id)}
                          className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium rounded-lg"
                        >
                          ยืนยันอนุมัติคำร้อง
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Official Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  หน้าต่างพรีวิวเอกสารราชการอิเล็กทรอนิกส์ (e-Document Viewer)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Document sheet representation */}
            <div className="border border-slate-300 rounded-lg p-6 bg-slate-50/50 space-y-4 font-serif">
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <span className="text-xs uppercase tracking-widest font-bold text-blue-900">
                  มหาวิทยาลัยพะเยา · กองกิจการนิสิต
                </span>
                <h4 className="text-base font-bold text-slate-900">หนังสือขออนุญาตเข้าร่วมการแข่งขันกีฬา (กรณีพิเศษ)</h4>
                <p className="text-xs text-slate-500">เลขที่อ้างอิง: SMED-REQ-{selectedDoc.id.toUpperCase()}-2569</p>
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed font-sans">
                <p><strong>เรื่อง:</strong> {selectedDoc.title}</p>
                <p><strong>ชนิดกีฬา:</strong> {selectedDoc.sport}</p>
                {selectedDoc.studentName && (
                  <p><strong>ผู้ขออนุญาต:</strong> {selectedDoc.studentName} รหัสนิสิต {selectedDoc.studentId} สังกัด {selectedDoc.faculty}</p>
                )}
                <p><strong>อาจารย์/บุคลากรผู้รับรอง:</strong> {selectedDoc.supervisorName} ({selectedDoc.supervisorPosition})</p>
                <div className="pt-2">
                  <p><strong>ข้อความชี้แจง:</strong></p>
                  <p className="bg-white p-3 rounded border border-slate-200 mt-1 italic text-slate-600">
                    "{selectedDoc.reason}"
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                <span>ตราประทับรับเอกสาร: งานกีฬา กองกิจการนิสิต</span>
                <span className="text-emerald-700 font-semibold font-sans">✓ รับรองความถูกต้องสมบูรณ์</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
