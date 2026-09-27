"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchJson, HttpError, requestMessage } from "@/lib/http-client";

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [targetEmail, setTargetEmail] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isTokenPresent = Boolean(token);
  const isTokenValid = isTokenPresent ? tokenValid : false;
  const displayError = isTokenPresent ? error : "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่";

  // Validate token on mount
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    fetchJson<{ valid: boolean; email?: string; error?: string }>(
      `/api/auth/reset-password?token=${encodeURIComponent(token)}`
    )
      .then((data) => {
        if (!isMounted) return;
        if (data.valid) {
          setTokenValid(true);
          if (data.email) setTargetEmail(data.email);
        } else {
          setTokenValid(false);
          setError(data.error || "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTokenValid(false);
        setError(err instanceof Error ? err.message : "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่");
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isTokenValid !== true) return;
    setError("");

    if (password.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("รหัสผ่านยาวเกิน 72 ไบต์");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      await fetchJson("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      setSuccess(true);
    } catch (err) {
      setError(requestMessage(err));
      if (err instanceof HttpError && err.status === 400 && !Object.keys(err.fieldErrors).length) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLengthValid = password.length >= 8;
  const isByteLengthValid = password.length > 0 && new TextEncoder().encode(password).length <= 72;
  const isMatchValid = password && password === confirmPassword;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-900 text-xl font-bold mb-1">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-xs text-slate-500">
            {targetEmail
              ? `กำหนดรหัสผ่านใหม่สำหรับบัญชี ${targetEmail}`
              : "กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ"}
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-800 space-y-2 text-center">
              <div className="text-2xl">🎉</div>
              <h2 className="font-bold text-green-900 text-sm">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</h2>
              <p>คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ หากบัญชีถูกระงับ กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งาน</p>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              เข้าสู่ระบบด้วยรหัสผ่านใหม่ →
            </button>
          </div>
        ) : isTokenValid === false ? (
          /* Invalid / Expired Token State */
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-2">
              <div className="font-semibold text-rose-900 text-sm flex items-center gap-1.5">
                <span>⚠️</span> ลิงก์ไม่ถูกต้องหรือหมดอายุ
              </div>
              <p>{displayError || "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่"}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/forgot-password"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg text-xs text-center transition-colors cursor-pointer"
              >
                ขอลิงก์ตั้งรหัสผ่านใหม่
              </Link>
              <Link
                href="/login"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-xs text-center transition-colors cursor-pointer"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        ) : isTokenValid === null ? (
          /* Checking Token State */
          <div className="py-8 text-center text-xs text-slate-400">
            กำลังตรวจสอบความถูกต้องของลิงก์...
          </div>
        ) : (
          /* Reset Password Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่านใหม่ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden pr-12 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่านใหม่" : "แสดงรหัสผ่านใหม่"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden pr-12 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "ซ่อนการยืนยันรหัสผ่าน" : "แสดงการยืนยันรหัสผ่าน"}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  {showConfirmPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
              <div className={`flex items-center gap-1.5 ${isLengthValid ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                <span>{isLengthValid ? "✓" : "○"}</span>
                <span>ความยาวอย่างน้อย 8 ตัวอักษร</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isMatchValid ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                <span>{isMatchValid ? "✓" : "○"}</span>
                <span>รหัสผ่านตรงกันทั้งสองช่อง</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isByteLengthValid ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                <span>{isByteLengthValid ? "✓" : "○"}</span>
                <span>ไม่เกิน 72 ไบต์ (ภาษาไทยใช้หลายไบต์ต่ออักษร)</span>
              </div>
            </div>

            {error && (
              <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isLengthValid || !isByteLengthValid || !isMatchValid}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
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

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  return <ResetPasswordForm key={token} token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-xs text-slate-400">
          กำลังโหลด...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
