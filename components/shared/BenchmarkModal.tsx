"use client";

import { useState } from "react";
import { errorMessage, requestJson } from "@/lib/phase4-client";
import type { ExcellenceBenchmark } from "@/lib/performance-service";

const PILOT_CONFIGS = [
  { sportKey: "กรีฑา", label: "กรีฑา (วิ่ง 40m)", defaultTime: 5.2, defaultScore: 85 },
  { sportKey: "กีฬาทางน้ำ", label: "กีฬาทางน้ำ / ว่ายน้ำ (ฟรีสไตล์ 50m)", defaultTime: 27.5, defaultScore: 85 },
];

export default function BenchmarkModal({
  benchmarks,
  onClose,
  onSaved,
}: {
  benchmarks: Record<string, ExcellenceBenchmark>;
  availableSports?: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedSport, setSelectedSport] = useState<string>("กรีฑา");
  const activeSport = selectedSport;

  const currentBenchmark =
    benchmarks[activeSport] ??
    (activeSport === "กีฬาทางน้ำ" ? benchmarks["ว่ายน้ำ"] : undefined) ??
    (activeSport === "กีฬาทางน้ำ"
      ? { targetTimeSeconds: 27.5, targetScore: 85 }
      : { targetTimeSeconds: 5.2, targetScore: 85 });

  const [targetTime, setTargetTime] = useState(String(currentBenchmark.targetTimeSeconds));
  const [targetScore, setTargetScore] = useState(String(currentBenchmark.targetScore));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleSportChange(val: string) {
    setSelectedSport(val);
    const b =
      benchmarks[val] ??
      (val === "กีฬาทางน้ำ" ? benchmarks["ว่ายน้ำ"] : undefined) ??
      (val === "กีฬาทางน้ำ"
        ? { targetTimeSeconds: 27.5, targetScore: 85 }
        : { targetTimeSeconds: 5.2, targetScore: 85 });
    setTargetTime(String(b.targetTimeSeconds));
    setTargetScore(String(b.targetScore));
  }

  async function save() {
    if (!activeSport) {
      setError("กรุณาระบุชื่อกีฬา");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await requestJson("/api/staff/excellence", {
        action: "saveBenchmark",
        sport: activeSport,
        targetTimeSeconds: Number(targetTime) || 0,
        targetScore: Number(targetScore) || 0,
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
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-800">System Benchmarks</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">กำหนดเกณฑ์มาตรฐาน (Benchmarks)</h2>
            <p className="mt-1 text-xs text-slate-500">ปรับเกณฑ์เวลาและคะแนนความพร้อมเฉพาะ 2 กีฬานำร่อง (กรีฑา และ กีฬาทางน้ำ/ว่ายน้ำ)</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-slate-700" aria-label="ปิด">×</button>
        </div>

        <div className="mt-3 rounded-lg bg-blue-50/70 p-2.5 text-[11px] text-blue-900 border border-blue-200">
          <strong>ขอบเขตกีฬานำร่อง:</strong> โมดูล Excellence รองรับเฉพาะกีฬาที่มีสถิติเวลาเชิงปริมาณ (วิ่ง 40m และ ฟรีสไตล์ 50m) กีฬาประเภททีมหรือชนิดกีฬาอื่นถูกแยกออกจากโมดูลนี้
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

        <div className="mt-5 space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            เลือกชนิดกีฬา
            <select
              value={selectedSport}
              onChange={e => handleSportChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {PILOT_CONFIGS.map(pilot => (
                <option key={pilot.sportKey} value={pilot.sportKey}>
                  {pilot.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-700">
              เวลาเป้าหมาย (วินาที) *
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={targetTime}
                onChange={e => setTargetTime(e.target.value)}
                placeholder="เช่น 5.2"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <span className="mt-0.5 block text-[10px] text-slate-400">สำหรับเทียบ Gap เวลาสถิติ</span>
            </label>

            <label className="block text-xs font-medium text-slate-700">
              คะแนนเป้าหมายสมรรถภาพ (0-100) *
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={targetScore}
                onChange={e => setTargetScore(e.target.value)}
                placeholder="เช่น 85"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <span className="mt-0.5 block text-[10px] text-slate-400">เกณฑ์ความพร้อมด้านสมรรถภาพ</span>
            </label>
          </div>
        </div>

        {/* Current list preview */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[11px] font-bold text-slate-700 mb-1.5">เกณฑ์ปัจจุบันเฉพาะ 2 กีฬานำร่อง:</p>
          <div className="space-y-1 text-[11px] text-slate-600">
            {PILOT_CONFIGS.map(pilot => {
              const b =
                benchmarks[pilot.sportKey] ??
                (pilot.sportKey === "กีฬาทางน้ำ" ? benchmarks["ว่ายน้ำ"] : undefined) ??
                { targetTimeSeconds: pilot.defaultTime, targetScore: pilot.defaultScore };
              return (
                <div key={pilot.sportKey} className="flex justify-between py-1 border-b border-slate-200/50 last:border-0">
                  <span className="font-medium text-slate-800">{pilot.label}</span>
                  <span className="font-semibold text-blue-900">เป้าเวลา {b.targetTimeSeconds}s · คะแนน {b.targetScore}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
          >
            {busy ? "กำลังบันทึก..." : "บันทึกเกณฑ์ Benchmark"}
          </button>
        </div>
      </div>
    </div>
  );
}
