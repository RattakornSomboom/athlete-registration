"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import {
  getClubCompetitions,
  getClubApplicants,
  saveClubApplicants,
  saveClubCompetitions,
  resubmitDocumentToStaff,
  ClubCompetition,
  ClubAthleteApplication,
  ApplicantDocument,
} from "@/lib/club-store";

export default function ClubTrackingPage() {
  const router = useRouter();

  const [competitions, setCompetitions] = useState<ClubCompetition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>("1");
  const [applicants, setApplicants] = useState<ClubAthleteApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "returned" | "approved" | "pending">("all");

  // Resubmit Modal State
  const [resubmitModal, setResubmitModal] = useState<{
    athlete: ClubAthleteApplication;
    doc: ApplicantDocument;
  } | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [resubmitNote, setResubmitNote] = useState("");

  // Preview Doc Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    filename: string;
    studentName: string;
    staffComment?: string;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    const comps = getClubCompetitions();
    setCompetitions(comps);
    const apps = getClubApplicants();
    setApplicants(apps);
  }, []);

  const activeCompetition = competitions.find((c) => c.id === selectedCompId) || competitions[0];

  // Filter applicants of selected competition who are submitted (status === "approved" as squad members)
  const submittedApplicants = applicants.filter(
    (a) => a.competitionId === selectedCompId && a.status === "approved"
  );

  // Calculate statistics
  const totalSubmitted = submittedApplicants.length;
  const mainSquadCount = submittedApplicants.filter((a) => a.squadType === "main").length;
  const reserveSquadCount = submittedApplicants.filter((a) => a.squadType === "reserve").length;

  // Flatten all documents of submitted applicants to count staff review outcomes
  const allDocs = submittedApplicants.flatMap((a) => a.documents);
  const staffApprovedDocs = allDocs.filter((d) => d.staffStatus === "approved").length;
  const staffReturnedDocs = allDocs.filter((d) => d.staffStatus === "returned").length;
  const staffPendingDocs = allDocs.filter((d) => d.staffStatus === "pending" || !d.staffStatus).length;

  // Filter list by status tab
  const filteredApplicants = submittedApplicants.filter((a) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "returned") {
      return a.documents.some((d) => d.staffStatus === "returned");
    }
    if (filterStatus === "approved") {
      return a.documents.every((d) => d.staffStatus === "approved");
    }
    if (filterStatus === "pending") {
      return a.documents.some((d) => d.staffStatus === "pending" || !d.staffStatus);
    }
    return true;
  });

  // Handle Resubmit Document
  const handleConfirmResubmit = () => {
    if (!resubmitModal) return;
    const finalFileName =
      newFileName.trim() ||
      `${resubmitModal.doc.id}_corrected_${resubmitModal.athlete.studentId}.pdf`;

    const updated = resubmitDocumentToStaff(
      resubmitModal.athlete.id,
      resubmitModal.doc.id,
      finalFileName
    );
    setApplicants(updated);
    setResubmitModal(null);
    setNewFileName("");
    setResubmitNote("");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top Navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/competitions" label="กลับรายการแข่งขัน" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              ติดตามสถานะการส่งรายชื่อและผลการตรวจเอกสารจากกองกิจการนิสิต
            </h1>
            <p className="text-xs text-slate-500">
              ตรวจสอบความคืบหน้าของบัญชีรายชื่อที่ส่งมอบให้กองกิจการนิสิต เอกสารที่ผ่านการอนุมัติ และเอกสารที่ถูกตีกลับเพื่อส่งแก้ไข
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/club/competitions/${selectedCompId}`)}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ← ดูรายชื่อผู้สมัครและคัดเลือก
            </button>
            <button
              onClick={() => router.push("/club/review")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              จัดทำบัญชีรายชื่อใหม่
            </button>
          </div>
        </div>

        {/* Competition Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {competitions.map((comp) => {
            const isSelected = comp.id === selectedCompId;
            return (
              <button
                key={comp.id}
                onClick={() => setSelectedCompId(comp.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isSelected
                    ? "bg-blue-900 text-white border-blue-900 shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <span>{comp.eventName}</span>
                {comp.returnedCount && comp.returnedCount > 0 ? (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-800"
                  }`}>
                    ตีกลับ {comp.returnedCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Overview Metric Banner for Selected Competition */}
        {activeCompetition && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {activeCompetition.eventName} ({activeCompetition.category})
                  </h2>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-900 border border-blue-200">
                    ส่งรายชื่อแล้ว
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  วันที่นำส่งกองกิจการนิสิต: {activeCompetition.submittedAt || "28 กันยายน 2569 เวลา 14:30 น."}
                </p>
              </div>

              {/* Status Indicator */}
              <div>
                {staffReturnedDocs > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    <span>พบเอกสารตีกลับ {staffReturnedDocs} ฉบับ (ต้องส่งแก้ไข)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold">
                    <span>✓</span>
                    <span>เอกสารได้รับการอนุมัติครบถ้วนสมบูรณ์</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-xs block">นักกีฬาที่ส่งรายชื่อ</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {totalSubmitted} คน
                </span>
                <span className="text-[11px] text-slate-400">
                  ตัวจริง {mainSquadCount} · สำรอง {reserveSquadCount}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-emerald-800 text-xs block font-medium">กองกิจอนุมัติแล้ว</span>
                <span className="text-xl font-bold text-emerald-900 mt-0.5 block">
                  {staffApprovedDocs} ฉบับ
                </span>
                <span className="text-[11px] text-emerald-700">
                  คิดเป็น {allDocs.length > 0 ? Math.round((staffApprovedDocs / allDocs.length) * 100) : 0}% ของเอกสารทั้งหมด
                </span>
              </div>

              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-rose-800 text-xs block font-bold">เอกสารตีกลับให้แก้ไข</span>
                <span className="text-xl font-bold text-rose-900 mt-0.5 block">
                  {staffReturnedDocs} ฉบับ
                </span>
                <span className="text-[11px] text-rose-700 font-medium">
                  {staffReturnedDocs > 0 ? "ดำเนินการแก้ไขด้านล่าง" : "ไม่มีเอกสารค้าง"}
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-amber-800 text-xs block font-medium">รอการตรวจสอบ</span>
                <span className="text-xl font-bold text-amber-900 mt-0.5 block">
                  {staffPendingDocs} ฉบับ
                </span>
                <span className="text-[11px] text-amber-700">
                  เจ้าหน้าที่กำลังตรวจ
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 mr-1">แสดงตามสถานะ:</span>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterStatus === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              ทั้งหมด ({submittedApplicants.length})
            </button>
            <button
              onClick={() => setFilterStatus("returned")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterStatus === "returned"
                  ? "bg-rose-700 text-white"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              มีเอกสารตีกลับ ({submittedApplicants.filter((a) => a.documents.some((d) => d.staffStatus === "returned")).length})
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterStatus === "approved"
                  ? "bg-emerald-800 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              ผ่านการอนุมัติครบ ({submittedApplicants.filter((a) => a.documents.every((d) => d.staffStatus === "approved")).length})
            </button>
          </div>

          <span className="text-xs text-slate-500">
            *คลิกปุ่ม &quot;แนบส่งเอกสารฉบับแก้ไข&quot; เพื่ออัปโหลดไฟล์แก้ไขส่งกลับไปยังกองกิจ
          </span>
        </div>

        {/* Applicants and Detailed Document Status Table */}
        <div className="space-y-3.5">
          {filteredApplicants.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-xs">
              ไม่พบรายชื่อนักกีฬาในเงื่อนไขการค้นหานี้
            </div>
          ) : (
            filteredApplicants.map((applicant) => {
              const returnedList = applicant.documents.filter((d) => d.staffStatus === "returned");
              const hasReturned = returnedList.length > 0;
              const allApproved = applicant.documents.every((d) => d.staffStatus === "approved");

              return (
                <div
                  key={applicant.id}
                  className={`bg-white rounded-xl border transition-all overflow-hidden shadow-xs ${
                    hasReturned ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
                  }`}
                >
                  {/* Applicant Summary Header */}
                  <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasReturned ? "bg-rose-50/50 border-rose-200" : "bg-slate-50/50 border-slate-100"
                  }`}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {applicant.firstName} {applicant.lastName}
                          </span>
                          <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            รหัสนิสิต {applicant.studentId}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            applicant.squadType === "main"
                              ? "bg-blue-100 text-blue-900 border border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {applicant.squadType === "main" ? "นักกีฬาตัวจริง" : "นักกีฬาตัวสำรอง"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {applicant.faculty} · สาขา{applicant.major} (ปี {applicant.year}) · ตำแหน่ง: {applicant.category} · โทร. {applicant.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasReturned ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                          <span>มีเอกสารตีกลับ {returnedList.length} ฉบับ</span>
                        </span>
                      ) : allApproved ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <span>✓</span>
                          <span>กองกิจอนุมัติเอกสารครบถ้วน</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200">
                          อยู่ระหว่างการตรวจเอกสาร
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Documents Detailed Audit Status List (5 ฉบับ) */}
                  <div className="p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      สถานะการพิจารณาเอกสารรายฉบับโดยกองกิจการนิสิต (5 ฉบับ)
                    </h4>

                    <div className="grid grid-cols-1 gap-2.5">
                      {applicant.documents.map((doc) => {
                        const isReturned = doc.staffStatus === "returned";
                        const isApproved = doc.staffStatus === "approved";
                        const isPending = doc.staffStatus === "pending" || !doc.staffStatus;

                        return (
                          <div
                            key={doc.id}
                            className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                              isReturned
                                ? "bg-rose-50/70 border-rose-300 shadow-2xs"
                                : isApproved
                                ? "bg-white border-slate-200"
                                : "bg-amber-50/40 border-amber-200"
                            }`}
                          >
                            {/* Left: Document metadata & Comments */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-900">
                                  {doc.title}
                                </span>

                                {/* Staff Status Badge */}
                                {isApproved && (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <span>✓</span>
                                    <span>กองกิจการนิสิตอนุมัติแล้ว</span>
                                  </span>
                                )}
                                {isReturned && (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-600 text-white border border-rose-700 flex items-center gap-1">
                                    <span>✕</span>
                                    <span>กองกิจการนิสิตตีกลับให้แก้ไข</span>
                                  </span>
                                )}
                                {isPending && (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-900 border border-amber-200">
                                    รอเจ้าหน้าที่กองกิจตรวจ
                                  </span>
                                )}

                                {doc.resubmitted && (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                    ✓ ส่งฉบับแก้ไขแล้ว
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 font-mono">
                                ไฟล์: {doc.filename} · หมวดหมู่: {doc.category}
                              </p>

                              {/* Official Staff Feedback / Comment */}
                              {isReturned && doc.staffComment && (
                                <div className="mt-2 p-2.5 bg-rose-100/90 border border-rose-300 rounded-lg text-xs text-rose-950">
                                  <span className="font-bold text-[11px] block text-rose-900">
                                    ความเห็น / เหตุผลที่กองกิจการนิสิตตีกลับ:
                                  </span>
                                  <p className="mt-0.5 font-medium leading-relaxed pl-3 border-l-2 border-rose-500">
                                    &quot;{doc.staffComment}&quot;
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {/* Preview File */}
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    title: doc.title,
                                    filename: doc.filename,
                                    studentName: `${applicant.firstName} ${applicant.lastName}`,
                                    staffComment: doc.staffComment,
                                  })
                                }
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 cursor-pointer transition-colors"
                              >
                                เปิดดูเอกสาร
                              </button>

                              {/* Resubmit Button (Only available when returned) */}
                              {isReturned && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResubmitModal({ athlete: applicant, doc });
                                    setNewFileName(`${doc.id}_revised_${applicant.studentId}.pdf`);
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                                >
                                  <span>↑ แนบส่งเอกสารฉบับแก้ไข</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===== POPUP: แนบส่งเอกสารฉบับแก้ไขกลับไปยังกองกิจ (Resubmit Modal) ===== */}
        {resubmitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                  ส่งเอกสารฉบับแก้ไข · Resubmit to Student Affairs
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {resubmitModal.doc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  สำหรับผู้สมัคร: <strong className="text-slate-800">{resubmitModal.athlete.firstName} {resubmitModal.athlete.lastName}</strong> (#{resubmitModal.athlete.studentId})
                </p>
              </div>

              {/* Staff Rejection Reason Notice */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-rose-800 block">
                  เหตุผลที่กองกิจการนิสิตให้แก้ไข:
                </span>
                <p className="text-rose-900 italic">
                  &quot;{resubmitModal.doc.staffComment || "เอกสารไม่สมบูรณ์ กรุณาแนบส่งฉบับแก้ไข"}&quot;
                </p>
              </div>

              {/* Upload Simulation Fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อไฟล์เอกสารฉบับแก้ไข (PDF / PNG) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="เช่น UP02_cert_66027012_signed_v2.pdf"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    บันทึกข้อความชี้แจงถึงเจ้าหน้าที่กองกิจการนิสิต (ถ้ามี)
                  </label>
                  <textarea
                    rows={3}
                    value={resubmitNote}
                    onChange={(e) => setResubmitNote(e.target.value)}
                    placeholder="เช่น ได้นำเอกสาร UP 02 ให้นายทะเบียนลงลายมือชื่อและประทับตรามหาวิทยาลัยเรียบร้อยแล้ว..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-950 space-y-1">
                  <span className="font-bold block">กระบวนการหลังการส่ง:</span>
                  <p>
                    สถานะเอกสารจะเปลี่ยนเป็น &quot;ส่งฉบับแก้ไขแล้ว - รอเจ้าหน้าที่กองกิจตรวจซ้ำ&quot; เพื่อให้เจ้าหน้าที่เปิดตรวจสอบและปลดล็อกการอนุมัติในระบบ
                  </p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResubmitModal(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResubmit}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer shadow-xs"
                >
                  ยืนยันการนำส่งเอกสารฉบับแก้ไข →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== POPUP: พรีวิวเอกสารที่ส่งกองกิจ (Document Viewer) ===== */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-blue-900 font-bold uppercase tracking-wider">
                    เอกสารในสารบบกองกิจการนิสิต
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

              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-900/10 flex items-center justify-center p-2">
                  <img
                    src="/images/logo_up.png"
                    alt="มหาวิทยาลัยพะเยา"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">กองกิจการนิสิต · มหาวิทยาลัยพะเยา</h4>
                  <p className="text-[11px] text-slate-500">ระบบตรวจคุณสมบัตินักกีฬาตัวแทนมหาวิทยาลัยพะเยา</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ผู้ถือสิทธิ์เอกสาร:</span>
                    <span className="font-semibold text-slate-900">{previewDoc.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ชื่อไฟล์ปัจจุบัน:</span>
                    <span className="font-mono text-slate-800">{previewDoc.filename}</span>
                  </div>
                </div>

                {previewDoc.staffComment && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 text-left">
                    <span className="font-bold block text-rose-800">บันทึกจากกองกิจการนิสิต:</span>
                    <p className="mt-0.5">{previewDoc.staffComment}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
