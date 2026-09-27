"use client";
import { APPLICATION_STATUSES } from "@/lib/validation";
import { useCallback, useState } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import { statusLabel } from "@/lib/phase4-client";

type Applicant = {
  id: string;
  sport: string;
  category?: string | null;
  status: string;
  createdAt?: string | null;
  competition: { name: string };
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
type Preview = { competitionId: string; applications: Pick<Applicant, "id" | "sport" | "user">[] };
export default function StaffReview() {
  const [search, setSearch] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const action = useRequestAction();
  const optionsLoad = useCallback(() => fetchJson<{ competitions: { id: string; name: string; quotas: { sport: string }[] }[] }>("/api/competitions"), []);
  const options = useRemoteData(optionsLoad);
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
  return <section className="space-y-4 rounded-xl border bg-white p-5">
    <h2 className="text-xl font-bold">ค้นหาและพิจารณาผู้สมัคร</h2>
    <fieldset disabled={action.busy} className="grid gap-3 md:grid-cols-4">
      <label>ชื่อ / รหัสนิสิต<input className="w-full rounded border p-2" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label>การแข่งขัน<select className="w-full rounded border p-2" value={competitionId} onChange={e => { setCompetitionId(e.target.value); setSport(""); setPreview(null); }}><option value="">ทุกการแข่งขัน</option>{options.data?.competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>กีฬา<select className="w-full rounded border p-2" value={sport} onChange={e => setSport(e.target.value)}><option value="">ทุกกีฬา</option>{sports.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>สถานะ<select className="w-full rounded border p-2" value={status} onChange={e => setStatus(e.target.value)}><option value="">ทุกสถานะ</option>{Object.entries(statusLabel).filter(([key]) => APPLICATION_STATUSES.some(status => status === key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </fieldset>
    <RequestState loading={options.loading} error={options.error} retry={options.retry}/>
    <RequestState loading={resource.loading} error={resource.error} retry={resource.retry}/>
    <RequestState error={action.error}/><p role="status">{action.success}</p>
    <div className="flex flex-wrap gap-4"><a href={"/api/export/applications?" + query} className="text-purple-700 underline">ส่งออก CSV ตามตัวกรอง</a><button disabled={action.busy} onClick={exportExcel} className="text-purple-700 underline">ส่งออก XLSX ตามตัวกรอง</button><button disabled={!competitionId || action.busy} onClick={showPreview} className="text-purple-700 underline">ดูตัวอย่างผู้ผ่านทั้งการแข่งขันที่เลือก</button></div>
    <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{["รหัสนิสิต", "ชื่อ", "การแข่งขัน", "กีฬา", "สถานะ", "ดำเนินการ"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{resource.data?.applications.map(a => <tr key={a.id} className="border-t"><td className="p-2">{a.user.studentId}</td><td>{a.user.profile?.firstName} {a.user.profile?.lastName}</td><td>{a.competition.name}</td><td>{a.sport}</td><td>{statusLabel[a.status] ?? a.status}</td><td className="space-x-3 p-2"><Link href={"/staff/applicants/" + a.id} className="underline">รายละเอียด</Link>{["SUBMITTED", "CLUB_APPROVED"].includes(a.status) && <><button disabled={action.busy} onClick={() => review(a.id, true)} className="text-green-700">อนุมัติ</button><button disabled={action.busy} onClick={() => review(a.id, false)} className="text-red-700">ไม่อนุมัติ</button></>}</td></tr>)}</tbody></table></div>
    {resource.data?.applications.length === 0 && <p>ไม่พบผู้สมัครตามตัวกรอง</p>}
    {preview?.competitionId === competitionId && <section className="space-y-3 rounded border border-purple-300 p-4"><h3 className="font-bold">ตัวอย่างประกาศผล: {options.data?.competitions.find(c => c.id === competitionId)?.name}</h3><p>ผู้ผ่าน {preview.applications.length} รายการ (ทุกกีฬาในรายการแข่งขันนี้)</p><ul>{preview.applications.map(a => <li key={a.id}>{a.user.studentId} · {a.user.profile?.firstName} {a.user.profile?.lastName} · {a.sport}</li>)}</ul><button disabled={!preview.applications.length || action.busy} onClick={publish} className="rounded bg-purple-700 px-4 py-2 text-white">ยืนยันประกาศผลตามตัวอย่าง</button></section>}
  </section>;
}
