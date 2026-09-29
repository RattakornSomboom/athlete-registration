"use client";
import { useState } from "react";
import { fetchJson } from "@/lib/http-client";
import LogoutButton from "@/components/shared/LogoutButton";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
    <form className="w-full max-w-md bg-white rounded-xl p-6 space-y-4 border" onSubmit={async event => {
      event.preventDefault(); setError("");
      if (newPassword !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
      setBusy(true);
      try {
        await fetchJson("/api/auth/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldPassword, newPassword, confirmPassword }) });
        window.location.assign("/login");
      } catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้"); }
      finally { setBusy(false); }
    }}>
      <h1 className="text-xl font-bold">เปลี่ยนรหัสผ่านก่อนใช้งาน</h1>
      <p>กรอกรหัสผ่านชั่วคราวที่ได้รับจากผู้ดูแล แล้วตั้งรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์</p>
      <label className="block">รหัสผ่านปัจจุบันหรือรหัสชั่วคราว<input className="block w-full border p-2" type="password" autoComplete="current-password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} /></label>
      <label className="block">รหัสผ่านใหม่<input className="block w-full border p-2" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
      <label className="block">ยืนยันรหัสผ่านใหม่<input className="block w-full border p-2" type="password" autoComplete="new-password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="bg-blue-900 text-white rounded p-2">{busy ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่านและเข้าสู่ระบบใหม่"}</button>
      <LogoutButton />
    </form>
  </main>;
}
