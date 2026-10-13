"use client";

import Link from "next/link";
import { useState } from "react";
import type { AnalyticsSummary as SummaryData } from "@/lib/analytics";
import { statusLabel } from "@/lib/phase4-client";

const panelClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

function formatNumber(value: number) {
  return value.toLocaleString("th-TH");
}

function ProgressBar({ value, maximum, color = "bg-blue-800" }: { value: number; maximum: number; color?: string }) {
  const width = maximum > 0 ? Math.min(100, Math.max(0, value / maximum * 100)) : 0;
  return (
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-[width] ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "green" | "amber" | "slate"; children: React.ReactNode }) {
  const classes = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
  }[tone];

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classes}`}>{children}</span>;
}

export default function AnalyticsSummary({ data }: { data: SummaryData }) {
  const [facultyView, setFacultyView] = useState<"chart" | "table">("chart");
  const metrics = data.metrics;
  const sportMaximum = Math.max(1, ...data.sports.map(sport => Math.max(sport.applications, sport.quota)));
  const facultyMaximum = Math.max(1, ...data.faculties.map(faculty => faculty.applications));
  const pendingStatuses = data.statuses.filter(item => ["SUBMITTED", "CLUB_APPROVED"].includes(item.status));
  const approvedStatuses = data.statuses.filter(item => ["STAFF_APPROVED", "FINAL_SELECTED"].includes(item.status));

  const cards = [
    { label: "ใบสมัครทั้งหมด", value: formatNumber(metrics.totalApplications), detail: `รอพิจารณา ${formatNumber(metrics.pending)} · ไม่ผ่าน ${formatNumber(metrics.rejected)} ใบ`, accent: "border-slate-200", valueClass: "text-slate-950" },
    { label: "นักกีฬาไม่ซ้ำ", value: formatNumber(metrics.uniqueAthletes), detail: "หนึ่งคนสมัครได้มากกว่าหนึ่งชนิดกีฬา", accent: "border-blue-200", valueClass: "text-blue-900" },
    { label: "ผ่านการคัดเลือก", value: formatNumber(metrics.approved), detail: `ตัวจริง ${formatNumber(metrics.main)} · สำรอง ${formatNumber(metrics.reserve)} ใบ`, accent: "border-emerald-200", valueClass: "text-emerald-800" },
    { label: "โควตาที่เติมเต็ม", value: `${metrics.fillRate.toFixed(1)}%`, detail: `${formatNumber(metrics.approved)} / ${formatNumber(metrics.totalQuota)} ที่นั่ง`, accent: "border-amber-200", valueClass: "text-amber-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">Current selection overview</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">ภาพรวมผลการคัดเลือก</h2>
          <p className="mt-1 text-xs text-slate-500">หน่วยหลักคือใบสมัคร · นักกีฬาหนึ่งคนสมัครได้หลายกีฬา · ผ่านหมายถึงอนุมัติหรือประกาศผลแล้ว</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/staff/applications" className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-900">ดูใบสมัครทั้งหมด →</Link>
          <Link href="/staff/selection" className="rounded-lg bg-blue-900 px-3 py-2 font-semibold text-white transition hover:bg-blue-800">ไปหน้าคัดเลือก →</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <section key={card.label} className={`rounded-2xl border bg-white p-5 shadow-sm ${card.accent}`}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xs font-semibold text-slate-500">{card.label}</h3>
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current opacity-70" />
            </div>
            <p className={`mt-3 text-3xl font-extrabold tabular-nums ${card.valueClass}`}>{card.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{card.detail}</p>
          </section>
        ))}
      </div>

      {!metrics.totalApplications && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">ยังไม่มีใบสมัครตรงกับตัวกรองนี้</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${panelClass} lg:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-950">สถานะใบสมัคร</h2>
              <p className="mt-1 text-xs text-slate-500">ดูจำนวนที่ยังต้องดำเนินการและจำนวนที่ผ่านแล้ว</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">ผ่าน {formatNumber(metrics.approved)} ใบ</span>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between"><StatusBadge tone="amber">รอดำเนินการ</StatusBadge><span className="text-sm font-bold tabular-nums">{formatNumber(metrics.pending)}</span></div>
              <div className="space-y-3">
                {pendingStatuses.map(item => <div key={item.status}><div className="mb-1 flex justify-between gap-3 text-xs text-slate-600"><span>{statusLabel[item.status] ?? item.status}</span><span className="font-semibold tabular-nums">{formatNumber(item.count)}</span></div><ProgressBar value={item.count} maximum={metrics.totalApplications} color="bg-amber-500" /></div>)}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between"><StatusBadge tone="green">ผ่านการคัดเลือก</StatusBadge><span className="text-sm font-bold tabular-nums">{formatNumber(metrics.approved)}</span></div>
              <div className="space-y-3">
                {approvedStatuses.map(item => <div key={item.status}><div className="mb-1 flex justify-between gap-3 text-xs text-slate-600"><span>{statusLabel[item.status] ?? item.status}</span><span className="font-semibold tabular-nums">{formatNumber(item.count)}</span></div><ProgressBar value={item.count} maximum={metrics.totalApplications} color="bg-emerald-600" /></div>)}
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-xs text-slate-600"><span>อัตราผ่านการคัดเลือก</span><span className="font-bold text-slate-900">{metrics.acceptanceRate.toFixed(1)}%</span></div>
            <div className="mt-2"><ProgressBar value={metrics.approved} maximum={metrics.totalApplications} color="bg-blue-800" /></div>
          </div>
        </section>

        <section className={panelClass}>
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-950">แยกตามการแข่งขัน</h2>
              <p className="mt-1 text-xs text-slate-500">จำนวนใบสมัครในตัวกรองนี้</p>
            </div>
            <StatusBadge tone="slate">{formatNumber(metrics.totalApplications)} ใบ</StatusBadge>
          </div>
          {!data.competitions?.length ? <p className="mt-4 text-sm text-slate-500">ยังไม่มีใบสมัครของการแข่งขัน</p> : <ul className="mt-2 divide-y divide-slate-100">{data.competitions.map(competition => <li key={competition.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="min-w-0 truncate text-slate-700">{competition.name ?? competition.id}</span><span className="shrink-0 font-bold tabular-nums text-slate-950">{formatNumber(competition.applications)} ใบ</span></li>)}</ul>}
        </section>
      </div>

      <section className={panelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-950">สถานะโควตารายกีฬา</h2>
            <p className="mt-1 text-xs text-slate-500">เปรียบเทียบใบสมัคร, ผู้ผ่าน และโควตารวมตัวจริงกับตัวสำรอง</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-800" />สมัคร</span>
            <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-600" />ผ่าน</span>
            <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-400" />โควตา</span>
          </div>
        </div>
        {!data.sports.length ? <p className="mt-4 text-sm text-slate-500">ไม่มีข้อมูลกีฬาตรงกับตัวกรอง</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><caption className="sr-only">สถานะโควตาแยกตามชนิดกีฬา</caption><thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th scope="col" className="px-3 py-3 font-semibold">ชนิดกีฬา</th><th scope="col" className="px-3 py-3 font-semibold">ใบสมัคร</th><th scope="col" className="px-3 py-3 font-semibold">ผ่าน</th><th scope="col" className="w-1/3 px-3 py-3 font-semibold">เทียบโควตา</th><th scope="col" className="px-3 py-3 text-right font-semibold">สถานะ</th></tr></thead><tbody>{data.sports.map(sport => { const shortfall = Math.max(0, sport.quota - sport.approved); const tone = sport.quota > 0 && shortfall === 0 ? "green" : sport.quota > 0 ? "amber" : "slate"; return <tr key={sport.sport} className="border-b border-slate-100 last:border-0"><th scope="row" className="px-3 py-4 font-semibold text-slate-900">{sport.sport}</th><td className="px-3 py-4 tabular-nums text-slate-700">{formatNumber(sport.applications)}</td><td className="px-3 py-4 font-semibold tabular-nums text-emerald-800">{formatNumber(sport.approved)}</td><td className="px-3 py-4"><div className="flex items-center gap-3"><div className="min-w-24 flex-1"><ProgressBar value={sport.approved} maximum={sport.quota || sportMaximum} color={tone === "green" ? "bg-emerald-600" : "bg-blue-800"} /></div><span className="w-16 text-right text-xs tabular-nums text-slate-600">{sport.quota ? `${sport.fillRate.toFixed(0)}%` : "—"}</span></div></td><td className="px-3 py-4 text-right"><StatusBadge tone={tone}>{sport.quota ? (shortfall ? `ขาด ${formatNumber(shortfall)}` : "เต็มโควตา") : "ไม่มีโควตา"}</StatusBadge></td></tr>; })}</tbody></table></div>}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${panelClass} lg:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-950">การกระจายตามคณะ</h2>
              <p className="mt-1 text-xs text-slate-500">นับจากจำนวนใบสมัคร ไม่ใช่จำนวนนักกีฬาที่ไม่ซ้ำ</p>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="รูปแบบข้อมูลคณะ">
              {(["chart", "table"] as const).map(view => <button type="button" key={view} aria-pressed={facultyView === view} onClick={() => setFacultyView(view)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${facultyView === view ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}>{view === "chart" ? "กราฟ" : "ตาราง"}</button>)}
            </div>
          </div>
          {!data.faculties.length ? <p className="mt-4 text-sm text-slate-500">ยังไม่มีข้อมูลคณะ</p> : facultyView === "chart" ? <div className="mt-5 space-y-4">{data.faculties.map(faculty => <div key={faculty.faculty}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-slate-700">{faculty.faculty}</span><span className="font-semibold tabular-nums text-slate-900">{formatNumber(faculty.applications)} ใบ · ผ่าน {formatNumber(faculty.approved)}</span></div><ProgressBar value={faculty.applications} maximum={facultyMaximum} /></div>)}</div> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">จำนวนใบสมัครและใบสมัครที่ผ่านแยกตามคณะ</caption><thead className="bg-slate-100 text-xs"><tr><th scope="col" className="p-3">คณะ</th><th scope="col" className="p-3">ใบสมัคร</th><th scope="col" className="p-3">ผ่าน</th></tr></thead><tbody>{data.faculties.map(faculty => <tr key={faculty.faculty} className="border-b border-slate-100"><th scope="row" className="p-3 font-medium">{faculty.faculty}</th><td className="p-3 tabular-nums">{formatNumber(faculty.applications)}</td><td className="p-3 font-semibold tabular-nums text-emerald-800">{formatNumber(faculty.approved)}</td></tr>)}</tbody></table></div>}
        </section>
        <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
          <h2 className="font-bold text-blue-950">ขั้นตอนถัดไป</h2>
          <p className="mt-2 text-xs leading-relaxed text-blue-800">ใช้ข้อมูลนี้เพื่อดูจุดที่ยังขาดโควตา แล้วไปตรวจสอบใบสมัครหรือบันทึกผลคัดเลือกต่อในหน้าที่เกี่ยวข้อง</p>
          <div className="mt-5 space-y-2">
            <Link href="/staff/applications" className="block rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-blue-900 hover:bg-blue-50">ตรวจสอบใบสมัคร</Link>
            <Link href="/staff/selection" className="block rounded-lg bg-blue-900 px-3 py-2.5 text-center text-xs font-semibold text-white hover:bg-blue-800">บันทึกผลคัดเลือก</Link>
          </div>
        </section>
      </div>
    </div>
  );
}