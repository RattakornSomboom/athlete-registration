"use client";

import { useState } from "react";
import { errorMessage, requestJson } from "@/lib/phase4-client";
import type { AthleteExcellenceItem } from "@/lib/performance-service";

export default function MatchResultModal({
  athlete,
  onClose,
  onSaved,
}: {
  athlete: AthleteExcellenceItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const existing = athlete.matchResult;
  const [score, setScore] = useState(existing?.score?.toString() ?? "");
  const [timeSeconds, setTimeSeconds] = useState(existing?.timeSeconds?.toString() ?? "");
  const [rank, setRank] = useState(existing?.rank?.toString() ?? "");
  const [resultOutcome, setResultOutcome] = useState(existing?.outcome ?? "");
  const [staffNotes, setStaffNotes] = useState(existing?.staffNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await requestJson("/api/staff/match-results", {
        applicationId: athlete.applicationId,
        matchId: existing?.matchId ?? undefined,
        category: existing?.category ?? "บุคคลทั่วไป",
        stage: existing?.stage ?? undefined,
        score: score || null,
        timeSeconds: timeSeconds || null,
        rank: rank || null,
        resultOutcome: resultOutcome || null,
        staffNotes: staffNotes || null,
      });
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="match-result-title">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-800">Match result entry</p>
            <h2 id="match-result-title" className="mt-1 text-lg font-bold text-slate-950">บันทึกผลการแข่งขัน</h2>
            <p className="mt-1 text-xs text-slate-500">{athlete.athleteName} · {athlete.sport}</p>
          </div>
          <button type="button" onClick={onClose} className="text-lg text-slate-400 hover:text-slate-700" aria-label="ปิด">×</button>
        </div>

        {athlete.isDemo && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">ข้อมูลสาธิตไม่สามารถบันทึกทับฐานข้อมูลจริงได้</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-700">คะแนน<input value={score} onChange={e => setScore(e.target.value)} type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-700">เวลา (วินาที)<input value={timeSeconds} onChange={e => setTimeSeconds(e.target.value)} type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-700">อันดับ<input value={rank} onChange={e => setRank(e.target.value)} type="number" min="1" step="1" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-700">ผลการแข่งขัน<select value={resultOutcome} onChange={e => setResultOutcome(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">ยังไม่ระบุ</option><option value="WIN">ชนะ</option><option value="LOSS">แพ้</option><option value="DRAW">เสมอ</option><option value="PODIUM">ขึ้นโพเดียม</option><option value="DNF">แข่งไม่จบ</option><option value="DQ">ถูกตัดสิทธิ์</option></select></label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">บันทึกผู้ฝึกสอน/เจ้าหน้าที่<textarea value={staffNotes} onChange={e => setStaffNotes(e.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">ยกเลิก</button>
          <button type="button" disabled={busy || athlete.isDemo} onClick={() => void save()} className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? "กำลังบันทึก..." : "บันทึกผล"}</button>
        </div>
      </div>
    </div>
  );
}
