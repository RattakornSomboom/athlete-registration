"use client";

import { useState, useMemo } from "react";
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
  // register มี 3 ขั้น: "select_role" (เลือกกลุ่มผู้ใช้), "account" (studentId+password) และ "profile" (ข้อมูลส่วนตัว)
  const [registerStep, setRegisterStep] = useState<"select_role" | "account" | "profile">("select_role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState<"athlete" | "club" | "staff" | "official" | "faq">("athlete");

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

  // Memoize รายการอำเภอและตำบล เพื่อป้องกันการคำนวณซ้ำตอนพิมพ์ฟอร์ม (O(1) Optimized)
  const amphureOptions = useMemo(() => {
    return profileForm.province ? getAmphuresByProvince(profileForm.province) : [];
  }, [profileForm.province]);

  const tambonOptions = useMemo(() => {
    return profileForm.province && profileForm.district
      ? getTambonsByAmphure(profileForm.province, profileForm.district)
      : [];
  }, [profileForm.province, profileForm.district]);

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
                <div className="w-20 h-20 rounded-full mx-auto mb-2 shadow-md border-2 border-slate-200 overflow-hidden bg-white p-1">
                  <img
                    src="/images/system-logo.png"
                    alt="Logo ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  ยินดีต้อนรับ
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
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
                  onClick={() => { setMode("login"); setError(""); setRegisterStep("select_role"); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === "login" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); setRegisterStep("select_role"); }}
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
                      Username
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
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
                    <span>{loading ? "กำลังตรวจสอบสิทธิ์..." : "Login"}</span>
                  </button>

                  {/* ทางลัดเข้าสู่ระบบตามบทบาท */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                      ทางลัดเข้าสู่ระบบด่วน (Quick Role Access)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          document.cookie = "role=athlete; path=/";
                          router.push("/athlete/register");
                        }}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        นิสิต / นักกีฬา
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          document.cookie = "role=club; path=/";
                          router.push("/club/competitions");
                        }}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        ประธานชมรมกีฬา
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          document.cookie = "role=team_official; path=/";
                          router.push("/team-official/register");
                        }}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        เจ้าหน้าที่ทีม / โค้ช
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          document.cookie = "role=staff; path=/";
                          router.push("/staff/applications");
                        }}
                        className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        เจ้าหน้าที่กองกิจ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          document.cookie = "role=admin; path=/";
                          router.push("/admin/clubs");
                        }}
                        className="col-span-2 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-[11px] font-semibold transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>ผู้ดูแลระบบ (Admin)</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ===== MODE: REGISTER - STEP 0: SELECT ROLE ===== */}
              {mode === "register" && registerStep === "select_role" && (
                <div className="space-y-3">
                  <div className="text-center pb-1">
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      เลือกกลุ่มผู้ใช้งานเพื่อลงทะเบียน
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      โปรดเลือกประเภทบัญชีผู้ใช้งานที่ท่านต้องการเปิดใหม่
                    </p>
                  </div>

                  {/* Card 1: นิสิต / นักกีฬา */}
                  <div
                    onClick={() => { setRegisterStep("account"); setError(""); }}
                    className="border border-slate-200 hover:border-blue-900 bg-slate-50 hover:bg-white rounded-xl p-3.5 transition-all cursor-pointer group text-left shadow-2xs hover:shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-900 transition-colors">
                          นิสิต / นักกีฬาตัวแทนสถาบัน
                        </h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold font-mono">
                        @up.ac.th
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-9">
                      สำหรับนิสิต ม.พะเยา ทุกชั้นปี ใช้อีเมลนิสิตและรหัสนิสิต 8 หลัก เพื่อบันทึกประวัติการศึกษา เกรดเฉลี่ยสะสม และสมัครเข้ารับการคัดเลือก
                    </p>
                    <div className="pl-9 pt-1 flex items-center justify-between text-[11px] font-semibold text-blue-900 group-hover:translate-x-0.5 transition-transform">
                      <span>ลงทะเบียนบัญชีนักกีฬาใหม่</span>
                      <span>→</span>
                    </div>
                  </div>

                  {/* Card 2: ผู้จัดการทีม / ผู้ฝึกสอน (โค้ช) */}
                  <div
                    onClick={() => {
                      document.cookie = "role=team_official; path=/";
                      router.push("/team-official/register");
                    }}
                    className="border border-slate-200 hover:border-emerald-800 bg-slate-50 hover:bg-white rounded-xl p-3.5 transition-all cursor-pointer group text-left shadow-2xs hover:shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs group-hover:text-emerald-800 transition-colors">
                          ผู้จัดการทีม / ผู้ฝึกสอนกีฬา (โค้ช)
                        </h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        อาจารย์ / โค้ช
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-9">
                      สำหรับอาจารย์ที่ปรึกษา บุคลากร หรือผู้ฝึกสอนภายนอก บันทึกข้อมูลตำแหน่งทีม สังกัดชนิดกีฬา และแนบแผนการฝึกซ้อม
                    </p>
                    <div className="pl-9 pt-1 flex items-center justify-between text-[11px] font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                      <span>ลงทะเบียนเจ้าหน้าที่ทีม / โค้ช</span>
                      <span>→</span>
                    </div>
                  </div>

                  {/* หมายเหตุสำหรับประธานชมรมและกองกิจ */}
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-[10px] text-amber-900 space-y-1 mt-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      หมายเหตุสำหรับประธานชมรมและเจ้าหน้าที่:
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      บัญชีสำหรับ <strong>ประธานชมรมกีฬา</strong> และ <strong>เจ้าหน้าที่กองกิจการนิสิต</strong> จะได้รับการจัดสรรและแต่งตั้งโดยผู้ดูแลระบบ (Admin) โดยตรง ไม่ต้องเปิดบัญชีใหม่
                    </p>
                  </div>
                </div>
              )}

              {/* ===== MODE: REGISTER STEP 1 (ATHLETE ACCOUNT) ===== */}
              {mode === "register" && registerStep === "account" && (
                <form onSubmit={handleRegisterAccount} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { setRegisterStep("select_role"); setError(""); }}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                    >
                      <span>← เปลี่ยนประเภทผู้ใช้งาน</span>
                    </button>
                    <span className="text-[10px] text-blue-900 font-semibold px-2 py-0.5 bg-blue-50 rounded">
                      บัญชีนิสิตนักกีฬา
                    </span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900">
                    กรอกรหัสประจำตัวนิสิต 8 หลัก เพื่อสร้างบัญชีนักกีฬา
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

            {/* ตัวเลือกสำหรับนิสิตปี 1 เทอม 1 */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileForm.isFreshmanFirstTerm || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setProfileForm((prev) => ({
                      ...prev,
                      isFreshmanFirstTerm: checked,
                      year: checked ? "1" : prev.year,
                      gpaSemester: checked ? "ยังไม่มีเกรด (ปี 1 เทอม 1)" : "",
                      gpaCumulative: checked ? "ยังไม่มีเกรด (ปี 1 เทอม 1)" : "",
                    }));
                  }}
                  className="mt-0.5 rounded text-blue-900 focus:ring-blue-900 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-blue-950 block">
                    เป็นนิสิตเข้าใหม่ ชั้นปีที่ 1 ภาคเรียนที่ 1 (ยังไม่มีเกรด/เกรดเฉลี่ยสะสม)
                  </span>
                  <span className="text-[11px] text-blue-800/80 leading-relaxed block mt-0.5">
                    *ได้รับการยกเว้นเกรดเฉลี่ยสะสมตามระเบียบ กกมท. โดยจะใช้ใบรับรองสภาพนิสิต (UP 02) ในการพิจารณาแทน
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เกรดเฉลี่ย (ภาคล่าสุด)</label>
                <input
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="เช่น 3.25"
                  value={profileForm.gpaSemester}
                  onChange={(e) => setProfile("gpaSemester", e.target.value)}
                  disabled={profileForm.isFreshmanFirstTerm}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เกรดเฉลี่ยสะสม (GPAX)</label>
                <input
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="เช่น 3.40"
                  value={profileForm.gpaCumulative}
                  onChange={(e) => setProfile("gpaCumulative", e.target.value)}
                  disabled={profileForm.isFreshmanFirstTerm}
                />
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
                  {amphureOptions.map((a) => (
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
                    const found = tambonOptions.find((t) => t.name === tambon);
                    if (found && found.postalCode) {
                      setProfile("postalCode", found.postalCode);
                    }
                  }}
                  disabled={!profileForm.district}
                >
                  <option value="">{profileForm.district ? "-- เลือกตำบล / แขวง --" : ""}</option>
                  {tambonOptions.map((t, idx) => (
                    <option key={`${t.name}-${idx}`} value={t.name}>{t.name}</option>
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

      {/* ===== POPUP MODAL: คู่มือการใช้งานระบบสารสนเทศ (ฉบับสมบูรณ์) ===== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    คู่มือการใช้งานระบบสารสนเทศ (SMED UP)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 pl-4.5">
                  ระบบสารสนเทศเพื่อการบริหารจัดการและพัฒนากีฬาสู่ความเป็นเลิศ มหาวิทยาลัยพะเยา
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Role Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setGuideActiveTab("athlete")}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  guideActiveTab === "athlete"
                    ? "bg-blue-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                นิสิต / นักกีฬา
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab("club")}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  guideActiveTab === "club"
                    ? "bg-blue-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ชมรมกีฬา
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab("staff")}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  guideActiveTab === "staff"
                    ? "bg-blue-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                กองกิจการนิสิต
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab("official")}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  guideActiveTab === "official"
                    ? "bg-blue-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                เจ้าหน้าที่ทีม / ผู้ฝึกสอน
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab("faq")}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  guideActiveTab === "faq"
                    ? "bg-blue-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                เกณฑ์ กกมท. & เอกสาร
              </button>
            </div>

            {/* Tab Contents: Scrollable */}
            <div className="overflow-y-auto pr-1 text-xs text-slate-600 space-y-3.5 flex-1">

              {/* TAB 1: นิสิต / นักกีฬา */}
              {guideActiveTab === "athlete" && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">ขั้นตอนที่ 1: การลงทะเบียนและบันทึกประวัติตั้งต้น</h4>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 pl-1">
                      <li>เข้าสู่เมนู <strong>"ลงทะเบียนเข้าใช้งาน"</strong> แล้วเลือกกลุ่มผู้ใช้เป็น <strong>"นิสิต / นักกีฬา"</strong></li>
                      <li>กำหนดรหัสผ่านความปลอดภัย (ความยาวขั้นต่ำ 8 ตัวอักษร ประกอบด้วยอักษรตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ)</li>
                      <li>กรอกข้อมูลประวัตินิสิต: รหัสนิสิต 8 หลัก, ชื่อ-นามสกุล, เพศ, สังกัดคณะ, สาขาวิชา, ชั้นปี, เบอร์โทรศัพท์ และอีเมล</li>
                      <li>
                        <strong>การระบุผลการเรียนสะสม (GPAX):</strong>
                        <ul className="list-disc list-inside pl-4 mt-0.5 space-y-0.5 text-slate-500">
                          <li><span className="font-medium text-slate-700">กรณีทั่วไป:</span> ต้องมีเกรดเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 2.00 ตามเกณฑ์ กกมท.</li>
                          <li><span className="font-medium text-slate-700">กรณีนิสิตชั้นปีที่ 1 ภาคเรียนที่ 1:</span> ให้ทำเครื่องหมายเลือก <em>"เป็นนิสิตปี 1 เทอม 1 (ยังไม่มีเกรดเฉลี่ยสะสม)"</em> เพื่อปิดช่องกรอกเกรดและได้รับการยกเว้นตามระเบียบ กกมท.</li>
                        </ul>
                      </li>
                      <li>แนบรูปถ่ายหน้าตรงชุดนิสิต ขนาด 1 นิ้ว (ไฟล์ภาพ JPG/PNG พื้นหลังเรียบสุภาพ) เพื่อใช้ในฐานข้อมูลกลางและการออกบัตรประจำตัวนักกีฬา (AD Card)</li>
                    </ol>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">ขั้นตอนที่ 2: การยื่นใบสมัครรับการคัดเลือก (3 ขั้นตอนย่อย)</h4>
                    </div>
                    <div className="space-y-2 text-[11px] text-slate-600 pl-1">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="font-semibold text-blue-950 block mb-0.5">1. ข้อมูลส่วนตัวและสังกัดชมรม</span>
                        ตรวจสอบข้อมูลประวัติตั้งต้น และเลือกสังกัดชมรมกีฬา (หากไม่ได้สังกัดชมรม ให้ระบุชื่อ-ตำแหน่งอาจารย์/ผู้ฝึกสอนที่รับรอง พร้อมแนบหนังสือขออนุมัติ)
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="font-semibold text-blue-950 block mb-0.5">2. เลือกชนิดกีฬาและประเภทการแข่งขัน</span>
                        เลือกชนิดกีฬาที่เปิดรับสมัคร และระบุประเภทการแข่งขัน (เช่น ทีมชาย, ทีมหญิง, บุคคลชาย, บุคคลหญิง) และรอบการแข่งขัน
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="font-semibold text-blue-950 block mb-0.5">3. ประวัติการแข่งขันและเอกสารแนบหลักฐาน (4 รายการ)</span>
                        ระบุประวัติการเคยเข้าร่วมแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย (ไม่เกิน 5 ครั้ง) และแนบเอกสารรับรองความถูกต้อง:
                        <ul className="list-disc list-inside pl-2 mt-1 space-y-0.5 text-slate-500">
                          <li>รูปถ่ายหน้าตรงชุดนิสิต ขนาด 1 นิ้ว (ดึงจากประวัติตั้งต้นอัตโนมัติ)</li>
                          <li>สำเนาบัตรประจำตัวประชาชน พร้อมรับรองสำเนาถูกต้อง</li>
                          <li><strong>สำเนาบัตรประจำตัวนิสิต</strong> หรือ <strong>ภาพแคปหน้าจอทะเบียนนิสิตจากระบบ REG</strong> (กรณีปี 1 ที่ยังไม่ได้รับบัตร หรือนิสิตที่ไม่มีบัตร)</li>
                          <li>ใบรับรองการเป็นนิสิต (UP 02) จากกองบริการการศึกษา</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">ขั้นตอนที่ 3: การติดตามสถานะและข้อเสนอแนะ</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      ติดตามสถานะใบสมัครได้ที่เมนู <strong>"ติดตามสถานะการสมัคร"</strong> ระบบจะแสดงความคืบหน้า 2 ระดับ:
                      <br />• <strong>การพิจารณาของชมรมกีฬา:</strong> รอพิจารณา, ผ่านคัดเลือกเป็นตัวจริง (Main Squad), ตัวสำรอง (Reserve Squad) หรือส่งกลับแก้ไข
                      <br />• <strong>การรับรองจากกองกิจการนิสิต:</strong> รอการตรวจสอบ, อนุมัติขึ้นทะเบียนตัวแทนมหาวิทยาลัย หรือส่งกลับพร้อมเหตุผล
                      <br />*กรณีเอกสารถูกตีกลับ นิสิตสามารถอ่านข้อคิดเห็น (Comment) และคลิกอัปโหลดเอกสารใหม่ส่งกลับไปให้ชมรมได้ทันที
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: ชมรมกีฬา */}
              {guideActiveTab === "club" && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">1. การเข้าถึงและการซิงค์รายการแข่งขัน</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      • เข้าสู่ระบบด้วยบัญชีชมรมกีฬาต้นสังกัด เพื่อเข้าสู่หน้าแดชบอร์ดรายการแข่งขัน
                      <br />• รายการแข่งขันจะ<strong>ซิงค์สถานะเปิด/ปิดกับกองกิจการนิสิตโดยอัตโนมัติ</strong> รายการที่เปิดรับสมัครสามารถคลิกเข้าไปดูใบสมัครได้ ส่วนรายการที่ยังไม่เปิดรับจะแสดงแถบสีเทาพร้อมเหตุผล
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">2. การตรวจสอบคุณสมบัติและเอกสารรายบุคคล</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-600 pl-1">
                      <li><strong>Automated Rule Checker:</strong> ระบบประเมินคุณสมบัติเบื้องต้นตามเกณฑ์ กกมท. อัตโนมัติ (อายุ ≤ 28 ปี, GPAX ≥ 2.00 หรือยกเว้นปี 1 เทอม 1, และแข่งไม่เกิน 5 ครั้ง)</li>
                      <li><strong>การตรวจสอบเอกสารแนบ:</strong> สามารถคลิกดูเอกสารของผู้สมัครแต่ละคนได้แบบแยกไฟล์</li>
                      <li><strong>การอนุมัติ/ตีกลับเอกสารแยกชิ้น:</strong> เจ้าหน้าที่ชมรมสามารถกด "อนุมัติ" หรือ "ปฏิเสธ" เอกสารแต่ละรายการ หากปฏิเสธสามารถระบุข้อคิดเห็น (Comment) ส่งกลับไปยังนิสิตเพื่อให้นิสิตส่งเอกสารที่ถูกต้องมาใหม่</li>
                      <li><strong>การจัดกลุ่มนักกีฬา:</strong> กำหนดสถานะผู้สมัครเป็น "นักกีฬาตัวจริง (Main Squad)" หรือ "นักกีฬาสำรอง (Reserve Squad)" ตามโควตาที่ระเบียบกำหนด</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">3. การส่งบัญชีรายชื่อและการติดตามสถานะ</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      • เมื่อพิจารณาและตรวจสอบเอกสารครบถ้วน ให้กดปุ่ม <strong>"ส่งบัญชีรายชื่อให้กองกิจการนิสิต"</strong>
                      <br />• ติดตามสถานะของแต่ละรายการและการตรวจสอบจากกองกิจการนิสิตได้ที่หน้า <strong>"ติดตามสถานะส่งรายชื่อ"</strong> หากมีเอกสารที่กองกิจการนิสิตตีกลับมา ชมรมสามารถประสานงานให้นักกีฬาแก้ไขได้ทันท่วงที
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: กองกิจการนิสิต */}
              {guideActiveTab === "staff" && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">1. การตรวจสอบบัญชีรายชื่อนักกีฬาตัวแทน</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      • แสดงบัญชีรายชื่อนักกีฬาที่ผ่านการคัดเลือกจากแต่ละชมรมกีฬา แยกตามชนิดกีฬาและรายการแข่งขัน
                      <br />• ตรวจสอบความถูกต้องตามระเบียบคณะกรรมการบริหารกีฬามหาวิทยาลัยแห่งประเทศไทย (กกมท.) ครั้งที่ 52 และระเบียบมหาวิทยาลัยพะเยา
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">2. การอนุมัติขั้นสุดท้ายหรือส่งกลับแก้ไข</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-600 pl-1">
                      <li><strong>อนุมัติขึ้นทะเบียน:</strong> รับรองรายชื่อนักกีฬาเข้าสู่บัญชีตัวแทนมหาวิทยาลัยพะเยาอย่างเป็นทางการ</li>
                      <li><strong>ส่งกลับพร้อมข้อเสนอแนะ:</strong> หากพบเอกสารไม่ถูกต้องหรือไม่ครบถ้วน สามารถระบุข้อคิดเห็น (Feedback) และส่งกลับไปยังชมรมกีฬาเพื่อให้แก้ไข</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">3. การวิเคราะห์ข้อมูลและการส่งออกรายงาน</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      • สรุปผลการคัดเลือกและจัดทำทะเบียนนักกีฬาตัวแทนสถาบัน
                      <br />• ส่งออกข้อมูลบัญชีรายชื่อเป็นไฟล์รายงาน CSV (รองรับ UTF-8 BOM สำหรับเปิดในโปรแกรม Excel ได้อย่างสมบูรณ์) เพื่อใช้ขึ้นทะเบียนอย่างเป็นทางการกับ กกมท.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: เจ้าหน้าที่ทีม / ผู้ฝึกสอน */}
              {guideActiveTab === "official" && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">1. การขึ้นทะเบียนเจ้าหน้าที่ทีมและผู้ฝึกสอน</h4>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 pl-1">
                      <li>เข้าสู่ระบบและเลือกเมนู <strong>"ขึ้นทะเบียนเจ้าหน้าที่ทีม"</strong></li>
                      <li>
                        เลือกประเภทหน้าที่รับผิดชอบ:
                        <span className="block pl-4 text-slate-500 mt-0.5">
                          • ผู้จัดการทีม (Team Manager)<br />
                          • ผู้ฝึกสอน (Head Coach)<br />
                          • ผู้ช่วยผู้ฝึกสอน (Assistant Coach)<br />
                          • เจ้าหน้าที่ประจำทีม / นักกายภาพ (Official / Physiotherapist)
                        </span>
                      </li>
                      <li>กรอกข้อมูลประวัติ สังกัดคณะ/หน่วยงาน และระบุชนิดกีฬาที่สังกัด</li>
                      <li>แนบคำสั่งแต่งตั้งหรือหนังสือรับรองการปฏิบัติหน้าที่จากต้นสังกัด/มหาวิทยาลัย</li>
                    </ol>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">2. การติดตามสถานะการขึ้นทะเบียน</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      ตรวจสอบสถานะการอนุมัติได้ที่หน้า <strong>"ติดตามสถานะเจ้าหน้าที่ทีม"</strong> เมื่อกองกิจการนิสิตตรวจสอบคำสั่งแต่งตั้งแล้ว จะดำเนินการออกบัตรประจำตัวเจ้าหน้าที่ทีม (Official AD Card) ต่อไป
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: เกณฑ์ กกมท. & เอกสาร */}
              {guideActiveTab === "faq" && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">คุณสมบัตินักกีฬาตามระเบียบ กกมท. ครั้งที่ 52</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                      <li><strong>สถานะการศึกษา:</strong> ต้องเป็นนิสิตที่กำลังศึกษาอยู่ในระดับปริญญาตรี หรือบัณฑิตศึกษา ของมหาวิทยาลัยพะเยา</li>
                      <li><strong>อายุ:</strong> อายุไม่เกิน 28 ปีบริบูรณ์ (คำนวณตามปี พ.ศ. เกิด)</li>
                      <li><strong>ผลการเรียนสะสม (GPAX):</strong> ไม่ต่ำกว่า 2.00 ตลอดระยะเวลาการศึกษา</li>
                      <li><strong>กรณีนิสิตชั้นปีที่ 1 เทอม 1:</strong> ได้รับการยกเว้นไม่ต้องมีผลการเรียนสะสม โดยใช้ใบรับรองสภาพนิสิตและการลงทะเบียนเรียน (UP 02) แนบแทนตามระเบียบ</li>
                      <li><strong>จำนวนครั้งที่เข้าร่วมแข่งขัน:</strong> สามารถเข้าร่วมการแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทยได้สูงสุดไม่เกิน 5 ครั้ง ตลอดการศึกษา</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                      <h4 className="font-semibold text-slate-900 text-xs">ข้อกำหนดของไฟล์เอกสารแนบ</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                      <li><strong>รูปแบบไฟล์ที่รองรับ:</strong> PDF, JPG, JPEG, PNG</li>
                      <li><strong>ขนาดไฟล์:</strong> ไม่เกิน 5 MB ต่อไฟล์</li>
                      <li><strong>ความชัดเจนของเอกสาร:</strong> ตัวหนังสือ ตัวเลข และภาพถ่ายต้องชัดเจน ไม่เบลอหรือถูกตัดทอน</li>
                      <li><strong>สำเนาบัตรประจำตัวนิสิต:</strong> หากเป็นนิสิตชั้นปีที่ 1 ที่ยังไม่ได้รับบัตร หรือนิสิตชั้นปีอื่น ๆ ที่ไม่มีบัตร สามารถแคปภาพหน้าจอข้อมูลทะเบียนนิสิตจากระบบ REG มาแนบแทนได้</li>
                      <li>สำเนาเอกสารทุกฉบับควรลงลายมือชื่อรับรองสำเนาถูกต้องกำกับไว้</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ช่องทางติดต่อประสานงาน */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
                <p className="font-semibold text-blue-950 mb-1 text-[11px]">ศูนย์ประสานงานระบบสารสนเทศด้านกีฬา (SMED UP):</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  งานส่งเสริมและพัฒนากีฬาสู่ความเป็นเลิศ กองกิจการนิสิต มหาวิทยาลัยพะเยา<br />
                  อาคารสงวนเสริมศรี โทรศัพท์: 054-466-666 ต่อ 6290 - 6295 (วันและเวลาราชการ 08:30 - 16:30 น.)<br />
                  อีเมล: <span className="font-mono text-blue-900 font-medium">dsa@up.ac.th</span> | เว็บไซต์: <span className="font-mono text-blue-900 font-medium">smed.up.ac.th</span>
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400">
                เวอร์ชัน 1.0 (อัปเดตระเบียบ กกมท. ครั้งที่ 52)
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
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
