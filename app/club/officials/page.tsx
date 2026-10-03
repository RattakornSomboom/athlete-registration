"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import {
  getTeamOfficials,
  updateClubDocReview,
  updateClubReview,
  TeamOfficialApplication,
  OfficialDocument,
  OfficialStage,
  POSITION_LABEL,
} from "@/lib/team-official-store";

export default function ClubOfficialsPage() {
  const router = useRouter();
  const [officials, setOfficials] = useState<TeamOfficialApplication[]>([]);
  const [selectedClub, setSelectedClub] = useState("football");
  const [detailOfficialId, setDetailOfficialId] = useState<string | null>(null);

  // Per-document reject modal
  const [rejectingDoc, setRejectingDoc] = useState<{ officialId: string; doc: OfficialDocument } | null>(null);
  const [docCommentInput, setDocCommentInput] = useState("");

  // Overall reject modal
  const [rejectingOfficialId, setRejectingOfficialId] = useState<string | null>(null);
  const [officialRejectReason, setOfficialRejectReason] = useState("");

  // Endorse & Submit modal
  const [endorsingOfficialId, setEndorsingOfficialId] = useState<string | null>(null);
  const [endorseFeedback, setEndorseFeedback] = useState("ผ่านการรับรองและเห็นชอบแผนการฝึกซ้อมจากชมรมกีฬาเรียบร้อยแล้ว เสนอชื่อต่อกองกิจการนิสิต");

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; filename: string; category: string; officialName: string } | null>(null);

  useEffect(() => {
    setOfficials(getTeamOfficials(selectedClub));
  }, [selectedClub]);

  const detailOfficial = officials.find((o) => o.id === detailOfficialId);

  // Handlers
  const handleApproveDoc = (officialId: string, docId: string) => {
    const updated = updateClubDocReview(officialId, docId, "approved");
    setOfficials(updated.filter((o) => o.clubId === selectedClub));
  };

  const openRejectDocModal = (officialId: string, doc: OfficialDocument) => {
    setRejectingDoc({ officialId, doc });
    setDocCommentInput(doc.clubComment || "");
  };

  const confirmRejectDoc = () => {
    if (!rejectingDoc) return;
    if (!docCommentInput.trim()) {
      alert("กรุณาระบุเหตุผลหรือข้อบกพร่องของเอกสารเพื่อให้ผู้สมัครทราบ");
      return;
    }
    const updated = updateClubDocReview(rejectingDoc.officialId, rejectingDoc.doc.id, "returned", docCommentInput.trim());
    setOfficials(updated.filter((o) => o.clubId === selectedClub));
    setRejectingDoc(null);
    setDocCommentInput("");
  };

  const confirmEndorseToStaff = () => {
    if (!endorsingOfficialId) return;
    const updated = updateClubReview(
      endorsingOfficialId,
      "approve",
      endorseFeedback.trim(),
      "นายสมชาย ใจดี (ประธานชมรมฟุตบอล)"
    );
    setOfficials(updated.filter((o) => o.clubId === selectedClub));
    setEndorsingOfficialId(null);
  };

  const confirmOverallReject = () => {
    if (!rejectingOfficialId || !officialRejectReason.trim()) {
      alert("กรุณาระบุเหตุผลการไม่อนุมัติ");
      return;
    }
    const updated = updateClubReview(
      rejectingOfficialId,
      "reject",
      officialRejectReason.trim(),
      "นายสมชาย ใจดี (ประธานชมรมฟุตบอล)"
    );
    setOfficials(updated.filter((o) => o.clubId === selectedClub));
    setRejectingOfficialId(null);
    setOfficialRejectReason("");
  };

  const stageBadge = (stage: OfficialStage) => {
    switch (stage) {
      case "submitted_to_club":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">รอชมรมตรวจสอบ</span>;
      case "club_approved":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">ชมรมเสนอชื่อแล้ว (รอกองกิจ)</span>;
      case "club_returned":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">ชมรมให้แก้ไขเอกสาร</span>;
      case "club_rejected":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">ชมรมไม่อนุมัติ</span>;
      case "staff_approved":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">กองกิจขึ้นทะเบียนสำเร็จ ✓</span>;
      case "staff_returned":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">กองกิจตีกลับให้แก้ไข</span>;
      case "staff_rejected":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">กองกิจไม่อนุมัติ</span>;
    }
  };

  const pendingCount = officials.filter((o) => o.stage === "submitted_to_club").length;
  const approvedCount = officials.filter((o) => o.stage === "club_approved" || o.stage === "staff_approved").length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/competitions" label="กลับรายการแข่งขัน" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การพิจารณาและรับรองเจ้าหน้าที่ทีมกีฬา (ผู้จัดการทีม / ผู้ฝึกสอน)
            </h1>
            <p className="text-xs text-slate-500">
              ตรวจสอบคุณสมบัติ แผนการฝึกซ้อม และเอกสารหลักฐาน ก่อนลงนามเสนอชื่อให้กองกิจการนิสิตขึ้นทะเบียน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/review")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              บัญชีรายชื่อนักกีฬา
            </button>
            <button
              onClick={() => router.push("/club/tracking")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ติดตามสถานะส่งกองกิจ
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">รอชมรมตรวจสอบ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ต้องตรวจเอกสารและรับรองแผนฝึกซ้อม</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">ชมรมเสนอชื่อแล้ว / ขึ้นทะเบียน</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-900">{approvedCount}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ส่งต่อให้กองกิจการนิสิตพิจารณา</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">ยอดรวมบุคลากรที่ยื่นขอ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{officials.length}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ผู้จัดการทีม / ผู้ฝึกสอน / ผู้ช่วยฯ</p>
          </div>
        </div>

        {/* Official Application List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              รายชื่อเจ้าหน้าที่ทีมกีฬาที่เสนอตัวปฏิบัติหน้าที่
            </h2>
            <span className="text-xs text-slate-500">
              คลิกที่รายชื่อเพื่อเปิดตรวจเอกสารและรับรองแผนฝึกซ้อม
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {officials.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                ยังไม่มีข้อมูลการสมัครเจ้าหน้าที่ทีมในชมรมนี้
              </div>
            ) : (
              officials.map((off) => {
                const docsApproved = off.documents.filter((d) => d.clubStatus === "approved").length;
                const totalDocs = off.documents.length;
                const allDocsApproved = docsApproved === totalDocs;

                return (
                  <div
                    key={off.id}
                    className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div
                      onClick={() => setDetailOfficialId(off.id)}
                      className="flex-1 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                          {off.firstName} {off.lastName}
                        </span>
                        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {POSITION_LABEL[off.appliedPosition]} {off.appliedPosition === "other" && `(${off.appliedPositionOther})`}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">#{off.regCode}</span>
                        {stageBadge(off.stage)}
                      </div>

                      <div className="text-xs text-slate-600">
                        {off.workplace} · ตำแหน่ง: {off.workPosition} · โทร: {off.phone}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span>ยื่นเมื่อ: {off.submittedAt}</span>
                        <span>·</span>
                        <span className={allDocsApproved ? "text-emerald-700 font-semibold" : "text-amber-700 font-medium"}>
                          ตรวจเอกสารผ่านแล้ว {docsApproved}/{totalDocs} ฉบับ
                        </span>
                        {off.officialLicenseId && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-emerald-800 font-bold">
                              รหัส กกมท: {off.officialLicenseId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailOfficialId(off.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-300"
                      >
                        ตรวจเอกสารรายฉบับ
                      </button>

                      {off.stage === "submitted_to_club" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEndorsingOfficialId(off.id)}
                            disabled={!allDocsApproved}
                            title={!allDocsApproved ? "กรุณาตรวจอนุมัติเอกสารให้ครบก่อนเสนอชื่อ" : ""}
                            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                          >
                            ลงนามเสนอชื่อส่งกองกิจ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingOfficialId(off.id);
                              setOfficialRejectReason("");
                            }}
                            className="px-3 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                          >
                            ไม่อนุมัติ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal: ตรวจสอบเอกสารรายฉบับอย่างละเอียด */}
        {detailOfficial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl border border-slate-300 max-w-3xl w-full p-6 space-y-4 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">#{detailOfficial.regCode}</span>
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {POSITION_LABEL[detailOfficial.appliedPosition]}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {detailOfficial.firstName} {detailOfficial.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    ชมรม{detailOfficial.sportName} มหาวิทยาลัยพะเยา
                  </p>
                </div>
                <button onClick={() => setDetailOfficialId(null)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
              </div>

              {/* ข้อมูลทั่วไป */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เลขประจำตัวประชาชน</span>
                  <span className="font-semibold text-slate-900 font-mono">{detailOfficial.nationalId}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">สัญชาติ / วันเกิด</span>
                  <span className="font-semibold text-slate-900">{detailOfficial.nationality} ({detailOfficial.birthDate})</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เบอร์โทรศัพท์ / อีเมล</span>
                  <span className="font-semibold text-slate-900 block">{detailOfficial.phone}</span>
                  <span className="text-[10px] text-slate-500">{detailOfficial.email}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">สถานที่ทำงานปัจจุบัน</span>
                  <span className="font-semibold text-slate-900">{detailOfficial.workplace}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">ตำแหน่งในที่ทำงาน</span>
                  <span className="font-semibold text-slate-900">{detailOfficial.workPosition}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">ประสบการณ์ในกีฬามหาวิทยาลัยฯ</span>
                  <span className="font-semibold text-blue-900 font-mono">{detailOfficial.previousCount} ครั้ง</span>
                </div>
              </div>

              {/* การตรวจเอกสารรายฉบับ (Per-document Review) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      เอกสารหลักฐานและแผนการฝึกซ้อม (ตรวจแยกรายฉบับ)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ประธานชมรมต้องตรวจรูปถ่าย, บัตรประชาชน และแผนการฝึกซ้อมให้ผ่านทุกฉบับก่อนลงนามส่งกองกิจ
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    อนุมัติแล้ว {detailOfficial.documents.filter((d) => d.clubStatus === "approved").length} / {detailOfficial.documents.length} ฉบับ
                  </span>
                </div>

                <div className="space-y-2.5">
                  {detailOfficial.documents.map((doc) => {
                    const isApproved = doc.clubStatus === "approved";
                    const isReturned = doc.clubStatus === "returned";
                    const isPending = doc.clubStatus === "pending";

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
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{doc.title}</span>
                              {isApproved && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ ผ่านการอนุมัติ (ชมรม)
                                </span>
                              )}
                              {isReturned && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  ✕ ตีกลับแก้ไข / ให้ส่งใหม่
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

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  title: doc.title,
                                  filename: doc.filename,
                                  category: doc.category,
                                  officialName: `${detailOfficial.firstName} ${detailOfficial.lastName}`,
                                })
                              }
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-300 flex items-center gap-1"
                            >
                              <span>ดูเอกสาร</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveDoc(detailOfficial.id, doc.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isApproved
                                  ? "bg-emerald-800 text-white shadow-2xs"
                                  : "border border-emerald-700 text-emerald-800 hover:bg-emerald-50"
                              }`}
                            >
                              ✓ อนุมัติเอกสาร
                            </button>

                            <button
                              type="button"
                              onClick={() => openRejectDocModal(detailOfficial.id, doc)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isReturned
                                  ? "bg-rose-700 text-white shadow-2xs"
                                  : "border border-rose-300 text-rose-700 hover:bg-rose-50"
                              }`}
                            >
                              ✕ ให้แก้ไข / แจ้งเหตุผล
                            </button>
                          </div>
                        </div>

                        {/* Comment Box if Returned */}
                        {isReturned && doc.clubComment && (
                          <div className="mt-2.5 p-2.5 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>ข้อความแจ้งผู้สมัครเพื่อนำส่งเอกสารใหม่:</span>
                            </span>
                            <p className="leading-relaxed pl-3 font-medium">
                              &quot;{doc.clubComment}&quot;
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
                  {detailOfficial.documents.every((d) => d.clubStatus === "approved") ? (
                    <span className="text-emerald-800 font-bold">
                      ✓ เอกสารและแผนฝึกซ้อมผ่านครบถ้วน พร้อมลงนามเสนอชื่อต่อกองกิจการนิสิต
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      * ยังมีเอกสารที่รอตรวจหรือต้องส่งแก้ไข โปรดตรวจให้ครบถ้วนก่อนส่ง
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailOfficialId(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>

                  {detailOfficial.stage === "submitted_to_club" && (
                    <button
                      type="button"
                      disabled={!detailOfficial.documents.every((d) => d.clubStatus === "approved")}
                      onClick={() => {
                        setEndorsingOfficialId(detailOfficial.id);
                        setDetailOfficialId(null);
                      }}
                      className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      ลงนามเสนอชื่อส่งกองกิจ
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal: ตีกลับเอกสารรายฉบับ (Comment Modal) */}
        {rejectingDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  แจ้งปฏิเสธเอกสารเพื่อให้นำส่งใหม่ (ชมรมกีฬา)
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{rejectingDoc.doc.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  โปรดระบุข้อบกพร่องของเอกสาร เพื่อให้ผู้สมัครแก้ไขและอัปโหลดส่งใหม่ได้ถูกต้อง
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลและคำแนะนำในการแก้ไข (Comment) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={docCommentInput}
                  onChange={(e) => setDocCommentInput(e.target.value)}
                  placeholder="เช่น ภาพถ่ายหน้าตรงไม่ชัดเจน หรือ แผนการฝึกซ้อมไม่ระบุระยะเวลาเก็บตัว..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  เหตุผลยอดนิยม (คลิกเพื่อเลือกด่วน):
                </span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    "ภาพถ่ายเอกสารไม่ชัดเจน โปรดสแกนใหม่",
                    "แผนการฝึกซ้อมไม่ระบุตารางการเก็บตัวและสถานที่",
                    "สำเนาบัตรประชาชนยังไม่ลงนามรับรองสำเนาถูกต้อง",
                    "ขาดหลักฐานคุณวุฒิผู้ฝึกสอนตามเกณฑ์ของสมาคมกีฬา",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDocCommentInput(preset)}
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
                  บันทึกและแจ้งให้ส่งใหม่
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: ลงนามรับรองและเสนอชื่อส่งกองกิจ (Endorse Modal) */}
        {endorsingOfficialId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
                  หนังสือรับรองและลงนามเสนอชื่อเจ้าหน้าที่ทีมกีฬา (ข้อ 8)
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  ลงนามเสนอชื่อต่อกองกิจการนิสิต มหาวิทยาลัยพะเยา
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  <p className="text-slate-700 leading-relaxed">
                    ข้าพเจ้าในนามประธานชมรมกีฬา ขอรับรองว่าบุคคลดังกล่าวเป็นผู้มีความรู้ ความสามารถ
                    และมีคุณสมบัติเหมาะสมตามระเบียบ กกมท. โดยชมรมได้ตรวจสอบและเห็นชอบแผนการฝึกซ้อมเรียบร้อยแล้ว
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  ผู้ลงนาม: <strong>นายสมชาย ใจดี</strong> (ประธานชมรมฟุตบอล มหาวิทยาลัยพะเยา)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ความเห็นและข้อเสนอแนะเพิ่มเติมต่อกองกิจการนิสิต
                </label>
                <textarea
                  rows={3}
                  value={endorseFeedback}
                  onChange={(e) => setEndorseFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEndorsingOfficialId(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmEndorseToStaff}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer shadow-xs"
                >
                  ลงนามรับรองและส่งต่อกองกิจ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: ไม่อนุมัติเจ้าหน้าที่ทีมภาพรวม */}
        {rejectingOfficialId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  ไม่อนุมัติคำขอขึ้นทะเบียน
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">ระบุเหตุผลการไม่อนุมัติ</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบจะบันทึกผลและแจ้งเหตุผลไปยังผู้สมัคร
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลการไม่อนุมัติ <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={officialRejectReason}
                  onChange={(e) => setOfficialRejectReason(e.target.value)}
                  placeholder="เช่น ชมรมมีผู้ฝึกสอนครบโควตาตามระเบียบแล้ว หรือ คุณสมบัติไม่ตรงตามข้อกำหนดของชนิดกีฬา..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingOfficialId(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmOverallReject}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs"
                >
                  ยืนยันไม่อนุมัติ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Document Preview */}
        {previewDoc && (
          <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
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

              {/* Document Sheet */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-lg space-y-4 relative overflow-hidden text-xs font-sans">
                <div className="text-center border-b border-slate-200 pb-3">
                  <div className="w-9 h-9 bg-blue-900 text-white rounded flex items-center justify-center font-bold text-xs mx-auto mb-1">
                    UP
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{previewDoc.title}</h4>
                  <p className="text-[11px] text-slate-500">มหาวิทยาลัยพะเยา · University of Phayao</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>ผู้ยื่นเอกสาร: <strong className="text-slate-900">{previewDoc.officialName}</strong></div>
                  <div>หมวดหมู่: <strong className="text-slate-900">{previewDoc.category}</strong></div>
                  <div>ชนิดเอกสาร: <strong className="font-mono text-blue-900">{previewDoc.filename}</strong></div>
                  <div>การรับรอง: <strong className="text-emerald-700">ยืนยันตัวตนผ่านระบบสารสนเทศ ✓</strong></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded text-center text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-800">เอกสารนี้ได้รับการรับรองผ่านระบบสารสนเทศทะเบียนกลาง มหาวิทยาลัยพะเยา</p>
                  <p className="text-[10px] text-slate-400 font-mono">Ref: UP-OFFICIAL-VERIFIED</p>
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

      </div>
    </div>
  );
}
