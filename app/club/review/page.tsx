"use client";
import { useEffect, useState } from "react";
import { Page, Notice, History, PrivateUpload, fieldClass, buttonClass } from "@/components/shared/Phase4UI";
import { requestJson, errorMessage, type CompetitionOption, type HistoryEvent } from "@/lib/phase4-client";
type Item = { applicationId: string; squadType: string };
type View = { roster: null | { id: string; status: string; version: number; documentId: string | null; items: Item[]; events: HistoryEvent[] }; applications: { id:string;status:string;user:{studentId:string;profile:{firstName:string;lastName:string}|null} }[]; competition: CompetitionOption };
export default function ClubReviewPage() {
  const [competitions,setCompetitions] = useState<CompetitionOption[]>([]);
  const [competitionId,setCompetitionId] = useState(""); const [view,setView] = useState<View|null>(null);
  const [items,setItems] = useState<Item[]>([]); const [documentId,setDocumentId] = useState("");
  const [confirmed,setConfirmed] = useState(false); const [busy,setBusy] = useState(false); const [message,setMessage] = useState("");
  useEffect(() => { let active = true; requestJson<{competitions:CompetitionOption[]}>("/api/competitions").then(d => { if(active) setCompetitions(d.competitions); }).catch(e => { if(active) setMessage(errorMessage(e)); }); return () => { active=false; }; },[]);
  async function load(id: string) {
    setCompetitionId(id); setView(null); setConfirmed(false); setMessage(""); if(!id) return;
    setBusy(true);
    try { const data = await requestJson<View>("/api/club/rosters?competitionId="+encodeURIComponent(id)); setView(data);setItems(data.roster?.items ?? []);setDocumentId(data.roster?.documentId ?? ""); }
    catch(e) { setMessage(errorMessage(e)); } finally { setBusy(false); }
  }
  async function save(action: string) {
    setBusy(true);setMessage("");
    try {
      await requestJson("/api/club/rosters", { competitionId,version:view?.roster?.version ?? 0,action,items,documentId,advisorApproved:confirmed });
      await load(competitionId);setMessage(action === "submit" ? "ส่งบัญชีแล้ว บัญชีถูกล็อกจนเจ้าหน้าที่ส่งคืน" : "บันทึกร่างแล้ว");
    } catch(e) {setMessage(errorMessage(e));} finally {setBusy(false);}
  }
  const locked = view?.roster?.status === "SUBMITTED";
  const quota = view?.competition?.quotas[0];
  return <Page title="บัญชีตัวจริง / สำรองของชมรม"><Notice text={message}/><label>การแข่งขัน<select className={fieldClass} disabled={busy} value={competitionId} onChange={e => void load(e.target.value)}><option value="">เลือกการแข่งขัน</option>{competitions.map(c=><option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}</select></label>
    {busy && <p role="status">กำลังดำเนินการ…</p>}
    {view && <section className="space-y-4 rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{locked ? "ส่งบัญชีแล้ว — ล็อกการแก้ไข" : view.roster?.status === "RETURNED" ? "ส่งคืนแล้ว — แก้ไขและส่งใหม่ได้" : "รายการรอจัดทำบัญชี"}</h2><button type="button" disabled={busy} onClick={()=>void load(competitionId)} className="text-purple-700 underline">โหลดข้อมูลล่าสุด</button></div>
      <p>เลือกแล้ว: ตัวจริง {items.filter(i=>i.squadType==="main").length} / {quota?.maxStarters ?? 0} · สำรอง {items.filter(i=>i.squadType==="reserve").length} / {quota?.maxSubstitutes ?? 0}</p>
      <p className="text-sm text-slate-500">ใบสมัครที่ไม่เลือกจะยังไม่ถูกปฏิเสธ รายการเดิมที่ผ่านกองกิจฯ แล้วแสดงเพื่ออ้างอิงและไม่สร้างประวัติย้อนหลัง</p>
      {!view.applications.length ? <p>ยังไม่มีใบสมัครในกีฬาของชมรมสำหรับการแข่งขันนี้</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="p-2">นักกีฬา</th><th>ผลปัจจุบัน</th><th>บัญชี</th></tr></thead><tbody>{view.applications.map(a=><tr key={a.id} className="border-t"><td className="p-2">{a.user.profile?.firstName} {a.user.profile?.lastName}<small className="block">{a.user.studentId}</small></td><td>{a.status}</td><td><select aria-label={"ประเภท " + a.user.studentId} className={fieldClass} disabled={busy || locked || !["SUBMITTED","CLUB_APPROVED"].includes(a.status)} value={items.find(i=>i.applicationId===a.id)?.squadType ?? ""} onChange={e=>setItems(old=>[...old.filter(i=>i.applicationId!==a.id),...(e.target.value ? [{applicationId:a.id,squadType:e.target.value}] : [])])}><option value="">ยังไม่เลือก</option><option value="main">ตัวจริง</option><option value="reserve">สำรอง</option></select></td></tr>)}</tbody></table></div>}
      <PrivateUpload label="เอกสารบัญชีลงนามรับรอง (บังคับก่อนส่ง)" value={documentId} onChange={setDocumentId} disabled={busy || locked} retained={!!view.roster?.events.some(e=>e.action==="SUBMITTED")}/>
      {!locked && <><label className="flex gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>ยืนยันว่าอาจารย์ที่ปรึกษารับรองรายชื่อและลงนามแล้ว</label><div className="flex gap-3"><button className={buttonClass} disabled={busy} onClick={()=>void save("save")}>บันทึกร่าง</button><button className={buttonClass} disabled={busy || !confirmed || !documentId || !items.length} onClick={()=>void save("submit")}>ส่งบัญชีให้กองกิจฯ</button></div></>}
      <History events={view.roster?.events ?? []}/>
    </section>}
  </Page>;
}

