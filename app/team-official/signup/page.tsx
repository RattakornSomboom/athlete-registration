"use client";
import {useState} from "react";
import Link from "next/link";
import {requestJson,errorMessage} from "@/lib/phase4-client";
import {fieldClass,buttonClass,Notice} from "@/components/shared/Phase4UI";
export default function Signup(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);const [message,setMessage]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);try{const d=await requestJson<{message:string}>("/api/auth/register-official",{email,password});setMessage(d.message);setPassword("");setDone(true);}catch(e){setMessage(errorMessage(e));}finally{setBusy(false);}}
 return <main className="mx-auto my-12 w-full max-w-lg space-y-6 rounded-xl border bg-white p-6 text-slate-900"><h1 className="text-2xl font-bold text-purple-900">สร้างบัญชีเจ้าหน้าที่ทีม</h1><p>สมัครด้วยอีเมลส่วนตัว จากนั้นเลือกชมรมและการแข่งขันเพื่อส่งใบสมัคร</p><Notice text={message}/>{!done&&<form onSubmit={submit} className="space-y-4"><label className="block">อีเมล<input className={fieldClass} type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)<input className={fieldClass} type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className={buttonClass} disabled={busy}>{busy?"กำลังสร้างบัญชี…":"สร้างบัญชี"}</button></form>}<Link href="/login" className="block text-purple-700 underline">มีบัญชีแล้ว / เข้าสู่ระบบ</Link></main>;
}

