"use client";

import { ATTENTION_LABEL, type AttentionFlag, type ExecutiveReport } from "@/lib/excellence-athletics";

const pct = (part: number, whole: number): number | null => (whole > 0 ? Math.round((part / whole) * 100) : null);

function Kpi({ label, value, unit, caption }: { label: string; value: string; unit?: string; caption: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-950">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{caption}</p>
    </div>
  );
}

// ตัวชี้วัดหลักสำหรับผู้บริหาร: ทุกตัวบอกตัวหารเสมอ (เช่น "3 จาก 8 คน") ไม่แสดงเปอร์เซ็นต์ลอย ๆ
export function KpiStrip({ report }: { report: ExecutiveReport }) {
  const { kpi } = report;
  const reached = pct(kpi.atTarget, kpi.targetEligible);
  const planned = pct(kpi.withPlan, kpi.athletes);
  const improved = pct(kpi.improved, kpi.retested);
  return (
    <section aria-label="ตัวชี้วัดหลัก" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <Kpi label="นักกีฬาในรายงาน" value={String(kpi.athletes)} unit="คน" caption={`มีผลแข่งแล้ว ${kpi.withResult} คน`} />
      <Kpi
        label="ถึงเป้าหมาย"
        value={reached === null ? "—" : `${reached}%`}
        caption={kpi.targetEligible ? `${kpi.atTarget} จาก ${kpi.targetEligible} คนที่มีทั้งเป้าและผลแข่ง` : "ยังไม่มีเป้าหมายให้เทียบ"}
      />
      <Kpi
        label="มีแผนพัฒนา"
        value={planned === null ? "—" : `${planned}%`}
        caption={kpi.athletes ? `${kpi.withPlan} จาก ${kpi.athletes} คน` : "ยังไม่มีนักกีฬา"}
      />
      <Kpi
        label="ทดสอบซ้ำแล้ว"
        value={String(kpi.retested)}
        unit="คน"
        caption={kpi.withPlan ? `จาก ${kpi.withPlan} คนที่มีแผน` : "ยังไม่มีผู้มีแผน"}
      />
      <Kpi
        label="พัฒนาขึ้นหลังทดสอบซ้ำ"
        value={improved === null ? "—" : `${improved}%`}
        caption={kpi.retested ? `${kpi.improved} จาก ${kpi.retested} คนที่ทดสอบซ้ำ (เกินช่วงคลาดเคลื่อน)` : "ยังไม่มีผลทดสอบซ้ำ"}
      />
    </section>
  );
}

const ATTENTION_ORDER: AttentionFlag[] = ["WEAK_NO_PLAN", "PLAN_OVERDUE", "NO_TARGET", "NO_RESULT"];
const ATTENTION_UNIT: Record<AttentionFlag, string> = { NO_TARGET: "รายการ", NO_RESULT: "คน", WEAK_NO_PLAN: "คน", PLAN_OVERDUE: "คน" };

// สิ่งที่ต้องลงมือทำ: คลิกเพื่อกรองรายชื่อด้านล่าง คลิกซ้ำเพื่อยกเลิก
export function AttentionPanel({ report, active, onSelect }: { report: ExecutiveReport; active: AttentionFlag | null; onSelect: (flag: AttentionFlag | null) => void }) {
  return (
    <section aria-labelledby="attention-title" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="attention-title" className="text-lg font-semibold text-slate-950">ต้องติดตาม</h2>
      <p className="mt-1 text-sm text-slate-600">เลือกหัวข้อเพื่อดูรายชื่อที่เกี่ยวข้อง</p>
      <ul className="mt-4 space-y-2">
        {ATTENTION_ORDER.map(flag => {
          const count = report.attention[flag];
          const selected = active === flag;
          return (
            <li key={flag}>
              <button
                type="button"
                disabled={count === 0 && !selected}
                aria-pressed={selected}
                onClick={() => onSelect(selected ? null : flag)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 ${
                  selected ? "border-blue-900 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-400 disabled:hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">{ATTENTION_LABEL[flag]}</span>
                <span className={`whitespace-nowrap font-mono tabular-nums ${count > 0 ? "font-bold text-slate-950" : ""}`}>
                  {count === 0 ? "ไม่มี" : `${count} ${ATTENTION_UNIT[flag]}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ถึงเป้าแยกตามรายการ: แท่งซ้อนมีตัวเลขกำกับ ไม่ใช้สีอย่างเดียว
export function EventAttainmentChart({ byEvent }: { byEvent: ExecutiveReport["byEvent"] }) {
  return (
    <section aria-labelledby="event-chart-title" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="event-chart-title" className="text-lg font-semibold text-slate-950">ถึงเป้าหมายแยกตามรายการ</h2>
      <p className="mt-1 text-sm text-slate-600">จำนวนนักกีฬา × รายการ ที่ถึงเป้า / ยังไม่ถึงเป้า / ยังไม่ตั้งเป้า</p>
      {byEvent.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">ยังไม่มีผลแข่งให้สรุป</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {byEvent.map(item => (
            <li key={item.event}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-slate-800">{item.label}</span>
                <span className="font-mono text-xs tabular-nums text-slate-600">
                  ถึง {item.atTarget} · ไม่ถึง {item.belowTarget} · ไม่มีเป้า {item.noTarget}
                </span>
              </div>
              <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${item.label}: ถึงเป้า ${item.atTarget} ยังไม่ถึงเป้า ${item.belowTarget} ยังไม่ตั้งเป้า ${item.noTarget} จากทั้งหมด ${item.athletes}`}>
                <span className="bg-emerald-600" style={{ width: `${(item.atTarget / item.athletes) * 100}%` }} />
                <span className="bg-rose-400" style={{ width: `${(item.belowTarget / item.athletes) * 100}%` }} />
                <span className="bg-slate-300" style={{ width: `${(item.noTarget / item.athletes) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-600 align-middle" />ถึงเป้า</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-rose-400 align-middle" />ยังไม่ถึงเป้า</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-300 align-middle" />ยังไม่ตั้งเป้า</span>
      </p>
    </section>
  );
}

// จุดอ่อนที่พบบ่อยของทีม: ห้าสถานีที่มีคนอ่อนมากที่สุด (นับเฉพาะคนที่ทดสอบสถานีนั้น)
export function WeakStationsChart({ stations }: { stations: ExecutiveReport["weakStations"] }) {
  return (
    <section aria-labelledby="weak-chart-title" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="weak-chart-title" className="text-lg font-semibold text-slate-950">จุดอ่อนที่พบบ่อยของทีม</h2>
      <p className="mt-1 text-sm text-slate-600">สถานีที่มีนักกีฬาระดับต่ำหรือต่ำมากมากที่สุด (นับจากคนที่ทดสอบสถานีนั้น)</p>
      {stations.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">ยังไม่พบจุดอ่อนในกลุ่มที่เลือก</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {stations.map(station => (
            <li key={station.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-slate-800">{station.name}</span>
                <span className="font-mono text-xs tabular-nums text-slate-600">{station.weak} จาก {station.tested} คน</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${station.name}: จุดอ่อน ${station.weak} จาก ${station.tested} คน`}>
                <span className="block h-full bg-rose-400" style={{ width: `${(station.weak / station.tested) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="กำลังโหลดรายงาน">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 rounded-xl bg-slate-200" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-slate-200" />
        <div className="h-64 rounded-xl bg-slate-200 lg:col-span-2" />
      </div>
      <div className="h-80 rounded-xl bg-slate-200" />
    </div>
  );
}
