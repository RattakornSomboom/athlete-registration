"use client";

import { useState } from "react";
import type { AnalyticsSummary as SummaryData } from "@/lib/analytics";
import { statusLabel } from "@/lib/phase4-client";

const panelClass = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

function ComparisonBar({ label, value, maximum, color }: { label: string; value: number; maximum: number; color: string }) {
  const width = maximum > 0 ? Math.min(100, Math.max(0, value / maximum * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3 text-xs text-slate-600"><span>{label}</span><span className="font-semibold tabular-nums">{value.toLocaleString("th-TH")}</span></div>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div>
    </div>
  );
}

export default function AnalyticsSummary({ data }: { data: SummaryData }) {
  const [facultyView, setFacultyView] = useState<"chart" | "table">("chart");
  const metrics = data.metrics;
  const cards = [
    { label: "ใบสมัครทั้งหมด", value: metrics.totalApplications, detail: `รอพิจารณา ${metrics.pending} · ไม่ผ่าน ${metrics.rejected} ใบ`, color: "text-slate-900" },
    { label: "นักกีฬาไม่ซ้ำ (คน)", value: metrics.uniqueAthletes, detail: "นักกีฬาหนึ่งคนสมัครได้หลายกีฬา", color: "text-blue-900" },
    { label: "ผ่านการคัดเลือก (ใบ)", value: metrics.approved, detail: `ตัวจริง ${metrics.main} · สำรอง ${metrics.reserve} ใบ`, color: "text-emerald-800" },
    { label: "อัตราเติมเต็มโควตา", value: `${metrics.fillRate.toFixed(1)}%`, detail: `ผ่าน ${metrics.approved} / โควตาตัวจริง + สำรอง ${metrics.totalQuota}`, color: "text-blue-900" },
  ];
  const sportMaximum = Math.max(1, ...data.sports.flatMap(sport => [sport.applications, sport.approved, sport.quota]));
  const facultyMaximum = Math.max(1, ...data.faculties.map(faculty => faculty.applications));

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">หน่วยหลักคือใบสมัคร นักกีฬาหนึ่งคนสมัครได้หลายกีฬา “ผ่าน” หมายถึงกองกิจฯ อนุมัติหรือประกาศผลแล้ว</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => <section key={card.label} className={panelClass}><h2 className="text-sm font-medium text-slate-600">{card.label}</h2><p className={`mt-2 text-3xl font-extrabold tabular-nums ${card.color}`}>{typeof card.value === "number" ? card.value.toLocaleString("th-TH") : card.value}</p><p className="mt-3 text-xs leading-relaxed text-slate-600">{card.detail}</p></section>)}
      </div>
      {!metrics.totalApplications && <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">ยังไม่มีใบสมัครตรงกับตัวกรองนี้</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${panelClass} lg:col-span-2`}>
          <h2 className="border-b border-slate-100 pb-3 font-bold">เปรียบเทียบใบสมัคร ผ่านการคัดเลือก และโควตารายกีฬา</h2>
          <p className="mt-2 text-xs text-slate-600">แถบทุกกีฬาใช้สเกลเดียวกัน · โควตารวมตัวจริงและสำรอง</p>
          {!data.sports.length && <p className="mt-4 text-sm text-slate-500">ไม่มีข้อมูลกีฬาตรงกับตัวกรอง</p>}
          <div className="mt-5 max-h-[32rem] space-y-5 overflow-y-auto pr-2">
            {data.sports.map(sport => <div key={sport.sport} className="space-y-2 rounded-lg border border-slate-100 p-3"><h3 className="text-sm font-semibold">{sport.sport}</h3><ComparisonBar label="ใบสมัคร" value={sport.applications} maximum={sportMaximum} color="bg-blue-900" /><ComparisonBar label="ผ่าน (ใบ)" value={sport.approved} maximum={sportMaximum} color="bg-emerald-700" /><ComparisonBar label="โควตา" value={sport.quota} maximum={sportMaximum} color="bg-slate-400" /><p className="pt-1 text-xs text-slate-600">{sport.quota ? `เติมเต็ม ${sport.fillRate.toFixed(1)}%` : "ยังไม่มีโควตา"}</p></div>)}
          </div>
          <details className="mt-5 border-t border-slate-100 pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-blue-900">ดูตารางตัวเลขรายกีฬา</summary>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">สถิติใบสมัครแยกตามกีฬา</caption><thead className="bg-slate-900 text-white"><tr>{["กีฬา", "ใบสมัคร", "ผ่าน", "โควตา", "เติมเต็ม"].map(label => <th scope="col" key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{data.sports.map(sport => <tr key={sport.sport} className="border-b border-slate-100"><th scope="row" className="p-3 font-medium">{sport.sport}</th><td className="p-3">{sport.applications}</td><td className="p-3">{sport.approved}</td><td className="p-3">{sport.quota}</td><td className="p-3">{sport.quota ? `${sport.fillRate.toFixed(1)}%` : "ไม่ระบุ"}</td></tr>)}</tbody></table></div>
          </details>
        </section>
        <section className={panelClass}>
          <h2 className="border-b border-slate-100 pb-3 font-bold">สถานะใบสมัคร</h2>
          <div className="mx-auto my-6 flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-blue-100"><p className="text-3xl font-extrabold tabular-nums">{metrics.totalApplications}</p><p className="text-xs text-slate-600">ใบสมัครรวม</p></div>
          <ul className="space-y-3">{data.statuses.map(status => <li key={status.status}><ComparisonBar label={statusLabel[status.status] ?? status.status} value={status.count} maximum={metrics.totalApplications} color="bg-blue-800" /></li>)}</ul>
          <p className="mt-5 border-t border-slate-100 pt-3 text-sm text-slate-600">อัตราผ่านการคัดเลือก {metrics.acceptanceRate.toFixed(1)}%</p>
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${panelClass} lg:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"><h2 className="font-bold">การกระจายตามคณะ (นับใบสมัคร)</h2><div className="flex gap-2" role="group" aria-label="รูปแบบข้อมูลคณะ">{(["chart", "table"] as const).map(view => <button type="button" key={view} aria-pressed={facultyView === view} onClick={() => setFacultyView(view)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${facultyView === view ? "border-blue-900 bg-blue-900 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{view === "chart" ? "กราฟ" : "ตาราง"}</button>)}</div></div>
          {!data.faculties.length ? <p className="mt-4 text-sm text-slate-500">ยังไม่มีข้อมูลคณะ</p> : facultyView === "chart" ? <div className="mt-5 space-y-4">{data.faculties.map(faculty => <div key={faculty.faculty}><ComparisonBar label={faculty.faculty} value={faculty.applications} maximum={facultyMaximum} color="bg-blue-900" /><p className="mt-1 text-xs text-emerald-800">ผ่าน {faculty.approved} ใบ</p></div>)}</div> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">จำนวนใบสมัครและใบสมัครที่ผ่านแยกตามคณะ</caption><thead className="bg-slate-100"><tr><th scope="col" className="p-3">คณะ</th><th scope="col" className="p-3">ใบสมัคร</th><th scope="col" className="p-3">ผ่าน</th></tr></thead><tbody>{data.faculties.map(faculty => <tr key={faculty.faculty} className="border-b border-slate-100"><th scope="row" className="p-3 font-medium">{faculty.faculty}</th><td className="p-3">{faculty.applications}</td><td className="p-3">{faculty.approved}</td></tr>)}</tbody></table></div>}
        </section>
        <section className={panelClass}><h2 className="border-b border-slate-100 pb-3 font-bold">แยกตามการแข่งขัน</h2>{!data.competitions?.length && <p className="mt-4 text-sm text-slate-500">ยังไม่มีใบสมัครของการแข่งขัน</p>}<ul className="mt-3 divide-y divide-slate-100">{data.competitions?.map(competition => <li key={competition.id} className="flex justify-between gap-4 py-3 text-sm"><span>{competition.name ?? competition.id}</span><span className="shrink-0 font-semibold">{competition.applications} ใบ</span></li>)}</ul></section>
      </div>
      <p className="rounded-lg border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600">เพศ / งบประมาณ / ผลตามเกณฑ์เฉพาะกีฬา / ปฏิทินทางการ: ยังไม่มีข้อมูลจาก API สำหรับแสดงในแดชบอร์ดนี้</p>
    </div>
  );
}
