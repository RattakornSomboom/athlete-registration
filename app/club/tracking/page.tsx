"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

interface CompetitionRow {
  id: string;
  name: string;
  year: string;
  round: string;
  status: string;
}

interface RosterEventRow {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
}

interface RosterItemRow {
  id: string;
  applicationId: string;
  squadType: string;
}

interface ApplicationRow {
  id: string;
  status: string;
  squadType: string | null;
  user: {
    studentId: string;
    profile: { firstName: string; lastName: string; faculty: string | null; major: string | null } | null;
  };
}

interface RosterView {
  roster: {
    id: string;
    status: "DRAFT" | "SUBMITTED" | "RETURNED";
    version: number;
    documentId: string | null;
    submittedAt: string | null;
    updatedAt: string;
    items: RosterItemRow[];
    events: RosterEventRow[];
  } | null;
  applications: ApplicationRow[];
}

interface TrackingData {
  competitions: CompetitionRow[];
  views: Record<string, RosterView>;
}

const ROSTER_STATUS: Record<string, { label: string; className: string }> = {
  NONE: { label: "ยังไม่ได้จัดบัญชี", className: "bg-slate-100 text-slate-700 border-slate-200" },
  DRAFT: { label: "ร่างบัญชี (ยังไม่ส่ง)", className: "bg-amber-100 text-amber-900 border-amber-200" },
  SUBMITTED: { label: "ส่งรายชื่อแล้ว", className: "bg-blue-100 text-blue-900 border-blue-200" },
  RETURNED: { label: "ถูกส่งคืนให้แก้ไข", className: "bg-rose-100 text-rose-800 border-rose-200" },
};

const APPLICATION_STATUS: Record<string, string> = {
  SUBMITTED: "รอชมรมพิจารณา",
  CLUB_APPROVED: "ผ่านพิจารณาชมรมแล้ว / รอกองกิจ",
  CLUB_REJECTED: "ชมรมไม่อนุมัติ",
  STAFF_APPROVED: "กองกิจอนุมัติ",
  STAFF_REJECTED: "กองกิจไม่อนุมัติ",
  FINAL_SELECTED: "ได้รับคัดเลือกขั้นสุดท้าย",
};

const EVENT_LABEL: Record<string, string> = {
  SAVED: "บันทึกร่างบัญชี",
  SUBMITTED: "ส่งบัญชีให้กองกิจ",
  RETURNED: "กองกิจส่งคืนบัญชี",
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-";
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
  return data;
}

async function loadTracking(): Promise<TrackingData> {
  const { competitions } = await readJson<{ competitions: CompetitionRow[] }>("/api/club/competitions");
  const entries = await Promise.all(
    competitions.map(async (c) => [c.id, await readJson<RosterView>(`/api/club/rosters?competitionId=${encodeURIComponent(c.id)}`)] as const),
  );
  return { competitions, views: Object.fromEntries(entries) };
}

export default function ClubTrackingPage() {
  const router = useRouter();
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadTracking()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setSelectedId((current) => current || result.competitions[0]?.id || "");
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const competition = data?.competitions.find((c) => c.id === selectedId);
  const view = data && selectedId ? data.views[selectedId] : undefined;
  const roster = view?.roster ?? null;
  const statusKey = roster?.status ?? "NONE";
  const statusInfo = ROSTER_STATUS[statusKey];
  const applicationById = new Map((view?.applications ?? []).map((a) => [a.id, a]));
  const rows = (roster?.items ?? []).flatMap((item) => {
    const application = applicationById.get(item.applicationId);
    return application ? [{ item, application }] : [];
  });
  const mainCount = rows.filter((r) => r.item.squadType === "main").length;
  const reserveCount = rows.filter((r) => r.item.squadType === "reserve").length;
  const selectedCount = rows.filter((r) => r.item.squadType === "selected").length;
  const lastReturn = roster?.events.find((e) => e.action === "RETURNED");

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <BackButton href="/club/competitions" label="กลับรายการแข่งขัน" />
          <LogoutButton />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">ติดตามสถานะการส่งรายชื่อ</h1>
            <p className="text-xs text-slate-500">
              ข้อมูลสถานะบัญชีรายชื่อ นักกีฬา และประวัติการส่งคืนจากกองกิจการนิสิต ดึงจากฐานข้อมูลจริง
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedId && (
              <button
                onClick={() => router.push(`/club/competitions/${selectedId}`)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer"
              >
                ← ดูรายชื่อผู้สมัครและคัดเลือก
              </button>
            )}
            <button
              onClick={() => router.push("/club/review")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              จัดทำบัญชีรายชื่อ
            </button>
          </div>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl p-4">{error}</div>}
        {!data && !error && <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>}
        {data && data.competitions.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">ยังไม่มีรายการแข่งขันสำหรับชมรมนี้</div>
        )}

        {data && data.competitions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {data.competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer ${
                  c.id === selectedId ? "bg-blue-900 text-white border-blue-900" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {competition && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">
                    {competition.name} ({competition.round} {competition.year})
                  </h2>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  วันที่นำส่งกองกิจการนิสิต: {formatDate(roster?.submittedAt ?? null)}
                </p>
              </div>
              {roster?.documentId && (
                <a
                  href={`/api/documents/${roster.documentId}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                >
                  ดูเอกสารบัญชีที่ลงนาม
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-xs block">นักกีฬาในบัญชี</span>
                <span className="text-xl font-bold text-slate-900 block">{rows.length} คน</span>
                <span className="text-[11px] text-slate-400">{selectedCount > 0 ? `ผ่านการคัดเลือก ${selectedCount} คน` : `ตัวจริง ${mainCount} · สำรอง ${reserveCount}`}</span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-xs block">ผู้สมัครแข่งขันในชนิดกีฬาของชมรม</span>
                <span className="text-xl font-bold text-slate-900 block">{view?.applications.length ?? 0} คน</span>
              </div>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-emerald-800 text-xs block font-medium">ผ่านการอนุมัติ/คัดเลือก</span>
                <span className="text-xl font-bold text-emerald-900 block">
                  {rows.filter((r) => ["STAFF_APPROVED", "FINAL_SELECTED"].includes(r.application.status)).length} คน
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-xs block">แก้ไขล่าสุด</span>
                <span className="text-sm font-bold text-slate-900 block mt-1">{formatDate(roster?.updatedAt ?? null)}</span>
              </div>
            </div>

            {roster?.status === "RETURNED" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <span className="font-bold block">เหตุผลที่กองกิจการนิสิตส่งคืน:</span>
                {lastReturn?.reason ?? "-"}
              </div>
            )}
          </div>
        )}

        {competition && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-800">รายชื่อนักกีฬาในบัญชี</div>
            {rows.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">ยังไม่มีรายชื่อนักกีฬาในบัญชีของรายการนี้</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-2">รหัสนิสิต</th>
                    <th className="px-4 py-2">ชื่อ-สกุล</th>
                    <th className="px-4 py-2">คณะ / สาขา</th>
                    <th className="px-4 py-2">ประเภท</th>
                    <th className="px-4 py-2">สถานะใบสมัคร</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ item, application }) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-mono">{application.user.studentId}</td>
                      <td className="px-4 py-2 font-semibold text-slate-900">
                        {application.user.profile ? `${application.user.profile.firstName} ${application.user.profile.lastName}` : "-"}
                      </td>
                      <td className="px-4 py-2">
                        {[application.user.profile?.faculty, application.user.profile?.major].filter(Boolean).join(" · ") || "-"}
                      </td>
                      <td className="px-4 py-2">{item.squadType === "main" ? "ตัวจริง" : (item.squadType === "selected" ? "ผ่านการคัดเลือก" : "สำรอง")}</td>
                      <td className="px-4 py-2">{APPLICATION_STATUS[application.status] ?? application.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {roster && roster.events.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-slate-800">ประวัติการดำเนินการ</h3>
            <ul className="space-y-1.5">
              {roster.events.map((e) => (
                <li key={e.id} className="text-xs text-slate-600 flex flex-wrap gap-x-3">
                  <span className="text-slate-400">{formatDate(e.createdAt)}</span>
                  <span className="font-semibold text-slate-800">{EVENT_LABEL[e.action] ?? e.action}</span>
                  {e.reason && <span className="text-rose-700">เหตุผล: {e.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
