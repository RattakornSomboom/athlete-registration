"use client";

import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData } from "@/components/shared/RequestState";


import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";
import BackButton from "@/components/shared/BackButton";
import { clubReviewProgress } from "@/lib/phase4-client";
import { extractClubFromNote, suggestClubForSport } from "@/lib/university-clubs";
import { useRequestAction } from "@/components/shared/RequestState";
import { documentReference } from "@/lib/athlete-document-policy";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  ClipboardListIcon,
} from "@/components/shared/Icons";

type StatusHistory = {
  id: string;
  status: string;
  label: string;
  by: string;
  createdAt: string;
};

type SportEntry = { sport: string; category: string; division?: string | null };
type CompetitionResult = { competitionName: string; year: string; result: string; evidenceFileUrl?: string | null };

type Application = {
  id: string;
  status: string;
  squadType?: "main" | "reserve" | null;
  note?: string | null;
  noClubFileUrl?: string | null;
  sport: string;
  category: string;
  createdAt: string;
  competition: { name: string; round: string; year: number };
  rosterClub: { id: string; name: string; sport: string } | null;
  sportEntries: SportEntry[];
  competitionResults: CompetitionResult[];
  statusHistory: StatusHistory[];
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  SUBMITTED:      { label: "รอการพิจารณา",           bg: "bg-yellow-50", text: "text-yellow-700" },
  CLUB_APPROVED:  { label: "ผ่านพิจารณาชมรมแล้ว — รอเจ้าหน้าที่", bg: "bg-blue-50", text: "text-blue-700" },
  CLUB_REJECTED:  { label: "ชมรมไม่อนุมัติ",           bg: "bg-red-50", text: "text-red-700" },
  STAFF_APPROVED: { label: "เจ้าหน้าที่อนุมัติ",       bg: "bg-green-50", text: "text-green-700" },
  STAFF_REJECTED: { label: "เจ้าหน้าที่ไม่อนุมัติ",   bg: "bg-red-50", text: "text-red-700" },
  FINAL_SELECTED: { label: "ผ่านการคัดเลือกขั้นสุดท้าย", bg: "bg-emerald-50", text: "text-emerald-700" },
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function uploadEvidence(file: File) {
  const form = new FormData();
  form.set("file", file);
  const result = await fetchJson<{ document: { id: string } }>("/api/documents", { method: "POST", body: form });
  return documentReference(result.document.id);
}

export default function AthleteStatusPage() {
  const router = useRouter();
  const load = useCallback(() => fetchJson<{ applications: Application[] }>("/api/applications"), []);
  const resource = useRemoteData(load);
  const decisionAction = useRequestAction();
  const applications = resource.data?.applications ?? [];
  const loading = resource.loading;
  const [confirmApplicationId, setConfirmApplicationId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [declineApplicationId, setDeclineApplicationId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineEvidence, setDeclineEvidence] = useState<File | null>(null);

  const submitDecision = (applicationId: string, decision: "CONFIRM" | "DECLINE") => decisionAction.run(async () => {
    const evidenceUrl = decision === "DECLINE" && declineEvidence ? await uploadEvidence(declineEvidence) : null;
    await fetchJson(`/api/applications/${encodeURIComponent(applicationId)}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: decision, reason: declineReason, acceptedTerms: decision === "CONFIRM" ? acceptedTerms : undefined, evidenceUrl }),
    });
    setConfirmApplicationId(null);
    setAcceptedTerms(false);
    setDeclineApplicationId(null);
    setDeclineReason("");
    setDeclineEvidence(null);
    resource.retry();
  }, decision === "CONFIRM" ? "ยืนยันสิทธิ์เรียบร้อยแล้ว" : "บันทึกการสละสิทธิ์เรียบร้อยแล้ว");

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3"><BackButton href="/" label="กลับหน้าหลัก" /></div>
            <span className="text-xs font-semibold text-blue-800">
              ระบบรับสมัครและรายงานตัวนักกีฬาตัวแทนสถาบัน
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              สถานะการสมัครและรายงานตัวนักกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/athlete/register")} className="rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800">สมัครการแข่งขัน</button>
            <LogoutButton />
          </div>
          </div>
        </div>

        <RequestState error={resource.error} retry={resource.retry} />
        {decisionAction.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{decisionAction.error}</div>}
        {decisionAction.success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{decisionAction.success}</div>}
        {resource.error ? null : loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardListIcon className="w-7 h-7 text-slate-500" />
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">ยังไม่มีใบสมัคร</h2>
            <p className="text-slate-500 text-sm mb-4">คุณยังไม่ได้ส่งใบสมัครแข่งขัน</p>
            <button onClick={() => router.push("/athlete/register")} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm rounded-lg transition-colors">สมัครแข่งขัน</button>
          </div>
        ) : (
          <div className="space-y-8">
            {applications.map((app) => {
              const cfg = STATUS_CONFIG[app.status] ?? { label: app.status, bg: "bg-slate-100", text: "text-slate-700" };

              const clubProgress = clubReviewProgress(app);
              const clubSelectionLabel = clubProgress.approved && app.squadType
                ? `ผ่านพิจารณาชมรม — ${app.squadType === "main" ? "ตัวจริง" : "ตัวสำรอง"}`
                : clubProgress.label;
              const isStaffApproved = app.status === "STAFF_APPROVED" || app.status === "FINAL_SELECTED";
              const isFinal = app.status === "FINAL_SELECTED";
              const isRejected = app.status.includes("REJECTED");
              const athleteDecision = app.statusHistory.findLast(history => history.status === "ATHLETE_CONFIRMED" || history.status === "ATHLETE_DECLINED");
              const isConfirmed = athleteDecision?.status === "ATHLETE_CONFIRMED";
              const isDeclined = athleteDecision?.status === "ATHLETE_DECLINED";

              return (
                <div key={app.id} className="space-y-6">
                  {/* Step Progress Tracker */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xs font-semibold text-slate-500 mb-6">
                      ขั้นตอนการคัดเลือก ({app.competition.name})
                    </h2>
                    <div className="grid grid-cols-4 gap-2 relative">
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">1</div>
                        <p className="text-xs font-semibold text-slate-900">ยื่นใบสมัคร</p>
                        <p className="text-xs text-slate-500 mt-0.5">สำเร็จแล้ว</p>
                      </div>

                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                          clubProgress.approved ? "bg-emerald-700 text-white" : clubProgress.rejected ? "bg-rose-700 text-white" : "bg-slate-200 text-slate-500"
                        }`}>2</div>
                        <p className="text-xs font-semibold text-slate-900">พิจารณาคัดเลือก (ชมรม)</p>
                        <p className={`text-xs mt-0.5 ${clubProgress.approved ? "text-emerald-700" : clubProgress.rejected ? "text-rose-700" : "text-slate-500"}`}>
                          {clubSelectionLabel}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                          isStaffApproved ? "bg-emerald-700 text-white" : isRejected && app.status === "STAFF_REJECTED" ? "bg-rose-700 text-white" : "bg-slate-200 text-slate-500"
                        }`}>3</div>
                        <p className="text-xs font-semibold text-slate-900">พิจารณา (เจ้าหน้าที่)</p>
                        <p className={`text-xs mt-0.5 ${isStaffApproved ? "text-emerald-700" : isRejected && app.status === "STAFF_REJECTED" ? "text-rose-700" : "text-slate-500"}`}>
                          {isStaffApproved ? "อนุมัติ" : isRejected && app.status === "STAFF_REJECTED" ? "ไม่ผ่าน" : "รอพิจารณา"}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                          isFinal ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"
                        }`}>4</div>
                        <p className="text-xs font-semibold text-slate-900">ประกาศผล</p>
                        <p className={`text-xs mt-0.5 ${isFinal ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                          {isFinal ? "ผ่านการคัดเลือก" : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Application Details Card */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono tracking-wide text-slate-300">
                            {app.id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-white mt-1">{app.competition.name}</h2>
                        <p className="text-xs text-slate-300">
                          {app.competition.round === "qualifier" ? "รอบคัดเลือก" : "รอบมหกรรม"} ปี {app.competition.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">สถานะผลการพิจารณา</span>
                        <span className={`text-sm font-semibold ${isFinal ? "text-emerald-400" : isRejected ? "text-rose-400" : "text-amber-400"}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {isFinal && (
                        <section className={`rounded-xl border p-4 ${isConfirmed ? "border-emerald-200 bg-emerald-50" : isDeclined ? "border-rose-200 bg-rose-50" : "border-blue-200 bg-blue-50"}`}>
                          {athleteDecision ? (
                            <div>
                              <p className={`text-sm font-bold ${isConfirmed ? "text-emerald-900" : "text-rose-900"}`}>
                                {isConfirmed ? "ยืนยันสิทธิ์แล้ว" : "สละสิทธิ์แล้ว"}
                              </p>
                              <p className={`mt-1 text-xs ${isConfirmed ? "text-emerald-800" : "text-rose-800"}`}>{athleteDecision.label}</p>
                              <p className="mt-1 text-xs text-slate-500">บันทึกเมื่อ {new Date(athleteDecision.createdAt).toLocaleString("th-TH")}</p>
                            </div>
                          ) : declineApplicationId === app.id ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-bold text-rose-900">แจ้งสละสิทธิ์การเป็นตัวแทนมหาวิทยาลัย</p>
                                <p className="mt-1 text-xs text-rose-800">การสละสิทธิ์เป็นคนละขั้นตอนกับการยกเลิกใบสมัคร และไม่สามารถย้อนกลับด้วยตนเองได้</p>
                              </div>
                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-700">เหตุผลที่สละสิทธิ์ <span className="text-red-600">*</span></span>
                                <textarea
                                  value={declineReason}
                                  onChange={event => setDeclineReason(event.target.value)}
                                  rows={3}
                                  maxLength={1000}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  placeholder="ระบุเหตุผลอย่างชัดเจน"
                                />
                              </label>
                              <label className="block text-xs text-slate-700">
                                <span className="mb-1 block font-semibold">หลักฐานประกอบ (ถ้ามี)</span>
                                <input
                                  type="file"
                                  accept="application/pdf,image/jpeg,image/png"
                                  onChange={event => {
                                    const file = event.target.files?.[0] ?? null;
                                    setDeclineEvidence(file && file.size <= MAX_FILE_BYTES ? file : null);
                                  }}
                                  className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                                />
                                <span className="mt-1 block text-xs text-slate-500">PDF/JPG/PNG ขนาดไม่เกิน 5 MB</span>
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={decisionAction.busy || !declineReason.trim()}
                                  onClick={() => submitDecision(app.id, "DECLINE")}
                                  className="rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {decisionAction.busy ? "กำลังบันทึก…" : "ยืนยันการสละสิทธิ์"}
                                </button>
                                <button
                                  type="button"
                                  disabled={decisionAction.busy}
                                  onClick={() => {
                                    setDeclineApplicationId(null);
                                    setDeclineReason("");
                                    setDeclineEvidence(null);
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          ) : confirmApplicationId === app.id ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-bold text-emerald-950">ยืนยันสิทธิ์การเป็นตัวแทนมหาวิทยาลัย</p>
                                <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                                  โปรดตรวจสอบและรับทราบหน้าที่และเงื่อนไขการเป็นนักกีฬาตัวแทนมหาวิทยาลัย:
                                </p>
                                <ul className="mt-2 list-disc list-inside text-xs text-slate-700 space-y-1 bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                                  <li>เข้าร่วมการฝึกซ้อมตามแผนงานและเวลาที่กำหนดอย่างสม่ำเสมอ</li>
                                  <li>ปฏิบัติตามระเบียบ วินัย และคำสั่งของผู้ฝึกสอน/ผู้ควบคุมทีมอย่างเคร่งครัด</li>
                                  <li>เข้าร่วมการแข่งขันตามกำหนดการ และรักษาเกียรติยศชื่อเสียงของสถาบัน</li>
                                </ul>
                              </div>
                              <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer pt-1">
                                <input
                                  type="checkbox"
                                  checked={acceptedTerms}
                                  onChange={e => setAcceptedTerms(e.target.checked)}
                                  className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-500"
                                />
                                <span>ข้าพเจ้ารับทราบหน้าที่และเงื่อนไข และยินยอมปฏิบัติตามระเบียบการเป็นนักกีฬาตัวแทนมหาวิทยาลัยทุกประการ</span>
                              </label>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={decisionAction.busy || !acceptedTerms}
                                  onClick={() => submitDecision(app.id, "CONFIRM")}
                                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {decisionAction.busy ? "กำลังบันทึก…" : "กดยืนยันสิทธิ์ตัวแทนสถาบัน"}
                                </button>
                                <button
                                  type="button"
                                  disabled={decisionAction.busy}
                                  onClick={() => {
                                    setConfirmApplicationId(null);
                                    setAcceptedTerms(false);
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-bold text-blue-950">รายงานตัวหลังผ่านการคัดเลือก</p>
                                <p className="mt-1 text-xs leading-relaxed text-blue-900">กรุณายืนยันว่าจะเข้าร่วมในฐานะตัวแทนมหาวิทยาลัย โดยรับทราบหน้าที่ การฝึกซ้อม ระเบียบ และกำหนดการแข่งขัน หรือแจ้งสละสิทธิ์พร้อมเหตุผล</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={decisionAction.busy}
                                  onClick={() => {
                                    setConfirmApplicationId(app.id);
                                    setAcceptedTerms(false);
                                    setDeclineApplicationId(null);
                                  }}
                                  className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                                >
                                  ยืนยันสิทธิ์
                                </button>
                                <button
                                  type="button"
                                  disabled={decisionAction.busy}
                                  onClick={() => {
                                    setDeclineApplicationId(app.id);
                                    setConfirmApplicationId(null);
                                    setAcceptedTerms(false);
                                  }}
                                  className="rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
                                >
                                  สละสิทธิ์
                                </button>
                              </div>
                            </div>
                          )}
                        </section>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {app.competitionResults && app.competitionResults.some(r => !r.evidenceFileUrl) ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangleIcon className="w-3.5 h-3.5" />
                              ยังไม่ได้แนบรูปหลักฐานผลงาน ({app.competitionResults.filter(r => !r.evidenceFileUrl).length} รายการ)
                            </span>
                          ) : app.competitionResults && app.competitionResults.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckIcon className="w-3.5 h-3.5" />
                              แนบรูปหลักฐานผลงานครบถ้วน
                            </span>
                          ) : null}
                        </div>
                        <button
                          onClick={() => router.push(`/athlete/${app.id}`)}
                          className="self-start sm:self-auto text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>ดูรายละเอียดใบสมัคร</span>
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-slate-500 block">ชนิดกีฬา / รายการ</span>
                          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                            {app.sportEntries.length > 0 ? app.sportEntries.map(e => e.sport).join(', ') : app.sport}
                          </span>
                          <span className="text-slate-500 mt-1 block">
                            ประเภท: {app.sportEntries.length > 0 ? app.sportEntries.map(e => e.category).join(', ') : app.category}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-slate-500 block">ชมรมสังกัด / ผู้ดูแลชนิดกีฬา</span>
                          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                            {(() => {
                              if (app.rosterClub?.name) return app.rosterClub.name;
                              const fromNote = extractClubFromNote(app.note).clubName;
                              if (fromNote) return fromNote;
                              if (app.noClubFileUrl) return "ชนิดกีฬาไม่มีชมรมจัดตั้ง (มีบุคลากรรับรอง)";
                              const autoSuggested = suggestClubForSport(app.sportEntries[0]?.sport || app.sport);
                              if (autoSuggested) return autoSuggested;
                              return "รอชมรมรับรองการสมัคร";
                            })()}
                          </span>
                          <span className="text-slate-500 text-xs mt-1 block">
                            {app.rosterClub
                              ? (app.squadType === "main" ? "อยู่ในบัญชีรายชื่อชมรม (ตัวจริง)" : app.squadType === "reserve" ? "อยู่ในบัญชีรายชื่อชมรม (ตัวสำรอง)" : "จัดเข้าบัญชีรายชื่อชมรมแล้ว")
                              : (app.noClubFileUrl ? "ส่งพิจารณาผ่านกองกิจการนิสิตโดยตรง" : "อยู่ระหว่างขั้นตอนพิจารณาของชมรมกีฬา")}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-slate-500 block">วันที่สมัคร</span>
                          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                            {new Date(app.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">ประวัติการดำเนินการ</h3>
                        <div className="space-y-3">
                          {app.statusHistory.map((h, i) => (
                            <div key={h.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-900 mt-1 shrink-0" />
                                {i < app.statusHistory.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 mt-1" />}
                              </div>
                              <div className="pb-2">
                                <p className="text-sm font-medium text-slate-900">{h.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(h.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} — {h.by}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
