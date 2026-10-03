"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import {
  getTeamOfficials,
  updateStaffDocReview,
  updateStaffReview,
  TeamOfficialApplication,
  OfficialDocument,
  OfficialStage,
  POSITION_LABEL,
} from "@/lib/team-official-store";
import { exportAthletesToCSV, AthleteExportRow } from "@/lib/export-helpers";

export default function StaffOfficialsPage() {
  const router = useRouter();
  const [officials, setOfficials] = useState<TeamOfficialApplication[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [detailOfficialId, setDetailOfficialId] = useState<string | null>(null);

  // Per-document reject modal
  const [rejectingDoc, setRejectingDoc] = useState<{ officialId: string; doc: OfficialDocument } | null>(null);
  const [docCommentInput, setDocCommentInput] = useState("");

  // Staff overall reject/return modal
  const [actionModal, setActionModal] = useState<{ officialId: string; type: "return" | "reject" } | null>(null);
  const [actionReasonInput, setActionReasonInput] = useState("");

  // Staff approve & certify modal
  const [approvingOfficialId, setApprovingOfficialId] = useState<string | null>(null);
  const [approveFeedback, setApproveFeedback] = useState("อนุมัติขึ้นทะเบียนบุคลากรกีฬา กกมท. ครั้งที่ 52 อย่างเป็นทางการ");

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; filename: string; category: string; officialName: string } | null>(null);

  useEffect(() => {
    setOfficials(getTeamOfficials());

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qClub = urlParams.get("clubId");
      if (qClub) {
        setSelectedClub(qClub);
      }
    }
  }, []);

  const detailOfficial = officials.find((o) => o.id === detailOfficialId);

  // Filtered officials
  const filtered = officials.filter((o) => {
    const matchClub = selectedClub === "all" || o.clubId === selectedClub;
    const matchStage = selectedStage === "all" || o.stage === selectedStage;
    const matchSearch = `${o.firstName} ${o.lastName} ${o.nationalId} ${o.workplace}`.toLowerCase().includes(search.toLowerCase());
    return matchClub && matchStage && matchSearch;
  });

  // Handlers
  const handleApproveStaffDoc = (officialId: string, docId: string) => {
    const updated = updateStaffDocReview(officialId, docId, "approved");
    setOfficials(updated);
  };

  const openRejectDocModal = (officialId: string, doc: OfficialDocument) => {
    setRejectingDoc({ officialId, doc });
    setDocCommentInput(doc.staffComment || "");
  };

  const confirmRejectStaffDoc = () => {
    if (!rejectingDoc) return;
    if (!docCommentInput.trim()) {
      alert("กรุณาระบุข้อบกพร่องของเอกสารเพื่อแจ้งชมรมและผู้สมัคร");
      return;
    }
    const updated = updateStaffDocReview(rejectingDoc.officialId, rejectingDoc.doc.id, "returned", docCommentInput.trim());
    setOfficials(updated);
    setRejectingDoc(null);
    setDocCommentInput("");
  };

  const confirmStaffApprove = () => {
    if (!approvingOfficialId) return;
    const updated = updateStaffReview(
      approvingOfficialId,
      "approve",
      approveFeedback.trim(),
      "นายอภิสิทธิ์ วงศ์ใหญ่ (หัวหน้างานกีฬา กองกิจการนิสิต)"
    );
    setOfficials(updated);
    setApprovingOfficialId(null);
  };

  const confirmStaffAction = () => {
    if (!actionModal) return;
    if (!actionReasonInput.trim()) {
      alert("กรุณาระบุเหตุผลการดำเนินการ");
      return;
    }
    const updated = updateStaffReview(
      actionModal.officialId,
      actionModal.type,
      actionReasonInput.trim(),
      "นายอภิสิทธิ์ วงศ์ใหญ่ (หัวหน้างานกีฬา กองกิจการนิสิต)"
    );
    setOfficials(updated);
    setActionModal(null);
    setActionReasonInput("");
  };

  const handleExportCSV = () => {
    const rows: AthleteExportRow[] = filtered.map((o, idx) => ({
      index: idx + 1,
      fullName: `${o.firstName} ${o.lastName}`,
      studentId: "-",
      nationalId: o.nationalId,
      gender: "ชาย",
      faculty: o.workplace,
      major: o.workPosition,
      studentLevel: "ปริญญาตรี",
      year: "-",
      sportName: o.sportName,
      position: POSITION_LABEL[o.appliedPosition],
      squadType: o.officialLicenseId || "รอขึ้นทะเบียน",
      status: o.stage === "staff_approved" ? "ขึ้นทะเบียนสำเร็จ" : o.stage === "staff_returned" ? "ตีกลับแก้ไข" : "รอการพิจารณา",
      gpaCumulative: "-",
      phone: o.phone,
    }));
    exportAthletesToCSV("ทะเบียนเจ้าหน้าที่ทีมกีฬา_กกมท52_มหาวิทยาลัยพะเยา", rows);
  };

  const stageBadge = (stage: OfficialStage) => {
    switch (stage) {
      case "submitted_to_club":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">รอประธานชมรมตรวจ</span>;
      case "club_approved":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">ชมรมเสนอชื่อแล้ว (รอกองกิจ)</span>;
      case "club_returned":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">ชมรมตีกลับแก้ไข</span>;
      case "club_rejected":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">ชมรมไม่อนุมัติ</span>;
      case "staff_approved":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">ขึ้นทะเบียนสำเร็จ ✓</span>;
      case "staff_returned":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">กองกิจตีกลับแก้ไข</span>;
      case "staff_rejected":
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">กองกิจไม่อนุมัติ</span>;
    }
  };

  const pendingStaffCount = officials.filter((o) => o.stage === "club_approved").length;
  const certifiedCount = officials.filter((o) => o.stage === "staff_approved").length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton
            href={selectedClub !== "all" ? `/staff/applications/${selectedClub}` : "/staff/applications"}
            label={selectedClub !== "all" ? "กลับหน้ารายการแข่งขันชมรม" : "กลับหน้าจัดการใบสมัคร"}
          />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · งานกีฬาและนันทนาการ
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              ทะเบียนและตรวจสอบเจ้าหน้าที่ทีมกีฬา (ผู้จัดการทีม / ผู้ฝึกสอน)
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 — ตรวจสอบคุณสมบัติ ออกรหัสบัตรประจำตัว กกมท.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => router.push("/staff/selection")}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <span>ไปหน้าประกาศผลทางการ</span>
              <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                กกมท.52
              </span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              ส่งออกรายชื่อ (Excel / CSV)
            </button>
            <button
              onClick={() => router.push("/staff/requests")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              คำร้องพิเศษ
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">รอการพิจารณาจากกองกิจ</span>
            <span className="text-2xl font-bold text-blue-900">{pendingStaffCount} คน</span>
            <p className="text-[11px] text-slate-400 mt-1">ประธานชมรมลงนามเสนอชื่อแล้ว</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">ขึ้นทะเบียนสำเร็จแล้ว</span>
            <span className="text-2xl font-bold text-emerald-800">{certifiedCount} คน</span>
            <p className="text-[11px] text-slate-400 mt-1">ออกรหัสบัตร กกมท. เรียบร้อยแล้ว</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
            <span className="text-xs text-slate-500 block">จำนวนบุคลากรทั้งหมด</span>
            <span className="text-2xl font-bold text-slate-900">{officials.length} คน</span>
            <p className="text-[11px] text-slate-400 mt-1">ครอบคลุมทุกชมรมกีฬา</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">ทุกชมรมกีฬา</option>
              <option value="football">ชมรมฟุตบอล</option>
              <option value="basketball">ชมรมบาสเกตบอล</option>
              <option value="volleyball">ชมรมวอลเลย์บอล</option>
              <option value="swimming">ชมรมว่ายน้ำ</option>
            </select>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">ทุกสถานะขั้นตอน</option>
              <option value="club_approved">รอกองกิจการนิสิตตรวจ (เสนอชื่อแล้ว)</option>
              <option value="staff_approved">ขึ้นทะเบียนสำเร็จ</option>
              <option value="staff_returned">กองกิจตีกลับแก้ไข</option>
              <option value="submitted_to_club">รอประธานชมรมตรวจ</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="ค้นหาชื่อ, เลขบัตรประชาชน, หน่วยงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-700 outline-none w-full md:w-64"
          />
        </div>

        {/* Officials List Table/Cards */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              รายชื่อเจ้าหน้าที่ทีมกีฬาที่เสนอขึ้นทะเบียน
            </h2>
            <span className="text-xs text-slate-500">
              แสดง {filtered.length} รายการ
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                ไม่พบข้อมูลเจ้าหน้าที่ทีมกีฬาตามเงื่อนไขที่เลือก
              </div>
            ) : (
              filtered.map((off) => {
                const docsStaffApproved = off.documents.filter((d) => d.staffStatus === "approved").length;
                const totalDocs = off.documents.length;
                const isReadyForApprove = off.stage === "club_approved" && docsStaffApproved === totalDocs;

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
                          {POSITION_LABEL[off.appliedPosition]} · ชมรม{off.sportName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">#{off.regCode}</span>
                        {stageBadge(off.stage)}
                      </div>

                      <div className="text-xs text-slate-600">
                        {off.workplace} · ตำแหน่ง: {off.workPosition} · โทร: {off.phone}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                        {off.clubReviewedBy && (
                          <span className="text-blue-900 font-medium">
                            เสนอชื่อโดย: {off.clubReviewedBy}
                          </span>
                        )}
                        <span>·</span>
                        <span className={docsStaffApproved === totalDocs ? "text-emerald-700 font-semibold" : "text-amber-700 font-medium"}>
                          กองกิจตรวจผ่านแล้ว {docsStaffApproved}/{totalDocs} ฉบับ
                        </span>
                        {off.officialLicenseId && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              รหัสบัตร กกมท: {off.officialLicenseId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailOfficialId(off.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-300"
                      >
                        ตรวจเอกสาร
                      </button>

                      {off.stage === "club_approved" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setApprovingOfficialId(off.id)}
                            disabled={!isReadyForApprove}
                            title={!isReadyForApprove ? "กรุณาตรวจอนุมัติเอกสารของกองกิจให้ครบก่อน" : ""}
                            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                          >
                            อนุมัติขึ้นทะเบียน
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ officialId: off.id, type: "return" });
                              setActionReasonInput("");
                            }}
                            className="px-3 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                          >
                            ตีกลับแก้ไข
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

        {/* Modal: ตรวจเอกสารรายฉบับอย่างละเอียด (Staff) */}
        {detailOfficial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl border border-slate-300 max-w-3xl w-full p-6 space-y-4 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">#{detailOfficial.regCode}</span>
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {POSITION_LABEL[detailOfficial.appliedPosition]} · ชมรม{detailOfficial.sportName}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {detailOfficial.firstName} {detailOfficial.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {detailOfficial.workplace} · โทร {detailOfficial.phone}
                  </p>
                </div>
                <button onClick={() => setDetailOfficialId(null)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
              </div>

              {/* ข้อความรับรองจากชมรม */}
              {detailOfficial.clubFeedback && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-blue-900 block">
                    ความเห็นและการรับรองจากประธานชมรม ({detailOfficial.clubReviewedBy}):
                  </span>
                  <p className="text-slate-700">{detailOfficial.clubFeedback}</p>
                </div>
              )}

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
                  <span className="text-slate-400 block">ที่อยู่</span>
                  <span className="font-semibold text-slate-900">
                    {detailOfficial.addressNo} ต.{detailOfficial.subDistrict} อ.{detailOfficial.district} จ.{detailOfficial.province}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">สถานที่ทำงาน / ตำแหน่ง</span>
                  <span className="font-semibold text-slate-900">{detailOfficial.workplace} ({detailOfficial.workPosition})</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">ประสบการณ์คุมทีม</span>
                  <span className="font-semibold text-blue-900 font-mono">{detailOfficial.previousCount} ครั้ง</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">รหัสขึ้นทะเบียน กกมท.</span>
                  <span className="font-bold text-emerald-800 font-mono">{detailOfficial.officialLicenseId || "ยังไม่ออกรหัส"}</span>
                </div>
              </div>

              {/* เอกสารหลักฐานรายฉบับ (Staff Per-document Review) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      เอกสารหลักฐานและแผนฝึกซ้อม (การตรวจสอบของกองกิจการนิสิต)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      กองกิจการนิสิตต้องตรวจสอบความถูกต้องของแผนการฝึกซ้อมและเอกสารทั้งหมดก่อนอนุมัติขึ้นทะเบียน
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    อนุมัติแล้ว {detailOfficial.documents.filter((d) => d.staffStatus === "approved").length} / {detailOfficial.documents.length} ฉบับ
                  </span>
                </div>

                <div className="space-y-2.5">
                  {detailOfficial.documents.map((doc) => {
                    const isStaffApproved = doc.staffStatus === "approved";
                    const isStaffReturned = doc.staffStatus === "returned";
                    const isStaffPending = doc.staffStatus === "pending";

                    return (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isStaffReturned
                            ? "bg-rose-50/60 border-rose-200"
                            : isStaffApproved
                            ? "bg-white border-slate-200 shadow-2xs"
                            : "bg-amber-50/40 border-amber-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{doc.title}</span>
                              {isStaffApproved && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ ผ่านการอนุมัติ (กองกิจ)
                                </span>
                              )}
                              {isStaffReturned && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  ✕ ตีกลับแก้ไข / ให้ส่งใหม่
                                </span>
                              )}
                              {isStaffPending && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-900 border border-amber-200">
                                  รอกองกิจตรวจสอบ
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
                              onClick={() => handleApproveStaffDoc(detailOfficial.id, doc.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isStaffApproved
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
                                isStaffReturned
                                  ? "bg-rose-700 text-white shadow-2xs"
                                  : "border border-rose-300 text-rose-700 hover:bg-rose-50"
                              }`}
                            >
                              ✕ ตีกลับ / แจ้งแก้ไข
                            </button>
                          </div>
                        </div>

                        {/* Comment Box if Returned */}
                        {isStaffReturned && doc.staffComment && (
                          <div className="mt-2.5 p-2.5 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>ข้อความแจ้งให้แก้ไขเอกสาร (จากกองกิจการนิสิต):</span>
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

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  {detailOfficial.documents.every((d) => d.staffStatus === "approved") ? (
                    <span className="text-emerald-800 font-bold">
                      ✓ เอกสารและแผนฝึกซ้อมผ่านการตรวจจากกองกิจครบถ้วน พร้อมอนุมัติขึ้นทะเบียน
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      * ยังมีเอกสารที่รอกองกิจตรวจหรือให้แก้ไข โปรดตรวจให้ครบถ้วนก่อน
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

                  {detailOfficial.stage === "club_approved" && (
                    <button
                      type="button"
                      disabled={!detailOfficial.documents.every((d) => d.staffStatus === "approved")}
                      onClick={() => {
                        setApprovingOfficialId(detailOfficial.id);
                        setDetailOfficialId(null);
                      }}
                      className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      อนุมัติและออกรหัสบัตร กกมท.
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal: ตีกลับเอกสารรายฉบับ (Staff Comment) */}
        {rejectingDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  แจ้งตีกลับเอกสารเพื่อให้นำส่งใหม่ (กองกิจการนิสิต)
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{rejectingDoc.doc.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  โปรดระบุข้อบกพร่องเพื่อให้ชมรมและผู้สมัครดำเนินการแก้ไข
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
                  placeholder="เช่น แผนการฝึกซ้อมกีฬาไม่ระบุสถานที่และตารางการเก็บตัว หรือ เอกสารขาดลายเซ็นรับรอง..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  เหตุผลยอดนิยม:
                </span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    "แผนการฝึกซ้อมกีฬาไม่ระบุสถานที่และตารางการเก็บตัว",
                    "ขาดสำเนาคุณวุฒิผู้ฝึกสอนกีฬาตามมาตรฐานสมาคมกีฬา",
                    "สำเนาบัตรประชาชนไม่ชัดเจนหรือไม่รับรองสำเนาถูกต้อง",
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
                  onClick={confirmRejectStaffDoc}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs"
                >
                  บันทึกแจ้งตีกลับ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: อนุมัติขึ้นทะเบียน (ออกรหัสบัตร กกมท.) */}
        {approvingOfficialId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  อนุมัติขึ้นทะเบียนบุคลากรกีฬาอย่างเป็นทางการ
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  ออกรหัสบัตรประจำตัวเจ้าหน้าที่ทีม กกมท. ครั้งที่ 52
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  กองกิจการนิสิต มหาวิทยาลัยพะเยา
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <span>✓</span>
                  <span>ผ่านการตรวจสอบคุณสมบัติและแผนการฝึกซ้อมตามระเบียบ กกมท.</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  ระบบจะสร้างรหัสบัตรประจำตัวทางการ (Official Accreditation ID) และบันทึกข้อมูลเข้าระบบทะเบียนนักกีฬาและบุคลากรกีฬาตัวแทนสถาบัน
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ข้อความรับรอง / บันทึกผลการพิจารณา
                </label>
                <textarea
                  rows={3}
                  value={approveFeedback}
                  onChange={(e) => setApproveFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovingOfficialId(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmStaffApprove}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer shadow-xs"
                >
                  ยืนยันอนุมัติและออกบัตร
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: ตีกลับหรือปฏิเสธภาพรวม (Staff Action Modal) */}
        {actionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  {actionModal.type === "return" ? "ตีกลับใบสมัครให้แก้ไข" : "ไม่อนุมัติขึ้นทะเบียน"}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">ระบุเหตุผลและคำแนะนำ</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบจะส่งข้อความแจ้งเตือนนี้ไปยังประธานชมรมและผู้สมัคร
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผล <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={actionReasonInput}
                  onChange={(e) => setActionReasonInput(e.target.value)}
                  placeholder="ระบุเหตุผลอย่างละเอียด..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmStaffAction}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs"
                >
                  ยืนยันบันทึกผล
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
                  <p className="text-[10px] text-slate-400 font-mono">Ref: UP-STAFF-OFFICIAL-VERIFIED</p>
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
