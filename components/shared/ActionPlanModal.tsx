"use client";

import { useState } from "react";
import { errorMessage, requestJson } from "@/lib/phase4-client";
import type { AthleteExcellenceItem } from "@/lib/performance-service";
import { getSportFitnessLabel, getSportFitnessStations, type FitnessRating } from "@/lib/performance-analytics";

const RATING_OPTIONS: FitnessRating[] = ["ดีมาก", "ดี", "ปานกลาง", "พอใช้", "ต่ำ", "ต่ำมาก"];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "ร่างแผน",
  IN_PROGRESS: "กำลังฝึกซ้อม",
  COMPLETED: "บรรลุเป้าหมาย",
  CANCELLED: "ยกเลิก",
};

export default function ActionPlanModal({
  athlete,
  onClose,
  onSaved,
}: {
  athlete: AthleteExcellenceItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"plan" | "retest" | "history">("plan");
  const existingPlan = athlete.actionPlan;
  const eventLabel = athlete.sport === "กีฬาทางน้ำ" || athlete.sport === "ว่ายน้ำ" ? "เวลาว่ายน้ำ 50 เมตร" : "เวลาวิ่ง 40 เมตร";
  const sportStations = getSportFitnessStations(athlete.sport);

  // Plan state
  const [coachName, setCoachName] = useState(existingPlan?.coachName ?? "");
  const [responsiblePerson, setResponsiblePerson] = useState(existingPlan?.responsiblePerson ?? "");
  const [startDate, setStartDate] = useState(() => existingPlan?.startDate ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => existingPlan?.endDate ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [status, setStatus] = useState<string>(existingPlan?.status ?? "IN_PROGRESS");
  const [items, setItems] = useState<string[]>(existingPlan?.items?.length ? existingPlan.items : [""]);
  const [planNotes, setPlanNotes] = useState(existingPlan?.notes ?? "");

  // Retest state
  const [retestDate, setRetestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [retestTime, setRetestTime] = useState("");
  const [retestScore, setRetestScore] = useState("");
  const [ratings, setRatings] = useState<Record<string, FitnessRating | "">>(() => {
    const init: Record<string, FitnessRating | ""> = {};
    const baselineRatings = new Map(athlete.analysis.standardStations.map(station => [station.name, station.rating]));
    for (const station of sportStations) {
      init[station.name] = baselineRatings.get(station.name) ?? "";
    }
    return init;
  });
  const [retestNotes, setRetestNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const followUps = athlete.followUps ?? (athlete.followUp ? [athlete.followUp] : []);

  async function savePlan() {
    setBusy(true);
    setError("");
    try {
      const filteredItems = items.map(i => i.trim()).filter(Boolean);
      await requestJson("/api/staff/excellence", {
        action: "savePlan",
        applicationId: athlete.applicationId,
        coachName,
        responsiblePerson,
        startDate,
        endDate,
        status,
        items: filteredItems,
        notes: planNotes || null,
      });
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  async function saveRetest() {
    setBusy(true);
    setError("");
    try {
      await requestJson("/api/staff/excellence", {
        action: "saveRetest",
        applicationId: athlete.applicationId,
        testedAt: retestDate,
        timeSeconds: retestTime ? Number(retestTime) : null,
        totalScore: retestScore ? Number(retestScore) : null,
        ratings: Object.fromEntries(Object.entries(ratings).filter(([, rating]) => rating !== "")),
        notes: retestNotes || null,
      });
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-800">Athlete Development & Closed-Loop</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">แผนพัฒนาและผลทดสอบซ้ำ</h2>
            <p className="mt-1 text-xs text-slate-500">{athlete.athleteName} · {athlete.sport} · {athlete.faculty}</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-slate-700" aria-label="ปิด">×</button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
          <button
            type="button"
            onClick={() => setTab("plan")}
            className={`border-b-2 px-4 py-2 text-xs font-semibold ${tab === "plan" ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            📋 1. แผนพัฒนาที่โค้ชกำหนด
          </button>
          <button
            type="button"
            onClick={() => setTab("retest")}
            className={`border-b-2 px-4 py-2 text-xs font-semibold ${tab === "retest" ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            ⏱️ 2. บันทึกผลทดสอบซ้ำ
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`border-b-2 px-4 py-2 text-xs font-semibold ${tab === "history" ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            📈 3. ประวัติทดสอบซ้ำ ({followUps.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

          {tab === "plan" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-700">
                  ชื่อโค้ช / ผู้ฝึกสอน *
                  <input
                    value={coachName}
                    onChange={e => setCoachName(e.target.value)}
                    placeholder="เช่น โค้ชวิทยาศาสตร์การกีฬา"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  ผู้รับผิดชอบ / สังกัด *
                  <input
                    value={responsiblePerson}
                    onChange={e => setResponsiblePerson(e.target.value)}
                    placeholder="เช่น อาจารย์ที่ปรึกษา / สโมสรกีฬา"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  วันที่เริ่มแผน *
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  วันที่สิ้นสุดแผน *
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                  สถานะการดำเนินแผน *
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">รายการแบบฝึกซ้อมที่กำหนด (Training Plan Items) *</label>
                  <button
                    type="button"
                    onClick={() => setItems(prev => [...prev, ""])}
                    className="text-xs font-bold text-blue-900 hover:underline"
                  >
                    + เพิ่มรายการ
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono w-5">{index + 1}.</span>
                      <input
                        value={item}
                        onChange={e => {
                          const next = [...items];
                          next[index] = e.target.value;
                          setItems(next);
                        }}
                        placeholder="เช่น Plyometrics สัปดาห์ละ 2 ครั้ง หรือ Interval 40m"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
                          className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                หมายเหตุ / จุดเน้นพิเศษ
                <textarea
                  value={planNotes}
                  onChange={e => setPlanNotes(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder="เช่น เน้นฟื้นฟูอาการล้าขาขวา และฝึกการเร่งสปีดช่วงต้น"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </label>
            </div>
          )}

          {tab === "retest" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-slate-700">
                  วันที่ทดสอบซ้ำ *
                  <input
                    type="date"
                    value={retestDate}
                    onChange={e => setRetestDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  สถิติเวลา (วินาที)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={retestTime}
                    onChange={e => setRetestTime(e.target.value)}
                    placeholder="เช่น 5.25"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  คะแนนรวมสมรรถภาพ (0-100)
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={retestScore}
                    onChange={e => setRetestScore(e.target.value)}
                    placeholder="เช่น 80"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>
              </div>

              <div>
                <p className="mb-1 text-xs font-bold text-slate-800">ผลทดสอบสมรรถภาพตามกีฬา · {getSportFitnessLabel(athlete.sport)}</p>
                <p className="mb-2 text-[11px] text-slate-500">เลือกเฉพาะรายการที่มีผลทดสอบจริง; รายการที่ยังไม่ทดสอบจะไม่ถูกบันทึก</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {sportStations.map(station => (
                    <div key={station.name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                      <span className="font-medium text-slate-700">{station.name}</span>
                      <select
                        value={ratings[station.name] ?? ""}
                        onChange={e => setRatings(prev => ({ ...prev, [station.name]: e.target.value as FitnessRating | "" }))}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                      >
                        <option value="">ยังไม่มีผล</option>
                        {RATING_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                หมายเหตุผลทดสอบซ้ำ
                <textarea
                  value={retestNotes}
                  onChange={e => setRetestNotes(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder="เช่น กล้ามเนื้อมีแรงระเบิดดีขึ้น ชัดเจนใน 20 เมตรแรก"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </label>
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-3">
              {followUps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  ยังไม่มีประวัติการทดสอบซ้ำสำหรับนักกีฬาท่านนี้ กดแท็บ &quot;2. บันทึกผลทดสอบซ้ำ&quot; เพื่อบันทึกรอบแรก
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((fu, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            การทดสอบซ้ำรอบที่ {idx + 1} · หลัง Baseline {fu.retest.weeksAfterBaseline} สัปดาห์
                          </p>
                          <p className="text-[11px] text-slate-500">
                            วันที่ทดสอบ: {fu.retest.testedAt ? new Date(fu.retest.testedAt).toLocaleDateString("th-TH") : "-"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${fu.comparison.status === "IMPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                          {fu.comparison.status === "IMPROVED" ? "ดีขึ้น" : fu.comparison.status === "DECLINED" ? "ลดลง" : "ยังไม่เปลี่ยนชัดเจน"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                        <div className="rounded bg-slate-50 p-2">
                          <span className="text-slate-500">{eventLabel}:</span>{" "}
                          <span className="font-bold text-slate-800">{fu.retest.timeSeconds ? `${fu.retest.timeSeconds}s` : "-"}</span>
                        </div>
                        <div className="rounded bg-slate-50 p-2">
                          <span className="text-slate-500">คะแนนเฉลี่ย:</span>{" "}
                          <span className="font-bold text-slate-800">{fu.comparison.fitnessAverageAfter ?? "-"}%</span>
                        </div>
                        <div className="rounded bg-slate-50 p-2">
                          <span className="text-slate-500">เปลี่ยนเวลา:</span>{" "}
                          <span className={`font-bold ${fu.comparison.timeChange === "IMPROVED" ? "text-emerald-700" : "text-slate-800"}`}>
                            {fu.comparison.timeDeltaSeconds !== null ? `${fu.comparison.timeDeltaSeconds > 0 ? "+" : ""}${fu.comparison.timeDeltaSeconds}s` : "-"}
                          </span>
                        </div>
                        <div className="rounded bg-slate-50 p-2">
                          <span className="text-slate-500">เปลี่ยนความฟิต:</span>{" "}
                          <span className={`font-bold ${fu.comparison.fitnessChange === "IMPROVED" ? "text-emerald-700" : "text-slate-800"}`}>
                            {fu.comparison.fitnessDelta !== null ? `${fu.comparison.fitnessDelta > 0 ? "+" : ""}${fu.comparison.fitnessDelta} คะแนน` : "-"}
                          </span>
                        </div>
                      </div>

                      {fu.retest.notes && (
                        <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                          <span className="font-semibold text-slate-700">บันทึก:</span> {fu.retest.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            ปิด
          </button>
          {tab === "plan" && (
            <button
              type="button"
              disabled={busy || athlete.isDemo}
              onClick={() => void savePlan()}
              className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
            >
              {busy ? "กำลังบันทึก..." : "บันทึกแผนพัฒนา"}
            </button>
          )}
          {tab === "retest" && (
            <button
              type="button"
              disabled={busy || athlete.isDemo}
              onClick={() => void saveRetest()}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
            >
              {busy ? "กำลังบันทึก..." : "บันทึกผลทดสอบซ้ำ"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
