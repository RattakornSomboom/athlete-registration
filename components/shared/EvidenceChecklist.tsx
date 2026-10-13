"use client";
import { useCallback, useState } from "react";
import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import { EVIDENCE_RESULT_LABELS, type EvidenceItem, type EvidenceResult } from "@/lib/evidence-verification";

type ReviewItem = {
  item: EvidenceItem;
  itemLabel: string;
  result: EvidenceResult;
  resultLabel: string;
  note: string | null;
  checkedBy: string | null;
  checkedAt: string | null;
  auto: { passed: boolean | null; message: string };
};

type Review = { applicationId: string; items: ReviewItem[] };

const resultStyle: Record<EvidenceResult, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PASSED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  ACTION_REQUIRED: "bg-amber-100 text-amber-800",
};

const formatDateTime = (value: string) => new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

export default function EvidenceChecklist({
  applicationId,
  onChanged,
}: {
  applicationId: string;
  onChanged?: () => void | Promise<void>;
}) {
  const load = useCallback(() => fetchJson<Review>(`/api/staff/applications/${encodeURIComponent(applicationId)}/evidence`), [applicationId]);
  const resource = useRemoteData(load);
  const action = useRequestAction();
  const [editing, setEditing] = useState<EvidenceItem | null>(null);
  const [result, setResult] = useState<EvidenceResult>("PASSED");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");

  const needsReason = result === "REJECTED" || result === "ACTION_REQUIRED";

  function open(item: EvidenceItem) {
    setEditing(item);
    setResult("PASSED");
    setReason("");
    setReference("");
  }

  async function submit(item: EvidenceItem) {
    await action.run(async () => {
      await fetchJson(`/api/staff/applications/${encodeURIComponent(applicationId)}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, result, reason, reference }),
      });
      setEditing(null);
      resource.retry();
      await onChanged?.();
    }, "บันทึกผลการตรวจเรียบร้อย");
  }

  return (
    <div>
      <h4 className="text-xs font-bold text-slate-700 mb-2">ตรวจหลักฐานรายรายการ</h4>
      <RequestState loading={resource.loading} error={resource.error} retry={resource.retry} />
      {action.error && <p role="alert" className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">{action.error}</p>}
      {action.success && <p className="mb-2 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">{action.success}</p>}
      <ul className="space-y-2">
        {resource.data?.items.map((row) => (
          <li key={row.item} className="rounded border border-slate-100 bg-slate-50 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-800">{row.itemLabel}</span>
              <span className={`rounded-full px-2.5 py-0.5 font-medium ${resultStyle[row.result]}`}>{row.resultLabel}</span>
            </div>
            <p className={row.auto.passed === false ? "text-rose-700" : "text-slate-500"}>ระบบตรวจเบื้องต้น: {row.auto.message}</p>
            {row.note && <p className="text-slate-600">{row.note}</p>}
            {row.checkedAt && <p className="text-slate-400">ตรวจโดย {row.checkedBy} · {formatDateTime(row.checkedAt)}</p>}
            {editing === row.item ? (
              <div className="space-y-2 border-t border-slate-200 pt-2">
                <select value={result} onChange={(e) => setResult(e.target.value as EvidenceResult)} className="w-full rounded border border-slate-300 bg-white px-2 py-1.5">
                  {(Object.keys(EVIDENCE_RESULT_LABELS) as EvidenceResult[]).map((value) => <option key={value} value={value}>{EVIDENCE_RESULT_LABELS[value]}</option>)}
                </select>
                <textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder={needsReason ? "เหตุผล (จำเป็น) เพื่อให้ผู้สมัครแก้ไขได้ตรงจุด" : "หมายเหตุ (ถ้ามี)"} className="w-full rounded border border-slate-300 px-2 py-1.5" rows={2} />
                <input value={reference} maxLength={300} onChange={(e) => setReference(e.target.value)} placeholder="หลักฐานอ้างอิง (ถ้ามี) เช่น ชื่อเอกสาร/เลขที่หนังสือ" className="w-full rounded border border-slate-300 px-2 py-1.5" />
                <div className="flex gap-2">
                  <button type="button" disabled={action.busy || (needsReason && !reason.trim())} onClick={() => submit(row.item)} className="rounded bg-blue-900 px-3 py-1.5 font-medium text-white hover:bg-blue-800 disabled:opacity-40">บันทึกผลตรวจ</button>
                  <button type="button" disabled={action.busy} onClick={() => setEditing(null)} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700">ยกเลิก</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => open(row.item)} className="font-medium text-blue-800 hover:underline">บันทึกผลตรวจ</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
