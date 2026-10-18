"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Page, fieldClass } from "@/components/shared/Phase4UI";
import { DemoBanner, EmptyText, EventOptions, ExcellenceNav, PrintSetup, SportSwitcher, demoQuery, useDemoMode } from "@/components/shared/ExcellenceUI";
import { DEFAULT_EXCELLENCE_SPORT } from "@/lib/excellence-sports";
import { requestJson, errorMessage } from "@/lib/phase4-client";
import { ATHLETICS_EVENTS, ATHLETICS_GENDERS, eventLabel, type Heatmap, type HeatmapCell } from "@/lib/excellence-athletics";

type HeatmapData = Heatmap & { isDemo: boolean };

// สีตามระดับ + ตัวอักษรระดับในช่องเสมอ (ไม่พึ่งสีอย่างเดียว) ระดับ ต่ำ และ ต่ำมาก คือจุดอ่อน (ปานกลางไม่ใช่จุดอ่อน)
function cellClass(cell: HeatmapCell | null): string {
  if (!cell) return "bg-white text-slate-500";
  if (cell.score >= 75) return "bg-emerald-100 text-emerald-900";
  if (cell.score >= 50) return "bg-slate-100 text-slate-800";
  if (cell.score >= 25) return "bg-amber-100 text-amber-900";
  return "bg-rose-200 text-rose-900";
}

export default function ExcellenceHeatmapPage() {
  const { demo, ready, setDemo } = useDemoMode();
  const [event, setEvent] = useState("");
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<HeatmapData | null>(null);
  const [error, setError] = useState("");

  const query = new URLSearchParams({ ...(event ? { event } : {}), ...(gender ? { gender } : {}), ...(search.trim() ? { search: search.trim() } : {}), ...(demo ? { demo: "true" } : {}) }).toString();

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      requestJson<HeatmapData>(`/api/staff/excellence/heatmap${query ? `?${query}` : ""}`)
        .then(result => { if (active) { setData(result); setError(""); } })
        .catch(e => { if (active) setError(errorMessage(e)); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, ready]);

  return (
    <Page title="แผนที่จุดอ่อนทีม">
      <PrintSetup />
      <ExcellenceNav demo={demo} onDemoChange={setDemo} />
      <DemoBanner show={demo} />
      <SportSwitcher sport={DEFAULT_EXCELLENCE_SPORT} />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 print:hidden">
        <label className="text-sm font-medium text-slate-700">
          รายการแข่งขัน (นักกีฬาที่มีผลในรายการนี้)
          <select value={event} onChange={e => setEvent(e.target.value)} className={`${fieldClass} mt-1`}>
            <option value="">ทุกรายการ</option>
            <EventOptions events={ATHLETICS_EVENTS} />
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          เพศ
          <select value={gender} onChange={e => setGender(e.target.value)} className={`${fieldClass} mt-1`}>
            <option value="">ทั้งชายและหญิง</option>
            {ATHLETICS_GENDERS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          ค้นหา
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ชื่อ รหัสนิสิต หรือคณะ" className={`${fieldClass} mt-1`} />
        </label>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {!data && !error && <p className="text-sm text-slate-600">กำลังโหลดข้อมูล…</p>}

      {data && (data.rows.length === 0 ? (
        <EmptyText>ไม่พบนักกีฬาตามตัวกรองที่เลือก หรือยังไม่มีนักกีฬากรีฑาที่ผ่านการคัดเลือก</EmptyText>
      ) : (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm print:overflow-visible">
          <table className="w-full min-w-[1200px] border-collapse print:min-w-0 print:text-xs text-left text-sm">
            <caption className="sr-only">ระดับผลทดสอบสมรรถภาพรายสถานีของนักกีฬาแต่ละคน</caption>
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">นักกีฬา</th>
                {data.stations.map(station => (
                  <th key={station.key} scope="col" className="px-2 py-3 text-center align-bottom text-xs font-medium">{station.name}</th>
                ))}
                <th scope="col" className="px-3 py-3 text-center font-medium">จุดอ่อน</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr key={row.applicationId} className="border-t border-slate-100">
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    <Link href={`/staff/excellence/${row.applicationId}${demoQuery(demo)}`} className="font-medium text-blue-900 underline-offset-2 hover:underline">{row.name}</Link>
                    <span className="block text-xs text-slate-500">{row.gender} · {row.events.length ? row.events.map(eventLabel).join(", ") : "ยังไม่มีผลแข่ง"}</span>
                  </th>
                  {data.stations.map(station => {
                    const cell = row.cells[station.key];
                    return (
                      <td key={station.key} className={`border-l border-white px-2 py-2 text-center text-xs font-medium ${cellClass(cell)}`}>
                        {cell ? cell.rating : "—"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-mono tabular-nums">
                    {row.testedCount === 0 ? <span className="text-slate-500">—</span> : `${row.weakCount}/${row.testedCount}`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-xs text-slate-700">
              <tr>
                <th scope="row" className="px-4 py-2 text-left font-semibold">จุดอ่อนของทีม (คน)</th>
                {data.stations.map(station => (
                  <td key={station.key} className="px-2 py-2 text-center">
                    {station.tested === 0 ? "—" : <><span className="font-mono text-sm font-semibold tabular-nums">{station.weak}/{station.tested}</span><span className="block text-slate-500">เฉลี่ย {station.averageScore}</span></>}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </section>
      ))}
      <p className="text-xs text-slate-500">
        จุดอ่อน = สถานีระดับต่ำและต่ำมาก (ปานกลางไม่นับ) · เรียงคนที่มีจุดอ่อนมากที่สุดก่อน · แถวสรุปนับเฉพาะคนที่ทดสอบสถานีนั้น (คนที่ไม่มีผลไม่ถูกนับเป็นจุดอ่อน) · คะแนนเฉลี่ย: ดีมาก 100, ดี 75, ปานกลาง 50, ต่ำ 25, ต่ำมาก 0 · สถานีและระดับตามเกณฑ์สมรรถภาพกลุ่ม 9
      </p>
    </Page>
  );
}
