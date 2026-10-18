"use client";

import { useEffect, useState } from "react";
import { errorMessage, requestJson } from "@/lib/phase4-client";
import type { PerformanceInsightsResponse } from "@/lib/performance-service";
import AthleteExcellenceCard from "@/components/shared/AthleteExcellenceCard";
import MatchResultModal from "@/components/shared/MatchResultModal";
import PrePostComparisonDashboard from "@/components/shared/PrePostComparisonDashboard";
import ActionPlanModal from "@/components/shared/ActionPlanModal";
import BenchmarkModal from "@/components/shared/BenchmarkModal";
import ProgramAnalyticsPanel from "@/components/shared/ProgramAnalyticsPanel";

export default function StaffExcellenceTab() {
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const [showDemo, setShowDemo] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return p.get("demo") === "true" || p.get("demo") === "1";
    }
    return false;
  });
  const [data, setData] = useState<PerformanceInsightsResponse | null>(null);
  const [selected, setSelected] = useState<PerformanceInsightsResponse["athletes"][number] | null>(null);
  const [developmentAthlete, setDevelopmentAthlete] = useState<PerformanceInsightsResponse["athletes"][number] | null>(null);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [resultKey, setResultKey] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "program" | "matrix" | "cards">("all");
  const requestKey = `${sport}|${search}|${showDemo}|${revision}`;



  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ includeDemo: String(showDemo) });
    if (sport) params.set("sport", sport);
    if (search) params.set("search", search);
    requestJson<PerformanceInsightsResponse>(`/api/staff/performance-insights?${params}`, undefined, "GET")
      .then(result => { if (active) { setData(result); setResultKey(requestKey); setError(""); } })
      .catch(reason => { if (active) { setError(errorMessage(reason)); setResultKey(requestKey); } })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [requestKey, revision, search, showDemo, sport]);

  const athletes = data?.athletes ?? [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
              Performance Intelligence & Excellence Analytics
            </p>
            <h2 className="mt-2 text-2xl font-bold">แดชบอร์ดวิเคราะห์สู่ความเป็นเลิศ</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-100">
              เปรียบเทียบความเชื่อมโยงระดับบุคคล ระหว่าง <strong>สมรรถภาพทางกายก่อนแข่งตามชนิดกีฬา (Pre-Competition)</strong> กับ <strong>ผลงานและสถิติเวลาจริง (Post-Competition)</strong> นำร่องใน 2 กีฬาเชิงเวลา: <strong>กรีฑา (วิ่ง 40m)</strong> และ <strong>ว่ายน้ำ/กีฬาทางน้ำ (ฟรีสไตล์ 50m)</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!showDemo && (
              <button
                type="button"
                onClick={() => setShowBenchmarks(true)}
                className="rounded-lg border border-amber-300/60 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-300/20"
              >
                ⚙️ ตั้งค่า Benchmark
              </button>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15 transition-colors">
              <input
                type="checkbox"
                checked={showDemo}
                onChange={e => setShowDemo(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>เข้าสู่โหมดสาธิต (Demo กรีฑา & ว่ายน้ำ)</span>
            </label>
          </div>
        </div>
      </section>

      {data?.isDemoData && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">Graduation Project Demo</p>
              <h3 className="mt-1 text-base font-bold">เส้นทางสาธิตจากข้อมูลก่อนแข่งสู่แผนพัฒนา</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-amber-900">
                ข้อมูลทั้งหมดในโหมดนี้เป็นข้อมูลจำลองของ 2 ชนิดกีฬานำร่อง: <strong>กรีฑา (วิ่ง 40m)</strong> และ <strong>กีฬาทางน้ำ (ฟรีสไตล์ 50m)</strong> รวม 5 กรณีพร้อม Closed-Loop Retest เพื่อสาธิตกระบวนการของระบบ
              </p>
            </div>
            <span className="w-fit rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold text-amber-800">
              DEMO DATA ONLY
            </span>
          </div>
          <ol className="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-5">
            {[
              "1. อ่าน Baseline สมรรถภาพก่อนแข่งตามชนิดกีฬา",
              "2. เทียบเวลาการแข่งขันกับ Benchmark ของแต่ละกีฬา (กรีฑา 5.2s / ว่ายน้ำ 27.5s)",
              "3. ตรวจจุดแข็งและจุดที่ควรติดตาม",
              "4. นำข้อเสนอแนะไปวางแผนฝึก",
              "5. ทดสอบซ้ำและเปรียบเทียบก่อน-หลัง",
            ].map(step => (
              <li key={step} className="rounded-xl border border-amber-200 bg-white/80 px-3 py-2 font-medium">
                {step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </p>
      )}

      {/* KPI สรุปผู้บริหาร 3 ด้าน */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="อัตราความพร้อมทางกายภาพก่อนแข่ง"
          sublabel="Average Pre-Fitness Readiness"
          value={`${data?.kpi.averageFitnessReadiness ?? 0}%`}
          tone="blue"
        />
        <KpiCard
          label="อัตราความสำเร็จในการแข่งขัน"
          sublabel="Podium / Win Success Rate"
          value={`${data?.kpi.successRate ?? 0}%`}
          tone="emerald"
        />
        <KpiCard
          label="ต้องพัฒนาเร่งด่วน (Bottleneck)"
          sublabel="Urgent Action Required"
          value={`${data?.kpi.urgentActionRequired ?? 0} คน`}
          tone="rose"
        />
      </div>

      {/* แถบตัวกรองและเลือกโหมดการแสดงผล */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1 text-xs font-semibold text-slate-700">
            ค้นหานักกีฬา
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ รหัสนิสิต คณะ หรือชนิดกีฬา"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="w-full text-xs font-semibold text-slate-700 md:w-56">
            ชนิดกีฬา
            <select
              value={sport}
              onChange={e => setSport(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">ทุกชนิดกีฬา (2 กีฬานำร่อง)</option>
              {(data?.sports ?? []).map(item => (
                <option key={item} value={item}>
                  {item === "กรีฑา" ? "กรีฑา (วิ่ง 40m)" : item === "กีฬาทางน้ำ" ? "กีฬาทางน้ำ / ว่ายน้ำ (ฟรีสไตล์ 50m)" : item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                viewMode === "all" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setViewMode("program")}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                viewMode === "program" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ภาพรวมโปรแกรม
            </button>
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                viewMode === "matrix" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ตารางเปรียบเทียบ
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                viewMode === "cards" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              การ์ดรายคน
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevision(value => value + 1)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            โหลดใหม่
          </button>
        </div>
      </section>

      {/* พื้นที่แสดงผลข้อมูล */}
      {busy || resultKey !== requestKey ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          กำลังโหลดข้อมูลวิเคราะห์สู่ความเป็นเลิศ...
        </p>
      ) : athletes.length ? (
        <div className="space-y-6">
          {/* ส่วนที่ 0: วิเคราะห์ระดับโปรแกรม (% ถึงเป้า, Gap ก่อน/หลังแผน, สถานีกับเวลา) */}
          {(viewMode === "all" || viewMode === "program") && data && (
            <ProgramAnalyticsPanel program={data.program} isDemo={data.isDemoData} />
          )}

          {/* ส่วนที่ 1: แดชบอร์ดเปรียบเทียบภาพรวมก่อน-หลังแข่ง (Pre vs Post Matrix) */}
          {(viewMode === "all" || viewMode === "matrix") && (
            <PrePostComparisonDashboard
              athletes={athletes}
              onSelectAthlete={athlete => setSelected(athlete)}
            />
          )}

          {/* ส่วนที่ 2: การ์ดแสดงผลรายบุคคลแบบเจาะลึกตามชนิดกีฬา */}
          {(viewMode === "all" || viewMode === "cards") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  รายละเอียดสมรรถภาพตามชนิดกีฬาและผลแข่งรายบุคคล ({athletes.length} คน)
                </h3>
              </div>
              {athletes.map(athlete => (
                <AthleteExcellenceCard
                  key={athlete.applicationId}
                  athlete={athlete}
                  onRecordResult={() => setSelected(athlete)}
                  onOpenDevelopment={() => setDevelopmentAthlete(athlete)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State ที่มีปุ่มเปิดชุดข้อมูลตัวอย่างชัดเจน */
        <div className="rounded-2xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 font-bold text-2xl shadow-inner">
            📊
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            ยังไม่มีข้อมูลผลการแข่งขันจริงที่บันทึกในระบบ
          </h3>
          <p className="mt-2 text-xs text-slate-600 max-w-lg mx-auto leading-5">
            เนื่องจากยังไม่มีการแข่งขันจริงที่บันทึกผลเข้าระบบ คุณสามารถเปิด <strong>ชุดข้อมูลสาธิตของกรีฑาและว่ายน้ำ</strong> เพื่อดูเส้นทางตั้งแต่ Baseline ก่อนแข่ง การเทียบ Benchmark ของแต่ละกีฬา ไปจนถึงการทดสอบซ้ำและวิเคราะห์คอขวดสมรรถภาพได้ทันที
          </p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-800 transition-colors"
            >
              <span>⚡ เปิดแดชบอร์ดสาธิต (กรีฑา & ว่ายน้ำ)</span>
            </button>
          </div>
        </div>
      )}

      {selected && (
        <MatchResultModal
          athlete={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            setRevision(value => value + 1);
          }}
        />
      )}

      {developmentAthlete && (
        <ActionPlanModal
          athlete={developmentAthlete}
          onClose={() => setDevelopmentAthlete(null)}
          onSaved={() => {
            setDevelopmentAthlete(null);
            setRevision(value => value + 1);
          }}
        />
      )}

      {showBenchmarks && data && (
        <BenchmarkModal
          benchmarks={data.benchmarks}
          availableSports={data.sports}
          onClose={() => setShowBenchmarks(false)}
          onSaved={() => {
            setShowBenchmarks(false);
            setRevision(value => value + 1);
          }}
        />
      )}
    </div>
  );
}

function KpiCard({
  label,
  sublabel,
  value,
  tone,
}: {
  label: string;
  sublabel?: string;
  value: string;
  tone: "blue" | "emerald" | "rose";
}) {
  const styles = {
    blue: "border-blue-200 bg-blue-50/70 text-blue-900",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
    rose: "border-rose-200 bg-rose-50/70 text-rose-900",
  }[tone];

  return (
    <div className={`rounded-2xl border p-5 shadow-xs ${styles}`}>
      <p className="text-xs font-bold text-slate-800">{label}</p>
      {sublabel && <p className="text-[10px] text-slate-500 font-medium">{sublabel}</p>}
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

