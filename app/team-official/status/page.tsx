"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Page,Notice,History,PrivateFile,buttonClass} from "@/components/shared/Phase4UI";
import {requestJson,errorMessage,statusLabel,type OfficialRecord} from "@/lib/phase4-client";
import {documentLabels} from "@/lib/official-labels";
export default function Status(){
 const [rows,setRows]=useState<OfficialRecord[]>([]);const [busy,setBusy]=useState(true);const [message,setMessage]=useState("");
 useEffect(()=>{let active=true;requestJson<{applications:OfficialRecord[]}>("/api/team-official/applications").then(d=>{if(active)setRows(d.applications);}).catch(e=>{if(active)setMessage(errorMessage(e));}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[]);
 return <Page title="ผลการสมัครเจ้าหน้าที่ทีม"><Notice text={message}/><Link className={buttonClass} href="/team-official/register">สมัครการแข่งขัน / แก้ไขข้อมูล</Link>{busy&&<p>กำลังโหลด…</p>}{!busy&&!rows.length&&<p>ยังไม่มีใบสมัคร</p>}{rows.map(a=><section key={a.id} className="space-y-3 rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">{a.competition.name} · {a.club?.name}</h2><p>{statusLabel[a.status]||a.status}</p><Link className="text-purple-700 underline" href={"/team-official/register?competitionId="+encodeURIComponent(a.competitionId)}>ดู / แก้ไขใบสมัคร</Link><ul>{Object.entries(a.documents).filter(([,id])=>id).map(([key,id])=><li key={key}>{documentLabels[key]}: <PrivateFile id={id}/></li>)}</ul><History events={a.events}/></section>)}</Page>;
}

