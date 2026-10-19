"use client";
import { APPLICATION_STATUSES } from "@/lib/validation";
import { useCallback, useState } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import { statusLabel } from "@/lib/phase4-client";
import {
  AlertTriangleIcon,
  CheckIcon,
  ClipboardListIcon,
  CloseIcon,
} from "@/components/shared/Icons";

type Applicant = {
  id: string;
  sport: string;
  category?: string | null;
  status: string;
  createdAt?: string | null;
  competition: { id: string; name: string };
  user: {
    studentId: string | null;
    profile: {
      firstName: string;
      lastName: string;
      faculty?: string | null;
      major?: string | null;
      phone?: string | null;
    } | null;
  };
};

type PublicationProblem = { applicationId: string; studentId: string | null; name: string; sport: string; reasons: string[]; kinds: ("EVIDENCE" | "ROSTER" | "TEAM")[] };
type Preview = { competitionId: string; applications: Pick<Applicant, "id" | "sport" | "user">[]; problems: PublicationProblem[]; canPublish: boolean };

export default function StaffReview() {
  const [search, setSearch] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCompetitionId, setImportCompetitionId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewRows, setImportPreviewRows] = useState<unknown[][] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<{ success?: string; error?: string; errors?: string[] } | null>(null);

  const action = useRequestAction();
  const optionsLoad = useCallback(() => fetchJson<{ competitions: { id: string; name: string; quotas: { sport: string }[] }[] }>("/api/competitions"), []);
  const options = useRemoteData(optionsLoad);
  const clubsLoad = useCallback(() => fetchJson<{ clubs: { id: string; sport: string }[] }>("/api/clubs"), []);
  const clubs = useRemoteData(clubsLoad);
  const detailHref = (a: Applicant) => {
    const club = clubs.data?.clubs.find(c => c.sport === a.sport);
    return club ? `/staff/applications/${club.id}/${a.competition.id}` : "/staff/applications";
  };
  const query = new URLSearchParams({ search, competitionId, sport, status }).toString();
  const load = useCallback(() => fetchJson<{ applications: Applicant[] }>("/api/staff/applications?" + query), [query]);
  const resource = useRemoteData(load);
  const sports = [...new Set((options.data?.competitions ?? []).filter(c => !competitionId || c.id === competitionId).flatMap(c => c.quotas.map(q => q.sport)))];

  const review = (id: string, approved: boolean) => action.run(async () => {
    const reason = approved ? "อนุมัติโดยเจ้าหน้าที่" : window.prompt("เหตุผลที่ไม่ผ่าน");
    if (!reason?.trim()) throw new Error("กรุณาระบุเหตุผลก่อนบันทึก");
    await fetchJson("/api/applications/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: approved ? "STAFF_APPROVED" : "STAFF_REJECTED", label: reason }) });
    setPreview(null);
    resource.update(() => ({ applications: [] }));
    const updated = await load();
    resource.update(() => updated);
  });

  const showPreview = () => action.run(async () => {
    setPreview(null);
    setPreview(await fetchJson<Preview>("/api/staff/applications/announce?" + new URLSearchParams({ competitionId })));
  }, "โหลดตัวอย่างแล้ว");

  const publish = () => action.run(async () => {
    if (!preview || preview.competitionId !== competitionId) throw new Error("กรุณาดูตัวอย่างใหม่");
    await fetchJson("/api/staff/applications/announce", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competitionId, applicationIds: preview.applications.map(a => a.id) }) });
    setPreview(null);
    const updated = await load();
    resource.update(() => updated);
  }, "ประกาศผลแล้ว");

  const exportExcel = () => action.run(async () => {
    const { applications } = await load();
    const XLSX = await import("xlsx");
    const rows = applications.map(a => ({
      "รหัสใบสมัคร": a.id,
      "รหัสนิสิต": a.user.studentId ?? "",
      "ชื่อ": a.user.profile?.firstName ?? "",
      "นามสกุล": a.user.profile?.lastName ?? "",
      "คณะ": a.user.profile?.faculty ?? "",
      "สาขาวิชา": a.user.profile?.major ?? "",
      "เบอร์โทรศัพท์": a.user.profile?.phone ?? "",
      "การแข่งขัน": a.competition.name,
      "ชนิดกีฬา": a.sport,
      "ประเภท": a.category ?? "",
      "สถานะ": statusLabel[a.status] ?? a.status,
      "วันที่สมัคร": a.createdAt ? new Date(a.createdAt).toLocaleString("th-TH") : ""
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Applicants");
    XLSX.writeFile(workbook, "applicants.xlsx");
  }, "ส่งออกแล้ว");

  const openImportDialog = () => {
    const targetId = competitionId || options.data?.competitions[0]?.id || "";
    setImportCompetitionId(targetId);
    setImportFile(null);
    setImportPreviewRows(null);
    setImportStatusMsg(null);
    setIsImporting(false);
    setShowImportModal(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportStatusMsg(null);
    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];
          setImportPreviewRows(rawRows);
        } catch {
          setImportStatusMsg({ error: "ไม่สามารถอ่านไฟล์ได้ กรุณาใช้ไฟล์ .xlsx, .xls หรือ .csv" });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setImportStatusMsg({ error: "โหลดตัวอ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
    }
  };

  const executeImport = async () => {
    if (!importCompetitionId) {
      setImportStatusMsg({ error: "กรุณาเลือกรายการแข่งขันเป้าหมายก่อนยืนยันนำเข้า" });
      return;
    }
    if (!importPreviewRows || importPreviewRows.length < 2) {
      setImportStatusMsg({ error: "ไฟล์ไม่มีข้อมูลนักกีฬา หรือไม่พบแถวข้อมูล" });
      return;
    }

    setIsImporting(true);
    setImportStatusMsg(null);

    try {
      const res = await fetchJson<{
        message: string;
        totalProcessed: number;
        createdCount: number;
        updatedCount: number;
        errorCount: number;
        errors?: string[];
      }>("/api/staff/applications/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: importCompetitionId,
          rawRows: importPreviewRows,
        }),
      });

      setImportStatusMsg({
        success: res.message,
        errors: res.errors && res.errors.length > 0 ? res.errors : undefined,
      });

      // Synchronize workspace filters with the imported competition and reset narrowing filters
      setCompetitionId(importCompetitionId);
      setSport("");
      setStatus("");
      setSearch("");

      // Immediately fetch fresh applications for this competition to bypass stale closure delay
      try {
        const fresh = await fetchJson<{ applications: Applicant[] }>(
          "/api/staff/applications?competitionId=" + encodeURIComponent(importCompetitionId)
        );
        resource.update(() => fresh);
        options.retry();
      } catch (refreshErr) {
        console.error("Refresh applications error:", refreshErr);
      }

      setTimeout(() => {
        setShowImportModal(false);
      }, 1800);
    } catch (err: unknown) {
      setImportStatusMsg({
        error: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการนำเข้า กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold text-blue-800">พื้นที่ตรวจสอบใบสมัคร</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">ค้นหาและพิจารณาผู้สมัคร</h2>
        <p className="mt-1 text-xs text-slate-500">ข้อมูลจากฐานข้อมูลจริงและจำกัดสิทธิ์ผ่าน API ฝั่งเซิร์ฟเวอร์</p>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">พบ {resource.data?.applications.length ?? 0} รายการ</span>
    </div>

    <fieldset disabled={action.busy || isImporting} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
      <label className="text-xs font-medium text-slate-700">ชื่อ / รหัสนิสิต<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสนิสิต" /></label>
      <label className="text-xs font-medium text-slate-700">การแข่งขัน<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" value={competitionId} onChange={e => { setCompetitionId(e.target.value); setSport(""); setPreview(null); }}><option value="">ทุกการแข่งขัน</option>{options.data?.competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-700">กีฬา<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" value={sport} onChange={e => setSport(e.target.value)}><option value="">ทุกกีฬา</option>{sports.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-700">สถานะ<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" value={status} onChange={e => setStatus(e.target.value)}><option value="">ทุกสถานะ</option>{Object.entries(statusLabel).filter(([key]) => APPLICATION_STATUSES.some(status => status === key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </fieldset>

    <RequestState loading={options.loading} error={options.error} retry={options.retry}/>
    <RequestState loading={resource.loading} error={resource.error} retry={resource.retry}/>
    <RequestState error={action.error}/>{action.success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{action.success}</p>}

    <div className="flex flex-wrap items-center gap-2">
      <a href={"/api/export/applications?" + query} className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100">ส่งออก CSV</a>
      <button disabled={action.busy || isImporting} onClick={exportExcel} className="rounded-lg border border-emerald-700 bg-white px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-40">ส่งออก XLSX</button>
      <button disabled={action.busy || isImporting} onClick={openImportDialog} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-900 hover:bg-blue-100 disabled:opacity-40"><ClipboardListIcon className="w-4 h-4" /> นำเข้า Excel / CSV</button>
      <button disabled={!competitionId || action.busy || isImporting} onClick={showPreview} className="rounded-lg bg-blue-900 px-3 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-40">ดูตัวอย่างก่อนประกาศผล</button>
    </div>

    {/* Import Modal */}
    {showImportModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ClipboardListIcon className="w-5 h-5 text-blue-800" /> นำเข้ารายชื่อนักกีฬาจากไฟล์ (Excel / CSV)</h3>
            <button type="button" aria-label="ปิดหน้าต่างนำเข้าข้อมูล" disabled={isImporting} onClick={() => setShowImportModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><CloseIcon className="w-4 h-4" /></button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">การแข่งขันเป้าหมาย <span className="text-rose-500">*</span></label>
              <select
                disabled={isImporting}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                value={importCompetitionId}
                onChange={(e) => setImportCompetitionId(e.target.value)}
              >
                <option value="">-- เลือกการแข่งขัน --</option>
                {options.data?.competitions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกไฟล์ข้อมูล (.xlsx, .xls, .csv) <span className="text-rose-500">*</span></label>
              <input
                type="file"
                disabled={isImporting}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="mt-1 text-xs text-slate-400">
                รองรับไฟล์ฟอร์มตอบกลับ Google Forms และไฟล์ Excel ทั่วไป ระบบตรวจจับคอลัมน์อัตโนมัติ
              </p>
            </div>

            {importPreviewRows && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-900">
                <p className="flex items-center gap-1.5 font-semibold"><ClipboardListIcon className="w-4 h-4" /> ข้อมูลในไฟล์: {importFile?.name}</p>
                <p className="mt-0.5">พบทั้งหมด {importPreviewRows.length - 1} แถวข้อมูล พร้อมนำเข้าสู่ระบบ</p>
              </div>
            )}

            {importStatusMsg?.error && (
              <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertTriangleIcon className="mt-0.5 w-4 h-4 shrink-0" /> {importStatusMsg.error}
              </p>
            )}

            {importStatusMsg?.success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold"><CheckIcon className="w-4 h-4" /> {importStatusMsg.success}</p>
                {importStatusMsg.errors && importStatusMsg.errors.length > 0 && (
                  <div className="mt-2 text-rose-700">
                    <p className="font-medium">พบข้อผิดพลาดบางรายการ ({importStatusMsg.errors.length} รายการ):</p>
                    <ul className="mt-1 max-h-32 overflow-y-auto list-disc list-inside space-y-0.5 text-xs">
                      {importStatusMsg.errors.map((e, idx) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              disabled={isImporting}
              onClick={() => setShowImportModal(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={isImporting || !importCompetitionId || !importPreviewRows}
              onClick={executeImport}
              className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-40"
            >
              {isImporting ? "กำลังประมวลผล..." : "ยืนยันนำเข้าข้อมูล"}
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-slate-900 text-xs text-white">
          <tr>
            {["รหัสนิสิต", "ชื่อ", "การแข่งขัน", "กีฬา", "สถานะ", "ดำเนินการ"].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {resource.data?.applications.map(a => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-600">{a.user.studentId}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{a.user.profile?.firstName} {a.user.profile?.lastName}</td>
              <td className="px-4 py-3 text-slate-600">{a.competition.name}</td>
              <td className="px-4 py-3 text-slate-600">{a.sport}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{statusLabel[a.status] ?? a.status}</span></td>
              <td className="space-x-3 px-4 py-3">
                <Link href={detailHref(a)} className="font-medium text-blue-800 hover:underline">รายละเอียด</Link>
                {["SUBMITTED", "CLUB_APPROVED"].includes(a.status) && (
                  <>
                    <button disabled={action.busy || isImporting} onClick={() => review(a.id, true)} className="font-medium text-emerald-700 hover:underline">อนุมัติ</button>
                    <button disabled={action.busy || isImporting} onClick={() => review(a.id, false)} className="font-medium text-rose-700 hover:underline">ไม่อนุมัติ</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {resource.data?.applications.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">ไม่พบผู้สมัครตามตัวกรอง</p>}
    {preview?.competitionId === competitionId && (
      <section className="space-y-3 rounded-xl border-2 border-blue-200 bg-blue-50/50 p-5">
        <p className="text-xs font-semibold text-blue-700">ตัวอย่างก่อนประกาศผล</p>
        <h3 className="font-bold text-slate-950">ตัวอย่างประกาศผล: {options.data?.competitions.find(c => c.id === competitionId)?.name}</h3>
        <p className="text-sm text-slate-600">ผู้ผ่าน {preview.applications.length} รายการ (ทุกกีฬาในรายการแข่งขันนี้)</p>
        <ul className="divide-y rounded-lg border bg-white px-4 text-sm">
          {preview.applications.map(a => <li className="py-2" key={a.id}>{a.user.studentId} · {a.user.profile?.firstName} {a.user.profile?.lastName} · {a.sport}</li>)}
        </ul>
        {(() => {
          const has = (kind: PublicationProblem["kinds"][number]) => preview.problems.filter(p => p.kinds.includes(kind)).length;
          const checks = [
            { label: "ผลตรวจหลักฐานรายบุคคลผ่านครบทุกรายการ", bad: has("EVIDENCE") },
            { label: "บัญชีรายชื่อของชมรมถูกส่งแล้ว", bad: has("ROSTER") },
            { label: "กีฬาประเภททีมผ่านเกณฑ์ผลงาน 50%", bad: has("TEAM") },
          ];
          return (
            <div className="space-y-2">
              <ul className="space-y-1 rounded-lg border bg-white p-3 text-sm">
                {checks.map(c => (
                  <li key={c.label} className={`flex items-start gap-1.5 ${c.bad ? "text-rose-700" : "text-emerald-700"}`}>
                    {c.bad ? <AlertTriangleIcon className="mt-0.5 w-4 h-4 shrink-0" /> : <CheckIcon className="mt-0.5 w-4 h-4 shrink-0" />}
                    <span>{c.label}{c.bad ? ` (ติดเงื่อนไข ${c.bad} คน)` : ""}</span>
                  </li>
                ))}
              </ul>
              {preview.problems.length > 0 && (
                <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
                  <p className="font-semibold">ยังประกาศผลไม่ได้: พบ {preview.problems.length} รายการที่ติดเงื่อนไข</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {preview.problems.map(p => <li key={p.applicationId}>{p.studentId} {p.name} · {p.sport}: {p.reasons.join("; ")}</li>)}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
        <button disabled={!preview.applications.length || !preview.canPublish || action.busy || isImporting} onClick={publish} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40">ยืนยันประกาศผลตามตัวอย่าง</button>
      </section>
    )}
  </section>;
}
