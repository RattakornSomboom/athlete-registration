"use client";

import { useState } from "react";
import type { AthleteExcellenceItem } from "@/lib/performance-service";
import { getSportFitnessLabel, getSportFitnessStations } from "@/lib/performance-analytics";
import FollowUpComparisonPanel from "@/components/shared/FollowUpComparisonPanel";

export default function AthleteExcellenceCard({
  athlete,
  onRecordResult,
  onOpenDevelopment,
}: {
  athlete: AthleteExcellenceItem;
  onRecordResult: () => void;
  onOpenDevelopment: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const stations = athlete.analysis.standardStations;
  const sportStationCount = getSportFitnessStations(athlete.sport).length;
  const match = athlete.matchResult;
  const gaps = athlete.analysis.gaps;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">{athlete.athleteName}</h3>
            {athlete.isDemo && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                DEMO
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {athlete.studentId} · {athlete.faculty} · {athlete.sport}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onOpenDevelopment}
            disabled={athlete.isDemo}
            className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {athlete.actionPlan ? "จัดการแผน / ทดสอบซ้ำ" : "บันทึกแผนพัฒนา"}
          </button>
          <button
            type="button"
            onClick={onRecordResult}
            disabled={athlete.isDemo}
            className="rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            บันทึกผลการแข่งขัน
          </button>
        </div>
      </div>

      {athlete.actionPlan && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[11px]">
          <span className="font-semibold text-emerald-900">
            แผนฝึก: {athlete.actionPlan.status === "IN_PROGRESS" ? "กำลังดำเนินการ" : athlete.actionPlan.status === "COMPLETED" ? "เสร็จสิ้น" : athlete.actionPlan.status === "CANCELLED" ? "ยกเลิก" : "ร่าง"}
            {" · "}{athlete.actionPlan.startDate} ถึง {athlete.actionPlan.endDate}
          </span>
          <span className="text-emerald-800">ผู้รับผิดชอบ: {athlete.actionPlan.responsiblePerson}</span>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">สมรรถภาพตามกีฬา · {getSportFitnessLabel(athlete.sport)}</h4>
              <p className="text-[11px] text-slate-500">
                มีผล {stations.length}/{sportStationCount} รายการ · เกณฑ์เป้าหมาย 80 คะแนน (ระดับดี)
                {gaps.fitnessScoreGap > 0 ? (
                  <span className="ml-1 text-rose-600 font-medium">Gap: -{gaps.fitnessScoreGap} คะแนน</span>
                ) : (
                  <span className="ml-1 text-emerald-600 font-medium">ผ่านเกณฑ์ (+{Math.abs(gaps.fitnessScoreGap)})</span>
                )}
              </p>
            </div>
            <span className="text-sm font-bold text-blue-900">
              {athlete.analysis.fitnessAverage !== null ? `${athlete.analysis.fitnessAverage}%` : "-"}
            </span>
          </div>

          <div className="space-y-2">
            {stations.map(station => {
              const value = station.score;
              return (
                <div key={station.name}>
                  <div className="mb-1 flex justify-between text-[11px] text-slate-600">
                    <span className="truncate pr-2">{station.name}</span>
                    <span className="font-semibold text-slate-700">{station.rating} ({station.score})</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        value < 60 ? "bg-rose-500" : value < 80 ? "bg-amber-400" : "bg-emerald-500"
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-slate-50 p-4">
          <h4 className="text-xs font-bold text-slate-800">ผลการแข่งขันล่าสุด</h4>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-500">อันดับ</dt>
              <dd className="font-bold text-slate-900">{match?.rank ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">คะแนน</dt>
              <dd className="font-bold text-slate-900">{match?.score ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ผลการแข่ง</dt>
              <dd className="font-bold text-slate-900">{match?.outcome ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ดัชนีภาพรวม (PI)</dt>
              <dd className="font-bold text-blue-900">{athlete.analysis.performanceIndex}</dd>
            </div>
            <div className="col-span-2 border-t border-slate-200 pt-2">
              <dt className="text-slate-500">เวลาที่ทำได้ (วินาที)</dt>
              <dd className="font-bold text-slate-900">
                {match?.timeSeconds !== null && match?.timeSeconds !== undefined ? (
                  <span>
                    {match.timeSeconds} วินาที
                    {gaps.timeGapSeconds !== null && (
                      <span className={`ml-2 text-[11px] font-medium ${gaps.timeGapSeconds > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        ({gaps.timeGapSeconds > 0 ? `ช้ากว่าเป้า +${gaps.timeGapSeconds}s` : `เร็วกว่าเป้า ${gaps.timeGapSeconds}s`})
                      </span>
                    )}
                  </span>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-bold text-emerald-800">จุดแข็ง</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {athlete.analysis.strengths.length ? (
              athlete.analysis.strengths.map(item => (
                <span key={item} className="rounded-full bg-white px-2 py-1 text-[10px] text-emerald-800">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-emerald-700">ยังไม่มีข้อมูลเด่น</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-[11px] font-bold text-rose-800">จุดที่ต้องพัฒนา (Bottlenecks)</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {athlete.analysis.weaknesses.length ? (
              athlete.analysis.weaknesses.map(item => (
                <span key={item} className="rounded-full bg-white px-2 py-1 text-[10px] text-rose-800">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-rose-700">ไม่พบ bottleneck</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-[11px] font-bold text-blue-800">ข้อเสนอแนะตามกฎของระบบ</p>
          <p className="mt-2 text-[11px] leading-5 text-blue-900">{athlete.analysis.actionPlan}</p>
        </div>
      </div>

      {athlete.followUp && <FollowUpComparisonPanel followUp={athlete.followUp} sport={athlete.sport} />}

      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        className="mt-4 text-xs font-semibold text-blue-900 hover:underline"
      >
        {expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียดการวิเคราะห์และข้อแนะนำ"}
      </button>

      {expanded && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">คำแนะนำตามกฎ:</span>{" "}
            {athlete.analysis.ruleRecommendations.join(" · ") || "ไม่มีคำแนะนำเพิ่มเติม"}
          </p>
          {match?.staffNotes && (
            <p className="mt-2">
              <span className="font-semibold text-slate-800">บันทึกเจ้าหน้าที่:</span> {match.staffNotes}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

