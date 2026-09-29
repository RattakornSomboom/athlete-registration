"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import AnalyticsSummary from "@/components/shared/AnalyticsSummary";
import {
  type CompetitionOption,
  errorMessage,
  requestJson,
  statusLabel,
} from "@/lib/phase4-client";
import { APPLICATION_STATUSES } from "@/lib/validation";
import type { AnalyticsRow, AnalyticsSummary as SummaryData } from "@/lib/analytics";
import {
  deleteSnapshot,
  getSnapshot,
  getSnapshots,
  saveSnapshot,
  type AnalyticsSnapshot,
  type SnapshotInfo,
} from "@/lib/snapshot-store";

type Result = {
  summary: SummaryData;
  rows: AnalyticsRow[];
  filters: { competitionId: string | null; sport: string | null };
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-slate-100";
const buttonClass =
  "rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("");

  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      requestJson<{ competitions: CompetitionOption[] }>("/api/competitions"),
      getSnapshots(),
    ])
      .then(([competitionData, snapshotData]) => {
        if (active) {
          setCompetitions(competitionData.competitions);
          setSnapshots(snapshotData);
        }
      })
      .catch(error => {
        if (active) setMessage(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    requestJson<Result>(
      "/api/staff/analytics?" + new URLSearchParams({ competitionId, sport, status }),
    )
      .then(data => {
        if (active) setResult(data);
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
  }, [competitionId, sport, status]);

  const sports = useMemo(() => {
    return [
      ...new Set(
        competitions
          .filter(c => !competitionId || c.id === competitionId)
          .flatMap(c => c.quotas.map(q => q.sport)),
      ),
    ].sort();
  }, [competitions, competitionId]);

  function handleCompetitionChange(newCompId: string) {
    setBusy(true);
    setMessage("");
    setResult(null);
    setCompetitionId(newCompId);
    setSport("");
  }

  async function handleSaveSnapshot() {
    setSaving(true);
    setMessage("");
    try {
      await saveSnapshot({ title, notes, competitionId, sport, status });
      setSnapshots(await getSnapshots());
      setTitle("");
      setNotes("");
      setMessage("บันทึกสรุปข้อมูล (Snapshot) เข้าฐานข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenSnapshot(id: string) {
    setSaving(true);
    setMessage("");
    try {
      setSnapshot(await getSnapshot(id));
      setActiveTab("history");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSnapshot(id: string) {
    if (!window.confirm("ยืนยันการลบรายงานย้อนหลังนี้ออกจากฐานข้อมูล?")) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteSnapshot(id);
      setSnapshots(await getSnapshots());
      if (snapshot?.id === id) setSnapshot(null);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadCSV() {
    if (!result) return;
    const escape = (v: unknown) =>
      '"' + String(v ?? "").replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
    const rows = [
      ["การแข่งขัน", "รหัสนิสิต", "ชื่อ", "นามสกุล", "คณะ", "กีฬา", "สถานะ", "ประเภท"],
      ...result.rows.map(r => [
        r.competitionName,
        r.studentId,
        r.firstName,
        r.lastName,
        r.faculty,
        r.sport,
        r.status,
        r.squadType,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + rows.map(r => r.map(escape).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "athlete-applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        <header className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                กองกิจการนิสิต มหาวิทยาลัยพะเยา
              </span>
              <span className="text-xs text-slate-400">ระบบบริหารจัดการและสรุปผลการคัดเลือกนักกีฬา</span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              แดชบอร์ดสถิติและการวิเคราะห์ข้อมูลนักกีฬา
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              ข้อมูลจริงจากฐานข้อมูลระบบรับสมัครและขึ้นทะเบียนนักกีฬา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/staff/applications"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              จัดการใบสมัคร
            </Link>
            <Link
              href="/staff/selection"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              ประกาศผล
            </Link>
            <Link
              href="/staff/settings"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              ตั้งค่าระบบ
            </Link>
          </div>
        </header>

        {message && (
          <div
            role="status"
            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 shadow-xs"
          >
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="font-bold text-blue-700 hover:underline"
            >
              ปิด
            </button>
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={activeTab === "current"}
              onClick={() => {
                setActiveTab("current");
                setSnapshot(null);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                activeTab === "current"
                  ? "bg-blue-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              สถิติรอบปัจจุบัน (ข้อมูลจริง)
            </button>
            <button
              type="button"
              aria-pressed={activeTab === "history"}
              onClick={() => setActiveTab("history")}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                activeTab === "history"
                  ? "bg-blue-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              รายงานย้อนหลัง (Snapshots){" "}
              <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">
                {snapshots.length}
              </span>
            </button>
          </div>

          {activeTab === "current" && result && !busy && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
              >
                ดาวน์โหลด CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                พิมพ์รายงาน
              </button>
            </div>
          )}
        </div>

        {activeTab === "current" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-slate-600">
                  การแข่งขัน
                  <select
                    className={`mt-1 ${fieldClass}`}
                    value={competitionId}
                    disabled={saving}
                    onChange={e => handleCompetitionChange(e.target.value)}
                  >
                    <option value="">ทุกการแข่งขัน</option>
                    {competitions.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  ชนิดกีฬา
                  <select
                    className={`mt-1 ${fieldClass}`}
                    value={sport}
                    disabled={saving}
                    onChange={e => {
                      setBusy(true);
                      setMessage("");
                      setResult(null);
                      setSport(e.target.value);
                    }}
                  >
                    <option value="">ทุกชนิดกีฬา</option>
                    {sports.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  สถานะใบสมัคร
                  <select
                    className={`mt-1 ${fieldClass}`}
                    value={status}
                    disabled={saving}
                    onChange={e => {
                      setBusy(true);
                      setMessage("");
                      setResult(null);
                      setStatus(e.target.value);
                    }}
                  >
                    <option value="">ทุกสถานะ</option>
                    {Object.entries(statusLabel)
                      .filter(([key]) => APPLICATION_STATUSES.some(s => s === key))
                      .map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <div className="text-xs text-slate-500">
                ใบสมัครตามตัวกรอง{" "}
                <span className="font-semibold text-slate-900">
                  {busy ? "กำลังโหลด…" : result?.rows.length ?? "ไม่พร้อมแสดง"}
                </span>{" "}
                รายการ
              </div>
            </div>

            {busy && (
              <div
                role="status"
                className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"
              >
                กำลังโหลดข้อมูลสถิติจากฐานข้อมูล...
              </div>
            )}

            {result && !busy && <AnalyticsSummary data={result.summary} />}

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900">
                บันทึกภาพรวมข้อมูลย้อนหลัง (Snapshot)
              </h2>
              <p className="text-xs text-slate-500">
                ระบบจะคำนวณยอดและบันทึกภาพรวมข้อมูลสรุปตามตัวกรองปัจจุบันลงในฐานข้อมูล
                โดยข้อมูลย้อนหลังจะไม่เปลี่ยนแปลงตามการเคลื่อนไหวของฐานข้อมูลหลังจากนี้
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  aria-label="ชื่อรายงาน"
                  placeholder="ชื่อรายงาน เช่น สรุปยอดก่อนปิดรับสมัคร"
                  className={fieldClass}
                  maxLength={200}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <textarea
                  aria-label="หมายเหตุ"
                  placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                  className={fieldClass}
                  maxLength={4000}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button
                type="button"
                className={buttonClass}
                disabled={busy || saving || !result || !title.trim()}
                onClick={() => void handleSaveSnapshot()}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก Snapshot เข้าฐานข้อมูล"}
              </button>
            </section>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            {snapshot ? (
              <section className="space-y-4 rounded-xl border-2 border-blue-200 bg-blue-50/20 p-6 shadow-xs">
                <div className="flex flex-col justify-between gap-2 border-b border-blue-100 pb-3 sm:flex-row sm:items-center">
                  <div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-900">
                      รายงานย้อนหลัง (Snapshot)
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {snapshot.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      บันทึกเมื่อ {new Date(snapshot.createdAt).toLocaleString("th-TH")} ·
                      รูปแบบรุ่น {snapshot.schemaVersion}
                      {snapshot.notes && ` · หมายเหตุ: ${snapshot.notes}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSnapshot(null)}
                    className="text-xs font-semibold text-blue-800 hover:underline"
                  >
                    ✕ ปิดรายงานนี้
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  ตัวกรองขณะบันทึก:{" "}
                  <span className="font-semibold text-slate-800">
                    {competitions.find(c => c.id === snapshot.filters.competitionId)?.name ??
                      snapshot.filters.competitionId ??
                      "ทุกการแข่งขัน"}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-slate-800">
                    {snapshot.filters.sport ?? "ทุกชนิดกีฬา"}
                  </span>
                </p>

                <AnalyticsSummary data={snapshot.data} />
              </section>
            ) : (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
                  รายการรายงานย้อนหลังทั้งหมด ({snapshots.length} รายการ)
                </h2>

                {!snapshots.length ? (
                  <p className="mt-4 text-xs text-slate-500">
                    ยังไม่มีรายงานย้อนหลังที่ถูกบันทึกไว้ในระบบ
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100">
                    {snapshots.map(s => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleOpenSnapshot(s.id)}
                            className="text-left text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
                          >
                            {s.title}
                          </button>
                          <p className="text-[11px] text-slate-400">
                            บันทึกเมื่อ {new Date(s.createdAt).toLocaleString("th-TH")}
                            {s.notes && ` — ${s.notes}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleOpenSnapshot(s.id)}
                            className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            เปิดดู
                          </button>
                          {s.canDelete && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void handleDeleteSnapshot(s.id)}
                              className="text-xs text-rose-700 hover:underline"
                            >
                              ลบ
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
