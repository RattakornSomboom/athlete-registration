"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MetricChange, StationChange, TargetStatus } from "@/lib/excellence-athletics";

// โหมดสาธิตอ่านจาก ?demo=true ใน URL ready = อ่าน URL เสร็จแล้ว (กันการโหลดข้อมูลซ้ำสองรอบ)
export function useDemoMode(): { demo: boolean; ready: boolean; setDemo: (value: boolean) => void } {
  const [demo, setDemoState] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setDemoState(new URLSearchParams(window.location.search).get("demo") === "true");
      setReady(true);
    });
    return () => { active = false; };
  }, []);
  const setDemo = useCallback((value: boolean) => {
    setDemoState(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("demo", "true");
    else url.searchParams.delete("demo");
    window.history.replaceState({}, "", url.toString());
  }, []);
  return { demo, ready, setDemo };
}

export function demoQuery(demo: boolean): string {
  return demo ? "?demo=true" : "";
}

const NAV: [href: string, label: string][] = [
  ["/staff/excellence", "ภาพรวมนักกีฬา"],
  ["/staff/excellence/benchmarks", "เป้าเวลา (Benchmark)"],
];

export function ExcellenceNav({ demo, onDemoChange }: { demo: boolean; onDemoChange?: (value: boolean) => void }) {
  const path = usePathname();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="เมนูสู่ความเป็นเลิศ" className="flex flex-wrap gap-2">
        {NAV.map(([href, label]) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href + demoQuery(demo)}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${active ? "bg-blue-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {onDemoChange && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={demo} onChange={event => onDemoChange(event.target.checked)} className="h-4 w-4 accent-amber-600" />
          แสดงข้อมูลสาธิต
        </label>
      )}
    </div>
  );
}

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <span className="font-semibold">ข้อมูลสาธิต:</span> นักกีฬาและผลทั้งหมดในโหมดนี้เป็นข้อมูลจำลองของกรีฑาประเภทลู่ ใช้สาธิตขั้นตอนของระบบเท่านั้น และบันทึกหรือแก้ไขไม่ได้
    </p>
  );
}

const TARGET_STYLES: Record<TargetStatus, { label: string; className: string }> = {
  AT_TARGET: { label: "ถึงเป้า", className: "bg-emerald-100 text-emerald-800" },
  BELOW_TARGET: { label: "ยังไม่ถึงเป้า", className: "bg-rose-100 text-rose-800" },
  NO_TARGET: { label: "ยังไม่ตั้งเป้า", className: "bg-slate-100 text-slate-600" },
  NO_RESULT: { label: "ยังไม่มีผลแข่ง", className: "bg-slate-100 text-slate-600" },
};

export function TargetBadge({ status }: { status: TargetStatus }) {
  const style = TARGET_STYLES[status];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>{style.label}</span>;
}

const CHANGE_STYLES: Record<StationChange["change"] | MetricChange, { label: string; className: string }> = {
  IMPROVED: { label: "ดีขึ้น", className: "text-emerald-700" },
  NO_CHANGE: { label: "เท่าเดิม", className: "text-slate-600" },
  WITHIN_SWC: { label: "ไม่เปลี่ยนชัดเจน", className: "text-slate-600" },
  DECLINED: { label: "ลดลง", className: "text-rose-700" },
  NOT_TESTED: { label: "ไม่มีผลให้เทียบ", className: "text-slate-400" },
};

export function ChangeLabel({ change }: { change: StationChange["change"] | MetricChange | null }) {
  if (!change) return <span className="text-slate-400">—</span>;
  const style = CHANGE_STYLES[change];
  return <span className={`font-semibold ${style.className}`}>{style.label}</span>;
}

export function Section({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{children}</p>;
}

export function formatThaiDate(date: string | null): string {
  if (!date) return "—";
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
