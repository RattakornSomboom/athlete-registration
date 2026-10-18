"use client";

import { useEffect, useState } from "react";
import { Page } from "@/components/shared/Phase4UI";
import { DemoBanner, ExcellenceNav, demoQuery, useDemoMode } from "@/components/shared/ExcellenceUI";
import { requestJson, errorMessage } from "@/lib/phase4-client";
import {
  ATHLETICS_TRACK_EVENTS,
  TRACK_GENDERS,
  benchmarkKey,
  formatTrackTime,
  type TrackBenchmarks,
  type TrackEvent,
  type TrackGender,
} from "@/lib/excellence-athletics";

type CellState = { saving: boolean; message: string; error: boolean };

function BenchmarkCell({ event, gender, current, readOnly, onSaved }: {
  event: TrackEvent;
  gender: TrackGender;
  current: number | null;
  readOnly: boolean;
  onSaved: (benchmarks: TrackBenchmarks) => void;
}) {
  const [value, setValue] = useState(current === null ? "" : formatTrackTime(current));
  const [state, setState] = useState<CellState>({ saving: false, message: "", error: false });
  const label = `เป้าเวลา ${event.label} ${gender}`;
  const unchanged = value.trim() === (current === null ? "" : formatTrackTime(current));

  if (!event.genders.includes(gender)) return <td className="px-4 py-3 text-sm text-slate-400">ไม่มีรายการนี้</td>;
  if (readOnly) {
    return (
      <td className="px-4 py-3 font-mono text-sm tabular-nums">
        {current === null ? <span className="font-sans text-slate-500">ยังไม่ตั้งเป้า</span> : formatTrackTime(current)}
      </td>
    );
  }

  async function save() {
    setState({ saving: true, message: "", error: false });
    try {
      const result = await requestJson<{ benchmarks: TrackBenchmarks }>(
        "/api/staff/excellence/benchmarks",
        { event: event.key, gender, targetSeconds: value.trim() || null },
        "PUT",
      );
      onSaved(result.benchmarks);
      const saved = result.benchmarks[benchmarkKey(event.key, gender)]?.targetSeconds ?? null;
      setValue(saved === null ? "" : formatTrackTime(saved));
      setState({ saving: false, message: value.trim() ? "บันทึกแล้ว" : "ยกเลิกเป้าแล้ว", error: false });
    } catch (e) {
      setState({ saving: false, message: errorMessage(e), error: true });
    }
  }

  return (
    <td className="px-4 py-3 align-top">
      <form onSubmit={e => { e.preventDefault(); void save(); }} className="flex items-center gap-2">
        <input
          aria-label={label}
          value={value}
          onChange={e => { setValue(e.target.value); setState({ saving: false, message: "", error: false }); }}
          placeholder="ยังไม่ตั้งเป้า"
          inputMode="decimal"
          className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm tabular-nums outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100"
        />
        <button type="submit" disabled={state.saving || unchanged} className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm text-white hover:bg-blue-800 disabled:opacity-40">
          {state.saving ? "…" : "บันทึก"}
        </button>
      </form>
      {state.message && <p role={state.error ? "alert" : "status"} className={`mt-1 text-xs ${state.error ? "text-rose-700" : "text-emerald-700"}`}>{state.message}</p>}
    </td>
  );
}

export default function ExcellenceBenchmarksPage() {
  const { demo, ready, setDemo } = useDemoMode();
  const [benchmarks, setBenchmarks] = useState<TrackBenchmarks | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let active = true;
    requestJson<{ benchmarks: TrackBenchmarks }>(`/api/staff/excellence/benchmarks${demoQuery(demo)}`)
      .then(result => { if (active) { setBenchmarks(result.benchmarks); setError(""); } })
      .catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [demo, ready]);

  return (
    <Page title="เป้าเวลา (Benchmark) · กรีฑาประเภทลู่">
      <ExcellenceNav demo={demo} onDemoChange={setDemo} />
      <DemoBanner show={demo} />
      <p className="text-sm text-slate-600">
        ตั้งเป้าเวลาแยกตามรายการและเพศ ใช้คำนวณ Gap และสถานะ &quot;ถึงเป้า&quot; ในภาพรวม รายการที่ยังไม่ตั้งเป้าจะแสดงว่า &quot;ยังไม่ตั้งเป้า&quot; ไม่มีการเดาค่าแทน
        กรอกเป็นวินาที (10.85) หรือ นาที:วินาที (1:58.32) และเว้นว่างแล้วกดบันทึกเพื่อยกเลิกเป้า
      </p>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {!benchmarks && !error && <p className="text-sm text-slate-600">กำลังโหลดข้อมูล…</p>}
      {benchmarks && (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">รายการ</th>
                {TRACK_GENDERS.map(gender => <th key={gender} className="px-4 py-3 font-medium">{gender}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ATHLETICS_TRACK_EVENTS.map(event => (
                <tr key={event.key}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{event.label}</td>
                  {TRACK_GENDERS.map(gender => (
                    <BenchmarkCell
                      key={`${demo}-${gender}`}
                      event={event}
                      gender={gender}
                      current={benchmarks[benchmarkKey(event.key, gender)]?.targetSeconds ?? null}
                      readOnly={demo}
                      onSaved={setBenchmarks}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </Page>
  );
}
