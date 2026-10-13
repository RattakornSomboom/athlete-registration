"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Notice,
  History,
  PrivateFile,
  buttonClass,
  fieldClass,
} from "@/components/shared/Phase4UI";
import {
  requestJson,
  errorMessage,
  statusLabel,
  type HistoryEvent,
} from "@/lib/phase4-client";

export type Roster = {
  id: string;
  clubId: string;
  competitionId: string;
  version: number;
  status: string;
  documentId: string | null;
  club: { name: string; sport: string };
  competition: { name: string };
  events: HistoryEvent[];
  items: {
    id: string;
    squadType: string;
    application: {
      id: string;
      status: string;
      user: {
        studentId: string;
        profile: { firstName: string; lastName: string } | null;
      };
    };
  }[];
};

export type PendingRoster = {
  clubId: string;
  clubName: string;
  sport: string;
  clubStatus: string;
  isActive: boolean;
  competitionId: string;
  competitionName: string;
};

type StatusBadge = {
  label: string;
  className: string;
};

function getStatusBadge(status: string): StatusBadge {
  const label = status === "DRAFT" ? "ฉบับร่าง" : (statusLabel[status] ?? status);

  if (["STAFF_APPROVED", "FINAL_SELECTED"].includes(status)) {
    return {
      label,
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }
  if (["CLUB_REJECTED", "STAFF_REJECTED", "RETURNED"].includes(status)) {
    return {
      label,
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }
  if (status === "CLUB_APPROVED") {
    return {
      label,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }
  if (status === "SUBMITTED") {
    return {
      label,
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }
  return {
    label,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };
}

function athleteName(item: Roster["items"][number]): string {
  const profile = item.application.user.profile;
  if (!profile) return "ไม่พบข้อมูลชื่อ-นามสกุล";
  return profile.firstName + " " + profile.lastName;
}

export default function StaffRosterReview() {
  const [rows, setRows] = useState<Roster[]>([]);
  const [pending, setPending] = useState<PendingRoster[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  const [reason, setReason] = useState<Record<string, string>>({});

  async function load(): Promise<boolean> {
    setBusy(true);
    setMessage("");
    try {
      const data = await requestJson<{ rosters: Roster[]; pending: PendingRoster[] }>("/api/staff/rosters");
      setRows(data.rosters);
      setPending(data.pending);
      return true;
    } catch (error) {
      setMessage(errorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let active = true;
    requestJson<{ rosters: Roster[]; pending: PendingRoster[] }>("/api/staff/rosters")
      .then(data => {
        if (active) {
          setRows(data.rosters);
          setPending(data.pending);
        }
      })
      .catch(error => {
        if (active) setMessage(errorMessage(error));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function sendBack(roster: Roster) {
    setBusy(true);
    setMessage("");
    try {
      await requestJson("/api/staff/rosters", {
        id: roster.id,
        version: roster.version,
        reason: reason[roster.id],
      });
      if (await load()) setMessage("ส่งคืนบัญชีและรีเซ็ตผลเพื่อพิจารณาใหม่แล้ว");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const noData = !busy && !message && rows.length === 0 && pending.length === 0;
  const initialLoading = busy && rows.length === 0 && pending.length === 0 && !message;

  return (
    <div className="space-y-6">
      <Notice text={message} />

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">ตรวจรับบัญชีรายชื่อตัวแทนชมรม (Rosters)</h2>
          <p className="text-sm leading-6 text-slate-600">
            ตรวจสอบบัญชีรายชื่อของชมรมในแต่ละรายการแข่งขัน และส่งคืนเพื่อแก้ไขเมื่อข้อมูลยังไม่พร้อมพิจารณา
          </p>
        </div>
        <button
          type="button"
          className={buttonClass + " shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"}
          disabled={busy}
          onClick={() => void load()}
        >
          {busy ? "กำลังโหลด..." : "โหลดข้อมูลใหม่"}
        </button>
      </div>

      {initialLoading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm"
        >
          กำลังโหลดข้อมูลบัญชีรายชื่อ...
        </div>
      )}

      {noData && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          ยังไม่มีรายการแข่งขันที่ต้องตรวจรับบัญชี
        </div>
      )}

      {pending.length > 0 && (
        <section aria-labelledby="pending-rosters-title" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 id="pending-rosters-title" className="text-lg font-bold text-slate-900">
              ชมรมที่ยังไม่ได้ส่งบัญชีรายชื่อ ({pending.length})
            </h3>
            <span className="text-xs text-slate-500">
              ชมรมต้องยืนยันส่งบัญชีก่อน จึงจะปรากฏเอกสารและประวัติการส่งคืน
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pending.map(item => (
              <div
                key={item.clubId + "-" + item.competitionId}
                className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                      รอชมรมจัดทำบัญชี
                    </span>
                    <h4 className="mt-2 text-base font-bold text-slate-900">{item.clubName}</h4>
                    <p className="text-sm text-slate-600">{item.competitionName}</p>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                    {item.sport}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-amber-200/80 pt-3 text-xs text-slate-600">
                  <span>สถานะชมรม: {item.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                  <Link
                    href={"/staff/applications/" + item.clubId + "/" + item.competitionId}
                    className="font-semibold text-blue-900 underline underline-offset-2 hover:text-violet-700"
                  >
                    ดูใบสมัครของชมรมนี้ →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <section aria-labelledby="submitted-rosters-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 id="submitted-rosters-title" className="text-lg font-bold text-slate-900">
              บัญชีรายชื่อที่ส่งแล้ว ({rows.length})
            </h3>
            <span className="text-xs text-slate-500">ตรวจรับเอกสารและส่งคืนได้ตามรอบพิจารณา</span>
          </div>

          <div className="space-y-4">
            {rows.map(roster => {
              const badge = getStatusBadge(roster.status);
              const canReturn = ["SUBMITTED", "CLUB_APPROVED"].includes(roster.status);

              return (
                <article
                  key={roster.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={"inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold " + badge.className}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-medium text-slate-500">รุ่นที่ {roster.version}</span>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {roster.club.sport}
                        </span>
                      </div>
                      <h4 className="mt-2 text-lg font-bold text-slate-900">{roster.club.name}</h4>
                      <p className="text-sm text-slate-600">{roster.competition.name}</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="text-sm text-slate-600">
                        {roster.documentId ? (
                          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="text-xs text-slate-500">เอกสารบัญชี:</span>
                            <PrivateFile id={roster.documentId} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">ไม่มีเอกสารแนบ</span>
                        )}
                      </div>
                      <Link
                        href={"/staff/applications/" + roster.clubId + "/" + roster.competitionId}
                        className="text-xs font-semibold text-blue-900 underline underline-offset-2 hover:text-violet-700"
                      >
                        เปิดหน้ารายละเอียดใบสมัครชมรมนี้ →
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <section aria-labelledby={"roster-athletes-" + roster.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <h5 id={"roster-athletes-" + roster.id} className="text-sm font-bold text-slate-900">
                          รายชื่อนักกีฬา ({roster.items.length} คน)
                        </h5>
                        <span className="text-xs text-slate-500">
                          {roster.items.some(i => i.squadType === "selected")
                            ? `ผ่านการคัดเลือก ${roster.items.filter(i => i.squadType === "selected").length} คน`
                            : `ตัวจริง ${roster.items.filter(i => i.squadType === "main").length} · สำรอง ${roster.items.filter(i => i.squadType === "reserve").length}`}
                        </span>
                      </div>

                      {roster.items.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                          ยังไม่มีรายชื่อนักกีฬาในบัญชีนี้
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                          {roster.items.map(item => {
                            const applicationStatus = getStatusBadge(item.application.status);
                            return (
                              <li
                                key={item.id}
                                className="flex min-w-0 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <Link
                                    className="break-words font-semibold text-blue-900 underline decoration-blue-200 underline-offset-4 transition hover:text-violet-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                                    href={"/staff/applications/" + roster.clubId + "/" + roster.competitionId}
                                  >
                                    {athleteName(item)}
                                  </Link>
                                  <p className="mt-1 text-sm text-slate-500">
                                    รหัสนิสิต {item.application.user.studentId}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                  <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                    {item.squadType === "main" ? "ตัวจริง" : (item.squadType === "selected" ? "ผ่านการคัดเลือก" : "สำรอง")}
                                  </span>
                                  <span className={"inline-flex rounded-full border px-2.5 py-1 text-xs font-medium " + applicationStatus.className}>
                                    {applicationStatus.label}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>

                    {canReturn && (
                      <section
                        aria-labelledby={"return-roster-" + roster.id}
                        className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <h5 id={"return-roster-" + roster.id} className="font-semibold text-amber-950">
                          ส่งคืนให้ชมรมแก้ไข
                        </h5>
                        <p className="mt-1 text-sm text-amber-900">
                          ระบุเหตุผลให้ชัดเจน ระบบจะส่งคืนบัญชีรุ่น {roster.version} เพื่อพิจารณาใหม่
                        </p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <label className="sr-only" htmlFor={"reason-" + roster.id}>
                            เหตุผลที่ส่งคืน {roster.club.name}
                          </label>
                          <input
                            id={"reason-" + roster.id}
                            aria-required="true"
                            placeholder="เหตุผลที่ส่งคืน (บังคับ)"
                            className={fieldClass + " sm:flex-1"}
                            value={reason[roster.id] ?? ""}
                            onChange={event => setReason({ ...reason, [roster.id]: event.target.value })}
                          />
                          <button
                            type="button"
                            className={buttonClass + " shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"}
                            disabled={busy || !reason[roster.id]?.trim()}
                            onClick={() => void sendBack(roster)}
                          >
                            ส่งคืนให้ชมรมแก้ไข
                          </button>
                        </div>
                      </section>
                    )}

                    <div className="border-t border-slate-200 pt-1 text-sm text-slate-700">
                      <History events={roster.events} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
