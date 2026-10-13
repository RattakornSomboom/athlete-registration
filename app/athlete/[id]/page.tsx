"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import { extractClubFromNote, suggestClubForSport } from "@/lib/university-clubs";
import { canAthleteEditApplication } from "@/lib/athlete-decision-service";
import { fetchJson, HttpError } from "@/lib/http-client";
import { ATHLETE_DOCUMENT_FIELDS, ATHLETE_VISIBLE_DOCUMENT_FIELDS, ATHLETE_DOCUMENT_LABELS, REQUIRED_ATHLETE_DOCUMENTS, documentReference } from "@/lib/athlete-document-policy";

type ApplicationDetail = {
  id: string;
  status: string;
  sport: string;
  category: string;
  division: string | null;
  note: string | null;
  supervisorName: string | null;
  supervisorPosition: string | null;
  createdAt: string;
  competition: { name: string; round: string; year: number };
  rosterClub: { name: string } | null;
  hasRosterItem?: boolean;
  sportEntries: { id: string; sport: string; category: string; division: string | null }[];
  competitionResults: { id: string; competitionName: string; year: string; result: string; evidenceFileUrl: string | null }[];
  statusHistory: { id: string; status: string; label: string; createdAt: string }[];
} & Record<string, unknown>;

type ResultDraft = { key: string; competitionName: string; year: string; result: string; evidenceFileUrl: string | null; newFile: File | null };

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "รอการพิจารณา",
  CLUB_APPROVED: "ผ่านพิจารณาชมรมแล้ว — รอเจ้าหน้าที่",
  CLUB_REJECTED: "ชมรมไม่อนุมัติ",
  STAFF_APPROVED: "เจ้าหน้าที่อนุมัติ",
  STAFF_REJECTED: "เจ้าหน้าที่ไม่อนุมัติ",
  FINAL_SELECTED: "ผ่านการคัดเลือกขั้นสุดท้าย",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

async function uploadFile(file: File) {
  const form = new FormData();
  form.set("file", file);
  const result = await fetchJson<{ document: { id: string } }>("/api/documents", { method: "POST", body: form });
  return documentReference(result.document.id);
}

export default function AthleteApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const load = useCallback(
    () => fetchJson<{ application: ApplicationDetail }>(`/api/applications/${encodeURIComponent(id)}`),
    [id],
  );
  const resource = useRemoteData(load);
  const action = useRequestAction();
  const app = resource.data?.application;

  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPosition, setSupervisorPosition] = useState("");
  const [results, setResults] = useState<ResultDraft[]>([]);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineEvidence, setDeclineEvidence] = useState<File | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const canEdit = !!app && canAthleteEditApplication(app);
  const athleteDecision = app?.statusHistory?.findLast(history => history.status === "ATHLETE_CONFIRMED" || history.status === "ATHLETE_DECLINED");
  const isConfirmed = athleteDecision?.status === "ATHLETE_CONFIRMED";
  const isDeclined = athleteDecision?.status === "ATHLETE_DECLINED";
  const clubRejectHistory = app?.statusHistory?.findLast(history => history.status === "CLUB_REJECTED");

  const startEdit = () => {
    if (!app) return;
    setNote(app.note ?? "");
    setSupervisorName(app.supervisorName ?? "");
    setSupervisorPosition(app.supervisorPosition ?? "");
    setResults(app.competitionResults.map(r => ({
      key: r.id, competitionName: r.competitionName, year: r.year, result: r.result, evidenceFileUrl: r.evidenceFileUrl, newFile: null,
    })));
    setFiles({});
    setEditing(true);
  };

  const updateResult = (key: string, patch: Partial<ResultDraft>) =>
    setResults(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));

  const pickFile = (apply: (file: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    apply(file && file.size <= MAX_FILE_BYTES ? file : null);
  };

  const cancelApplication = () => action.run(async () => {
    if (!app) return;
    await fetchJson(`/api/applications/${encodeURIComponent(app.id)}`, {
      method: "DELETE",
    });
    router.push("/athlete/status");
  }, "ยกเลิกใบสมัครเรียบร้อยแล้ว");

  const submitDecision = (decision: "CONFIRM" | "DECLINE") => action.run(async () => {
    if (!app) return;
    const evidenceUrl = decision === "DECLINE" && declineEvidence ? await uploadFile(declineEvidence) : null;
    await fetchJson(`/api/applications/${encodeURIComponent(app.id)}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: decision, reason: declineReason, acceptedTerms: decision === "CONFIRM" ? acceptedTerms : undefined, evidenceUrl }),
    });
    setShowDeclineModal(false);
    setDeclineReason("");
    setDeclineEvidence(null);
    resource.retry();
  }, decision === "CONFIRM" ? "ยืนยันสิทธิ์การเป็นตัวแทนมหาวิทยาลัยเรียบร้อยแล้ว" : "บันทึกการสละสิทธิ์เรียบร้อยแล้ว");

  const save = () => action.run(async () => {
    if (!app) return;
    if (results.some(r => !r.competitionName.trim() || !/^\d{1,4}$/.test(r.year.trim()) || !r.result.trim())) {
      throw new HttpError(400, "กรุณากรอกผลงานการแข่งขันให้ครบถ้วน (ปีเป็นตัวเลข)");
    }
    const documents: Record<string, string> = {};
    for (const field of ATHLETE_DOCUMENT_FIELDS) {
      const file = files[field];
      if (file) documents[field] = await uploadFile(file);
    }
    const competitionResults = await Promise.all(results.map(async r => ({
      competitionName: r.competitionName.trim(),
      year: r.year.trim(),
      result: r.result.trim(),
      evidenceFileUrl: r.newFile ? await uploadFile(r.newFile) : r.evidenceFileUrl,
    })));
    await fetchJson(`/api/applications/${encodeURIComponent(app.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note,
        supervisorName: supervisorName.trim() || null,
        supervisorPosition: supervisorPosition.trim() || null,
        competitionResults,
        ...documents,
      }),
    });
    setEditing(false);
    resource.retry();
  }, "บันทึกการแก้ไขใบสมัครเรียบร้อยแล้ว");

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <BackButton href="/athlete/status" label="กลับหน้าสถานะ" />
          <LogoutButton />
        </div>

        <RequestState loading={resource.loading} error={resource.error} retry={resource.retry} />
        {action.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{action.error}</div>}
        {action.success && !editing && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{action.success}</div>}

        {app && (
          <>
            <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-slate-300">{app.id.slice(-8).toUpperCase()}</span>
                <h1 className="text-lg font-bold mt-1">{app.competition.name}</h1>
                <p className="text-xs text-slate-300">
                  {app.competition.round === "qualifier" ? "รอบคัดเลือก" : "รอบมหกรรม"} ปี {app.competition.year}
                </p>
              </div>
              <div className="sm:text-right space-y-2">
                <div>
                  <span className="text-xs text-slate-400 block">สถานะ</span>
                  <span className="text-sm font-semibold text-amber-300">{STATUS_LABEL[app.status] ?? app.status}</span>
                </div>
                {canEdit && !editing && (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button type="button" onClick={startEdit} className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">
                      แก้ไขใบสมัคร
                    </button>
                    <button type="button" onClick={() => setShowCancelConfirm(true)} className="rounded-lg border border-rose-400 bg-rose-900/60 px-3.5 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-800 cursor-pointer">
                      ยกเลิกใบสมัคร
                    </button>
                  </div>
                )}
              </div>
            </div>

            {app.status === "CLUB_REJECTED" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-rose-800">ชมรมแจ้งให้แก้ไขใบสมัคร / เอกสาร</span>
                  <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-semibold text-rose-900">สามารถแก้ไขและนำส่งใหม่ได้</span>
                </div>
                {clubRejectHistory?.label && (
                  <p className="rounded-lg bg-white/80 p-3 border border-rose-200 text-rose-950 font-medium leading-relaxed">
                    เหตุผลจากชมรม: &quot;{clubRejectHistory.label}&quot;
                  </p>
                )}
                <p className="text-slate-600">
                  โปรดตรวจสอบข้อมูลหรือเอกสารที่ต้องแก้ไข จากนั้นกดปุ่ม <strong>&quot;แก้ไขใบสมัคร&quot;</strong> เพื่อปรับปรุงข้อมูลและนำส่งใหม่อีกครั้ง
                </p>
              </div>
            )}

            {showCancelConfirm && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-3">
                <p className="font-bold text-sm">ยืนยันการยกเลิกใบสมัคร?</p>
                <p>การยกเลิกใบสมัครจะลบรายการสมัครนี้ออกจากระบบ และท่านสามารถสมัครใหม่ได้หากการแข่งขันยังเปิดรับสมัครอยู่ (การยกเลิกใบสมัครก่อนประกาศผลไม่ใช่การสละสิทธิ์)</p>
                <div className="flex gap-2">
                  <button type="button" disabled={action.busy} onClick={cancelApplication} className="rounded-lg bg-rose-700 px-3.5 py-1.5 font-semibold text-white hover:bg-rose-800 disabled:opacity-50">
                    {action.busy ? "กำลังยกเลิก…" : "ยืนยันยกเลิกใบสมัคร"}
                  </button>
                  <button type="button" disabled={action.busy} onClick={() => setShowCancelConfirm(false)} className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50">
                    ไม่ยกเลิก
                  </button>
                </div>
              </div>
            )}

            {app.status === "FINAL_SELECTED" && (
              <section className={`rounded-xl border p-5 ${isConfirmed ? "border-emerald-200 bg-emerald-50" : isDeclined ? "border-rose-200 bg-rose-50" : "border-blue-200 bg-blue-50"}`}>
                {athleteDecision ? (
                  <div>
                    <h3 className={`text-sm font-bold ${isConfirmed ? "text-emerald-900" : "text-rose-900"}`}>
                      {isConfirmed ? "✅ ยืนยันสิทธิ์การเป็นตัวแทนมหาวิทยาลัยแล้ว" : "❌ สละสิทธิ์การเป็นตัวแทนมหาวิทยาลัยแล้ว"}
                    </h3>
                    <p className={`mt-1 text-xs ${isConfirmed ? "text-emerald-800" : "text-rose-800"}`}>{athleteDecision.label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">บันทึกเมื่อ {formatDate(athleteDecision.createdAt)}</p>
                  </div>
                ) : showDeclineModal ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-rose-900">แจ้งสละสิทธิ์การเป็นตัวแทนมหาวิทยาลัย</h3>
                      <p className="mt-0.5 text-xs text-rose-800">กรุณาระบุเหตุผลและแนบหลักฐาน (ถ้ามี) เพื่อให้ชมรมและกองกิจการนิสิตพิจารณาเลื่อนผู้สมัครสำรองต่อไป</p>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-700">เหตุผลในการสละสิทธิ์ <span className="text-red-600">*</span></span>
                      <textarea
                        value={declineReason}
                        onChange={e => setDeclineReason(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="ระบุเหตุผล เช่น ติดภารกิจการศึกษา มีอาการบาดเจ็บ หรือเหตุผลความจำเป็นส่วนตัว"
                      />
                    </label>
                    <label className="block text-xs text-slate-700">
                      <span className="mb-1 block font-semibold">เอกสาร/หลักฐานประกอบ (ถ้ามี เช่น ใบรับรองแพทย์ หนังสือขอสละสิทธิ์)</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={pickFile(setDeclineEvidence)}
                        className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                      />
                      <span className="mt-1 block text-[11px] text-slate-500">PDF/JPG/PNG ขนาดไม่เกิน 5 MB</span>
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={action.busy || !declineReason.trim()}
                        onClick={() => submitDecision("DECLINE")}
                        className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {action.busy ? "กำลังบันทึก…" : "ยืนยันการสละสิทธิ์"}
                      </button>
                      <button
                        type="button"
                        disabled={action.busy}
                        onClick={() => {
                          setShowDeclineModal(false);
                          setDeclineReason("");
                          setDeclineEvidence(null);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : showConfirmModal ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-950">ยืนยันสิทธิ์การเป็นตัวแทนมหาวิทยาลัย</h3>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                        โปรดตรวจสอบและรับทราบหน้าที่และเงื่อนไขการเป็นนักกีฬาตัวแทนมหาวิทยาลัย:
                      </p>
                      <ul className="mt-2 list-disc list-inside text-xs text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-emerald-100">
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
                        disabled={action.busy || !acceptedTerms}
                        onClick={() => submitDecision("CONFIRM")}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {action.busy ? "กำลังบันทึก…" : "กดยืนยันสิทธิ์ตัวแทนสถาบัน"}
                      </button>
                      <button
                        type="button"
                        disabled={action.busy}
                        onClick={() => {
                          setShowConfirmModal(false);
                          setAcceptedTerms(false);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-blue-950">🎉 ผ่านการคัดเลือกเป็นตัวแทนมหาวิทยาลัยพะเยา</h3>
                      <p className="mt-1 text-xs leading-relaxed text-blue-900">
                        ท่านได้รับการประกาศรายชื่อผ่านการคัดเลือก กรุณากดยืนยันสิทธิ์เพื่อรับทราบหน้าที่ การเข้าร่วมฝึกซ้อมตามแผนงาน การปฏิบัติตามระเบียบวินัย และการเข้าร่วมการแข่งขันตามกำหนด หรือแจ้งสละสิทธิ์หากไม่สะดวกเข้าร่วม
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={action.busy}
                        onClick={() => {
                          setShowConfirmModal(true);
                          setShowDeclineModal(false);
                          setAcceptedTerms(false);
                        }}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                      >
                        ยืนยันสิทธิ์การเป็นตัวแทนมหาวิทยาลัย
                      </button>
                      <button
                        type="button"
                        disabled={action.busy}
                        onClick={() => {
                          setShowDeclineModal(true);
                          setShowConfirmModal(false);
                        }}
                        className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
                      >
                        สละสิทธิ์
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {!canEdit && (
              <p className="text-xs text-slate-500">ใบสมัครที่ถูกพิจารณาแล้วหรืออยู่ในบัญชีชมรมแล้ว ไม่สามารถแก้ไขได้</p>
            )}

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 text-sm">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ข้อมูลการสมัคร</h2>
              <p><span className="text-slate-500">ชนิดกีฬา: </span>{app.sport} / {app.category}{app.division ? ` (${app.division})` : ""}</p>
              <p><span className="text-slate-500">ชมรมสังกัด / ผู้ดูแลชนิดกีฬา: </span>{(() => {
                if (app.rosterClub?.name) return app.rosterClub.name;
                const fromNote = extractClubFromNote(app.note).clubName;
                if (fromNote) return fromNote;
                if (app.noClubFileUrl) return "ไม่มีชมรมจัดตั้ง (มีบุคลากรรับรอง)";
                const autoSuggested = suggestClubForSport(app.sportEntries[0]?.sport || app.sport);
                if (autoSuggested) return autoSuggested;
                return "-";
              })()}</p>
              <p><span className="text-slate-500">ส่งเมื่อ: </span>{formatDate(app.createdAt)}</p>
              {app.sportEntries.length > 0 && (
                <ul className="list-disc pl-5 text-slate-700">
                  {app.sportEntries.map(entry => (
                    <li key={entry.id}>{entry.sport} — {entry.category}{entry.division ? ` (${entry.division})` : ""}</li>
                  ))}
                </ul>
              )}
              {editing ? (
                <div className="grid gap-3 pt-2">
                  <label className="block">
                    <span className="block text-xs font-medium text-gray-700 mb-1">ผู้รับรอง/ผู้ควบคุมทีม</span>
                    <input className={inputClass} maxLength={200} value={supervisorName} onChange={e => setSupervisorName(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-gray-700 mb-1">ตำแหน่ง/สังกัด</span>
                    <input className={inputClass} maxLength={200} value={supervisorPosition} onChange={e => setSupervisorPosition(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุ</span>
                    <textarea className={inputClass} rows={3} maxLength={4000} value={note} onChange={e => setNote(e.target.value)} />
                  </label>
                </div>
              ) : (
                <>
                  <p><span className="text-slate-500">ผู้ควบคุมทีม: </span>{app.supervisorName ? `${app.supervisorName}${app.supervisorPosition ? ` (${app.supervisorPosition})` : ""}` : "-"}</p>
                  <p><span className="text-slate-500">หมายเหตุ: </span>{app.note || "-"}</p>
                </>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 text-sm">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ผลงานการแข่งขัน</h2>
              {editing ? (
                <div className="space-y-3">
                  {results.map(r => (
                    <div key={r.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-[2fr_1fr_2fr]">
                        <input className={inputClass} placeholder="ชื่อการแข่งขัน" maxLength={200} value={r.competitionName} onChange={e => updateResult(r.key, { competitionName: e.target.value })} />
                        <input className={inputClass} placeholder="ปี พ.ศ." inputMode="numeric" maxLength={4} value={r.year} onChange={e => updateResult(r.key, { year: e.target.value })} />
                        <input className={inputClass} placeholder="ผลการแข่งขัน" maxLength={200} value={r.result} onChange={e => updateResult(r.key, { result: e.target.value })} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <label className="cursor-pointer text-blue-800 underline">
                          {r.evidenceFileUrl || r.newFile ? "เปลี่ยนรูปหลักฐาน" : "แนบรูปหลักฐาน"} (JPG/PNG ≤ 5MB)
                          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={pickFile(file => updateResult(r.key, { newFile: file }))} />
                        </label>
                        <span className="text-slate-500">{r.newFile ? r.newFile.name : r.evidenceFileUrl ? "มีรูปหลักฐานแล้ว" : "ยังไม่แนบหลักฐาน"}</span>
                        <button type="button" className="ml-auto text-red-700 hover:underline" onClick={() => setResults(prev => prev.filter(x => x.key !== r.key))}>ลบรายการ</button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    onClick={() => setResults(prev => [...prev, { key: `new-${Date.now()}-${prev.length}`, competitionName: "", year: "", result: "", evidenceFileUrl: null, newFile: null }])}
                  >
                    + เพิ่มผลงาน
                  </button>
                </div>
              ) : app.competitionResults.length === 0 ? <p className="text-slate-500">ไม่มีข้อมูล</p> : (
                <ul className="space-y-2">
                  {app.competitionResults.map(result => (
                    <li key={result.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span>{result.competitionName} ({result.year}) — {result.result}</span>
                      {result.evidenceFileUrl
                        ? <a className="text-blue-800 underline" href={result.evidenceFileUrl} target="_blank" rel="noreferrer">ดูหลักฐาน</a>
                        : <span className="text-amber-700">ยังไม่แนบหลักฐาน</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 text-sm">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เอกสารแนบ</h2>
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed">
                ℹ️ <strong>ข้อควรทราบ:</strong> การอัปโหลดเอกสารหมายถึงการส่งเอกสารเข้าสู่ระบบ <u>ยังไม่ถือว่าเอกสารผ่านการอนุมัติ</u> จนกว่าชมรมกีฬาหรือกองกิจการนิสิตจะตรวจสอบความถูกต้องครบถ้วน
              </div>
              <ul className="space-y-2">
                {ATHLETE_VISIBLE_DOCUMENT_FIELDS.map(field => {
                  const url = app[field];
                  const hasFile = typeof url === "string" && !!url;
                  const required = (REQUIRED_ATHLETE_DOCUMENTS as readonly string[]).includes(field);
                  return (
                    <li key={field} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span>{ATHLETE_DOCUMENT_LABELS[field]}{required && <span className="text-red-600"> *</span>}</span>
                      <span className="flex items-center gap-3">
                        {hasFile
                          ? <a className="text-blue-800 underline" href={url} target="_blank" rel="noreferrer">เปิดไฟล์</a>
                          : <span className="text-slate-400">ไม่มี</span>}
                        {editing && (
                          <label className="cursor-pointer text-xs text-blue-800 underline">
                            {files[field] ? files[field]!.name : hasFile ? "เปลี่ยนไฟล์" : "แนบไฟล์"}
                            <input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={pickFile(file => setFiles(prev => ({ ...prev, [field]: file })))} />
                          </label>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {editing && <p className="text-xs text-slate-500">ไฟล์ PDF/JPG/PNG ขนาดไม่เกิน 5MB ไฟล์ที่ไม่ได้เลือกใหม่จะคงไฟล์เดิมไว้</p>}
            </section>

            {editing && (
              <div className="flex justify-end gap-3">
                <button type="button" disabled={action.busy} onClick={() => setEditing(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
                <button type="button" disabled={action.busy} onClick={save} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50">
                  {action.busy ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
                </button>
              </div>
            )}

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 text-sm">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ประวัติสถานะ</h2>
              <ul className="space-y-2">
                {app.statusHistory.map(item => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>{item.label}</span>
                    <span className="text-slate-400 text-xs">{formatDate(item.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
