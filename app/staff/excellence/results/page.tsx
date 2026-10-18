"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Page, fieldClass } from "@/components/shared/Phase4UI";
import { DemoBanner, EmptyText, EventOptions, ExcellenceNav, SportSwitcher, demoQuery, useDemoMode } from "@/components/shared/ExcellenceUI";
import { requestJson, errorMessage } from "@/lib/phase4-client";
import {
  ATHLETICS_EVENTS,
  checkMarkText,
  eventKind,
  eventLabel,
  formatMark,
  formatSignedMark,
  gapToTarget,
  lowerIsBetter,
  parseMark,
  percentOfTarget,
  type EntrySheetRow,
} from "@/lib/excellence-athletics";
import { DEFAULT_EXCELLENCE_SPORT } from "@/lib/excellence-sports";

type Sheet = { isDemo: boolean; event: string; athletes: EntrySheetRow[] };
type SaveSummary = { saved: number; skipped: string[] };

const today = () => new Date().toISOString().slice(0, 10);

// บันทึกผลหลายคนของรายการ/วัน/รอบเดียวกันในครั้งเดียว (งานตอนจบการแข่งขัน)
export default function ExcellenceBatchResultsPage() {
  const { demo, ready, setDemo } = useDemoMode();
  const [event, setEvent] = useState("100m");
  const [competedAt, setCompetedAt] = useState(today());
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<SaveSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    requestJson<Sheet>(`/api/staff/excellence/entry-sheet?event=${encodeURIComponent(event)}${demo ? "&demo=true" : ""}`)
      .then(result => { if (active) { setSheet(result); setLoadError(""); } })
      .catch(e => { if (active) setLoadError(errorMessage(e)); });
    return () => { active = false; };
  }, [event, demo, ready, reload]);

  const athletes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = sheet?.event === event ? sheet.athletes : [];
    return query ? rows.filter(row => row.name.toLowerCase().includes(query) || row.studentId.toLowerCase().includes(query) || row.faculty.toLowerCase().includes(query)) : rows;
  }, [sheet, event, search]);

  const all = sheet?.event === event ? sheet.athletes : [];
  const filled = all.filter(row => (marks[row.applicationId] ?? "").trim() !== "");
  const invalid = filled.filter(row => checkMarkText(event, marks[row.applicationId]));
  const valid = filled.length - invalid.length;
  const kind = eventKind(event);
  const readOnly = Boolean(sheet?.isDemo) || demo;

  // กันปิดหน้าโดยเผลอขณะมีผลที่ยังไม่ได้บันทึก
  useEffect(() => {
    if (!filled.length || readOnly) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [filled.length, readOnly]);

  const changeEvent = (next: string) => {
    if (filled.length && !window.confirm("เปลี่ยนรายการจะล้างผลที่กรอกไว้ทั้งหมด ใช่หรือไม่")) return;
    setMarks({});
    setRowErrors({});
    setSummary(null);
    setSaveError("");
    setEvent(next);
  };

  const setMark = (id: string, value: string) => {
    setMarks(previous => ({ ...previous, [id]: value }));
    setRowErrors(previous => {
      if (!previous[id]) return previous;
      const { [id]: _removed, ...rest } = previous;
      void _removed;
      return rest;
    });
    setSummary(null);
  };

  const focusNext = useCallback((current: HTMLInputElement) => {
    const inputs = [...document.querySelectorAll<HTMLInputElement>("input[data-mark-input]")];
    inputs[inputs.indexOf(current) + 1]?.focus();
  }, []);

  async function save() {
    setSaving(true);
    setSaveError("");
    setRowErrors({});
    setSummary(null);
    try {
      const entries = filled.map(row => ({ applicationId: row.applicationId, mark: marks[row.applicationId].trim() }));
      const response = await fetch("/api/staff/excellence/results/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, competedAt, stage, entries }),
      });
      const result = await response.json() as { error?: string; details?: Record<string, string>; saved?: number; skipped?: string[] };
      if (!response.ok) {
        const errors: Record<string, string> = {};
        for (const [key, message] of Object.entries(result.details ?? {})) {
          if (key.startsWith("entries.")) errors[key.slice("entries.".length)] = message;
        }
        setRowErrors(errors);
        setSaveError(result.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setSummary({ saved: result.saved ?? 0, skipped: result.skipped ?? [] });
      setMarks({});
      setReload(value => value + 1);
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const nameOf = (id: string) => all.find(row => row.applicationId === id)?.name ?? id;

  return (
    <Page title="บันทึกผลแข่ง">
      <ExcellenceNav demo={demo} onDemoChange={setDemo} />
      <DemoBanner show={demo} />
      <SportSwitcher sport={DEFAULT_EXCELLENCE_SPORT} />

      <section aria-labelledby="setup-title" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="setup-title" className="text-lg font-semibold text-slate-950">1. เลือกรายการแข่งขัน</h2>
        <p className="mt-1 text-sm text-slate-600">บันทึกได้ครั้งละ 1 รายการ / 1 วัน / 1 รอบ ผลของทุกคนในชุดนี้จะใช้รายการ วันที่ และรอบเดียวกัน</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            รายการ
            <select value={event} onChange={e => changeEvent(e.target.value)} className={`${fieldClass} mt-1`}>
              <EventOptions events={ATHLETICS_EVENTS} />
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            วันที่แข่ง
            <input type="date" value={competedAt} max={today()} onChange={e => setCompetedAt(e.target.value)} className={`${fieldClass} mt-1`} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            รอบการแข่งขัน (ไม่บังคับ)
            <input value={stage} onChange={e => setStage(e.target.value)} maxLength={100} placeholder="เช่น รอบคัดเลือก, รอบชิงชนะเลิศ" className={`${fieldClass} mt-1`} />
          </label>
        </div>
      </section>

      <section aria-labelledby="sheet-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 id="sheet-title" className="text-lg font-semibold text-slate-950">2. กรอกผล {eventLabel(event)}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {kind === "TRACK" ? "กรอกเวลาเป็นวินาที เช่น 10.85 หรือ นาที:วินาที เช่น 1:58.32" : "กรอกระยะเป็นเมตร เช่น 7.85"} · เว้นว่างคนที่ไม่ได้แข่ง · กด Enter เพื่อไปแถวถัดไป
            </p>
          </div>
          <label className="text-sm font-medium text-slate-700">
            ค้นหานักกีฬา
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ชื่อ รหัสนิสิต หรือคณะ" className={`${fieldClass} mt-1 w-64`} />
          </label>
        </div>

        {loadError && <p role="alert" className="m-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{loadError}</p>}
        {!sheet && !loadError && <p className="p-6 text-sm text-slate-600">กำลังโหลดรายชื่อ…</p>}

        {sheet && all.length === 0 && (
          <div className="p-6">
            <EmptyText>ยังไม่มีนักกีฬาที่รายการนี้เปิดให้ (ต้องเป็นนักกีฬากรีฑาที่ผ่านการคัดเลือก และเพศที่รายการนี้เปิด) เมื่อมีผู้ผ่านการคัดเลือกแล้วรายชื่อจะแสดงที่นี่</EmptyText>
          </div>
        )}

        {all.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">นักกีฬา</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">ผลดีที่สุดเดิม</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">เป้า</th>
                  <th scope="col" className="px-4 py-3 font-medium">ผลที่กรอก</th>
                  <th scope="col" className="px-4 py-3 font-medium">เทียบเป้า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {athletes.map(row => {
                  const text = (marks[row.applicationId] ?? "").trim();
                  const clientError = text ? checkMarkText(event, text) : null;
                  const message = clientError ?? rowErrors[row.applicationId] ?? null;
                  const parsed = text && !clientError ? parseMark(event, text) : null;
                  const gap = parsed === null ? null : gapToTarget(event, parsed, row.targetMark);
                  const percent = parsed === null ? null : percentOfTarget(event, parsed, row.targetMark);
                  const newBest = parsed !== null && row.bestMark !== null && (lowerIsBetter(event) ? parsed < row.bestMark : parsed > row.bestMark);
                  const errorId = `err-${row.applicationId}`;
                  return (
                    <tr key={row.applicationId} className={message ? "bg-rose-50/50" : text ? "bg-blue-50/40" : ""}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.studentId} · {row.gender} · {row.faculty}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{row.bestMark === null ? "—" : formatMark(event, row.bestMark)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{row.targetMark === null ? <span className="font-sans text-slate-400">ยังไม่ตั้งเป้า</span> : formatMark(event, row.targetMark)}</td>
                      <td className="px-4 py-3 align-top">
                        <input
                          data-mark-input
                          value={marks[row.applicationId] ?? ""}
                          onChange={e => setMark(row.applicationId, e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); focusNext(e.currentTarget); } }}
                          disabled={readOnly || saving}
                          inputMode="decimal"
                          autoComplete="off"
                          aria-label={`ผล${eventLabel(event)}ของ ${row.name}`}
                          aria-invalid={Boolean(message)}
                          aria-describedby={message ? errorId : undefined}
                          className={`w-36 rounded-lg border px-2.5 py-1.5 font-mono tabular-nums outline-none focus:ring-2 disabled:bg-slate-100 ${message ? "border-rose-400 focus:ring-rose-100" : "border-slate-300 focus:border-blue-800 focus:ring-blue-100"}`}
                        />
                        {message && <p id={errorId} role="alert" className="mt-1 text-xs text-rose-700">{message}</p>}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        {parsed === null ? <span className="text-slate-300">—</span> : (
                          <span className="flex flex-wrap items-center gap-2">
                            {gap !== null && <span className={`font-mono tabular-nums ${gap > 0 ? "text-rose-700" : "text-emerald-700"}`}>{formatSignedMark(event, gap)}{percent !== null ? ` · ${percent.toFixed(1)}%` : ""}</span>}
                            {gap === null && <span className="text-slate-500">ยังไม่ตั้งเป้า</span>}
                            {newBest && <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-bold text-violet-800">PB ใหม่</span>}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {athletes.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">ไม่พบนักกีฬาตามคำค้นหา</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {summary && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">บันทึกแล้ว {summary.saved} ผล</p>
          {summary.skipped.length > 0 && <p className="mt-1">ข้าม {summary.skipped.length} คนที่มีผลเดียวกัน (รายการ วันที่ และผลเท่ากัน) บันทึกไว้แล้ว: {summary.skipped.map(nameOf).join(", ")}</p>}
          <p className="mt-2"><Link href={`/staff/excellence${demoQuery(demo)}`} className="font-medium underline-offset-2 hover:underline">ไปดูรายงานภาพรวม</Link></p>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-1 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm" aria-live="polite">
            <span className="font-semibold text-slate-900">กรอกแล้ว {filled.length} คน</span>
            {invalid.length > 0 && <span className="ml-3 text-rose-700">ต้องแก้ {invalid.length} แถว</span>}
            {readOnly && <span className="ml-3 text-amber-800">โหมดสาธิต บันทึกไม่ได้</span>}
            {saveError && <span role="alert" className="ml-3 text-rose-700">{saveError}</span>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setMarks({}); setRowErrors({}); setSaveError(""); }} disabled={!filled.length || saving} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">ล้างที่กรอก</button>
            <button type="button" onClick={() => void save()} disabled={readOnly || saving || valid === 0 || invalid.length > 0} className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40">
              {saving ? "กำลังบันทึก…" : `บันทึก ${valid} ผล`}
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
