"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Page } from "@/components/shared/Phase4UI";
import { ChangeLabel, DemoBanner, EmptyText, ExcellenceNav, Section, demoQuery, formatThaiDate, useDemoMode } from "@/components/shared/ExcellenceUI";
import { PlanForm, ResultForm, RetestForm, type EditableResult } from "@/components/shared/ExcellenceForms";
import { requestJson, errorMessage } from "@/lib/phase4-client";
import {
  PLAN_STATUS_LABEL,
  eventLabel,
  findStation,
  formatSignedSeconds,
  formatTrackTime,
  latestPlan,
  type AthleteDetail,
  type DevelopmentPlan,
  type TimelineEntry,
} from "@/lib/excellence-athletics";

type Detail = AthleteDetail & { isDemo: boolean };
type OpenForm = { kind: "result"; result?: EditableResult } | { kind: "plan"; plan: DevelopmentPlan | null } | { kind: "retest" } | null;

const ratingClass = (score: number) =>
  score >= 80 ? "bg-emerald-100 text-emerald-800" : score >= 60 ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-800";

const TIMELINE_DOT: Record<TimelineEntry["kind"], string> = {
  FITNESS: "bg-slate-500",
  PLAN: "bg-blue-700",
  RESULT: "bg-amber-500",
  RETEST: "bg-emerald-600",
};

function AddButton({ label, onClick, hidden }: { label: string; onClick: () => void; hidden: boolean }) {
  if (hidden) return null;
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-blue-900 px-3 py-1.5 text-sm font-medium text-blue-900 hover:bg-blue-50">
      {label}
    </button>
  );
}

export default function ExcellenceAthletePage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { demo, ready } = useDemoMode();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState<OpenForm>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    requestJson<Detail>(`/api/staff/excellence/${encodeURIComponent(applicationId)}${demoQuery(demo)}`)
      .then(result => { if (active) { setDetail(result); setError(""); } })
      .catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [applicationId, demo, ready, reload]);

  const saved = () => { setForm(null); setReload(value => value + 1); };

  async function removeResult(result: EditableResult) {
    if (!window.confirm(`ลบผล ${eventLabel(result.event)} ${formatTrackTime(result.timeSeconds)} ของวันที่ ${formatThaiDate(result.competedAt)} ใช่หรือไม่`)) return;
    try {
      await requestJson(`/api/staff/excellence/results/${encodeURIComponent(result.id)}`, {}, "DELETE");
      setError("");
      setReload(value => value + 1);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const readOnly = !detail || detail.isDemo;
  const weak = detail?.stations.filter(station => station.weak).sort((a, b) => a.score - b.score) ?? [];
  const hasFitness = Boolean(detail?.athlete.fitness);

  return (
    <Page title={detail ? detail.athlete.name : "รายละเอียดนักกีฬา"}>
      <ExcellenceNav demo={demo} />
      <DemoBanner show={demo} />
      <Link href={`/staff/excellence${demoQuery(demo)}`} className="inline-block text-sm text-blue-900 hover:underline">← กลับไปภาพรวม</Link>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {!detail && !error && <p className="text-sm text-slate-600">กำลังโหลดข้อมูล…</p>}

      {detail && (
        <>
          <section className="flex flex-wrap gap-x-8 gap-y-2 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <p><span className="text-slate-500">รหัสนิสิต</span> <span className="font-medium">{detail.athlete.studentId || "—"}</span></p>
            <p><span className="text-slate-500">คณะ</span> <span className="font-medium">{detail.athlete.faculty || "—"}</span></p>
            <p><span className="text-slate-500">ประเภท</span> <span className="font-medium">กรีฑาลู่ ({detail.athlete.gender})</span></p>
            <p><span className="text-slate-500">การแข่งขัน</span> <span className="font-medium">{detail.athlete.competitionName}</span></p>
          </section>

          <Section
            title="ผลการแข่งขัน"
            description="PB = เวลาดีที่สุดของรายการ · SB = เวลาดีที่สุดในปีนั้น · Gap เทียบเป้าเวลาของรายการและเพศ"
            action={<AddButton label="+ บันทึกเวลา" hidden={readOnly || form?.kind === "result"} onClick={() => setForm({ kind: "result" })} />}
          >
            {form?.kind === "result" && <ResultForm key={form.result?.id ?? "new"} applicationId={applicationId} events={detail.events} result={form.result} onSaved={saved} onCancel={() => setForm(null)} />}
            {detail.results.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th className="py-2 pr-4 font-medium">วันที่</th>
                      <th className="py-2 pr-4 font-medium">รายการ</th>
                      <th className="py-2 pr-4 text-right font-medium">เวลา</th>
                      <th className="py-2 pr-4 font-medium"></th>
                      <th className="py-2 pr-4 text-right font-medium">เป้า</th>
                      <th className="py-2 pr-4 text-right font-medium">Gap</th>
                      <th className="py-2 font-medium">การแข่งขัน</th>
                      {!readOnly && <th className="py-2 pl-4 font-medium"><span className="sr-only">จัดการ</span></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.results.map(result => (
                      <tr key={result.id}>
                        <td className="py-2 pr-4 text-slate-600">{formatThaiDate(result.competedAt)}</td>
                        <td className="py-2 pr-4">{eventLabel(result.event)}</td>
                        <td className="py-2 pr-4 text-right font-mono tabular-nums font-semibold">{formatTrackTime(result.timeSeconds)}</td>
                        <td className="py-2 pr-4">
                          <span className="flex gap-1">
                            {result.isPB && <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-bold text-violet-800">PB</span>}
                            {result.isSB && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-xs font-bold text-sky-800">SB</span>}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right font-mono tabular-nums text-slate-600">{result.targetSeconds === null ? "ยังไม่ตั้งเป้า" : formatTrackTime(result.targetSeconds)}</td>
                        <td className={`py-2 pr-4 text-right font-mono tabular-nums ${result.gapSeconds === null ? "text-slate-400" : result.gapSeconds > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                          {formatSignedSeconds(result.gapSeconds)}
                        </td>
                        <td className="py-2 text-slate-600">{result.competitionName}{result.stage ? ` · ${result.stage}` : ""}</td>
                        {!readOnly && (
                          <td className="whitespace-nowrap py-2 pl-4 text-sm">
                            <button type="button" onClick={() => setForm({ kind: "result", result })} className="text-blue-900 hover:underline">แก้ไข</button>
                            <button type="button" onClick={() => void removeResult(result)} className="ml-3 text-rose-700 hover:underline">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyText>ยังไม่มีผลการแข่งขันที่บันทึกไว้</EmptyText>}
          </Section>

          <Section
            title="สมรรถภาพและจุดอ่อน"
            description={detail.athlete.fitness?.testedAt ? `ผลทดสอบสมรรถภาพเมื่อ ${formatThaiDate(detail.athlete.fitness.testedAt)} · จุดอ่อนคือสถานีระดับพอใช้ลงไป` : undefined}
          >
            {!hasFitness ? (
              <EmptyText>ยังไม่มีผลทดสอบสมรรถภาพ กรุณาบันทึกผลในแดชบอร์ดสมรรถภาพทางกายก่อน จึงจะสร้างแผนพัฒนาได้</EmptyText>
            ) : detail.stations.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {detail.stations.map(station => (
                  <li key={station.key} className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${station.weak ? "border-rose-200 bg-rose-50/50" : "border-slate-200"}`}>
                    <span className="text-slate-800">{station.name}</span>
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${ratingClass(station.score)}`}>{station.rating}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyText>ผลทดสอบสมรรถภาพไม่มีระดับของสถานีกรีฑาที่ระบบอ่านได้</EmptyText>}
          </Section>

          <Section
            title="แผนพัฒนา"
            description="แต่ละข้อของแผนผูกกับสถานีที่ต้องการพัฒนา เพื่อวัดผลเมื่อทดสอบซ้ำ"
            action={<AddButton label="+ สร้างแผน" hidden={readOnly || !hasFitness || form?.kind === "plan"} onClick={() => setForm({ kind: "plan", plan: null })} />}
          >
            {form?.kind === "plan" && (
              <PlanForm applicationId={applicationId} revision={detail.revision} plan={form.plan} weakStations={weak} onSaved={saved} onCancel={() => setForm(null)} />
            )}
            {detail.plans.length ? (
              <ul className="space-y-3">
                {detail.plans.map(plan => (
                  <li key={plan.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-slate-600">
                        {formatThaiDate(plan.startDate)} – {formatThaiDate(plan.endDate)} · {plan.coachName}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-900">{PLAN_STATUS_LABEL[plan.status]}</span>
                        {!readOnly && <button type="button" onClick={() => setForm({ kind: "plan", plan })} className="text-sm text-blue-900 hover:underline">แก้ไข</button>}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {plan.items.map(item => (
                        <li key={item.id} className="flex gap-2">
                          <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{findStation(item.stationKey)?.name ?? item.stationKey}</span>
                          <span className="text-slate-800">{item.activity}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.notes && <p className="mt-2 text-sm text-slate-600">หมายเหตุ: {plan.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : <EmptyText>{weak.length ? `ยังไม่มีแผนพัฒนา · จุดอ่อนที่ควรเริ่ม: ${weak.map(station => station.name).join(", ")}` : "ยังไม่มีแผนพัฒนา"}</EmptyText>}
          </Section>

          <Section
            title="ผลทดสอบซ้ำ"
            description="เทียบกับผลครั้งก่อนหน้า เวลาเทียบกับผลแข่งล่าสุดของรายการเดียวกัน และนับว่าเปลี่ยนเมื่อเกินช่วงคลาดเคลื่อน (SWC)"
            action={<AddButton label="+ บันทึกผลทดสอบซ้ำ" hidden={readOnly || !hasFitness || form?.kind === "retest"} onClick={() => setForm({ kind: "retest" })} />}
          >
            {form?.kind === "retest" && (
              <RetestForm
                applicationId={applicationId}
                revision={detail.revision}
                plans={detail.plans}
                events={detail.events}
                defaultPlanId={latestPlan(detail.plans)?.id ?? null}
                onSaved={saved}
                onCancel={() => setForm(null)}
              />
            )}
            {detail.retests.length ? (
              <ul className="space-y-3">
                {detail.retests.map(retest => {
                  const { comparison } = retest;
                  const rows = comparison.planItems.length
                    ? comparison.planItems.map(item => ({ ...item, key: item.itemId }))
                    : comparison.stations.map(station => ({ ...station, key: station.stationKey, activity: null }));
                  return (
                    <li key={retest.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">ทดสอบซ้ำ {formatThaiDate(retest.testedAt)}</p>
                      <p className="mt-1 text-sm text-slate-700">{comparison.summary}</p>
                      {rows.length > 0 && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full min-w-[520px] text-left text-sm">
                            <thead className="text-slate-600">
                              <tr className="border-b border-slate-200">
                                <th className="py-1.5 pr-4 font-medium">{comparison.planItems.length ? "ข้อของแผน / สถานี" : "สถานี"}</th>
                                <th className="py-1.5 pr-4 font-medium">ก่อน</th>
                                <th className="py-1.5 pr-4 font-medium">หลัง</th>
                                <th className="py-1.5 font-medium">ผล</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rows.map(row => (
                                <tr key={row.key}>
                                  <td className="py-1.5 pr-4">
                                    <span className="text-slate-800">{row.stationName}</span>
                                    {row.activity && <span className="block text-xs text-slate-500">{row.activity}</span>}
                                  </td>
                                  <td className="py-1.5 pr-4 text-slate-600">{row.before ?? "—"}</td>
                                  <td className="py-1.5 pr-4 text-slate-800">{row.after ?? "—"}</td>
                                  <td className="py-1.5"><ChangeLabel change={row.change} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {comparison.time && (
                        <p className="mt-3 text-sm text-slate-700">
                          {eventLabel(comparison.time.event)}: {formatTrackTime(comparison.time.before)} → <span className="font-semibold">{formatTrackTime(comparison.time.after)}</span>
                          {comparison.time.delta !== null && <> ({formatSignedSeconds(comparison.time.delta)}, ช่วงคลาดเคลื่อน ±{comparison.time.swc}s) · <ChangeLabel change={comparison.time.change} /></>}
                        </p>
                      )}
                      {retest.notes && <p className="mt-2 text-sm text-slate-600">หมายเหตุ: {retest.notes}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : <EmptyText>ยังไม่มีผลทดสอบซ้ำ</EmptyText>}
          </Section>

          <Section title="ไทม์ไลน์">
            {detail.timeline.length ? (
              <ol className="space-y-2 border-l border-slate-200 pl-4 text-sm">
                {detail.timeline.map((entry, index) => (
                  <li key={`${entry.kind}-${entry.date}-${index}`} className="relative">
                    <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${TIMELINE_DOT[entry.kind]}`} aria-hidden />
                    <span className="text-slate-500">{formatThaiDate(entry.date)}</span> · <span className="text-slate-800">{entry.label}</span>
                  </li>
                ))}
              </ol>
            ) : <EmptyText>ยังไม่มีเหตุการณ์</EmptyText>}
          </Section>
        </>
      )}
    </Page>
  );
}
