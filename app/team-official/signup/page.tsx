"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import BackButton from "@/components/shared/BackButton";

export default function TeamOfficialSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษรและไม่เกิน 72 ไบต์");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register-official", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error || "สร้างบัญชีไม่ได้ กรุณาลองใหม่");
        return;
      }
      setCreated(true);
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center p-4 font-sans text-slate-800"
      style={{ backgroundImage: "url('/images/cover-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[2px]" />
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white p-7 shadow-2xl sm:p-9">
        <div className="mb-5">
          <BackButton href="/login" label="กลับหน้าเข้าสู่ระบบ" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">
          สมัครบัญชีผู้จัดการทีม / ผู้ฝึกสอน
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          ใช้อีเมลที่ติดต่อได้เพื่อสร้างบัญชีเจ้าหน้าที่ทีม
        </p>

        {created ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              สร้างบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้
            </p>
            <Link
              href="/login"
              className="block rounded-full bg-[#e11d48] px-4 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#be123c]"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-busy={loading}>
            <div>
              <label htmlFor="official-email" className="mb-1 block text-xs font-semibold text-slate-700">
                อีเมล
              </label>
              <input
                id="official-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                disabled={loading}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
            <div>
              <label htmlFor="official-password" className="mb-1 block text-xs font-semibold text-slate-700">
                รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
              </label>
              <input
                id="official-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={loading}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
            <div>
              <label htmlFor="official-confirm-password" className="mb-1 block text-xs font-semibold text-slate-700">
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="official-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-emerald-800 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
