"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/shared/BackButton";
import { UP_FACULTIES } from "@/lib/up-faculties";
import {
  saveAthleteProfile,
  hasAthleteProfile,
  calcBirthYearCE,
  type AthleteProfile,
} from "@/lib/athlete-profile";
import {
  ALL_THAI_PROVINCES,
  getAmphuresByProvince,
  getTambonsByAmphure,
} from "@/lib/thailand-addresses";

// TODO: เชื่อม API จริงตอน Backend พร้อม
const validatePassword = (password: string) => {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  return { hasUpper, hasLower, hasNumber, hasSpecial, valid: hasUpper && hasLower && hasNumber && hasSpecial };
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  // register มี 2 ขั้น: "account" (studentId+password) และ "profile" (ข้อมูลส่วนตัว)
  const [registerStep, setRegisterStep] = useState<"account" | "profile">("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Login state
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Register step 1 — account
  const [registerForm, setRegisterForm] = useState({
    studentId: "",
    password: "",
    confirmPassword: "",
  });

  // Register step 2 — personal profile
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [profileForm, setProfileForm] = useState<Omit<AthleteProfile, "studentId" | "birthYearCE" | "previousEntriesCount" | "photoName" | "photoUrl">>({
    firstName: "",
    lastName: "",
    gender: "",
    faculty: "",
    major: "",
    studentLevel: "bachelor",
    year: "",
    nationalId: "",
    nationality: "ไทย",
    birthDate: "",
    gpaSemester: "",
    gpaCumulative: "",
    addressNo: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    phone: "",
  });

  const setProfile = (field: string, value: string) =>
    setProfileForm((prev) => ({ ...prev, [field]: value }));

  const username = registerForm.studentId ? `${registerForm.studentId}@up.ac.th` : "";
  const passwordCheck = validatePassword(registerForm.password);

  // Validation — profile step
  const profileValid = !!(
    profileForm.firstName && profileForm.lastName && profileForm.gender &&
    profileForm.faculty && profileForm.major && profileForm.studentLevel && profileForm.year &&
    profileForm.nationalId && profileForm.nationality && profileForm.birthDate &&
    profileForm.addressNo && profileForm.subDistrict && profileForm.district &&
    profileForm.province && profileForm.postalCode && profileForm.phone
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // TODO: เชื่อม API Login จริง
      if (!loginForm.username.endsWith("@up.ac.th")) {
        setError("กรุณาใช้ Username รูปแบบ รหัสนิสิต@up.ac.th");
        return;
      }
      if (!loginForm.password) {
        setError("กรุณากรอกรหัสผ่าน");
        return;
      }
      await new Promise((r) => setTimeout(r, 800));
      document.cookie = `role=athlete; path=/`;
      // บันทึก studentId ที่กำลัง login
      const studentId = loginForm.username.replace("@up.ac.th", "");
      localStorage.setItem("current_student_id", studentId);

      // ตรวจว่ามี profile แล้วหรือยัง
      if (hasAthleteProfile(studentId)) {
        router.push("/athlete/register");
      } else {
        // ถ้าไม่มีข้อมูลส่วนตัว ให้ไปกรอกก่อน
        router.push("/athlete/register");
      }
    } finally {
      setLoading(false);
    }
  };

  // Register Step 1 — ตรวจ account แล้วไป Step 2
  const handleRegisterAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!registerForm.studentId || !/^\d{8}$/.test(registerForm.studentId)) {
      setError("รหัสนิสิตต้องเป็นตัวเลข 8 หลัก");
      return;
    }
    if (!passwordCheck.valid) {
      setError("รหัสผ่านไม่ผ่านเกณฑ์ที่กำหนด");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    // ไปขั้นตอนถัดไป (กรอกข้อมูลส่วนตัว)
    setRegisterStep("profile");
  };

  // Register Step 2 — บันทึกข้อมูลส่วนตัว + redirect
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // TODO: ส่ง API Register จริง → บันทึก account + profile ลง DB
      await new Promise((r) => setTimeout(r, 800));

      const birthYearCE = calcBirthYearCE(profileForm.birthDate);

      const profile: AthleteProfile = {
        studentId: registerForm.studentId,
        ...profileForm,
        birthYearCE,
        previousEntriesCount: 0,
        photoName: photo?.name,
        photoUrl: photoUrl || undefined,
      };

      saveAthleteProfile(profile);

      document.cookie = `role=athlete; path=/`;
      router.push("/athlete/register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center p-4 font-sans text-slate-800"
      style={{ backgroundImage: "url('/images/cover-bg.jpg')" }}
    >
      {/* Dark / Blur Backdrop Overlay */}
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[2px]" />

      {/* ===== Case 1: LOGIN หรือ REGISTER STEP 1 (แบบ 2 คอลัมน์ ตาม Screenshot) ===== */}
      {registerStep !== "profile" ? (
        <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/20">

          {/* ฝั่งซ้าย: ฟอร์มเข้าสู่ระบบ / ลงทะเบียน */}
          <div className="p-8 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Logo และหัวเรื่อง */}
              <div className="text-center mb-5">
                <div className="w-20 h-20 rounded-full mx-auto mb-3 shadow-md border-2 border-slate-200 overflow-hidden bg-white p-1">
                  <img
                    src="/images/system-logo.jpg"
                    alt="Logo ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  ยินดีต้อนรับ
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  เข้าสู่ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ
                </p>
                <p className="text-[10px] text-blue-900 font-semibold mt-0.5">
                  Information System for Sports Management and Excellence Development
                </p>
              </div>

              {/* Tabs: เข้าสู่ระบบ / ลงทะเบียนครั้งแรก */}
              <div className="flex rounded-lg bg-slate-100 p-1 mb-5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setRegisterStep("account"); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === "login" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); setRegisterStep("account"); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === "register" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  ลงทะเบียน (ครั้งแรก)
                </button>
              </div>

              {/* ===== MODE: LOGIN ===== */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้ใช้งาน (Username ทางการ)
                    </label>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                      placeholder="66xxxxxx@up.ac.th"
                      required
                      autoComplete="off"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
                      >
                        {showPassword ? "ซ่อน" : "แสดง"}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* ปุ่มสีแดงโค้งมน ตาม Screenshot 2026-09-26 195849 */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#e11d48] hover:bg-[#be123c] active:scale-[0.99] text-white font-bold py-2.5 rounded-full text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบด้วย UP Account"}</span>
                  </button>

                  {/* ทางลัดเข้าสู่ระบบตามบทบาท */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                      ทางลัดเข้าสู่ระบบด่วน (Quick Role Access)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => router.push("/athlete/register")}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        นิสิต / นักกีฬา
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/club/competitions")}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        ประธานชมรมกีฬา
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/team-official/register")}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        เจ้าหน้าที่ทีม / โค้ช
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/staff/applications")}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        เจ้าหน้าที่กองกิจ
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ===== MODE: REGISTER STEP 1 (ACCOUNT) ===== */}
              {mode === "register" && (
                <form onSubmit={handleRegisterAccount} className="space-y-3.5">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900">
                    กรอกรหัสประจำตัวนิสิต 8 หลัก เพื่อสร้างบัญชีผู้ใช้งานระบบสารสนเทศ
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสประจำตัวนิสิต (8 หลัก)</label>
                    <input
                      type="text"
                      value={registerForm.studentId}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, studentId: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                      placeholder="66xxxxxx"
                      required
                      maxLength={8}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                    {registerForm.studentId.length === 8 && (
                      <p className="text-[11px] text-slate-500 mt-1">Username ทางการของคุณคือ <span className="font-semibold text-blue-900">{username}</span></p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">กำหนดรหัสผ่าน</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="กำหนดรหัสผ่านความปลอดภัยสูง"
                        required
                        autoComplete="new-password"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]">
                        {showPassword ? "ซ่อน" : "แสดง"}
                      </button>
                    </div>

                    {/* Password checklist */}
                    {registerForm.password.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1 p-2 bg-slate-50 border border-slate-200 rounded-md">
                        {[
                          { ok: passwordCheck.hasUpper, label: "A-Z อย่างน้อย 1 ตัว" },
                          { ok: passwordCheck.hasLower, label: "a-z อย่างน้อย 1 ตัว" },
                          { ok: passwordCheck.hasNumber, label: "0-9 อย่างน้อย 1 ตัว" },
                          { ok: passwordCheck.hasSpecial, label: "อักษรพิเศษอย่างน้อย 1 ตัว" },
                        ].map((item) => (
                          <p key={item.label} className={`text-[10px] flex items-center gap-1 ${item.ok ? "text-emerald-700 font-medium" : "text-slate-400"}`}>
                            <span>{item.ok ? "✓" : "○"}</span> {item.label}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ยืนยันรหัสผ่านอีกครั้ง</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="กรอกรหัสผ่านเดิมซ้ำอีกครั้ง"
                        required
                        autoComplete="new-password"
                        className={`w-full px-3.5 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-900 outline-none pr-10 ${registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword ? "border-rose-300" : "border-slate-300"}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]">
                        {showConfirmPassword ? "ซ่อน" : "แสดง"}
                      </button>
                    </div>
                  </div>

                  {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

                  <button
                    type="submit"
                    disabled={!passwordCheck.valid || registerForm.password !== registerForm.confirmPassword || registerForm.studentId.length !== 8}
                    className="w-full bg-[#e11d48] hover:bg-[#be123c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-full text-xs transition-colors shadow-md cursor-pointer"
                  >
                    ถัดไป: บันทึกข้อมูลประวัตินิสิต →
                  </button>
                </form>
              )}
            </div>

            {/* Footer ข้อมูลติดต่อ (ตาม Screenshot 2026-09-26 195849) */}
            <div className="text-center text-[11px] text-slate-400 pt-4 mt-4 border-t border-slate-100">
              <p className="font-medium text-slate-600">
                พบปัญหา โทร. 054-466-666 ต่อ 6290-6295
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                (งานกีฬา กองกิจการนิสิต มหาวิทยาลัยพะเยา)
              </p>
            </div>
          </div>

          {/* ฝั่งขวา: รูปภาพ graphic เต็มพื้นที่ + ปุ่มปิด (X) + แถบคู่มือการใช้งานระบบ (ตาม Screenshot 2026-09-26 195849) */}
          <div className="hidden md:flex flex-col justify-between relative bg-slate-950 text-white overflow-hidden">
            {/* Close button (X) at top right */}
            <Link
              href="/"
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors shadow-md backdrop-blur-xs"
              title="กลับหน้าหลัก"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>

            {/* รูปภาพ graphic แทนส่วนเดิม เต็มพื้นที่ ไม่มีรูปเดิมหรือข้อความเดิม */}
            <div className="relative flex-1 w-full h-full min-h-[380px] overflow-hidden flex items-center justify-center bg-slate-950">
              <img
                src="/images/graphic.jpg"
                alt="ระบบรักษาความปลอดภัยดิจิทัล"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* แถบด้านล่าง: คู่มือการใช้งานระบบสารสนเทศ */}
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="relative z-10 w-full py-3 px-4 bg-slate-900/90 hover:bg-slate-900 text-white/90 hover:text-white text-xs font-medium text-center transition-colors border-t border-white/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>คู่มือการใช้งานระบบสารสนเทศ</span>
            </button>
          </div>
        </div>
      ) : (
        /* ===== Case 2: REGISTER STEP 2 (กรอกข้อมูลประวัตินิสิต) ===== */
        <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleRegisterProfile} className="space-y-4">

            {/* Header step 2 */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
              <div>
                <p className="text-sm font-bold text-slate-900">บันทึกข้อมูลประวัตินิสิต (ขั้นตอนที่ 2)</p>
                <p className="text-[11px] text-slate-500">ข้อมูลนี้จะถูกบันทึกเป็นฐานข้อมูลประวัตินักกีฬาทางการของสถาบัน</p>
              </div>
              <BackButton
                onClick={() => { setRegisterStep("account"); setError(""); }}
                label="ย้อนกลับขั้นตอนที่ 1"
              />
            </div>

            {/* Mini step indicator */}
            <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-white">✓</div>
                <span className="text-slate-500 font-medium">1. กำหนดรหัสผ่าน</span>
              </div>
              <div className="w-6 h-0.5 bg-blue-900" />
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center text-[10px] font-bold text-white">2</div>
                <span className="text-slate-900 font-bold">2. บันทึกข้อมูลประวัตินิสิต</span>
              </div>
            </div>

            {/* รูปถ่าย */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">
                รูปถ่ายหน้าตรงชุดนิสิต (ขนาด 1 นิ้ว สำหรับทำบัตรประจำตัว)
              </p>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-slate-50 transition-colors overflow-hidden relative bg-slate-50 shrink-0">
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} alt="รูปถ่ายนิสิต" className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium text-center px-1">
                        คลิกเพื่อเปลี่ยนรูป
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <svg className="w-8 h-8 mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-[11px] text-slate-600 font-medium">แนบรูปถ่าย</span>
                      <span className="text-[9px] text-slate-400">ขนาด 1 นิ้ว</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size <= 5 * 1024 * 1024) {
                        setPhoto(file);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setPhotoUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">คำแนะนำรูปถ่ายทางการ:</p>
                  <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5">
                    <li>รูปถ่ายหน้าตรง สวมชุดนิสิตถูกระเบียบ</li>
                    <li>พื้นหลังสีขาวหรือสีฟ้า ไม่สวมหมวกหรือแว่นตาดำ</li>
                    <li>ขนาดไฟล์ไม่เกิน 5 MB (JPG หรือ PNG)</li>
                  </ul>
                  {photo && (
                    <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                      ✓ แนบไฟล์: {photo.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ข้อมูลนิสิต */}
            <p className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-100 uppercase tracking-wider">
              ข้อมูลส่วนตัวและสถานภาพการศึกษา
            </p>

            {/* ช่องเลือกเพศ (อยู่ด้านบนกรอกชื่อ ตามคำขอ) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เพศ</label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                value={profileForm.gender}
                onChange={(e) => setProfile("gender", e.target.value)}
              >
                <option value="">-- กรุณาเลือกเพศ --</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            {/* ชื่อ - นามสกุล */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อจริง</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="ชื่อจริง" value={profileForm.firstName} onChange={(e) => setProfile("firstName", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">นามสกุล</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="นามสกุล" value={profileForm.lastName} onChange={(e) => setProfile("lastName", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">รหัสประจำตัวนิสิต</label>
              <input
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 font-mono cursor-not-allowed"
                value={registerForm.studentId}
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">คณะ / วิทยาลัย</label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                value={profileForm.faculty}
                onChange={(e) => { setProfile("faculty", e.target.value); setProfile("major", ""); }}
              >
                <option value="">-- กรุณาเลือกคณะต้นสังกัด --</option>
                {UP_FACULTIES.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">สาขาวิชา</label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                  value={profileForm.major}
                  onChange={(e) => setProfile("major", e.target.value)}
                  disabled={!profileForm.faculty}
                >
                  <option value="">{profileForm.faculty ? "-- กรุณาเลือกสาขา --" : ""}</option>
                  {UP_FACULTIES.find((f) => f.name === profileForm.faculty)?.majors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ระดับการศึกษา</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setProfile("studentLevel", "bachelor")} className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${profileForm.studentLevel === "bachelor" ? "bg-blue-900 text-white border-blue-900 font-bold" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>ปริญญาตรี</button>
                  <button type="button" onClick={() => setProfile("studentLevel", "graduate")} className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${profileForm.studentLevel === "graduate" ? "bg-blue-900 text-white border-blue-900 font-bold" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>บัณฑิตศึกษา</button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ชั้นปีปัจจุบัน</label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                value={profileForm.year}
                onChange={(e) => setProfile("year", e.target.value)}
              >
                <option value="">เลือกชั้นปี</option>
                {["1", "2", "3", "4", "5", "6"].map((y) => (
                  <option key={y} value={y}>ปีที่ {y}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เลขบัตรประจำตัวประชาชน</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none" placeholder="X-XXXX-XXXXX-XX-X" value={profileForm.nationalId} onChange={(e) => setProfile("nationalId", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">สัญชาติ</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={profileForm.nationality} onChange={(e) => setProfile("nationality", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">วันเดือนปีเกิด</label>
                <input type="date" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={profileForm.birthDate} onChange={(e) => setProfile("birthDate", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="0XX-XXX-XXXX" value={profileForm.phone} onChange={(e) => setProfile("phone", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เกรดเฉลี่ย (ภาคล่าสุด)</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none" placeholder="เช่น 3.25" value={profileForm.gpaSemester} onChange={(e) => setProfile("gpaSemester", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เกรดเฉลี่ยสะสม (GPAX)</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none" placeholder="เช่น 3.40" value={profileForm.gpaCumulative} onChange={(e) => setProfile("gpaCumulative", e.target.value)} />
              </div>
            </div>

            {/* ที่อยู่ Cascading Dropdown */}
            <p className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-100 uppercase tracking-wider">
              ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ปัจจุบัน
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">บ้านเลขที่ / หมู่ / ซอย / ถนน</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" placeholder="เช่น 99/1 หมู่ 2 ซ.สุขสวัสดิ์" value={profileForm.addressNo} onChange={(e) => setProfile("addressNo", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">จังหวัด</label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                  value={profileForm.province}
                  onChange={(e) => {
                    setProfile("province", e.target.value);
                    setProfile("district", "");
                    setProfile("subDistrict", "");
                    setProfile("postalCode", "");
                  }}
                >
                  <option value="">-- เลือกจังหวัด --</option>
                  {ALL_THAI_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">อำเภอ / เขต</label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                  value={profileForm.district}
                  onChange={(e) => {
                    setProfile("district", e.target.value);
                    setProfile("subDistrict", "");
                    setProfile("postalCode", "");
                  }}
                  disabled={!profileForm.province}
                >
                  <option value="">{profileForm.province ? "-- เลือกอำเภอ / เขต --" : ""}</option>
                  {profileForm.province && getAmphuresByProvince(profileForm.province).map((a) => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ตำบล / แขวง</label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                  value={profileForm.subDistrict}
                  onChange={(e) => {
                    const tambon = e.target.value;
                    setProfile("subDistrict", tambon);
                    // Auto-fill รหัสไปรษณีย์
                    if (profileForm.province && profileForm.district) {
                      const tambons = getTambonsByAmphure(profileForm.province, profileForm.district);
                      const found = tambons.find((t) => t.name === tambon);
                      if (found && found.postalCode) {
                        setProfile("postalCode", found.postalCode);
                      }
                    }
                  }}
                  disabled={!profileForm.district}
                >
                  <option value="">{profileForm.district ? "-- เลือกตำบล / แขวง --" : ""}</option>
                  {profileForm.province && profileForm.district && getTambonsByAmphure(profileForm.province, profileForm.district).map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">รหัสไปรษณีย์</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none" placeholder="เช่น 56000" value={profileForm.postalCode} onChange={(e) => setProfile("postalCode", e.target.value)} />
                {profileForm.postalCode && profileForm.subDistrict && (
                  <p className="text-[10px] text-emerald-700 font-medium mt-0.5">ระบุรหัสอัตโนมัติจากตำบลที่เลือก</p>
                )}
              </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading || !profileValid}
              className="w-full bg-[#e11d48] hover:bg-[#be123c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-full text-xs transition-colors shadow-md cursor-pointer"
            >
              {loading ? "กำลังบันทึกข้อมูลเข้าฐานข้อมูล..." : "บันทึกประวัติและเข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      )}

      {/* ===== POPUP MODAL: คู่มือการใช้งานระบบสารสนเทศ ===== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  คู่มือการใช้งานระบบสารสนเทศ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-900 mb-1">🏃 สำหรับนิสิต / นักกีฬา:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>ลงทะเบียนด้วยรหัสนิสิต 8 หลัก และกำหนดรหัสผ่านความปลอดภัย</li>
                  <li>กรอกข้อมูลประวัติการศึกษาและแนบรูปถ่ายหน้าตรงชุดนิสิต</li>
                  <li>ยื่นใบสมัครคัดเลือกชนิดกีฬาที่เปิดรับ (สูงสุด 4 ชนิด) และแนบเอกสารรับรอง UP 02</li>
                  <li>ติดตามผลการคัดเลือกและยืนยันสิทธิ์ในระบบเมื่อได้รับการประกาศชื่อ</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-900 mb-1">🏆 สำหรับชมรมกีฬา:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>เข้าสู่ระบบด้วยบัญชีชมรมกีฬาต้นสังกัด</li>
                  <li>พิจารณาคัดเลือกนักกีฬาและจัดประเภทตัวจริง/ตัวสำรองตามโควตา กกมท.</li>
                  <li>ลงนามดิจิทัลรับรองบัญชีรายชื่อส่งต่อให้กองกิจการนิสิต</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-900 mb-1">🏛️ ช่องทางการติดต่อเจ้าหน้าที่:</p>
                <p className="text-[11px] text-slate-600">
                  งานกีฬาและนันทนาการ กองกิจการนิสิต มหาวิทยาลัยพะเยา<br />
                  โทร. 054-466-666 ต่อ 6290-6295 หรืออีเมล: <span className="font-mono text-blue-900">dsa@up.ac.th</span>
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                เข้าใจแล้ว / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
