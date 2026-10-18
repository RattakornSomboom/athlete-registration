"use client";

import type {
  AttainmentSet,
  Ratio,
  SportProgramAnalytics,
  StationCorrelation,
  TimePrePost,
} from "@/lib/performance-program-analytics";
import type { PerformanceInsightsResponse } from "@/lib/performance-service";

const SPORT_LABEL: Record<string, string> = {
  "กรีฑา": "กรีฑา (วิ่ง 40m)",
  "กีฬาทางน้ำ": "กีฬาทางน้ำ / ว่ายน้ำ (ฟรีสไตล์ 50m)",
};

function pctText(value: Ratio): string {
  return value.pct === null ? "—" : `${value.pct}%`;
}

function signed(value: number | null, digits: number, unit = ""): string {
  if (value === null) return "—";
  const text = value.toFixed(digits);
  return `${value > 0 ? "+" : ""}${text}${unit}`;
}

export default function ProgramAnalyticsPanel({
  program,
  isDemo,
}: {
  program: PerformanceInsightsResponse["program"];
  isDemo: boolean;
}) {
  if (!program.sports.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ระดับโปรแกรม
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-label="ภาพรวมโปรแกรม">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-900">
          Program-level Analytics
        </span>
        <h3 className="mt-1 text-base font-bold text-slate-900">ภาพรวมโปรแกรม: ถึงเป้าแค่ไหน แผนฝึกลด Gap ได้หรือไม่ สถานีไหนสัมพันธ์กับเวลา</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          ตัวเลขแยกตามชนิดกีฬา เพราะเวลา 40 เมตรกับ 50 เมตรนำมารวมกันไม่ได้ ทุกค่าแสดงจำนวนคนที่ใช้คำนวณ (n/N) กำกับ
          และเป็นการสังเกตแนวโน้มเท่านั้น ไม่ได้พิสูจน์ว่าแผนฝึกเป็นสาเหตุของการเปลี่ยนแปลง
        </p>
        {isDemo && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
            DEMO DATA ONLY: ส่วนนี้ใช้นักกีฬาจำลองกีฬาละ 12 คนที่สร้างแบบกำหนดค่าตายตัว ความสัมพันธ์ที่เห็นถูกกำหนดขึ้นเองเพื่อสาธิต ไม่ใช่ผลวิจัยจริง
          </p>
        )}
      </div>

      {program.sports.map(sport => (
        <SportBlock key={sport.sport} sport={sport} minSample={program.minCorrelationSample} />
      ))}
    </section>
  );
}

function SportBlock({ sport, minSample }: { sport: SportProgramAnalytics; minSample: number }) {
  const { coverage, benchmark, baseline, followUp } = sport;
  const steps = [
    { label: "นักกีฬาทั้งหมด", value: coverage.total },
    { label: "มีผลสมรรถภาพ", value: coverage.withFitness },
    { label: "มีเวลาแข่ง", value: coverage.withTime },
    { label: "มีแผนพัฒนา", value: coverage.withActionPlan },
    { label: "ทดสอบซ้ำแล้ว", value: coverage.withFollowUp },
  ];

  return (
    <article className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <h4 className="text-sm font-bold text-slate-900">{SPORT_LABEL[sport.sport] ?? sport.sport}</h4>
        <p className="text-[11px] text-slate-500">
          เป้าหมาย: เวลา ≤ {benchmark.targetTimeSeconds} วินาที · คะแนนความพร้อม ≥ {benchmark.targetScore}
        </p>
      </header>

      {/* ความครบของข้อมูล */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">ความครบของข้อมูล</p>
        <ol className="mt-2 grid gap-2 sm:grid-cols-5">
          {steps.map(step => (
            <li key={step.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-medium text-slate-500">{step.label}</p>
              <p className="text-lg font-black text-slate-900">
                {step.value}
                <span className="text-xs font-semibold text-slate-400"> / {coverage.total}</span>
              </p>
              <div className="mt-1 h-1.5 rounded-full bg-slate-200" aria-hidden="true">
                <div
                  className="h-1.5 rounded-full bg-indigo-500"
                  style={{ width: `${coverage.total ? (step.value / coverage.total) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* % ถึงเป้า */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">สัดส่วนที่ถึงเป้าหมาย</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="text-[11px] text-slate-500">
              <tr>
                <th className="py-1.5 pr-3 font-semibold">ตัวชี้วัด</th>
                <th className="py-1.5 pr-3 font-semibold">ช่วงแข่ง (ทุกคน)</th>
                <th className="py-1.5 pr-3 font-semibold">กลุ่มทดสอบซ้ำ: ก่อนแผน</th>
                <th className="py-1.5 pr-3 font-semibold">กลุ่มทดสอบซ้ำ: หลังแผน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AttainmentRow label="ทำเวลาได้ถึงเป้า" pick="time" baseline={baseline} before={followUp.before} after={followUp.after} />
              <AttainmentRow label="สมรรถภาพถึงเป้า" pick="fitness" baseline={baseline} before={followUp.before} after={followUp.after} />
              <AttainmentRow label="ถึงเป้าทั้งสองด้าน" pick="both" baseline={baseline} before={followUp.before} after={followUp.after} />
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          กลุ่มทดสอบซ้ำเปรียบเทียบนักกีฬากลุ่มเดียวกันก่อน-หลัง ตัวหารจึงต่างจากคอลัมน์ช่วงแข่ง
        </p>
      </div>

      {/* Gap ก่อน/หลังแผน */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Gap เทียบเป้าหมาย ก่อน → หลังแผนพัฒนา</p>
        {followUp.time.n === 0 && followUp.fitness.n === 0 ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">ยังไม่มีนักกีฬาที่ทดสอบซ้ำหลังแผนพัฒนา</p>
        ) : (
          <div className="mt-2 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 text-xs">
              <SummaryLine
                label="Gap เวลา (ค่ากลาง)"
                value={`${signed(followUp.time.medianGapBefore, 2)} → ${signed(followUp.time.medianGapAfter, 2)} วินาที`}
                hint={`เปลี่ยน ${signed(followUp.time.medianDelta, 2)} วินาที (n=${followUp.time.n})`}
              />
              <SummaryLine
                label="คะแนนความพร้อม (ค่ากลาง)"
                value={`${followUp.fitness.medianBefore ?? "—"} → ${followUp.fitness.medianAfter ?? "—"}`}
                hint={`เปลี่ยน ${signed(followUp.fitness.medianDelta, 1)} คะแนน (n=${followUp.fitness.n})`}
              />
              <SummaryLine
                label="เวลาดีขึ้น / ไม่เปลี่ยนชัดเจน / แย่ลง"
                value={`${followUp.time.improved} / ${followUp.time.unchanged} / ${followUp.time.worsened} คน`}
                hint="นับเฉพาะที่เปลี่ยนเกินช่วงคลาดเคลื่อน (SWC) เกณฑ์เดียวกับการ์ดรายคน"
              />
              <SummaryLine
                label="ปิด Gap เวลาได้"
                value={`${followUp.time.gapClosed.closed} จาก ${followUp.time.gapClosed.hadGap} คนที่เดิมช้ากว่าเป้า`}
              />
              <p className="text-[11px] text-slate-500">ใช้ค่ากลาง (median) เพราะกลุ่มตัวอย่างเล็ก ค่าเฉลี่ยถูกค่าสุดโต่งดึงได้ง่าย</p>
            </div>
            <GapDumbbell time={followUp.time} />
          </div>
        )}
      </div>

      {/* ความสัมพันธ์รายสถานี */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">ความสัมพันธ์ของคะแนนสถานี กับเวลาแข่ง</p>
        <CorrelationTable correlations={sport.correlations} minSample={minSample} />
      </div>
    </article>
  );
}

function AttainmentRow({
  label,
  pick,
  baseline,
  before,
  after,
}: {
  label: string;
  pick: keyof AttainmentSet;
  baseline: AttainmentSet;
  before: AttainmentSet;
  after: AttainmentSet;
}) {
  const cell = (value: Ratio) => (
    <td className="py-2 pr-3">
      <span className="font-bold text-slate-900">{pctText(value)}</span>
      <span className="ml-1 text-[11px] text-slate-500">({value.count}/{value.total})</span>
    </td>
  );
  return (
    <tr>
      <th scope="row" className="py-2 pr-3 font-semibold text-slate-700">{label}</th>
      {cell(baseline[pick])}
      {cell(before[pick])}
      {cell(after[pick])}
    </tr>
  );
}

function SummaryLine({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

const CHANGE_STROKES: Record<TimePrePost["points"][number]["change"], string> = {
  IMPROVED: "stroke-emerald-500",
  WITHIN_SWC: "stroke-slate-400",
  DECLINED: "stroke-rose-500",
};

function GapDumbbell({ time }: { time: TimePrePost }) {
  if (!time.points.length) {
    return <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">ไม่มีข้อมูลเวลาก่อน-หลังสำหรับวาดกราฟ</p>;
  }
  const points = [...time.points].sort((a, b) => b.gapBefore - a.gapBefore);
  const values = points.flatMap(p => [p.gapBefore, p.gapAfter, 0]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo || 1) * 0.1;
  const min = lo - pad;
  const max = hi + pad;
  const width = 360;
  const left = 36;
  const right = 12;
  const rowH = 22;
  const top = 18;
  const height = top + points.length * rowH + 22;
  const x = (value: number) => left + ((value - min) / (max - min)) * (width - left - right);
  const summary = `กราฟเทียบ Gap เวลาก่อนและหลังแผนของ ${points.length} คน เส้นประคือเวลาเท่าเป้าหมาย`;

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} className="w-full">
        <line x1={x(0)} x2={x(0)} y1={top - 6} y2={height - 20} stroke="currentColor" strokeDasharray="3 3" className="text-slate-400" />
        <text x={x(0)} y={10} textAnchor="middle" className="fill-slate-500 text-[9px]">เท่าเป้า</text>
        {points.map((p, i) => {
          const y = top + i * rowH + rowH / 2;
          return (
            <g key={p.applicationId}>
              <text x={left - 6} y={y + 3} textAnchor="end" className="fill-slate-500 text-[9px]">{i + 1}</text>
              <line
                x1={x(p.gapBefore)}
                x2={x(p.gapAfter)}
                y1={y}
                y2={y}
                strokeWidth={2}
                className={CHANGE_STROKES[p.change]}
              />
              <circle cx={x(p.gapBefore)} cy={y} r={4} className="fill-white stroke-slate-500" strokeWidth={1.5}>
                <title>{`คนที่ ${i + 1} ก่อนแผน ${signed(p.gapBefore, 2)} วินาที`}</title>
              </circle>
              <circle cx={x(p.gapAfter)} cy={y} r={4} className="fill-indigo-600">
                <title>{`คนที่ ${i + 1} หลังแผน ${signed(p.gapAfter, 2)} วินาที`}</title>
              </circle>
            </g>
          );
        })}
        <text x={left} y={height - 6} className="fill-slate-500 text-[9px]">← เร็วกว่าเป้า</text>
        <text x={width - right} y={height - 6} textAnchor="end" className="fill-slate-500 text-[9px]">ช้ากว่าเป้า →</text>
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border-2 border-slate-500 bg-white" />ก่อนแผน</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />หลังแผน</span>
        <span className="inline-flex items-center gap-1"><span className="h-0.5 w-3 bg-emerald-500" />ดีขึ้น</span>
        <span className="inline-flex items-center gap-1"><span className="h-0.5 w-3 bg-slate-400" />ไม่เปลี่ยนชัดเจน</span>
        <span className="inline-flex items-center gap-1"><span className="h-0.5 w-3 bg-rose-500" />แย่ลง</span>
        <span>เรียงตาม Gap ก่อนแผนมากไปน้อย</span>
      </figcaption>
    </figure>
  );
}

function CorrelationTable({ correlations, minSample }: { correlations: StationCorrelation[]; minSample: number }) {
  if (!correlations.length) {
    return <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">ยังไม่มีคะแนนสถานีสำหรับวิเคราะห์</p>;
  }
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="text-[11px] text-slate-500">
          <tr>
            <th className="py-1.5 pr-3 font-semibold">สถานี</th>
            <th className="py-1.5 pr-3 font-semibold">n</th>
            <th className="py-1.5 pr-3 font-semibold">คะแนนสูง ↔ เวลาเร็วขึ้น</th>
            <th className="py-1.5 pr-3 font-semibold">ระดับ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {correlations.map(item => (
            <tr key={item.station}>
              <th scope="row" className="py-2 pr-3 font-semibold text-slate-700">{item.station}</th>
              <td className="py-2 pr-3 text-slate-600">{item.n}</td>
              {item.status === "OK" && item.alignment !== null ? (
                <>
                  <td className="py-2 pr-3">
                    <AlignmentBar value={item.alignment} />
                  </td>
                  <td className="py-2 pr-3 font-semibold text-slate-700">{item.strength}</td>
                </>
              ) : (
                <td colSpan={2} className="py-2 pr-3 text-slate-500">
                  {item.status === "INSUFFICIENT_N" && `ข้อมูลไม่พอ (ต้องมีอย่างน้อย ${minSample} คน)`}
                  {item.status === "NO_VARIATION" && "คะแนนไม่แปรผัน จึงคำนวณไม่ได้"}
                  {item.status === "RACE_PROXY" && "วัดสิ่งเดียวกับรายการแข่ง ความสอดคล้องสูงโดยอัตโนมัติ จึงไม่นำมาจัดอันดับ"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        ใช้สหสัมพันธ์แบบ Spearman ρ จากผลทดสอบก่อนแข่งคนละ 1 จุด (ระดับ: &lt;0.3 อ่อน · 0.3–0.49 ปานกลาง · ≥0.5 ชัด) ใช้ดูว่าควรให้น้ำหนักสถานีใดเมื่อวางแผนฝึก
        ไม่ได้บอกว่าสถานีนั้นเป็นสาเหตุของเวลา และไม่แสดงนัยสำคัญทางสถิติ
      </p>
    </div>
  );
}

function AlignmentBar({ value }: { value: number }) {
  const widthPct = Math.min(Math.abs(value), 1) * 50;
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2.5 w-32 rounded-full bg-slate-100" role="img" aria-label={`ค่า ${value.toFixed(2)}`}>
        <span className="absolute left-1/2 top-0 h-2.5 w-px bg-slate-400" />
        <span
          className={`absolute top-0 h-2.5 rounded-full ${positive ? "bg-emerald-500" : "bg-rose-500"}`}
          style={positive ? { left: "50%", width: `${widthPct}%` } : { right: "50%", width: `${widthPct}%` }}
        />
      </div>
      <span className="w-12 font-bold tabular-nums text-slate-900">{value > 0 ? "+" : ""}{value.toFixed(2)}</span>
    </div>
  );
}
