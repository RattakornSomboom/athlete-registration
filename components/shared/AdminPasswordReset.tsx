"use client";
import { useState } from "react";
import { fetchJson } from "@/lib/http-client";

export default function AdminPasswordReset({ id, kind = "users", label }: { id: string; kind?: "users" | "clubs"; label: string }) {
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function close() { setPassword(""); setVerified(false); setError(""); setOpen(false); }
  return <>
    <button type="button" className="border rounded px-3 py-1 text-sm text-blue-900" onClick={() => setOpen(true)}>รีเซ็ตรหัส</button>
    {open && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-label="รีเซ็ตรหัสผ่าน" className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 text-slate-900 text-left">
        <h2 className="font-bold text-lg">รีเซ็ตรหัสผ่าน: {label}</h2>
        {password ? <>
          <p>รหัสผ่านชั่วคราวแสดงครั้งนี้เท่านั้น กรุณาส่งมอบให้เจ้าของบัญชีผ่านช่องทางที่ยืนยันตัวแล้ว ผู้ใช้ต้องเปลี่ยนรหัสก่อนใช้งาน</p>
          <output className="block break-all font-mono bg-slate-100 p-3 select-all">{password}</output>
          <p className="text-sm">บัญชีที่ถูกระงับจะยังเข้าใช้งานไม่ได้</p>
        </> : <>
          <p>การยืนยันจะยกเลิกรหัสผ่านและ session เดิมทันที ไม่มีการส่งอีเมล</p>
          <label className="flex gap-2"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} />ฉันได้ยืนยันว่าเป็นเจ้าของบัญชีที่แจ้งลืมรหัสผ่านแล้ว</label>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <button type="button" disabled={!verified || busy} className="bg-blue-900 text-white p-2 rounded disabled:opacity-50" onClick={async () => {
            setBusy(true); setError("");
            try { const result = await fetchJson<{ temporaryPassword: string }>(`/api/admin/${kind}/${id}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identityVerified: verified }) }); setPassword(result.temporaryPassword); }
            catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถรีเซ็ตได้"); }
            finally { setBusy(false); }
          }}>{busy ? "กำลังรีเซ็ต..." : "ยืนยันออกรหัสชั่วคราว"}</button>
        </>}
        <button type="button" disabled={busy} className="border p-2 rounded" onClick={close}>{password ? "บันทึกรหัสแล้ว ปิด" : "ยกเลิก"}</button>
      </section>
    </div>}
  </>;
}
