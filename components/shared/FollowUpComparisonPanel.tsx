"use client";

import type { AthleteExcellenceItem } from "@/lib/performance-service";

type FollowUp = NonNullable<AthleteExcellenceItem["followUp"]>;

const STATUS_STYLES: Record<FollowUp["comparison"]["status"], { label: string; className: string }> = {
  IMPROVED: { label: "ดีขึ้น", className: "bg-emerald-100 text-emerald-800" },
  NO_CHANGE: { label: "ยังไม่เปลี่ยนชัดเจน", className: "bg-slate-100 text-slate-700" },
  DECLINED: { label: "ลดลง", className: "bg-rose-100 text-rose-800" },
};

type MetricChange = FollowUp["comparison"]["timeChange"];

const CHANGE_STYLES: Record<NonNullable<MetricChange>, string> = {
  IMPROVED: "text-emerald-700",
  WITHIN_SWC: "text-slate-500",
  DECLINED: "text-rose-700",
};

function formatSigned(value: number | null, unit: string): string {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${value}${unit}`;
}

function ChangeLine({ delta, change, swc, unit }: { delta: number | null; change: MetricChange; swc: number | null; unit: string }) {
  return (
    <p className={`text-[11px] font-semibold ${change ? CHANGE_STYLES[change] : "text-slate-500"}`}>
      เปลี่ยนแปลง {formatSigned(delta, unit)}
      {change === "WITHIN_SWC" && swc !== null && (
        <span className="font-normal"> (อยู่ในช่วงคลาดเคลื่อน ±{swc}{unit})</span>
      )}
    </p>
  );
}

export default function FollowUpComparisonPanel({ followUp, sport }: { followUp: FollowUp; sport: string }) {
  const { retest, comparison } = followUp;
  const eventLabel = sport === "กีฬาทางน้ำ" || sport === "ว่ายน้ำ" ? "เวลาว่ายน้ำ 50 เมตร" : "เวลาวิ่ง 40 เมตร";
  const status = STATUS_STYLES[comparison.status];
  const changedStations = comparison.stationChanges.filter(change => change.delta !== 0);

  return (
    <section className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Closed Loop · Follow-up Retest</p>
          <h4 className="mt-1 text-sm font-bold text-slate-900">
            ผลทดสอบซ้ำหลังฝึก {retest.weeksAfterBaseline} สัปดาห์
          </h4>
          <p className="mt-1 text-[11px] text-slate-500">
            {retest.recordedBy ? "บันทึกผลจริงในระบบ (Closed-Loop)" : "ข้อมูลจำลองเพื่อสาธิตการติดตามผล ไม่ใช่ผลการฝึกจริง"}
          </p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-bold text-slate-700">1. แผนฝึกที่โค้ชกำหนด</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-600">
            {retest.trainingPlan.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-bold text-slate-700">2. {eventLabel}</p>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {comparison.timeBefore ?? "-"}s → {comparison.timeAfter ?? "-"}s
          </p>
          <ChangeLine delta={comparison.timeDeltaSeconds} change={comparison.timeChange} swc={comparison.swc.timeSeconds} unit="s" />
          <p className="mt-1 text-[11px] text-slate-500">
            {comparison.remainingGapSeconds === null
              ? "ข้อมูลไม่เพียงพอสำหรับเทียบเป้าหมาย"
              : comparison.remainingGapSeconds > 0
                ? `ยังช้ากว่าเป้าหมาย +${comparison.remainingGapSeconds}s`
                : "ถึงเวลาเป้าหมายแล้ว"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-bold text-slate-700">3. ความพร้อมด้านสมรรถภาพ</p>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {comparison.fitnessAverageBefore ?? "-"}% → {comparison.fitnessAverageAfter ?? "-"}%
          </p>
          <ChangeLine delta={comparison.fitnessDelta} change={comparison.fitnessChange} swc={comparison.swc.fitnessPoints} unit=" คะแนน" />
        </div>
      </div>

      {retest.notes && (
        <p className="mt-3 rounded-lg bg-emerald-100/60 p-2 text-[11px] text-emerald-900">
          <span className="font-semibold">บันทึกผลทดสอบ:</span> {retest.notes}
        </p>
      )}

      {changedStations.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[420px] text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-2">สถานี</th>
                <th className="p-2">ก่อนฝึก</th>
                <th className="p-2">หลังฝึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {changedStations.map(change => (
                <tr key={change.name}>
                  <td className="p-2 text-slate-700">{change.name}</td>
                  <td className="p-2 text-slate-500">{change.beforeRating} ({change.beforeScore})</td>
                  <td className="p-2 font-semibold text-emerald-700">{change.afterRating} ({change.afterScore})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-5 text-slate-600">
        <span className="font-semibold text-slate-800">สรุป:</span> {comparison.summary}
        {comparison.remainingGapSeconds !== null && comparison.remainingGapSeconds > 0
          ? " แต่ยังไม่ถึงเป้าหมาย ควรติดตามต่อในรอบถัดไป"
          : ""}
        {" "}การเปลี่ยนแปลงนี้แสดงพัฒนาการที่ติดตามได้ แต่ไม่ได้พิสูจน์ว่าเกิดจากแผนฝึกเพียงอย่างเดียว
      </p>
    </section>
  );
}
