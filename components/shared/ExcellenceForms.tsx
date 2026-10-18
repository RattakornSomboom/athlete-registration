"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClass, fieldClass } from "@/components/shared/Phase4UI";
import { EventOptions } from "@/components/shared/ExcellenceUI";
import { requestJson, errorMessage } from "@/lib/phase4-client";
import {
  ATHLETICS_STATIONS,
  FITNESS_RATINGS,
  PLAN_STATUSES,
  PLAN_STATUS_LABEL,
  eventKind,
  formatMarkInput,
  type DevelopmentPlan,
  type PlanStatus,
  type StationResult,
  type AthleticsEvent,
} from "@/lib/excellence-athletics";

const today = () => new Date().toISOString().slice(0, 10);

function FormShell({ title, onCancel, onSubmit, saving, error, children }: {
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  // เปิดฟอร์มแล้วย้ายโฟกัสไปช่องแรก (ผู้ใช้แป้นพิมพ์/โปรแกรมอ่านหน้าจอไม่ต้องไล่หา)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")?.focus();
  }, []);
  return (
    <form
      ref={ref}
      aria-label={title}
      onSubmit={event => { event.preventDefault(); onSubmit(); }}
      className="mt-4 space-y-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4 print:hidden"
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {children}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={buttonClass}>{saving ? "กำลังบันทึก…" : "บันทึก"}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">ยกเลิก</button>
      </div>
    </form>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export type EditableResult = { id: string; event: string; mark: number; competedAt: string; stage: string | null };

// result = โหมดแก้ไขผลเดิม (PUT) ไม่ส่ง = บันทึกผลใหม่ (POST)
export function ResultForm({ applicationId, events, result, onSaved, onCancel }: {
  applicationId: string;
  events: AthleticsEvent[];
  result?: EditableResult;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [event, setEvent] = useState(result?.event ?? events[0]?.key ?? "");
  const [time, setTime] = useState(result ? formatMarkInput(result.event, result.mark) : "");
  const [competedAt, setCompetedAt] = useState(result?.competedAt ?? today());
  const [stage, setStage] = useState(result?.stage ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function submit() {
    // กันกดส่งซ้ำก่อนที่ state saving จะอัปเดต
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError("");
    try {
      if (result) await requestJson(`/api/staff/excellence/results/${encodeURIComponent(result.id)}`, { event, mark: time, competedAt, stage }, "PUT");
      else await requestJson("/api/staff/excellence/results", { applicationId, event, mark: time, competedAt, stage });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <FormShell title={result ? "แก้ไขผลแข่ง" : "บันทึกผลแข่งขัน"} onCancel={onCancel} onSubmit={submit} saving={saving} error={error}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="รายการ">
          <select value={event} onChange={e => setEvent(e.target.value)} className={fieldClass}>
            <EventOptions events={events} />
          </select>
        </Field>
        <Field
          label={eventKind(event) === "TRACK" ? "เวลา" : "ระยะ (เมตร)"}
          hint={eventKind(event) === "TRACK" ? "วินาที เช่น 10.85 หรือ นาที:วินาที เช่น 1:58.32" : "เมตร เช่น 7.85"}
        >
          <input value={time} onChange={e => setTime(e.target.value)} required inputMode="decimal" className={fieldClass} />
        </Field>
        <Field label="วันที่แข่ง">
          <input type="date" value={competedAt} onChange={e => setCompetedAt(e.target.value)} required className={fieldClass} />
        </Field>
        <Field label="รอบการแข่งขัน (ไม่บังคับ)">
          <input value={stage} onChange={e => setStage(e.target.value)} maxLength={100} placeholder="เช่น รอบคัดเลือก, รอบชิงชนะเลิศ" className={fieldClass} />
        </Field>
      </div>
    </FormShell>
  );
}

type DraftItem = { id: string | null; stationKey: string; activity: string };

export function PlanForm({ applicationId, revision, plan, weakStations, onSaved, onCancel }: {
  applicationId: string;
  revision: number;
  plan: DevelopmentPlan | null;
  weakStations: StationResult[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [coachName, setCoachName] = useState(plan?.coachName ?? "");
  const [startDate, setStartDate] = useState(plan?.startDate ?? today());
  const [endDate, setEndDate] = useState(plan?.endDate ?? "");
  const [status, setStatus] = useState<PlanStatus>(plan?.status ?? "ACTIVE");
  const [notes, setNotes] = useState(plan?.notes ?? "");
  // แผนใหม่เริ่มจากจุดอ่อนของนักกีฬา 1 ข้อต่อ 1 สถานี
  const [items, setItems] = useState<DraftItem[]>(() =>
    plan?.items.map(item => ({ ...item })) ?? (weakStations.length
      ? weakStations.map(station => ({ id: null, stationKey: station.key, activity: "" }))
      : [{ id: null, stationKey: ATHLETICS_STATIONS[0].key, activity: "" }]),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const weakKeys = new Set(weakStations.map(station => station.key));

  const updateItem = (index: number, patch: Partial<DraftItem>) =>
    setItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await requestJson("/api/staff/excellence/plans", {
        applicationId,
        revision,
        plan: { id: plan?.id ?? null, coachName, startDate, endDate, status, notes, items },
      });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormShell title={plan ? "แก้ไขแผนพัฒนา" : "สร้างแผนพัฒนา"} onCancel={onCancel} onSubmit={submit} saving={saving} error={error}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="โค้ชผู้รับผิดชอบ">
          <input value={coachName} onChange={e => setCoachName(e.target.value)} required maxLength={120} className={fieldClass} />
        </Field>
        <Field label="สถานะ">
          <select value={status} onChange={e => setStatus(e.target.value as PlanStatus)} className={fieldClass}>
            {PLAN_STATUSES.map(item => <option key={item} value={item}>{PLAN_STATUS_LABEL[item]}</option>)}
          </select>
        </Field>
        <Field label="วันที่เริ่ม">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={fieldClass} />
        </Field>
        <Field label="วันที่สิ้นสุด">
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required min={startDate} className={fieldClass} />
        </Field>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-700">ข้อของแผน (แต่ละข้อผูกกับสถานีที่ต้องการพัฒนา)</legend>
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
            <select aria-label={`สถานีของข้อ ${index + 1}`} value={item.stationKey} onChange={e => updateItem(index, { stationKey: e.target.value })} className={fieldClass}>
              {ATHLETICS_STATIONS.map(station => (
                <option key={station.key} value={station.key}>{station.name}{weakKeys.has(station.key) ? " · จุดอ่อน" : ""}</option>
              ))}
            </select>
            <input
              aria-label={`กิจกรรมฝึกของข้อ ${index + 1}`}
              value={item.activity}
              onChange={e => updateItem(index, { activity: e.target.value })}
              required
              maxLength={300}
              placeholder="กิจกรรมฝึก เช่น Plyometrics สัปดาห์ละ 2 ครั้ง"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => setItems(current => current.filter((_, i) => i !== index))}
              disabled={items.length === 1}
              className="rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-40"
            >
              ลบ
            </button>
          </div>
        ))}
        {items.length < 10 && (
          <button type="button" onClick={() => setItems(current => [...current, { id: null, stationKey: ATHLETICS_STATIONS[0].key, activity: "" }])} className="text-sm font-medium text-blue-900 hover:underline">
            + เพิ่มข้อ
          </button>
        )}
      </fieldset>

      <Field label="หมายเหตุ (ไม่บังคับ)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} rows={2} className={fieldClass} />
      </Field>
    </FormShell>
  );
}

export type EditableRetest = {
  id: string;
  planId: string | null;
  testedAt: string;
  ratings: Record<string, string>;
  event: string | null;
  mark: number | null;
  notes: string | null;
};

// retest = โหมดแก้ไขผลเดิม (PUT) ไม่ส่ง = บันทึกผลใหม่ (POST)
export function RetestForm({ applicationId, revision, plans, events, defaultPlanId, retest, onSaved, onCancel }: {
  applicationId: string;
  revision: number;
  plans: DevelopmentPlan[];
  events: AthleticsEvent[];
  defaultPlanId: string | null;
  retest?: EditableRetest;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [planId, setPlanId] = useState(retest ? retest.planId ?? "" : defaultPlanId ?? "");
  const [testedAt, setTestedAt] = useState(retest?.testedAt ?? today());
  const [ratings, setRatings] = useState<Record<string, string>>(retest?.ratings ?? {});
  const [event, setEvent] = useState(retest?.event ?? "");
  const [time, setTime] = useState(retest?.mark != null && retest.event ? formatMarkInput(retest.event, retest.mark) : "");
  const [notes, setNotes] = useState(retest?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const planStations = new Set(plans.find(plan => plan.id === planId)?.items.map(item => item.stationKey) ?? []);

  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError("");
    try {
      const payload = {
        applicationId,
        revision,
        retest: { planId: planId || null, testedAt, ratings, event: event || null, mark: event ? time : null, notes },
      };
      if (retest) await requestJson(`/api/staff/excellence/retests/${encodeURIComponent(retest.id)}`, payload, "PUT");
      else await requestJson("/api/staff/excellence/retests", payload);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <FormShell title={retest ? "แก้ไขผลทดสอบซ้ำ" : "บันทึกผลทดสอบซ้ำ"} onCancel={onCancel} onSubmit={submit} saving={saving} error={error}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ผูกกับแผนพัฒนา">
          <select value={planId} onChange={e => setPlanId(e.target.value)} className={fieldClass}>
            <option value="">ไม่ผูกกับแผน</option>
            {plans.map(plan => <option key={plan.id} value={plan.id}>เริ่ม {plan.startDate} · {PLAN_STATUS_LABEL[plan.status]}</option>)}
          </select>
        </Field>
        <Field label="วันที่ทดสอบซ้ำ">
          <input type="date" value={testedAt} onChange={e => setTestedAt(e.target.value)} required className={fieldClass} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">ระดับผลรายสถานี (กรอกเฉพาะสถานีที่ทดสอบ)</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ATHLETICS_STATIONS.map(station => (
            <label key={station.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className={planStations.has(station.key) ? "font-semibold text-blue-900" : "text-slate-700"}>
                {station.name}{planStations.has(station.key) ? " · ในแผน" : ""}
              </span>
              <select value={ratings[station.key] ?? ""} onChange={e => setRatings(current => ({ ...current, [station.key]: e.target.value }))} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                <option value="">ไม่ได้ทดสอบ</option>
                {FITNESS_RATINGS.map(rating => <option key={rating} value={rating}>{rating}</option>)}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="รายการที่บันทึกผลในการทดสอบซ้ำ (ไม่บังคับ)">
          <select value={event} onChange={e => setEvent(e.target.value)} className={fieldClass}>
            <option value="">ไม่ได้บันทึกผล</option>
            <EventOptions events={events} />
          </select>
        </Field>
        <Field label={event && eventKind(event) === "FIELD" ? "ระยะ (เมตร)" : "เวลา"} hint="เทียบกับผลแข่งล่าสุดของรายการเดียวกัน">
          <input value={time} onChange={e => setTime(e.target.value)} disabled={!event} required={Boolean(event)} inputMode="decimal" className={fieldClass} />
        </Field>
      </div>

      <Field label="หมายเหตุ (ไม่บังคับ)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} rows={2} className={fieldClass} />
      </Field>
    </FormShell>
  );
}
