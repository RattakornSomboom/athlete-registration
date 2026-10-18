"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Page, fieldClass } from "@/components/shared/Phase4UI";
import { DemoBanner, EmptyText, EventOptions, ExcellenceNav, PrintSetup, SportSwitcher, TargetBadge, demoQuery, formatThaiDate, useDemoMode, usePrinting } from "@/components/shared/ExcellenceUI";
import { AttentionPanel, EventAttainmentChart, KpiStrip, ReportSkeleton, WeakStationsChart } from "@/components/shared/ExcellenceReport";
import { requestJson, errorMessage } from "@/lib/phase4-client";
import {
  ATHLETICS_EVENTS,
  ATHLETICS_GENDERS,
  ATTENTION_LABEL,
  PLAN_STATUS_LABEL,
  TARGET_STATUS_LABEL,
  eventLabel,
  filterRows,
  formatMark,
  formatSignedMark,
  overviewCsv,
  type AttentionFlag,
  type ExecutiveReport,
  type OverviewRow,
  type TargetStatus,
} from "@/lib/excellence-athletics";
import { DEFAULT_EXCELLENCE_SPORT, findExcellenceSport } from "@/lib/excellence-sports";

type Overview = { isDemo: boolean; sport: string; generatedAt: string; rows: OverviewRow[]; report: ExecutiveReport };

const PAGE_SIZE = 25;
const STATUS_ORDER: Record<TargetStatus, number> = { BELOW_TARGET: 0, NO_TARGET: 1, NO_RESULT: 2, AT_TARGET: 3 };
const STATUS_FILTERS: (TargetStatus | "")[] = ["", "AT_TARGET", "BELOW_TARGET", "NO_TARGET", "NO_RESULT"];

type SortKey = "attention" | "name" | "event" | "gap" | "percent" | "status";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) =>
  a === null && b === null ? 0 : a === null ? 1 : b === null ? -1 : (a - b) * dir;

function sortRows(rows: OverviewRow[], sort: Sort): OverviewRow[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  const byName = (a: OverviewRow, b: OverviewRow) => a.name.localeCompare(b.name, "th");
  return [...rows].sort((a, b) => {
    switch (sort.key) {
      case "name": return byName(a, b) * dir;
      case "event": return (eventLabel(a.event ?? "~").localeCompare(eventLabel(b.event ?? "~"), "th") || byName(a, b)) * dir;
      case "gap": return nullsLast(a.gapMark, b.gapMark, dir) || byName(a, b);
      case "percent": return nullsLast(a.percentOfTarget, b.percentOfTarget, dir) || byName(a, b);
      case "status": return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir || byName(a, b);
      // desc = มีเรื่องต้องติดตามมากกว่าขึ้นก่อน (ค่าเริ่มต้น)
      default: return (a.flags.length - b.flags.length) * dir || byName(a, b);
    }
  });
}

function SortHeader({ label, sortKey, sort, onSort, align = "left" }: { label: string; sortKey: SortKey; sort: Sort; onSort: (key: SortKey) => void; align?: "left" | "right" }) {
  const active = sort.key === sortKey;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""}`}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 rounded py-1 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-blue-800 ${active ? "text-slate-950" : ""}`}>
        {label}
        <span aria-hidden className="text-xs print:hidden">{active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

export default function ExcellenceOverviewPage() {
  const { demo, ready, setDemo } = useDemoMode();
  const printing = usePrinting();
  const [sport, setSport] = useState(DEFAULT_EXCELLENCE_SPORT);
  const [event, setEvent] = useState("");
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TargetStatus | "">("");
  const [flag, setFlag] = useState<AttentionFlag | null>(null);
  const [sort, setSort] = useState<Sort>({ key: "attention", dir: "desc" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const query = new URLSearchParams({
    sport,
    ...(event ? { event } : {}),
    ...(gender ? { gender } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(demo ? { demo: "true" } : {}),
  }).toString();

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      requestJson<Overview>(`/api/staff/excellence?${query}`)
        .then(result => { if (active) { setData(result); setError(""); } })
        .catch(e => { if (active) setError(errorMessage(e)); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, ready, reloadKey]);

  const visible = useMemo(() => (data ? sortRows(filterRows(data.rows, { status: status || undefined, flag: flag ?? undefined }), sort) : []), [data, status, flag, sort]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const sportLabel = findExcellenceSport(sport)?.label ?? sport;
  const filtered = Boolean(event || gender || search.trim() || status || flag);

  const changeSort = (key: SortKey) => {
    setSort(previous => ({ key, dir: previous.key === key && previous.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  };
  const resetFilters = () => { setEvent(""); setGender(""); setSearch(""); setStatus(""); setFlag(null); setPage(1); };

  function exportCsv() {
    const blob = new Blob(["﻿" + overviewCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `สู่ความเป็นเลิศ-${sportLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page title="สู่ความเป็นเลิศ">
      <PrintSetup />
      <ExcellenceNav demo={demo} onDemoChange={setDemo} />
      <DemoBanner show={demo} />

      <section aria-label="ตัวกรองรายงาน" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SportSwitcher sport={sport} onChange={next => { setSport(next); setEvent(""); setPage(1); }} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} disabled={!visible.length} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              ส่งออก CSV ({visible.length} แถว)
            </button>
            <button type="button" onClick={() => window.print()} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">พิมพ์รายงาน</button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            รายการแข่งขัน
            <select value={event} onChange={e => { setEvent(e.target.value); setPage(1); }} className={`${fieldClass} mt-1`}>
              <option value="">ทุกรายการ</option>
              <EventOptions events={ATHLETICS_EVENTS} />
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            เพศ
            <select value={gender} onChange={e => { setGender(e.target.value); setPage(1); }} className={`${fieldClass} mt-1`}>
              <option value="">ทั้งชายและหญิง</option>
              {ATHLETICS_GENDERS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            ค้นหา
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ชื่อ รหัสนิสิต หรือคณะ" className={`${fieldClass} mt-1`} />
          </label>
        </div>
      </section>

      <p className="hidden text-sm text-slate-700 print:block">
        รายงานสู่ความเป็นเลิศ · กีฬา{sportLabel} · ข้อมูล ณ {data ? formatThaiDate(data.generatedAt) : ""}{demo ? " (ข้อมูลสาธิต)" : ""}
      </p>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey(value => value + 1)} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-medium hover:bg-rose-100">ลองใหม่</button>
        </div>
      )}

      {!data && !error && <ReportSkeleton />}

      {data && (
        <>
          <KpiStrip report={data.report} />

          <div className="grid gap-4 lg:grid-cols-3 print:grid-cols-1">
            <div className="lg:col-span-1 print:hidden">
              <AttentionPanel report={data.report} active={flag} onSelect={next => { setFlag(next); setPage(1); }} />
            </div>
            <div className="grid gap-4 lg:col-span-2 xl:grid-cols-2 print:col-span-1 print:grid-cols-2">
              <EventAttainmentChart byEvent={data.report.byEvent} />
              <WeakStationsChart stations={data.report.weakStations} />
            </div>
          </div>

          <section aria-labelledby="athletes-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h2 id="athletes-title" className="text-lg font-semibold text-slate-950">รายชื่อนักกีฬา</h2>
                <p className="text-sm text-slate-600" aria-live="polite">
                  {visible.length} แถว
                  {flag && <> · กรอง: {ATTENTION_LABEL[flag]}</>}
                  {filtered && <button type="button" onClick={resetFilters} className="ml-3 text-blue-900 underline-offset-2 hover:underline print:hidden">ล้างตัวกรอง</button>}
                </p>
              </div>
              <div role="group" aria-label="กรองตามสถานะ" className="flex flex-wrap gap-2 print:hidden">
                {STATUS_FILTERS.map(item => (
                  <button
                    key={item || "all"}
                    type="button"
                    aria-pressed={status === item}
                    onClick={() => { setStatus(item); setPage(1); }}
                    className={`rounded-full border px-3 py-1 text-sm transition ${status === item ? "border-blue-900 bg-blue-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {item ? TARGET_STATUS_LABEL[item] : "ทั้งหมด"}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="space-y-3 p-6">
                <EmptyText>
                  {data.rows.length === 0 && !filtered
                    ? "ยังไม่มีนักกีฬาที่ผ่านการคัดเลือก (สถานะกองกิจฯ อนุมัติ หรือประกาศผลแล้ว) เมื่อมีผู้ผ่านการคัดเลือก รายชื่อและผลแข่งจะแสดงที่นี่"
                    : "ไม่พบนักกีฬาตามตัวกรองที่เลือก"}
                </EmptyText>
                {filtered && <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">ล้างตัวกรอง</button>}
                {!filtered && !demo && (
                  <button type="button" onClick={() => setDemo(true)} className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100">
                    ดูตัวอย่างด้วยข้อมูลสาธิต
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[1000px] text-left text-sm print:min-w-0 print:text-xs">
                  <caption className="sr-only">รายชื่อนักกีฬาพร้อมผลดีที่สุด เป้า ส่วนต่าง สถานะ จุดอ่อน และแผนพัฒนา ใช้ปุ่มหัวคอลัมน์เพื่อเรียงลำดับ</caption>
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <SortHeader label="นักกีฬา" sortKey="name" sort={sort} onSort={changeSort} />
                      <SortHeader label="รายการ" sortKey="event" sort={sort} onSort={changeSort} />
                      <th scope="col" className="px-4 py-3 text-right font-medium">ผลดีที่สุด</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">เป้า</th>
                      <SortHeader label="Gap" sortKey="gap" sort={sort} onSort={changeSort} align="right" />
                      <SortHeader label="% ของเป้า" sortKey="percent" sort={sort} onSort={changeSort} align="right" />
                      <SortHeader label="สถานะ" sortKey="status" sort={sort} onSort={changeSort} />
                      <th scope="col" className="px-4 py-3 font-medium">จุดอ่อนหลัก</th>
                      <SortHeader label="แผน / ต้องติดตาม" sortKey="attention" sort={sort} onSort={changeSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(printing ? visible : shown).map(row => {
                      const flags = row.flags.filter(item => item !== "NO_RESULT" && item !== "NO_TARGET");
                      return (
                        <tr key={row.rowId} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link href={`/staff/excellence/${row.applicationId}${demoQuery(demo)}`} className="font-medium text-blue-900 underline-offset-2 hover:underline">{row.name}</Link>
                            <p className="text-xs text-slate-500">{row.studentId} · {row.gender} · {row.faculty}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{row.event ? eventLabel(row.event) : "—"}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">{row.event ? formatMark(row.event, row.bestMark) : "—"}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{row.event ? formatMark(row.event, row.targetMark) : "—"}</td>
                          <td className={`px-4 py-3 text-right font-mono tabular-nums ${row.gapMark === null ? "text-slate-500" : row.gapMark > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                            {row.event ? formatSignedMark(row.event, row.gapMark) : "—"}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono tabular-nums ${row.percentOfTarget === null ? "text-slate-500" : row.percentOfTarget >= 100 ? "text-emerald-700" : "text-slate-700"}`}>
                            {row.percentOfTarget === null ? "—" : `${row.percentOfTarget.toFixed(1)}%`}
                          </td>
                          <td className="px-4 py-3"><TargetBadge status={row.status} /></td>
                          <td className="px-4 py-3 text-slate-700">{row.weakestStation ?? <span className="text-slate-500">ไม่พบจุดอ่อน</span>}</td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700">{row.planStatus ? PLAN_STATUS_LABEL[row.planStatus] : <span className="text-slate-500">ยังไม่มีแผน</span>}</span>
                            {row.retestCount > 0 && <span className="ml-2 text-xs text-slate-500">ทดสอบซ้ำ {row.retestCount} ครั้ง</span>}
                            {flags.length > 0 && (
                              <span className="mt-1 flex flex-wrap gap-1">
                                {flags.map(item => <span key={item} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">{ATTENTION_LABEL[item]}</span>)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {visible.length > PAGE_SIZE && (
              <nav aria-label="แบ่งหน้า" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm print:hidden">
                <p className="text-slate-600">แสดง {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, visible.length)} จาก {visible.length} แถว</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">ก่อนหน้า</button>
                  <span className="tabular-nums text-slate-600">หน้า {current} / {pages}</span>
                  <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">ถัดไป</button>
                </div>
              </nav>
            )}
          </section>
          <p className="text-xs text-slate-500">
            นับเป็นจำนวนคน ยกเว้น &quot;ยังไม่ตั้งเป้าหมาย&quot; ที่นับเป็นรายการ · Gap = ตามหลังเป้า (ค่าบวก = ตามหลัง) · % ของเป้า: 100 = เท่าเป้า มากกว่า = ดีกว่า ใช้เทียบข้ามรายการ · จุดอ่อน = สถานีสมรรถภาพระดับต่ำและต่ำมาก (เกณฑ์กลุ่ม 9)
          </p>
        </>
      )}
    </Page>
  );
}
