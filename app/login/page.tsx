"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UP_FACULTIES } from "@/lib/up-faculties";

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
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
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
    profileForm.firstName && profileForm.lastName &&
    profileForm.faculty && profileForm.major && profileForm.studentLevel && profileForm.year &&
    profileForm.nationalId && profileForm.nationality && profileForm.birthDate &&
    profileForm.addressNo && profileForm.subDistrict && profileForm.district &&
    profileForm.province && profileForm.postalCode && profileForm.phone
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      // รองรับทั้ง studentId@up.ac.th และ email ชมรม
      const isStudentEmail = loginForm.username.endsWith("@up.ac.th");
      const isClubEmail = loginForm.username.includes("@") && !loginForm.username.endsWith("@up.ac.th");

      if (!loginForm.username.includes("@")) {
        setError("กรุณาใช้ Username รูปแบบ รหัสนิสิต@up.ac.th หรือ email ชมรม");
        return;
      }
      if (!loginForm.password) {
        setError("กรุณากรอกรหัสผ่าน");
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      // redirect ตาม role
      const role = data.role;
      if (role === "athlete") {
        localStorage.setItem("current_student_id", data.user.studentId);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/athlete/register");
      } else if (role === "club") {
        localStorage.setItem("current_club_id", data.club.id);
        localStorage.setItem("club", JSON.stringify(data.club));
        router.push("/club/athletes");
      } else if (role === "team_official") {
        router.push("/team-official/status");
      } else if (role === "staff") {
        router.push("/staff/applications");
      } else if (role === "admin") {
        router.push("/admin/clubs");
      } else {
        router.push("/");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: registerForm.studentId,
          password: registerForm.password,
          profile: {
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            faculty: profileForm.faculty,
            major: profileForm.major,
            studentLevel: profileForm.studentLevel,
            year: profileForm.year,
            nationalId: profileForm.nationalId,
            nationality: profileForm.nationality,
            birthDate: profileForm.birthDate,
            gpaSemester: profileForm.gpaSemester || undefined,
            gpaCumulative: profileForm.gpaCumulative || undefined,
            addressNo: profileForm.addressNo,
            subDistrict: profileForm.subDistrict,
            district: profileForm.district,
            province: profileForm.province,
            postalCode: profileForm.postalCode,
            phone: profileForm.phone,
            photoUrl: photo?.name || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ลงทะเบียนไม่สำเร็จ");
        return;
      }

      // สมัครสำเร็จ → กลับไปหน้า Login พร้อม Username ที่กรอกไว้
      const createdUsername = `${registerForm.studentId}@up.ac.th`;
      setLoginForm({ username: createdUsername, password: "" });
      setMode("login");
      setRegisterStep("account");
      setSuccessMessage("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านที่ตั้งไว้");
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className={`bg-white rounded-xl shadow-xs border border-slate-200 w-full p-8 ${registerStep === "profile" ? "max-w-2xl" : "max-w-md"}`}>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-lg border border-blue-800">
            UP
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
            มหาวิทยาลัยพะเยา · กองกิจการนิสิต
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-1">ระบบสารสนเทศการคัดเลือกนักกีฬา</h1>
          <p className="text-xs text-slate-500 mt-0.5">กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52</p>
        </div>

        {/* Tab — ซ่อนตอนอยู่ใน profile step */}
        {registerStep !== "profile" && (
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 border border-slate-200">
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
        )}

        {/* ===== LOGIN FORM ===== */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อผู้ใช้งาน (Username ทางการ)</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="66xxxxxx@up.ac.th"
                required
                autoComplete="off"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]">
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            {successMessage && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 rounded-lg">{successMessage}</div>}
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {loading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบ"}
            </button>

            <p className="text-center text-xs text-slate-500">
              ยังไม่มีบัญชีในระบบ?{" "}
              <button type="button" onClick={() => setMode("register")} className="text-blue-900 font-semibold hover:underline">ลงทะเบียนครั้งแรก</button>
            </p>

            {/* ทางลัดเข้าสู่ระบบตามบทบาทสำหรับทดสอบ */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                ทางลัดเข้าสู่ระบบตามกลุ่มผู้ใช้งาน (Quick Access)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/athlete/status")}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                >
                  นิสิต / นักกีฬา
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/club/athletes")}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                >
                  ประธานชมรมกีฬา
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/team-official/status")}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors text-center cursor-pointer"
                >
                  เจ้าหน้าที่ทีม / โค้ช
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/staff/analytics")}
                  className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded text-[11px] font-semibold transition-colors text-center cursor-pointer"
                >
                  เจ้าหน้าที่กองกิจการนิสิต
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===== REGISTER STEP 1: กรอก Account ===== */}
        {mode === "register" && registerStep === "account" && (
          <form onSubmit={handleRegisterAccount} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none pr-12"
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
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-900 outline-none pr-12 ${registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword
                    ? "border-rose-300 focus:ring-rose-400"
                    : "border-slate-300"
                    }`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]">
                  {showConfirmPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
              {registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1">รหัสผ่านไม่ตรงกัน</p>
              )}
              {registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">✓ รหัสผ่านตรงกันเรียบร้อย</p>
              )}
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={!passwordCheck.valid || registerForm.password !== registerForm.confirmPassword || registerForm.studentId.length !== 8}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              ถัดไป: บันทึกข้อมูลประวัตินิสิต →
            </button>

            <p className="text-center text-xs text-slate-500">
              มีบัญชีในระบบอยู่แล้ว?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-blue-900 font-semibold hover:underline">เข้าสู่ระบบ</button>
            </p>
          </form>
        )}

        {/* ===== REGISTER STEP 2: กรอกข้อมูลส่วนตัว ===== */}
        {mode === "register" && registerStep === "profile" && (
          <form onSubmit={handleRegisterProfile} className="space-y-4">

            {/* Header step 2 */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
              <div>
                <p className="text-sm font-bold text-slate-900">บันทึกข้อมูลประวัตินิสิต (ขั้นตอนที่ 2)</p>
                <p className="text-[11px] text-slate-500">ข้อมูลนี้จะถูกบันทึกเป็นฐานข้อมูลประวัตินักกีฬาทางการของสถาบัน</p>
              </div>
              <button
                type="button"
                onClick={() => { setRegisterStep("account"); setError(""); }}
                className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded cursor-pointer"
              >
                ← ย้อนกลับ
              </button>
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
              <p className="text-xs font-semibold text-slate-700 mb-1.5">รูปถ่ายหน้าตรงชุดนิสิต (ขนาด 1 นิ้ว สำหรับทำบัตรประจำตัว)</p>
              <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-slate-50 transition-colors">
                <span className="text-xs text-slate-500 text-center px-2">{photo ? photo.name : "คลิกแนบรูปถ่าย"}</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) setPhoto(file);
                  }}
                />
              </label>
            </div>

            {/* ข้อมูลนิสิต */}
            <p className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-100 uppercase tracking-wider">ข้อมูลส่วนตัวและสถานภาพการศึกษา</p>

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

            {/* ที่อยู่ */}
            <p className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-100 uppercase tracking-wider">ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ปัจจุบัน</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">บ้านเลขที่ / หมู่</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={profileForm.addressNo} onChange={(e) => setProfile("addressNo", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ตำบล / แขวง</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={profileForm.subDistrict} onChange={(e) => setProfile("subDistrict", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">อำเภอ / เขต</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={profileForm.district} onChange={(e) => setProfile("district", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">จังหวัด</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none" value={profileForm.province} onChange={(e) => setProfile("province", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">รหัสไปรษณีย์</label>
                <input className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 outline-none" value={profileForm.postalCode} onChange={(e) => setProfile("postalCode", e.target.value)} />
              </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading || !profileValid}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {loading ? "กำลังบันทึกข้อมูลเข้าฐานข้อมูล..." : "บันทึกประวัติและเข้าสู่ระบบ"}
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-slate-400 mt-6 border-t border-slate-100 pt-3">
          หากพบปัญหาการเข้าใช้งานระบบ กรุณาติดต่องานกีฬา กองกิจการนิสิต มหาวิทยาลัยพะเยา
        </p>
      </div>
    </div>
  );
}
