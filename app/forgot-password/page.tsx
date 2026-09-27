"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchJson, requestMessage } from "@/lib/http-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await fetchJson<{ message: string }>(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      setSubmitted(true);
    } catch (err) {
      setError(requestMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-900 text-xl font-bold mb-1">
            🔑
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ลืมรหัสผ่าน</h1>
          <p className="text-xs text-slate-500">
            กรอกอีเมลที่ใช้กับบัญชีของคุณเพื่อดำเนินการตั้งรหัสผ่านใหม่
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
                <span>📬</span> ตรวจสอบกล่องจดหมายของคุณ
              </div>
              <p>
                หากอีเมลนี้มีบัญชีอยู่ในระบบ เราจะส่งขั้นตอนการตั้งรหัสผ่านใหม่ให้
                กรุณาตรวจสอบอีเมลและทำตามคำแนะนำในลิงก์ที่ได้รับ
              </p>
              <p className="text-[11px] text-emerald-700">
                (ลิงก์จะมีอายุการใช้งาน 15 นาทีเพื่อความปลอดภัย)
              </p>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-semibold text-blue-900 hover:text-blue-700 hover:underline"
              >
                ← กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมล <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="66xxxxxx@up.ac.th หรืออีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                maxLength={254}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden transition-all"
              />
            </div>

            {error && (
              <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              {loading ? "กำลังส่งคำขอ..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline transition-colors"
              >
                ← กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
