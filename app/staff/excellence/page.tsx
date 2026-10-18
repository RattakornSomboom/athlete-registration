"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Page, fieldClass } from "@/components/shared/Phase4UI";
import { DemoBanner, EmptyText, ExcellenceNav, TargetBadge, demoQuery, useDemoMode } from "@/components/shared/ExcellenceUI";
import { requestJson, errorMessage } from "@/lib/phase4-client";
import {
  ATHLETICS_TRACK_EVENTS,
  PLAN_STATUS_LABEL,
  TRACK_GENDERS,
  eventLabel,
  formatSignedSeconds,
  formatTrackTime,
  type OverviewRow,
  type OverviewSummary,
} from "@/lib/excellence-athletics";

type Overview = { isDemo: boolean; rows: OverviewRow[]; summary: OverviewSummary };

function SummaryTile({ label, value, total }: { label: string; value: number; total?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">
        {value}
        {total !== undefined && <span className="text-base font-medium text-slate-500"> / {total} คน</span>}
        {total === undefined && <span className="text-base font-medium text-slate-500"> คน</span>}
      </p>
    </div>
  );
}

export default function ExcellenceOverviewPage() {
  const { demo, ready, setDemo } = useDemoMode();
  const [event, setEvent] = useState("");
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const query = new URLSearchParams({ ...(event ? { event } : {}), ...(gender ? { gender } : {}), ...(search.trim() ? { search: search.trim() } : {}), ...(demo ? { demo: "true" } : {}) }).toString();

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      requestJson<Overview>(`/api/staff/excellence${query ? `?${query}` : ""}`)
        .then(result => { if (active) { setData(result); setError(""); } })
        .catch(e => { if (active) setError(errorMessage(e)); })
        .finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, ready]);

  const filtered = Boolean(event || gender || search.trim());
  const summary = data?.summary;

  return (
    <Page title="สู่ความเป็นเลิศ · กรีฑาประเภทลู่">
      <ExcellenceNav demo={demo} onDemoChange={setDemo} />
      <DemoBanner show={demo} />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          รายการแข่งขัน
          <select value={event} onChange={e => setEvent(e.target.value)} className={`${fieldClass} mt-1`}>
            <option value="">ทุกรายการ</option>
            {ATHLETICS_TRACK_EVENTS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          เพศ
          <select value={gender} onChange={e => setGender(e.target.value)} className={`${fieldClass} mt-1`}>
            <option value="">ทั้งชายและหญิง</option>
            {TRACK_GENDERS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          ค้นหา
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ชื่อ รหัสนิสิต หรือคณะ" className={`${fieldClass} mt-1`} />
        </label>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile label="นักกีฬา" value={summary.athletes} />
          <SummaryTile label="ถึงเป้าอย่างน้อย 1 รายการ" value={summary.atTarget} total={summary.athletes} />
          <SummaryTile label="มีแผนพัฒนา" value={summary.withPlan} total={summary.athletes} />
          <SummaryTile label="ทดสอบซ้ำแล้ว" value={summary.retested} total={summary.athletes} />
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading && !data ? (
          <p className="p-6 text-sm text-slate-600">กำลังโหลดข้อมูล…</p>
        ) : !data?.rows.length ? (
          <div className="space-y-3 p-6">
            <EmptyText>
              {filtered
                ? "ไม่พบนักกีฬาตามตัวกรองที่เลือก"
                : "ยังไม่มีนักกีฬากรีฑาประเภทลู่ที่ผ่านการคัดเลือก (สถานะกองกิจฯ อนุมัติ หรือประกาศผลแล้ว)"}
            </EmptyText>
            {!filtered && !demo && (
              <button type="button" onClick={() => setDemo(true)} className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100">
                ดูตัวอย่างด้วยข้อมูลสาธิต
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">นักกีฬา</th>
                  <th className="px-4 py-3 font-medium">รายการ</th>
                  <th className="px-4 py-3 text-right font-medium">เวลาดีที่สุด</th>
                  <th className="px-4 py-3 text-right font-medium">เป้า</th>
                  <th className="px-4 py-3 text-right font-medium">Gap</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">จุดอ่อนหลัก</th>
                  <th className="px-4 py-3 font-medium">แผนพัฒนา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map(row => (
                  <tr key={row.rowId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/staff/excellence/${row.applicationId}${demoQuery(demo)}`} className="font-medium text-blue-900 underline-offset-2 hover:underline">
                        {row.name}
                      </Link>
                      <p className="text-xs text-slate-500">{row.studentId} · {row.gender} · {row.faculty}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.event ? eventLabel(row.event) : "—"}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatTrackTime(row.bestSeconds)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{formatTrackTime(row.targetSeconds)}</td>
                    <td className={`px-4 py-3 text-right font-mono tabular-nums ${row.gapSeconds === null ? "text-slate-400" : row.gapSeconds > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {formatSignedSeconds(row.gapSeconds)}
                    </td>
                    <td className="px-4 py-3"><TargetBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-slate-700">{row.weakestStation ?? <span className="text-slate-400">ไม่พบจุดอ่อน</span>}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.planStatus ? PLAN_STATUS_LABEL[row.planStatus] : <span className="text-slate-400">ยังไม่มีแผน</span>}
                      {row.retestCount > 0 && <span className="block text-xs text-slate-500">ทดสอบซ้ำ {row.retestCount} ครั้ง</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="text-xs text-slate-500">
        แสดง 1 แถวต่อนักกีฬาต่อรายการที่มีผลแข่ง · Gap = เวลาดีที่สุด − เป้า (ค่าบวกคือช้ากว่าเป้า) · จุดอ่อน = สถานีสมรรถภาพระดับพอใช้ลงไป
      </p>
    </Page>
  );
}
