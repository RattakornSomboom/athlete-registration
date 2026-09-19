"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { requestJson, errorMessage, statusLabel, type HistoryEvent } from "@/lib/phase4-client";
export const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900";
export const buttonClass = "rounded-lg bg-purple-700 px-4 py-2 text-white disabled:opacity-40";
export function Phase4Nav() {
  const path = usePathname();
  const links = path.startsWith("/club") ? [["/club/athletes","นักกีฬา"],["/club/review","บัญชีตัวจริง/สำรอง"],["/club/officials","เจ้าหน้าที่ทีม"]]
    : path.startsWith("/staff") || path.startsWith("/admin") ? [["/staff/applications","ใบสมัครนักกีฬา"],["/staff/rosters","บัญชีชมรม"],["/staff/officials","เจ้าหน้าที่ทีม"],["/staff/analytics","สถิติ"]]
    : path.startsWith("/team-official") ? [["/team-official/register","สมัครการแข่งขัน"],["/team-official/status","ผลการสมัคร"]] : [];
  if (!links.length || path.endsWith("/signup")) return null;
  return <nav aria-label="เมนูการสมัคร" className="flex flex-wrap gap-4 border-b bg-white px-6 py-3 text-sm text-purple-800">{links.map(([href,label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={path === href ? "font-bold underline" : ""}>{label}</Link>)}</nav>;
}
export function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex items-center justify-between gap-4"><h1 className="text-2xl font-bold text-purple-900">{title}</h1><LogoutButton /></header>{children}</div></main>;
}
export function Notice({ text }: { text: string }) { return text ? <p role="status" className="rounded-lg border border-purple-200 bg-purple-50 p-3">{text}</p> : null; }
export function History({ events }: { events: HistoryEvent[] }) {
  return <details className="mt-4"><summary className="cursor-pointer">ประวัติ ({events.length})</summary><ul className="space-y-2 p-3 text-sm">{events.map(e => <li key={e.id}>{new Date(e.createdAt).toLocaleString("th-TH")} · {statusLabel[e.action] || e.action}{e.reason ? " — " + e.reason : ""}</li>)}</ul></details>;
}
export function PrivateFile({ id }: { id: string }) {
  const [error, setError] = useState("");
  async function open() {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try { const data = await requestJson<{ url: string }>("/api/documents/" + id); if (tab) tab.location.href = data.url; else setError("กรุณาอนุญาตการเปิดแท็บเอกสาร"); }
    catch (e) { tab?.close(); setError(errorMessage(e)); }
  }
  return <span><button type="button" onClick={open} className="text-purple-700 underline">เปิดเอกสาร</button>{error && <span role="alert" className="ml-2 text-red-700">{error}</span>}</span>;
}
export function PrivateUpload({ label, value, onChange, disabled = false, retained = false }: { label: string; value: string; onChange: (id: string) => void; disabled?: boolean; retained?: boolean }) {
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    if (!["application/pdf","image/jpeg","image/png"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) { setMessage("รองรับ PDF/JPEG/PNG ขนาดไม่เกิน 5 MB"); return; }
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.set("file",file);
      const response = await fetch("/api/documents", { method:"POST", body:form });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      onChange(data.document.id); setMessage("อัปโหลดแล้ว: " + file.name + " — กดบันทึกเพื่อผูกกับรายการ");
    } catch(e) { setMessage(errorMessage(e)); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await requestJson("/api/documents/" + value, {}, "DELETE"); onChange(""); setMessage("ลบแล้ว กรุณาบันทึกข้อมูล"); }
    catch(e) { setMessage(errorMessage(e)); } finally { setBusy(false); }
  }
  return <div className="space-y-2 rounded-lg border bg-white p-3"><label className="block font-medium">{label}<input aria-label={label} type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={disabled || busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} className="block w-full py-2 text-sm" /></label><p className="text-xs text-slate-500">PDF/JPEG/PNG ไม่เกิน 5 MB</p>{value && <div className="flex gap-4"><PrivateFile id={value}/>{!disabled && <button type="button" onClick={remove} disabled={busy} className="text-red-700">{retained ? "ลบเฉพาะไฟล์ร่างที่ยังไม่เคยส่ง" : "ลบไฟล์ร่าง"}</button>}</div>}<Notice text={busy ? "กำลังดำเนินการ…" : message}/></div>;
}

