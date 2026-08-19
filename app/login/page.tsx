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
        router.push("/club/competitions");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 w-full p-8 ${registerStep === "profile" ? "max-w-2xl" : "max-w-md"}`}>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">UP</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">ระบบลงทะเบียนนักกีฬา</h1>
          <p className="text-gray-500 text-sm mt-1">กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52</p>
        </div>

        {/* Tab — ซ่อนตอนอยู่ใน profile step */}
        {registerStep !== "profile" && (
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setRegisterStep("account"); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); setRegisterStep("account"); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              ลงทะเบียน (ครั้งแรก)
            </button>
          </div>
        )}

        {/* ===== LOGIN FORM ===== */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="xxxxxxxx@up.ac.th"
                required
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            {successMessage && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">{successMessage}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            <p className="text-center text-xs text-gray-400">
              ยังไม่มีบัญชี?{" "}
              <button type="button" onClick={() => setMode("register")} className="text-blue-600 hover:underline">ลงทะเบียนครั้งแรก</button>
            </p>
          </form>
        )}

        {/* ===== REGISTER STEP 1: กรอก Account ===== */}
        {mode === "register" && registerStep === "account" && (
          <form onSubmit={handleRegisterAccount} className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              กรอกรหัสนิสิตเพื่อสร้าง Username สำหรับเข้าสู่ระบบในครั้งถัดไป
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนิสิต</label>
              <input
                type="text"
                value={registerForm.studentId}
                onChange={(e) => setRegisterForm((p) => ({ ...p, studentId: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                placeholder="xxxxxxxx"
                required
                maxLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {registerForm.studentId.length === 8 && (
                <p className="text-xs text-gray-500 mt-1">Username ของคุณคือ <span className="font-medium text-blue-600">{username}</span></p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ตั้งรหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="ตั้งรหัสผ่าน"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>

              {/* Password checklist */}
              {registerForm.password.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {[
                    { ok: passwordCheck.hasUpper, label: "A-Z อย่างน้อย 1 ตัว" },
                    { ok: passwordCheck.hasLower, label: "a-z อย่างน้อย 1 ตัว" },
                    { ok: passwordCheck.hasNumber, label: "0-9 อย่างน้อย 1 ตัว" },
                    { ok: passwordCheck.hasSpecial, label: "อักษรพิเศษอย่างน้อย 1 ตัว" },
                  ].map((item) => (
                    <p key={item.label} className={`text-xs flex items-center gap-1 ${item.ok ? "text-green-600" : "text-gray-400"}`}>
                      <span>{item.ok ? "✓" : "○"}</span> {item.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="ยืนยันรหัสผ่าน"
                  required
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-300"
                    }`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showConfirmPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
              {registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
              )}
              {registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword && (
                <p className="text-xs text-green-600 mt-1">✓ รหัสผ่านตรงกัน</p>
              )}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={!passwordCheck.valid || registerForm.password !== registerForm.confirmPassword || registerForm.studentId.length !== 8}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              ถัดไป: กรอกข้อมูลส่วนตัว →
            </button>

            <p className="text-center text-xs text-gray-400">
              มีบัญชีอยู่แล้ว?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-blue-600 hover:underline">เข้าสู่ระบบ</button>
            </p>
          </form>
        )}

        {/* ===== REGISTER STEP 2: กรอกข้อมูลส่วนตัว ===== */}
        {mode === "register" && registerStep === "profile" && (
          <form onSubmit={handleRegisterProfile} className="space-y-4">

            {/* Header step 2 */}
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => { setRegisterStep("account"); setError(""); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← ย้อนกลับ
              </button>
              <div>
                <p className="text-sm font-medium text-gray-900">กรอกข้อมูลส่วนตัว</p>
                <p className="text-xs text-gray-500">ข้อมูลนี้จะถูกบันทึกและใช้ในการสมัครแข่งขัน</p>
              </div>
            </div>

            {/* Mini step indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-xs font-medium text-white">✓</div>
                <span className="text-xs text-gray-400">ตั้งรหัสผ่าน</span>
              </div>
              <div className="w-6 h-0.5 bg-blue-600" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white">2</div>
                <span className="text-xs text-gray-900 font-medium">ข้อมูลส่วนตัว</span>
              </div>
            </div>

            {/* รูปถ่าย */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">รูปถ่ายชุดนิสิต (ขนาด 1 นิ้ว)</p>
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <span className="text-2xl mb-1">📷</span>
                <span className="text-xs text-gray-500 text-center px-2">{photo ? photo.name : "แนบรูปถ่าย"}</span>
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
            <p className="text-sm font-medium text-gray-700 pt-2">ข้อมูลนิสิต</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="" value={profileForm.firstName} onChange={(e) => setProfile("firstName", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="" value={profileForm.lastName} onChange={(e) => setProfile("lastName", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนิสิต</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                value={registerForm.studentId}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คณะ</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={profileForm.faculty}
                onChange={(e) => { setProfile("faculty", e.target.value); setProfile("major", ""); }}
              >
                <option value="">-- กรุณาเลือกคณะ --</option>
                {UP_FACULTIES.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สาขา</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ระดับการศึกษา</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setProfile("studentLevel", "bachelor")} className={`px-2 py-2.5 rounded-lg text-xs font-medium border transition-colors ${profileForm.studentLevel === "bachelor" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ปริญญาตรี</button>
                  <button type="button" onClick={() => setProfile("studentLevel", "graduate")} className={`px-2 py-2.5 rounded-lg text-xs font-medium border transition-colors ${profileForm.studentLevel === "graduate" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>บัณฑิตศึกษา</button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={profileForm.year}
                onChange={(e) => setProfile("year", e.target.value)}
              >
                <option value="">เลือกชั้นปี</option>
                {["1", "2", "3", "4", "5", "6"].map((y) => (
                  <option key={y} value={y}>ปี {y}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประจำตัวประชาชน</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="X-XXXX-XXXXX-XX-X" value={profileForm.nationalId} onChange={(e) => setProfile("nationalId", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สัญชาติ</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.nationality} onChange={(e) => setProfile("nationality", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันเดือนปีเกิด</label>
                <input type="date" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.birthDate} onChange={(e) => setProfile("birthDate", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0XX-XXX-XXXX" value={profileForm.phone} onChange={(e) => setProfile("phone", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เกรดเฉลี่ย (ภาคล่าสุด)</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="เช่น X.XX" value={profileForm.gpaSemester} onChange={(e) => setProfile("gpaSemester", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เกรดเฉลี่ยสะสม</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="เช่น X.XX" value={profileForm.gpaCumulative} onChange={(e) => setProfile("gpaCumulative", e.target.value)} />
              </div>
            </div>

            {/* ที่อยู่ */}
            <p className="text-sm font-medium text-gray-700 pt-2">ที่อยู่ปัจจุบัน</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.addressNo} onChange={(e) => setProfile("addressNo", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.subDistrict} onChange={(e) => setProfile("subDistrict", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.district} onChange={(e) => setProfile("district", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.province} onChange={(e) => setProfile("province", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.postalCode} onChange={(e) => setProfile("postalCode", e.target.value)} />
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading || !profileValid}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกและเข้าสู่ระบบ"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          หากมีปัญหาการเข้าใช้งาน กรุณาติดต่องานกิจการนิสิต
        </p>
      </div>
    </div>
  );
}