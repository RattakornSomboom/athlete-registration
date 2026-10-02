"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import {
  getClubApplicants,
  saveClubApplicants,
  updateDocumentApproval,
  ClubAthleteApplication,
  ApplicantDocument,
  DocumentStatus,
  getClubCompetitions,
} from "@/lib/club-store";

const EVENT_NAMES: Record<string, string> = {
  "1": "ฟุตบอล 11 คน (ทีมชาย)",
  "2": "ฟุตบอล 7 คน (ทีมชาย)",
  "3": "ฟุตบอล 11 คน (ทีมหญิง)",
  "4": "ฟุตซอล 5 คน",
};

export default function ClubCompetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = (params.id as string) || "1";
  const eventName = EVENT_NAMES[competitionId] || `รายการแข่งขัน #${competitionId}`;

  const [applicants, setApplicants] = useState<ClubAthleteApplication[]>([]);
  const [detailAthleteId, setDetailAthleteId] = useState<string | null>(null);
  const [squadModalId, setSquadModalId] = useState<string | null>(null);
  const [squadChoice, setSquadChoice] = useState<"main" | "reserve" | "">("main");

  // Document comment dialog state
  const [rejectingDoc, setRejectingDoc] = useState<{ athleteId: string; doc: ApplicantDocument } | null>(null);
  const [rejectCommentInput, setRejectCommentInput] = useState<string>("");

  // Document Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<{ title: string; filename: string; category: string; athleteName: string } | null>(null);

  // Overall reject reason input
  const [showOverallRejectInput, setShowOverallRejectInput] = useState<string | null>(null);
  const [overallRejectReason, setOverallRejectReason] = useState<Record<string, string>>({});

  useEffect(() => {
    setApplicants(getClubApplicants(competitionId));
  }, [competitionId]);

  const detailAthlete = applicants.find((a) => a.id === detailAthleteId);

  // Count summaries
  const mainCount = applicants.filter((a) => a.squadType === "main").length;
  const reserveCount = applicants.filter((a) => a.squadType === "reserve").length;
  const pendingCount = applicants.filter((a) => a.status === "pending").length;

  // Handler for individual document approval
  const handleApproveDoc = (athleteId: string, docId: string) => {
    const updated = updateDocumentApproval(athleteId, docId, "approved");
    setApplicants(updated.filter((a) => a.competitionId === competitionId));
  };

  // Open rejection modal for a document
  const openRejectDocModal = (athleteId: string, doc: ApplicantDocument) => {
    setRejectingDoc({ athleteId, doc });
    setRejectCommentInput(doc.comment || "");
  };

  // Confirm document rejection with comment
  const confirmRejectDoc = () => {
    if (!rejectingDoc) return;
    if (!rejectCommentInput.trim()) {
      alert("กรุณาระบุเหตุผลที่ไม่ผ่าน เพื่อให้ผู้สมัครทราบและนำส่งเอกสารฉบับแก้ไข");
      return;
    }
    const updated = updateDocumentApproval(
      rejectingDoc.athleteId,
      rejectingDoc.doc.id,
      "rejected",
      rejectCommentInput.trim()
    );
    setApplicants(updated.filter((a) => a.competitionId === competitionId));
    setRejectingDoc(null);
    setRejectCommentInput("");
  };

  // Confirm Squad Allocation (Main / Reserve)
  const confirmSquadAllocation = () => {
    if (!squadModalId || !squadChoice) return;
    const currentList = getClubApplicants();
    const updated = currentList.map((a) =>
      a.id === squadModalId ? { ...a, status: "approved" as const, squadType: squadChoice } : a
    );
    saveClubApplicants(updated);
    setApplicants(updated.filter((a) => a.competitionId === competitionId));
    setSquadModalId(null);
  };

  // Confirm Overall Rejection
  const handleOverallReject = (athleteId: string, reason: string) => {
    if (!reason.trim()) return;
    const currentList = getClubApplicants();
    const updated = currentList.map((a) =>
      a.id === athleteId
        ? { ...a, status: "rejected" as const, squadType: "" as const, rejectReason: reason }
        : a
    );
    saveClubApplicants(updated);
    setApplicants(updated.filter((a) => a.competitionId === competitionId));
    setShowOverallRejectInput(null);
    setOverallRejectReason((prev) => ({ ...prev, [athleteId]: "" }));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/competitions" label="กลับรายการแข่งขัน" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · การตรวจสอบและคัดเลือกนักกีฬา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {eventName}
            </h1>
            <p className="text-xs text-slate-500">
              ตรวจสอบเอกสารรายฉบับของผู้สมัคร อนุมัติ/ส่งกลับแก้ไข และจัดสรรประเภทตัวจริง/ตัวสำรอง
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/tracking")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ติดตามสถานะส่งกองกิจ
            </button>
            <button
              onClick={() => router.push("/club/review")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              จัดทำบัญชีรายชื่อส่งกองกิจ →
            </button>
          </div>
        </div>

        {/* Status Quota Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">นักกีฬาตัวจริง (Main Squad)</span>
            <span className="text-2xl font-bold text-blue-900">{mainCount} คน</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">โควตาสูงสุด 22 คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
            <span className="text-2xl font-bold text-emerald-800">{reserveCount} คน</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">โควตาสูงสุด 6 คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">รอพิจารณาคัดเลือก & ตรวจเอกสาร</span>
            <span className="text-2xl font-bold text-slate-700">{pendingCount} คน</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">จากผู้สมัครทั้งหมด {applicants.length} คน</span>
          </div>
        </div>

        {/* Applicants Table List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                บัญชีรายชื่อผู้สมัครเข้ารับการคัดเลือก ({applicants.length} คน)
              </h2>
              <p className="text-xs text-slate-500">
                คลิกที่ชื่อหรือปุ่ม &quot;ตรวจเอกสาร & รายละเอียด&quot; เพื่อเปิดตรวจเอกสารแนบรายฉบับ
              </p>
            </div>
            <span className="text-xs text-blue-900 font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              รองรับการตรวจและอนุมัติเอกสารแยกรายฉบับ 100%
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {applicants.map((a) => {
              const approvedDocs = a.documents.filter((d) => d.status === "approved").length;
              const rejectedDocs = a.documents.filter((d) => d.status === "rejected").length;
              const totalDocs = a.documents.length;

              return (
                <div
                  key={a.id}
                  className="p-4.5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  {/* Left: Applicant basic info */}
                  <div
                    onClick={() => setDetailAthleteId(a.id)}
                    className="flex-1 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-900 transition-colors">
                        {a.firstName} {a.lastName}
                      </span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        #{a.studentId}
                      </span>

                      {/* Squad Type Badge */}
                      {a.status === "approved" && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.squadType === "main"
                            ? "bg-blue-100 text-blue-900 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {a.squadType === "main" ? "นักกีฬาตัวจริง" : "นักกีฬาตัวสำรอง"}
                        </span>
                      )}
                      {a.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          ไม่ผ่านเกณฑ์
                        </span>
                      )}
                      {a.status === "pending" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          รอการพิจารณา
                        </span>
                      )}

                      {/* Documents Status Counter Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        rejectedDocs > 0
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : approvedDocs === totalDocs
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        เอกสารผ่าน {approvedDocs}/{totalDocs} ฉบับ
                        {rejectedDocs > 0 && ` (แจ้งแก้ไข ${rejectedDocs} ฉบับ)`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {a.faculty} · สาขา{a.major} (ปี {a.year}) · ตำแหน่ง: <strong className="text-slate-800">{a.category}</strong> · GPAX: <strong className="text-slate-800 font-mono">{a.gpaCumulative}</strong> · เบอร์โทร: {a.phone}
                    </p>

                    {a.note && (
                      <p className="text-[11px] text-blue-900/80 bg-blue-50/60 px-2 py-0.5 rounded inline-block">
                        หมายเหตุ: {a.note}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* View Details & Documents Button */}
                    <button
                      type="button"
                      onClick={() => setDetailAthleteId(a.id)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-300"
                    >
                      ตรวจเอกสาร & รายละเอียด
                    </button>

                    {/* Pending Actions */}
                    {a.status === "pending" && (
                      <>
                        {showOverallRejectInput === a.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="ระบุเหตุผลไม่ผ่าน..."
                              value={overallRejectReason[a.id] || ""}
                              onChange={(e) => setOverallRejectReason((prev) => ({ ...prev, [a.id]: e.target.value }))}
                              className="bg-slate-50 border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg outline-none w-44"
                            />
                            <button
                              onClick={() => handleOverallReject(a.id, overallRejectReason[a.id] || "")}
                              className="bg-rose-700 hover:bg-rose-800 text-white text-xs px-2.5 py-1.5 rounded-lg cursor-pointer"
                            >
                              ยืนยัน
                            </button>
                            <button
                              onClick={() => setShowOverallRejectInput(null)}
                              className="border border-slate-300 text-slate-600 text-xs px-2 py-1.5 rounded-lg cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowOverallRejectInput(a.id)}
                              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              ไม่ผ่าน
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSquadModalId(a.id);
                                setSquadChoice("main");
                              }}
                              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              อนุมัติคัดเลือก
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {a.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSquadModalId(a.id);
                          setSquadChoice(a.squadType || "main");
                        }}
                        className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        สลับตัวจริง / สำรอง
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== MODAL: ตรวจเอกสารและประวัติผู้สมัครแบบละเอียด ===== */}
        {detailAthlete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">

              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3.5">
                <div>
                  <span className="text-[11px] text-blue-900 font-mono font-semibold">
                    รหัสนิสิต {detailAthlete.studentId} · ผู้สมัคร {eventName}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {detailAthlete.firstName} {detailAthlete.lastName}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailAthleteId(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Personal & Academic Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">คณะต้นสังกัด</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{detailAthlete.faculty}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">สาขาวิชา / ชั้นปี</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {detailAthlete.major} (ปี {detailAthlete.year})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">เกรดเฉลี่ยสะสม (GPAX)</span>
                  <span className="font-bold text-blue-900 font-mono text-sm block mt-0.5">
                    {detailAthlete.gpaCumulative}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">ตำแหน่งที่สมัคร</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{detailAthlete.category}</span>
                </div>
              </div>

              {/* Previous Sports Achievements */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  ประวัติผลงานการแข่งขันกีฬาที่ผ่านมา
                </h4>
                {detailAthlete.competitions.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 italic">
                    ไม่มีประวัติการแข่งขันที่ระบุ (นักกีฬาหน้าใหม่)
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {detailAthlete.competitions.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center"
                      >
                        <span className="font-medium text-slate-800">
                          {c.competitionName} (ปีการศึกษา {c.year})
                        </span>
                        <span className="font-semibold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded">
                          {c.result}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ===== CORE FEATURE: ตรวจเอกสารแนบรายฉบับ (พร้อมปุ่ม อนุมัติ / ปฏิเสธ + Comment) ===== */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      เอกสารหลักฐานแนบประกอบการสมัคร (ตรวจและอนุมัติแยกรายฉบับ)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ประธานชมรมสามารถเปิดพรีวิว และกดอนุมัติหรือปฏิเสธพร้อมระบุเหตุผลเพื่อให้นักศึกษานำส่งใหม่ได้
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      อนุมัติแล้ว {detailAthlete.documents.filter((d) => d.status === "approved").length} / {detailAthlete.documents.length} ฉบับ
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {detailAthlete.documents.map((doc) => {
                    const isApproved = doc.status === "approved";
                    const isRejected = doc.status === "rejected";

                    return (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isRejected
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
                                  <span>ผ่านการอนุมัติ</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                  <span>✕</span>
                                  <span>ไม่ผ่าน / แจ้งให้ส่งใหม่</span>
                                </span>
                              )}
                              {doc.status === "pending" && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-900 border border-amber-200">
                                  รอการตรวจสอบ
                                </span>
                              )}

                              {doc.updatedAt && (
                                <span className="text-[10px] text-slate-400">
                                  (อัปเดตเมื่อ {doc.updatedAt})
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
                              onClick={() => handleApproveDoc(detailAthlete.id, doc.id)}
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
                              onClick={() => openRejectDocModal(detailAthlete.id, doc)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isRejected
                                  ? "bg-rose-700 text-white shadow-2xs"
                                  : "border border-rose-300 text-rose-700 hover:bg-rose-50"
                              }`}
                            >
                              ✕ ให้แก้ไข / แจ้งเหตุผล
                            </button>
                          </div>
                        </div>

                        {/* Comment Box if Rejected */}
                        {isRejected && doc.comment && (
                          <div className="mt-2.5 p-2.5 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>ข้อความแจ้งผู้สมัครเพื่อนำส่งเอกสารใหม่:</span>
                            </span>
                            <p className="leading-relaxed pl-3 font-medium">
                              &quot;{doc.comment}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  {detailAthlete.documents.every((d) => d.status === "approved") ? (
                    <span className="text-emerald-800 font-bold">
                      ✓ เอกสารแนบผ่านการอนุมัติครบถ้วน 5/5 ฉบับ พร้อมนำส่งกองกิจการนิสิต
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      * ยังมีเอกสารที่รอตรวจหรือต้องส่งแก้ไข โปรดตรวจสอบให้ครบถ้วนก่อนส่งบัญชีรายชื่อ
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailAthleteId(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSquadModalId(detailAthlete.id);
                      setSquadChoice(detailAthlete.squadType || "main");
                    }}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    กำหนดสถานะตัวจริง / ตัวสำรอง
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===== POPUP: ระบุเหตุผลปฏิเสธเอกสาร (Comment Modal) ===== */}
        {rejectingDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  แจ้งปฏิเสธเอกสารเพื่อให้นำส่งใหม่
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {rejectingDoc.doc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  โปรดระบุข้อบกพร่องของเอกสาร เพื่อให้นักศึกษาสามารถแก้ไขและอัปโหลดส่งใหม่ได้ถูกต้อง
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลและคำแนะนำในการแก้ไข (Comment) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectCommentInput}
                  onChange={(e) => setRejectCommentInput(e.target.value)}
                  placeholder="เช่น ภาพถ่ายสำเนาไม่ชัดเจน ไม่สามารถอ่านเลขบัตรประชาชนได้ หรือ เอกสาร UP 02 ขาดลายเซ็นนายทะเบียน..."
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
                    "เอกสาร UP 02 ไม่ตรงตามปีการศึกษาปัจจุบัน",
                    "ผลการทดสอบสมรรถภาพทางกายหมดอายุหรือไม่สมบูรณ์",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectCommentInput(preset)}
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
                  onClick={confirmRejectDoc}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs"
                >
                  บันทึกและแจ้งให้นักศึกษาส่งใหม่
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== POPUP: พรีวิวเอกสารเสมือนจริง (E-Document Preview Viewer) ===== */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-2xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-blue-900 font-bold uppercase tracking-wider">
                    พรีวิวเอกสารอิเล็กทรอนิกส์ · e-Document Preview
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {previewDoc.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Simulated Official Document Sheet */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 relative overflow-hidden text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-900/10 flex items-center justify-center p-2">
                  <img
                    src="/images/logo_up.png"
                    alt="มหาวิทยาลัยพะเยา"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">มหาวิทยาลัยพะเยา · กองกิจการนิสิต</h4>
                  <p className="text-[11px] text-slate-500">เอกสารแนบประกอบการสมัครตัวแทนนักกีฬา ประจำปีการศึกษา 2569</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">ชื่อเอกสาร:</span>
                    <span className="font-semibold text-slate-900">{previewDoc.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">ชื่อเจ้าของเอกสาร:</span>
                    <span className="font-semibold text-slate-900">{previewDoc.athleteName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">ชื่อไฟล์ที่อัปโหลด:</span>
                    <span className="font-mono text-slate-800">{previewDoc.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ประเภทหลักฐาน:</span>
                    <span className="text-blue-900 font-medium">{previewDoc.category}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  * เอกสารนี้ผ่านการตรวจสอบเบื้องต้นโดยระบบจัดเก็บเอกสารสารนิพนธ์มหาวิทยาลัยพะเยา
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  ปิดหน้าต่างพรีวิว
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== POPUP: กำหนดสถานะตัวจริง / สำรอง ===== */}
        {squadModalId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-sm w-full p-6 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">กำหนดสถานะนักกีฬาตัวแทนชมรม</h3>
                <p className="text-xs text-slate-500 mt-0.5">เลือกประเภทบัญชีรายชื่อที่จะส่งต่อให้กองกิจการนิสิต</p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="squad"
                    value="main"
                    checked={squadChoice === "main"}
                    onChange={() => setSquadChoice("main")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">นักกีฬาตัวจริง (Main Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนในบัญชีรายชื่อหลักที่เข้าแข่งขัน</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="squad"
                    value="reserve"
                    checked={squadChoice === "reserve"}
                    onChange={() => setSquadChoice("reserve")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนทดแทนกรณีตัวจริงสละสิทธิ์หรือบาดเจ็บ</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSquadModalId(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmSquadAllocation}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer shadow-xs"
                >
                  บันทึกผล
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
