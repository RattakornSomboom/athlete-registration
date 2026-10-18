"use client";

import { useState } from "react";
import type { AthleteExcellenceItem } from "@/lib/performance-service";
import PerformanceQuadrantChart from "./PerformanceQuadrantChart";

export default function PrePostComparisonDashboard({
  athletes,
  onSelectAthlete,
}: {
  athletes: AthleteExcellenceItem[];
  onSelectAthlete?: (athlete: AthleteExcellenceItem) => void;
}) {
  const [subView, setSubView] = useState<"both" | "matrix" | "quadrant">("both");

  if (!athletes.length) return null;

  // คำนวณค่าสถิติเปรียบเทียบก่อน vs หลังแข่ง
  const total = athletes.length;
  const passedPreThreshold = athletes.filter(a => (a.analysis.fitnessAverage ?? 0) >= 80).length;
  const passedPrePct = Math.round((passedPreThreshold / total) * 100);

  const podiumCount = athletes.filter(a => {
    const r = a.matchResult;
    return Boolean(r && (r.isWinner || r.rank === 1 || r.outcome === "WIN" || r.outcome === "PODIUM"));
  }).length;
  const podiumPct = Math.round((podiumCount / total) * 100);

  // คำนวณ Time Gap เฉลี่ยของคนที่มีเวลา
  const timeGaps = athletes
    .map(a => a.analysis.gaps.timeGapSeconds)
    .filter((g): g is number => g !== null && g !== undefined);
  const avgTimeGap = timeGaps.length
    ? Math.round((timeGaps.reduce((s, g) => s + g, 0) / timeGaps.length) * 100) / 100
    : null;

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:border-none print:shadow-none print:p-0">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-900">
            แดชบอร์ดเปรียบเทียบ & กราฟ 4 จตุภาค
          </span>
          <h3 className="mt-1 text-base font-bold text-slate-900">
            แดชบอร์ดเปรียบเทียบ: สมรรถภาพก่อนแข่งขัน vs ผลการแข่งขันจริง
          </h3>
          <p className="text-xs text-slate-500">
            วิเคราะห์ความเชื่อมโยงระดับบุคคล ระหว่างความพร้อมทางกายภาพตามชนิดกีฬากับอันดับและเวลาการแข่งขันจริง
          </p>
        </div>

        {/* ปุ่มควบคุมและส่งออก */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 print:hidden">
            <button
              type="button"
              onClick={() => setSubView("both")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                subView === "both" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              แสดงทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setSubView("quadrant")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                subView === "quadrant" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              กราฟ 4 จตุภาค
            </button>
            <button
              type="button"
              onClick={() => setSubView("matrix")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                subView === "matrix" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ตารางคู่ขนาน
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs print:hidden"
            title="พิมพ์หรือส่งออก PDF สำหรับผู้ฝึกสอน"
          >
            <span>🖨️ พิมพ์รายงานโค้ช (Print)</span>
          </button>
        </div>
      </div>

      {/* บล็อกสรุปไฮไลต์ 3 มิติ */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-50/60 to-white p-3.5">
          <p className="text-[11px] font-bold text-blue-900">1. มิติก่อนแข่งขัน (Pre-Competition)</p>
          <p className="mt-1 text-xs text-slate-600">
            นักกีฬาผ่านเกณฑ์ 80% จำนวน <span className="font-bold text-blue-950">{passedPreThreshold}/{total} คน</span>
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${passedPrePct}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/60 to-white p-3.5">
          <p className="text-[11px] font-bold text-indigo-900">2. มิติหลังแข่งขัน (Post-Competition)</p>
          <p className="mt-1 text-xs text-slate-600">
            คว้าชัย/ขึ้นโพเดียม <span className="font-bold text-indigo-950">{podiumCount}/{total} คน ({podiumPct}%)</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {avgTimeGap !== null ? (
              <span>ค่าเฉลี่ย Gap เวลา: <strong className={avgTimeGap > 0 ? "text-rose-600" : "text-emerald-600"}>{avgTimeGap > 0 ? `+${avgTimeGap}s ช้ากว่าเป้า` : `${avgTimeGap}s ตามเป้า`}</strong></span>
            ) : (
              "ไม่มีข้อมูลเวลาแข่งขัน"
            )}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 to-white p-3.5">
          <p className="text-[11px] font-bold text-amber-900">3. ข้อค้นพบความเชื่อมโยง (Correlation)</p>
          <p className="mt-1 text-xs leading-5 text-amber-950">
            ข้อมูลชุดนี้แสดงแนวโน้มเบื้องต้นว่า Bottleneck ด้านความเร็วหรือแรงระเบิดอาจพบร่วมกับเวลาที่ช้ากว่าเป้าหมาย จึงควรใช้เป็นประเด็นติดตามร่วมกับการประเมินของโค้ช
          </p>
        </div>
      </div>

      {/* กราฟ 4 จตุภาค (Scatter Plot) */}
      {(subView === "both" || subView === "quadrant") && (
        <PerformanceQuadrantChart
          athletes={athletes}
          onSelectAthlete={onSelectAthlete}
        />
      )}

      {/* ตารางเปรียบเทียบ Pre vs Post แบบ Side-by-Side */}
      {(subView === "both" || subView === "matrix") && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <th className="p-3">นักกีฬา</th>
                <th className="bg-blue-50/80 p-3 text-blue-950">ก่อนแข่ง: สมรรถภาพตามชนิดกีฬา</th>
                <th className="bg-blue-50/80 p-3 text-blue-950">Gap เทียบเกณฑ์ (80)</th>
                <th className="bg-indigo-50/80 p-3 text-indigo-950">หลังแข่ง: ผลการแข่งขัน</th>
                <th className="bg-indigo-50/80 p-3 text-indigo-950">เวลาจริง vs เวลาเป้าหมาย</th>
                <th className="bg-slate-100 p-3 text-slate-900">ดัชนี (PI) / แผนพัฒนา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {athletes.map(a => {
                const fitnessAvg = a.analysis.fitnessAverage;
                const fitGap = a.analysis.gaps.fitnessScoreGap;
                const match = a.matchResult;
                const timeGap = a.analysis.gaps.timeGapSeconds;

                return (
                  <tr key={a.applicationId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{a.athleteName}</div>
                      <div className="text-[11px] text-slate-500">{a.studentId} · {a.sport}</div>
                      {a.isDemo && (
                        <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-semibold text-amber-800">
                          ข้อมูลสาธิต
                        </span>
                      )}
                    </td>

                    {/* ฝั่งก่อนแข่ง */}
                    <td className="bg-blue-50/30 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-950">
                          {fitnessAvg !== null ? `${fitnessAvg}%` : "-"}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          (fitnessAvg ?? 0) >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : (fitnessAvg ?? 0) >= 60
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}>
                          {(fitnessAvg ?? 0) >= 80 ? "พร้อมแข่งสูง" : (fitnessAvg ?? 0) >= 60 ? "ปานกลาง" : "ต้องพัฒนา"}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 truncate max-w-[180px]">
                        {a.analysis.strengths.length ? `จุดแข็ง: ${a.analysis.strengths.slice(0, 2).join(", ")}` : "ยังไม่มีข้อมูลเด่น"}
                      </div>
                    </td>

                    {/* Gap สมรรถภาพ */}
                    <td className="bg-blue-50/30 p-3">
                      {fitGap > 0 ? (
                        <span className="font-semibold text-rose-600">-{fitGap} คะแนน</span>
                      ) : (
                        <span className="font-semibold text-emerald-600">ผ่านเกณฑ์ (+{Math.abs(fitGap)})</span>
                      )}
                    </td>

                    {/* ฝั่งหลังแข่ง */}
                    <td className="bg-indigo-50/30 p-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>อันดับ {match?.rank ?? "-"}</span>
                        {match?.outcome && (
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            match.outcome === "WIN"
                              ? "bg-emerald-100 text-emerald-800"
                              : match.outcome === "PODIUM"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-rose-100 text-rose-800"
                          }`}>
                            {match.outcome}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        คะแนนการแข่งขัน: {match?.score ?? "-"}
                      </div>
                    </td>

                    {/* Gap เวลาหรือคะแนน */}
                    <td className="bg-indigo-50/30 p-3">
                      {match?.timeSeconds !== null && match?.timeSeconds !== undefined ? (
                        <div>
                          <div className="font-semibold text-slate-900">{match.timeSeconds} วินาที</div>
                          {timeGap !== null && (
                            <div className={`text-[10px] font-bold ${timeGap > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              {timeGap > 0 ? `ช้ากว่าเป้า +${timeGap}s` : `เร็วกว่าเป้า ${timeGap}s`}
                            </div>
                          )}
                        </div>
                      ) : match?.score !== null && match?.score !== undefined ? (
                        <div>
                          <div className="font-semibold text-slate-900">{match.score} คะแนน</div>
                          <div className="text-[10px] text-slate-500">(ประเภทคะแนน/ทีม)</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* การวิเคราะห์ภาพรวม */}
                    <td className="bg-slate-50/50 p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-blue-900">PI: {a.analysis.performanceIndex}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-4 text-slate-600 line-clamp-2">
                        {a.analysis.actionPlan}
                      </p>
                      {onSelectAthlete && !a.isDemo && (
                        <button
                          type="button"
                          onClick={() => onSelectAthlete(a)}
                          className="mt-1.5 text-[11px] font-semibold text-blue-800 hover:underline"
                        >
                          แก้ไขผลแข่ง
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

