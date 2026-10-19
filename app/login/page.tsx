"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import BackButton from "@/components/shared/BackButton";
import ThaiDateInput from "@/components/shared/ThaiDateInput";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BuildingIcon,
  CheckIcon,
  CloseIcon,
  ClipboardListIcon,
  RunnerIcon,
  TrophyIcon,
} from "@/components/shared/Icons";
import { fetchJson, requestMessage } from "@/lib/http-client";
import {
  ALL_THAI_PROVINCES,
  getAmphuresByProvince,
  getTambonsByAmphure,
} from "@/lib/thailand-addresses";
import { UP_FACULTIES } from "@/lib/up-faculties";
import {
  calculateExactAge,
  evaluateAge,
  evaluateParticipationCount,
} from "@/lib/rule-checker";

const validatePassword = (password: string) => {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasLength = password.length >= 8 && new TextEncoder().encode(password).length <= 72;
  return { hasUpper, hasLower, hasNumber, hasSpecial, hasLength, valid: hasUpper && hasLower && hasNumber && hasSpecial && hasLength };
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<"select_role" | "account" | "profile">("select_role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const guideRef = useRef<HTMLDialogElement>(null);

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setRegisterStep("select_role");
    setError("");
    setProfileErrors({});
    setSuccessMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Login state
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Register step 1 — account
  const [registerForm, setRegisterForm] = useState({
    studentId: "",
    password: "",
    confirmPassword: "",
  });

  // Register step 2 — personal profile
  const [profileForm, setProfileForm] = useState({
    title: "",
    gender: "",
    firstName: "",
    lastName: "",
    faculty: "",
    major: "",
    studentLevel: "bachelor",
    year: "",
    semester: "",
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

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const clearProfileError = (field: string) => {
    setProfileErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setProfile = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    clearProfileError(field);
  };

  const handleTitleChange = (title: string) => {
    let autoGender = profileForm.gender;
    if (title === "Mr") autoGender = "male";
    else if (title === "Miss" || title === "Mrs") autoGender = "female";

    setProfileForm((prev) => ({
      ...prev,
      title,
      gender: autoGender,
    }));
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next.title;
      if (autoGender) delete next.gender;
      return next;
    });
  };

  const amphures = getAmphuresByProvince(profileForm.province);
  const tambons = getTambonsByAmphure(profileForm.province, profileForm.district);

  const handleProvinceChange = (province: string) => {
    setProfileForm((prev) => ({
      ...prev,
      province,
      district: "",
      subDistrict: "",
      postalCode: "",
    }));
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next.province;
      delete next.district;
      delete next.subDistrict;
      delete next.postalCode;
      return next;
    });
  };

  const handleDistrictChange = (district: string) => {
    setProfileForm((prev) => ({
      ...prev,
      district,
      subDistrict: "",
      postalCode: "",
    }));
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next.district;
      delete next.subDistrict;
      delete next.postalCode;
      return next;
    });
  };

  const handleSubDistrictChange = (subDistrict: string) => {
    const postalCode = tambons.find((item) => item.name === subDistrict)?.postalCode ?? "";
    setProfileForm((prev) => ({ ...prev, subDistrict, postalCode }));
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next.subDistrict;
      delete next.postalCode;
      return next;
    });
  };

  const handleGpaChange = (field: "gpaSemester" | "gpaCumulative", raw: string) => {
    let val = raw.replace(/[^\d.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = `${parts[0]}.${parts.slice(1).join("")}`;
    }
    if (val.length > 4) {
      val = val.slice(0, 4);
    }
    setProfile(field, val);
  };

  const handleGpaBlur = (field: "gpaSemester" | "gpaCumulative") => {
    const raw = profileForm[field].trim();
    if (!raw) return;
    const num = Number(raw);
    if (!Number.isNaN(num) && num >= 0 && num <= 4) {
      setProfile(field, num.toFixed(2));
    }
  };

  const username = registerForm.studentId ? `${registerForm.studentId}@up.ac.th` : "";
  const passwordCheck = validatePassword(registerForm.password);

  const birthDateObj = profileForm.birthDate ? new Date(profileForm.birthDate) : null;
  const currentCompYear = new Date().getFullYear();
  const dynamicAge = birthDateObj && !Number.isNaN(birthDateObj.getTime())
    ? calculateExactAge(birthDateObj)
    : null;
  const ageEvaluation = birthDateObj && !Number.isNaN(birthDateObj.getTime())
    ? evaluateAge(birthDateObj, currentCompYear)
    : null;
  const participationEvaluation = evaluateParticipationCount(
    0,
    profileForm.studentLevel === "graduate" ? "GRADUATE" : "BACHELOR",
  );
  const eligibilityOk = (ageEvaluation?.passed ?? true) && participationEvaluation.passed;

  // Validation — profile step
  const validateProfileForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!profileForm.title) {
      errors.title = "กรุณาเลือกคำนำหน้าชื่อ";
    }

    if (!profileForm.gender) {
      errors.gender = "กรุณาเลือกเพศ";
    }

    if (!profileForm.firstName.trim()) {
      errors.firstName = "กรุณากรอกชื่อจริง";
    }

    if (!profileForm.lastName.trim()) {
      errors.lastName = "กรุณากรอกนามสกุล";
    }

    if (!profileForm.faculty.trim()) {
      errors.faculty = "กรุณาเลือกคณะ / วิทยาลัย";
    }

    if (!profileForm.major.trim()) {
      errors.major = "กรุณาเลือกสาขาวิชา";
    }

    if (!profileForm.studentLevel) {
      errors.studentLevel = "กรุณาเลือกระดับการศึกษา";
    }

    if (!profileForm.year.trim()) {
      errors.year = "กรุณาเลือกชั้นปี";
    }

    if (profileForm.semester && !["1", "2", "3"].includes(profileForm.semester)) {
      errors.semester = "ภาคเรียนต้องเป็น 1, 2 หรือ 3";
    }

    const cleanNationalId = profileForm.nationalId.replace(/\D/g, "");
    if (!profileForm.nationalId.trim()) {
      errors.nationalId = "กรุณากรอกเลขบัตรประจำตัวประชาชน";
    } else if (cleanNationalId.length !== 13) {
      errors.nationalId = "เลขบัตรประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก";
    }

    if (!profileForm.nationality.trim()) {
      errors.nationality = "กรุณากรอกสัญชาติ";
    }

    if (!profileForm.birthDate.trim()) {
      errors.birthDate = "กรุณาระบุวันเดือนปีเกิด";
    } else {
      const d = new Date(profileForm.birthDate);
      if (Number.isNaN(d.getTime())) {
        errors.birthDate = "รูปแบบวันเดือนปีเกิดไม่ถูกต้อง";
      } else if (d > new Date()) {
        errors.birthDate = "วันเดือนปีเกิดต้องไม่เป็นวันที่ในอนาคต";
      } else if (ageEvaluation && !ageEvaluation.passed) {
        errors.birthDate = ageEvaluation.message || "อายุเกินเกณฑ์นักกีฬาตัวแทนสถาบัน (ไม่เกิน 28 ปี ตามเกณฑ์ กกมท.)";
      }
    }

    const cleanPhone = profileForm.phone.replace(/[-\s]/g, "");
    if (!profileForm.phone.trim()) {
      errors.phone = "กรุณากรอกเบอร์โทรศัพท์ติดต่อ";
    } else if (!/^0\d{8,9}$/.test(cleanPhone)) {
      errors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 081xxxxxxx หรือ 081-xxx-xxxx)";
    }

    if (profileForm.gpaSemester.trim()) {
      const gpa = Number(profileForm.gpaSemester.trim());
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 4) {
        errors.gpaSemester = "เกรดเฉลี่ยต้องอยู่ระหว่าง 0.00 ถึง 4.00";
      }
    }

    if (profileForm.gpaCumulative.trim()) {
      const gpax = Number(profileForm.gpaCumulative.trim());
      if (Number.isNaN(gpax) || gpax < 0 || gpax > 4) {
        errors.gpaCumulative = "เกรดเฉลี่ยสะสมต้องอยู่ระหว่าง 0.00 ถึง 4.00";
      }
    }

    if (!profileForm.addressNo.trim()) {
      errors.addressNo = "กรุณากรอกบ้านเลขที่ / ที่อยู่";
    }

    if (!profileForm.province.trim()) {
      errors.province = "กรุณาเลือกจังหวัด";
    }

    if (!profileForm.district.trim()) {
      errors.district = "กรุณาเลือกอำเภอ / เขต";
    }

    if (!profileForm.subDistrict.trim()) {
      errors.subDistrict = "กรุณาเลือกตำบล / แขวง";
    }

    if (!profileForm.postalCode.trim()) {
      errors.postalCode = "กรุณาระบุรหัสไปรษณีย์";
    } else if (!/^\d{5}$/.test(profileForm.postalCode.trim())) {
      errors.postalCode = "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      // รองรับทั้ง studentId@up.ac.th และ email ชมรม

      if (!loginForm.username.includes("@")) {
        setError("กรุณาใช้รหัสนิสิต@up.ac.th หรืออีเมลบัญชีของคุณ");
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

      const data: {
        error?: string;
        mustChangePassword?: boolean;
        role?: string;
        user?: { studentId?: string; clubId?: string | null };
        club?: { id: string };
      } = await res.json();

      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      if (data.mustChangePassword) { router.push("/change-password"); return; }
      // redirect ตาม role
      const role = data.role;
      if (role === "athlete") {
        if (data.user?.studentId) localStorage.setItem("current_student_id", data.user.studentId);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        try {
          const result = await fetchJson<{ applications: { id: string }[] }>("/api/applications");
          router.push(result.applications.length > 0 ? "/athlete/status" : "/athlete/register");
        } catch (error) {
          setError(`เข้าสู่ระบบสำเร็จ แต่ตรวจสอบใบสมัครไม่สำเร็จ: ${requestMessage(error)}`);
        }
      } else if (role === "club") {
        const clubId = data.club?.id ?? data.user?.clubId;
        if (clubId) localStorage.setItem("current_club_id", clubId);
        if (data.club) localStorage.setItem("club", JSON.stringify(data.club));
        router.push("/club/competitions");
      } else if (role === "team_official") {
        try {
          const result = await fetchJson<{ applications: { id: string }[] }>("/api/team-official/applications");
          router.push(result.applications.length > 0 ? "/team-official/status" : "/team-official/register");
        } catch {
          router.push("/team-official/status");
        }
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
    setProfileErrors({});
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
    if (loading) return;
    setError("");

    const validation = validateProfileForm();
    if (!validation.isValid) {
      setProfileErrors(validation.errors);
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง");
      return;
    }

    if (ageEvaluation && !ageEvaluation.passed) {
      setError(`ไม่สามารถลงทะเบียนได้: ${ageEvaluation.message} (ข้อบังคับ กกมท. กำหนดอายุไม่เกิน 28 ปีบริบูรณ์)`);
      return;
    }

    setLoading(true);
    try {
      const cleanNationalId = profileForm.nationalId.replace(/\D/g, "");
      const cleanPhone = profileForm.phone.replace(/[-\s]/g, "");

      const titlePrefixMap: Record<string, string> = {
        Mr: "นาย",
        Miss: "นางสาว",
        Mrs: "นาง",
      };
      const prefix = titlePrefixMap[profileForm.title] || "";
      let finalFirstName = profileForm.firstName.trim();
      if (prefix && !finalFirstName.startsWith(prefix)) {
        finalFirstName = `${prefix}${finalFirstName}`;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: registerForm.studentId,
          password: registerForm.password,
          profile: {
            firstName: finalFirstName,
            lastName: profileForm.lastName.trim(),
            faculty: profileForm.faculty.trim(),
            major: profileForm.major.trim(),
            studentLevel: profileForm.studentLevel === "graduate" ? "GRADUATE" : "BACHELOR",
            year: profileForm.year.trim(),
            semester: profileForm.semester.trim() || null,
            nationalId: cleanNationalId,
            nationality: profileForm.nationality.trim() || "ไทย",
            birthDate: profileForm.birthDate.trim(),
            gpaSemester: profileForm.gpaSemester.trim() || undefined,
            gpaCumulative: profileForm.gpaCumulative.trim() || undefined,
            addressNo: profileForm.addressNo.trim(),
            subDistrict: profileForm.subDistrict.trim(),
            district: profileForm.district.trim(),
            province: profileForm.province.trim(),
            postalCode: profileForm.postalCode.trim(),
            phone: cleanPhone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === "object") {
          setProfileErrors(data.fieldErrors);
        }
        setError(data.error || "ลงทะเบียนไม่สำเร็จ");
        return;
      }

      // สมัครสำเร็จ → กลับไปหน้า Login พร้อม Username ที่กรอกไว้
      const createdUsername = `${registerForm.studentId}@up.ac.th`;
      setLoginForm({ username: createdUsername, password: "" });
      setMode("login");
      setRegisterStep("select_role");
      setRegisterForm({ studentId: "", password: "", confirmPassword: "" });
      setProfileErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setSuccessMessage("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านที่ตั้งไว้");
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center p-4 font-sans text-slate-800"
      style={{ backgroundImage: "url('/images/cover-bg.jpg')" }}
    >

      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[2px]" />

      {registerStep !== "profile" ? (
        <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/20">

          <div className="p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="mb-4 md:hidden"><BackButton href="/" label="กลับหน้าหลัก" /></div>

              <div className="text-center mb-5">
                <div className="w-20 h-20 rounded-full mx-auto mb-2 shadow-md border-2 border-slate-200 overflow-hidden bg-white p-1">
                  <Image
                    width={80}
                    height={80}
                    priority
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
                <p className="text-xs text-blue-900 font-semibold mt-0.5">
                  Information System for Sports Management and Excellence Development
                </p>
              </div>

              <div className="flex rounded-lg bg-slate-100 p-1 mb-5 border border-slate-200">
                <button
                  type="button"
                  disabled={loading}
                  aria-pressed={mode === "login"}
                  onClick={() => switchMode("login")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === "login" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  disabled={loading}
                  aria-pressed={mode === "register"}
                  onClick={() => switchMode("register")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === "register" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  ลงทะเบียน (ครั้งแรก)
                </button>
              </div>


              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-3.5" aria-busy={loading}>
                  <div>
                    <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1">
                      Username
                    </label>
                    <input
                      id="login-username"
                      disabled={loading}
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                      placeholder="66xxxxxx@up.ac.th หรืออีเมลบัญชี"
                      required
                      autoComplete="username"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        id="login-password"
                        disabled={loading}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        {showPassword ? "ซ่อน" : "แสดง"}
                      </button>
                    </div>
                  </div>

                  {successMessage && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{successMessage}</div>}
                  {error && (
                    <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-900 hover:bg-blue-800 active:bg-blue-950 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "กำลังตรวจสอบสิทธิ์..." : "Login"}</span>
                  </button>

                  <p className="text-center text-xs text-slate-500">ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบเพื่อยืนยันตัวและรับรหัสชั่วคราว</p>
                </form>
              )}


              {mode === "register" && registerStep === "select_role" && (
                <div className="space-y-3">
                  <div className="text-center pb-1">
                    <h2 className="text-xs font-bold text-slate-800 tracking-normal">
                      เลือกกลุ่มผู้ใช้งานเพื่อลงทะเบียน
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      โปรดเลือกประเภทบัญชีผู้ใช้งานที่ท่านต้องการเปิดใหม่
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setRegisterStep("account"); setError(""); }}
                    className="block w-full border border-slate-200 hover:border-blue-900 bg-slate-50 hover:bg-white rounded-xl p-3.5 transition-all cursor-pointer group text-left shadow-2xs hover:shadow-xs space-y-1.5"
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                          <RunnerIcon className="w-4 h-4" />
                        </span>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-blue-900 transition-colors">
                          นิสิต / นักกีฬาตัวแทนสถาบัน
                        </span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold font-mono">
                        @up.ac.th
                      </span>
                    </span>
                    <span className="block text-xs text-slate-500 leading-relaxed pl-9">
                      สำหรับนิสิต ม.พะเยา ทุกชั้นปี ใช้อีเมลนิสิตและรหัสนิสิต 8 หลัก เพื่อบันทึกประวัติการศึกษา เกรดเฉลี่ยสะสม และสมัครเข้ารับการคัดเลือก
                    </span>
                    <span className="pl-9 pt-1 flex items-center justify-between text-xs font-semibold text-blue-900 group-hover:translate-x-0.5 transition-transform">
                      <span>ลงทะเบียนบัญชีนักกีฬาใหม่</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </span>
                  </button>

                  <Link
                    href="/team-official/signup"
                    className="block border border-slate-200 hover:border-emerald-800 bg-slate-50 hover:bg-white rounded-xl p-3.5 transition-all cursor-pointer group text-left shadow-2xs hover:shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                          <ClipboardListIcon className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs group-hover:text-emerald-800 transition-colors">
                          ผู้จัดการทีม / ผู้ฝึกสอนกีฬา (โค้ช)
                        </h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        อาจารย์ / โค้ช
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pl-9">
                      สำหรับอาจารย์ที่ปรึกษา บุคลากร หรือผู้ฝึกสอนภายนอก บันทึกข้อมูลตำแหน่งทีม สังกัดชนิดกีฬา และแนบแผนการฝึกซ้อม
                    </p>
                    <div className="pl-9 pt-1 flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                      <span>ลงทะเบียนเจ้าหน้าที่ทีม / โค้ช</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </div>
                  </Link>

                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-900 space-y-1 mt-1">
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

              {/* ===== REGISTER STEP 1: กรอก Account ===== */}
              {mode === "register" && registerStep === "account" && (
                <form onSubmit={handleRegisterAccount} className="space-y-3.5">
                  <button type="button" onClick={() => { setRegisterStep("select_role"); setError(""); }} className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    เปลี่ยนประเภทผู้ใช้งาน
                  </button>
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
                      <p className="text-xs text-slate-500 mt-1">Username ทางการของคุณคือ <span className="font-semibold text-blue-900">{username}</span></p>
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
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                        {showPassword ? "ซ่อน" : "แสดง"}
                      </button>
                    </div>

                    {/* Password checklist */}
                    {registerForm.password.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1 p-2 bg-slate-50 border border-slate-200 rounded-md">
                        {[
                          { ok: passwordCheck.hasLength, label: "อย่างน้อย 8 ตัวอักษร ไม่เกิน 72 ไบต์" },
                          { ok: passwordCheck.hasUpper, label: "A-Z อย่างน้อย 1 ตัว" },
                          { ok: passwordCheck.hasLower, label: "a-z อย่างน้อย 1 ตัว" },
                          { ok: passwordCheck.hasNumber, label: "0-9 อย่างน้อย 1 ตัว" },
                          { ok: passwordCheck.hasSpecial, label: "อักษรพิเศษอย่างน้อย 1 ตัว" },
                        ].map((item) => (
                          <p key={item.label} className={`text-xs flex items-center gap-1 ${item.ok ? "text-emerald-700 font-medium" : "text-slate-400"}`}>
                            {item.ok ? <CheckIcon className="w-3.5 h-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden="true" />} {item.label}
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
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                        {showConfirmPassword ? "ซ่อน" : "แสดง"}
                      </button>
                    </div>
                    {registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                      <p className="text-xs text-rose-600 mt-1">รหัสผ่านไม่ตรงกัน</p>
                    )}
                    {registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword && (
                      <p className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium mt-1">
                        <CheckIcon className="w-3.5 h-3.5" />
                        รหัสผ่านตรงกันเรียบร้อย
                      </p>
                    )}
                  </div>

                  {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

                  <button
                    type="submit"
                    disabled={!passwordCheck.valid || registerForm.password !== registerForm.confirmPassword || registerForm.studentId.length !== 8}
                    className="w-full bg-blue-900 hover:bg-blue-800 active:bg-blue-950 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-md cursor-pointer"
                  >
                    <span>ถัดไป: บันทึกข้อมูลประวัตินิสิต</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    มีบัญชีในระบบอยู่แล้ว?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="text-blue-900 font-semibold hover:underline">เข้าสู่ระบบ</button>
                  </p>
                </form>
              )}

            </div>

            <div className="text-center text-xs text-slate-400 pt-4 mt-4 border-t border-slate-100">
              <p className="font-medium text-slate-600">
                พบปัญหา โทร. 054-466-666 ต่อ 6290-6295
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                (งานกีฬา กองกิจการนิสิต มหาวิทยาลัยพะเยา)
              </p>
              <button type="button" onClick={() => guideRef.current?.showModal()} className="mt-3 text-blue-900 underline md:hidden">คู่มือการใช้งานระบบสารสนเทศ</button>
            </div>
          </div>

          <div className="hidden md:flex flex-col justify-between relative bg-slate-950 text-white overflow-hidden">

            <Link
              href="/"
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors shadow-md backdrop-blur-xs"
              title="กลับหน้าหลัก"
              aria-label="กลับหน้าหลัก"
            >
              <CloseIcon className="w-4 h-4" />
            </Link>

            <div className="relative flex-1 w-full min-h-[380px] overflow-hidden flex items-center justify-center bg-slate-950">
              <Image
                fill
                sizes="(min-width: 768px) 448px, 1px"
                src="/images/graphic.jpg"
                alt="ระบบรักษาความปลอดภัยดิจิทัล"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <button
              type="button"
              onClick={() => guideRef.current?.showModal()}
              className="relative z-10 w-full py-3 px-4 bg-slate-900/90 hover:bg-slate-900 text-white/90 hover:text-white text-xs font-medium text-center transition-colors border-t border-white/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BookOpenIcon className="w-3.5 h-3.5 text-blue-300" />
              <span>คู่มือการใช้งานระบบสารสนเทศ</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleRegisterProfile} className="space-y-4">

            {/* Header step 2 */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
              <div>
                <p className="text-sm font-bold text-slate-900">บันทึกข้อมูลประวัตินิสิต (ขั้นตอนที่ 2)</p>
                <p className="text-xs text-slate-500">ข้อมูลนี้จะถูกบันทึกเป็นฐานข้อมูลประวัตินักกีฬาทางการของสถาบัน</p>
              </div>
              <button
                type="button"
                onClick={() => { setRegisterStep("account"); setError(""); setProfileErrors({}); }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded cursor-pointer"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                ย้อนกลับ
              </button>
            </div>

            {/* Mini step indicator */}
            <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold text-white"><CheckIcon className="w-3 h-3" /></div>
                <span className="text-slate-500 font-medium">1. กำหนดรหัสผ่าน</span>
              </div>
              <div className="w-6 h-0.5 bg-blue-900" />
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-white">2</div>
                <span className="text-slate-900 font-bold">2. บันทึกข้อมูลประวัตินิสิต</span>
              </div>
            </div>

            {/* รูปถ่าย */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">รูปถ่ายหน้าตรงชุดนิสิต (ขนาด 1 นิ้ว สำหรับทำบัตรประจำตัว)</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">หลังเข้าสู่ระบบ สามารถอัปโหลดและบันทึกรูปถ่าย JPEG/PNG ขนาดไม่เกิน 5 MB ในหน้าสมัครเข้าร่วมการแข่งขันได้ รูปจะเก็บในพื้นที่ส่วนตัวของบัญชี</p>
            </div>

            {/* ข้อมูลนิสิต */}
            <p className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-100 tracking-normal">ข้อมูลส่วนตัวและสถานภาพการศึกษา</p>

            {/* ช่องเลือกคำนำหน้าชื่อ และ เลือกเพศ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-slate-700 mb-1">
                  คำนำหน้าชื่อ <span className="text-rose-500">*</span>
                </label>
                <select
                  id="title"
                  name="title"
                  required
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white outline-none cursor-pointer ${profileErrors.title ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                >
                  <option value="">-- เลือกคำนำหน้าชื่อ --</option>
                  <option value="Mr">นาย</option>
                  <option value="Miss">นางสาว</option>
                  <option value="Mrs">นาง</option>
                </select>
                {profileErrors.title && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.title}</p>
                )}
              </div>
              <div>
                <label htmlFor="gender" className="block text-xs font-medium text-slate-700 mb-1">
                  เพศ <span className="text-rose-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white outline-none cursor-pointer ${profileErrors.gender ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.gender}
                  onChange={(e) => setProfile("gender", e.target.value)}
                >
                  <option value="">-- เลือกเพศ --</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
                {profileErrors.gender && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.gender}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-first-name" className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อจริง <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-first-name"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${profileErrors.firstName ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  placeholder="ชื่อจริง"
                  value={profileForm.firstName}
                  onChange={(e) => setProfile("firstName", e.target.value)}
                />
                {profileErrors.firstName && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="profile-last-name" className="block text-xs font-medium text-slate-700 mb-1">
                  นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-last-name"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${profileErrors.lastName ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  placeholder="นามสกุล"
                  value={profileForm.lastName}
                  onChange={(e) => setProfile("lastName", e.target.value)}
                />
                {profileErrors.lastName && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="profile-student-id" className="block text-xs font-medium text-slate-700 mb-1">
                รหัสประจำตัวนิสิต
              </label>
              <input
                id="profile-student-id"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 font-mono cursor-not-allowed"
                value={registerForm.studentId}
                disabled
              />
            </div>

            <div>
              <label htmlFor="profile-faculty" className="block text-xs font-medium text-slate-700 mb-1">
                คณะ / วิทยาลัย <span className="text-rose-500">*</span>
              </label>
              <select
                id="profile-faculty"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white outline-none ${profileErrors.faculty ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                value={profileForm.faculty}
                onChange={(e) => { setProfile("faculty", e.target.value); setProfile("major", ""); }}
              >
                <option value="">-- กรุณาเลือกคณะต้นสังกัด --</option>
                {UP_FACULTIES.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
              {profileErrors.faculty && (
                <p className="text-xs text-rose-600 mt-1">{profileErrors.faculty}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-major" className="block text-xs font-medium text-slate-700 mb-1">
                  สาขาวิชา <span className="text-rose-500">*</span>
                </label>
                <select
                  id="profile-major"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white outline-none disabled:bg-slate-100 ${profileErrors.major ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.major}
                  onChange={(e) => setProfile("major", e.target.value)}
                  disabled={!profileForm.faculty}
                >
                  <option value="">{profileForm.faculty ? "-- กรุณาเลือกสาขา --" : ""}</option>
                  {UP_FACULTIES.find((f) => f.name === profileForm.faculty)?.majors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {profileErrors.major && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.major}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ระดับการศึกษา <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setProfile("studentLevel", "bachelor")} className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${profileForm.studentLevel === "bachelor" ? "bg-blue-900 text-white border-blue-900 font-bold" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>ปริญญาตรี</button>
                  <button type="button" onClick={() => setProfile("studentLevel", "graduate")} className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${profileForm.studentLevel === "graduate" ? "bg-blue-900 text-white border-blue-900 font-bold" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>บัณฑิตศึกษา</button>
                </div>
                {profileErrors.studentLevel && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.studentLevel}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="profile-year" className="block text-xs font-medium text-slate-700 mb-1">
                ชั้นปีปัจจุบัน <span className="text-rose-500">*</span>
              </label>
              <select
                id="profile-year"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white outline-none ${profileErrors.year ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                value={profileForm.year}
                onChange={(e) => setProfile("year", e.target.value)}
              >
                <option value="">เลือกชั้นปี</option>
                {["1", "2", "3", "4", "5", "6"].map((y) => (
                  <option key={y} value={y}>ปีที่ {y}</option>
                ))}
              </select>
              {profileErrors.year && (
                <p className="text-xs text-rose-600 mt-1">{profileErrors.year}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="profile-semester">ภาคเรียนปัจจุบัน</label>
              <select
                id="profile-semester"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white outline-none ${profileErrors.semester ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                value={profileForm.semester}
                onChange={(event) => setProfile("semester", event.target.value)}
              >
                <option value="">เลือกภาคเรียน</option>
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
                <option value="3">ภาคเรียนฤดูร้อน</option>
              </select>
              {profileErrors.semester && (
                <p className="text-xs text-rose-600 mt-1">{profileErrors.semester}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">นิสิตปริญญาตรีปี 1 เทอม 1 ที่ยังไม่มีผลการเรียน สามารถเว้น GPA และ GPAX ทั้งสองช่องเพื่อรับการยกเว้นเกณฑ์ GPAX</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-national-id" className="block text-xs font-medium text-slate-700 mb-1">
                  เลขบัตรประจำตัวประชาชน <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-national-id"
                  maxLength={17}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${profileErrors.nationalId ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  placeholder="เลข 13 หลัก"
                  value={profileForm.nationalId}
                  onChange={(e) => setProfile("nationalId", e.target.value.replace(/[^\d-]/g, "").slice(0, 13))}
                />
                {profileErrors.nationalId && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.nationalId}</p>
                )}
              </div>
              <div>
                <label htmlFor="profile-nationality" className="block text-xs font-medium text-slate-700 mb-1">
                  สัญชาติ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-nationality"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${profileErrors.nationality ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.nationality}
                  onChange={(e) => setProfile("nationality", e.target.value)}
                />
                {profileErrors.nationality && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.nationality}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันเดือนปีเกิด <span className="text-rose-500">*</span>
                </label>
                <ThaiDateInput
                  compact
                  minYearBE={2520}
                  maxYearBE={2555}
                  value={profileForm.birthDate}
                  onChange={(val) => setProfile("birthDate", val)}
                  ariaLabel="วันเดือนปีเกิด"
                />
                {dynamicAge !== null && (
                  <span className={`text-xs font-medium mt-0.5 block ${ageEvaluation?.passed ? "text-blue-800" : "text-rose-600 font-semibold"}`}>
                    อายุ {dynamicAge} ปีบริบูรณ์ {ageEvaluation && !ageEvaluation.passed ? `(${ageEvaluation.message})` : ""}
                  </span>
                )}
                {profileErrors.birthDate && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.birthDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="profile-phone" className="block text-xs font-medium text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-phone"
                  maxLength={12}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${profileErrors.phone ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  placeholder="0XX-XXX-XXXX"
                  value={profileForm.phone}
                  onChange={(e) => setProfile("phone", e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                />
                {profileErrors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.phone}</p>
                )}
              </div>
            </div>

            {birthDateObj && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${eligibilityOk ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                <p className="font-medium mb-0.5">{eligibilityOk ? "สถานะคุณสมบัติเบื้องต้น: ผ่าน" : "สถานะคุณสมบัติเบื้องต้น: ไม่ผ่าน"}</p>
                {ageEvaluation && <p>{ageEvaluation.message}</p>}
                <p>{participationEvaluation.message}</p>
                {!eligibilityOk && (
                  <p className="mt-1 flex items-start gap-2 font-semibold text-rose-800">
                    <AlertTriangleIcon className="mt-0.5 w-4 h-4 shrink-0" />
                    <span>อายุของคุณเกินเกณฑ์ที่ระเบียบ กกมท. กำหนด (ต้องไม่เกิน 28 ปีตามปีมหกรรมกีฬา) จึงไม่สามารถลงทะเบียนเป็นนักกีฬาตัวแทนสถาบันได้</span>
                  </p>
                )}
              </div>
            )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="profile-gpa-semester" className="block text-xs font-medium text-slate-700 mb-1">
                    เกรดเฉลี่ย (ภาคล่าสุด)
                  </label>
                  <input
                    id="profile-gpa-semester"
                    maxLength={4}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${profileErrors.gpaSemester ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                    placeholder="เช่น 3.25"
                    value={profileForm.gpaSemester}
                    onChange={(e) => handleGpaChange("gpaSemester", e.target.value)}
                    onBlur={() => handleGpaBlur("gpaSemester")}
                  />
                  {profileErrors.gpaSemester && (
                    <p className="text-xs text-rose-600 mt-1">{profileErrors.gpaSemester}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="profile-gpa-cumulative" className="block text-xs font-medium text-slate-700 mb-1">
                    เกรดเฉลี่ยสะสม (GPAX)
                  </label>
                  <input
                    id="profile-gpa-cumulative"
                    maxLength={4}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${profileErrors.gpaCumulative ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                    placeholder="เช่น 3.40"
                    value={profileForm.gpaCumulative}
                    onChange={(e) => handleGpaChange("gpaCumulative", e.target.value)}
                    onBlur={() => handleGpaBlur("gpaCumulative")}
                  />
                  {profileErrors.gpaCumulative && (
                    <p className="text-xs text-rose-600 mt-1">{profileErrors.gpaCumulative}</p>
                  )}
                </div>
              </div>

            {/* ที่อยู่ */}
            <p className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-100 tracking-normal">ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ปัจจุบัน</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-address-no" className="block text-xs font-medium text-slate-700 mb-1">
                  บ้านเลขที่ / หมู่ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-address-no"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${profileErrors.addressNo ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.addressNo}
                  onChange={(e) => setProfile("addressNo", e.target.value)}
                />
                {profileErrors.addressNo && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.addressNo}</p>
                )}
              </div>
              <div>
                <label htmlFor="profile-province" className="block text-xs font-medium text-slate-700 mb-1">
                  จังหวัด <span className="text-rose-500">*</span>
                </label>
                <select
                  id="profile-province"
                  className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs outline-none ${profileErrors.province ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.province}
                  onChange={(event) => handleProvinceChange(event.target.value)}
                >
                  <option value="">-- เลือกจังหวัด --</option>
                  {ALL_THAI_PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {profileErrors.province && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.province}</p>
                )}
              </div>
              <div>
                <label htmlFor="profile-district" className="block text-xs font-medium text-slate-700 mb-1">
                  อำเภอ / เขต <span className="text-rose-500">*</span>
                </label>
                <select
                  id="profile-district"
                  className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs outline-none disabled:bg-slate-100 ${profileErrors.district ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.district}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  disabled={!profileForm.province}
                >
                  <option value="">-- เลือกอำเภอ / เขต --</option>
                  {amphures.map((amphure) => (
                    <option key={amphure.name} value={amphure.name}>{amphure.name}</option>
                  ))}
                </select>
                {profileErrors.district && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.district}</p>
                )}
              </div>
              <div>
                <label htmlFor="profile-sub-district" className="block text-xs font-medium text-slate-700 mb-1">
                  ตำบล / แขวง <span className="text-rose-500">*</span>
                </label>
                <select
                  id="profile-sub-district"
                  className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs outline-none disabled:bg-slate-100 ${profileErrors.subDistrict ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-300 focus:ring-2 focus:ring-blue-900"}`}
                  value={profileForm.subDistrict}
                  onChange={(event) => handleSubDistrictChange(event.target.value)}
                  disabled={!profileForm.district}
                >
                  <option value="">-- เลือกตำบล / แขวง --</option>
                  {tambons.map((tambon) => (
                    <option key={`${tambon.name}-${tambon.postalCode}`} value={tambon.name}>{tambon.name}</option>
                  ))}
                </select>
                {profileErrors.subDistrict && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.subDistrict}</p>
                )}
              </div>
              <div>
                <label htmlFor="profile-postal-code" className="block text-xs font-medium text-slate-700 mb-1">
                  รหัสไปรษณีย์ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-postal-code"
                  className={`w-full cursor-not-allowed rounded-lg border bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600 ${profileErrors.postalCode ? "border-rose-400 bg-rose-50/20" : "border-slate-200"}`}
                  value={profileForm.postalCode}
                  readOnly
                  aria-label="รหัสไปรษณีย์"
                />
                {profileErrors.postalCode && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.postalCode}</p>
                )}
              </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading || (ageEvaluation ? !ageEvaluation.passed : false)}
              className="w-full bg-blue-900 hover:bg-blue-800 active:bg-blue-950 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-md cursor-pointer"
            >
              {loading
                ? "กำลังบันทึกข้อมูลเข้าฐานข้อมูล..."
                : ageEvaluation && !ageEvaluation.passed
                ? "ไม่สามารถลงทะเบียนได้ (อายุเกินเกณฑ์ กกมท.)"
                : "บันทึกประวัติและกลับไปเข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      )}

      <dialog ref={guideRef} aria-labelledby="login-guide-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-900" />
              <h3 id="login-guide-title" className="font-bold text-slate-900 text-sm">
                คู่มือการใช้งานระบบสารสนเทศ
              </h3>
            </div>
            <button
              type="button"
              onClick={() => guideRef.current?.close()}
              aria-label="ปิดคู่มือ"
              className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center text-xs"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-600 space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="flex items-center gap-2 font-semibold text-slate-900 mb-1"><RunnerIcon className="w-4 h-4 text-blue-900" /> สำหรับนิสิต / นักกีฬา:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-xs">
                <li>ลงทะเบียนด้วยรหัสนิสิต 8 หลัก และกำหนดรหัสผ่านความปลอดภัย</li>
                <li>กรอกข้อมูลประวัติการศึกษา จากนั้นเข้าสู่ระบบเพื่อแนบรูปถ่ายหน้าตรงชุดนิสิต</li>
                <li>ยื่นใบสมัครคัดเลือกชนิดกีฬาที่เปิดรับ และแนบเอกสารตามที่ระบบกำหนด</li>
                <li>ติดตามผลการคัดเลือกในระบบเมื่อได้รับการประกาศชื่อ</li>
              </ol>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="flex items-center gap-2 font-semibold text-slate-900 mb-1"><TrophyIcon className="w-4 h-4 text-emerald-800" /> สำหรับชมรมกีฬา:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-xs">
                <li>เข้าสู่ระบบด้วยบัญชีชมรมกีฬาต้นสังกัด</li>
                <li>พิจารณาคัดเลือกนักกีฬาและจัดประเภทตัวจริง/ตัวสำรองตามโควตา กกมท.</li>
                <li>ตรวจสอบและส่งบัญชีรายชื่อให้กองกิจการนิสิตตามขั้นตอนของระบบ</li>
              </ol>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="flex items-center gap-2 font-semibold text-slate-900 mb-1"><BuildingIcon className="w-4 h-4 text-slate-700" /> ช่องทางการติดต่อเจ้าหน้าที่:</p>
              <p className="text-xs text-slate-600">
                งานกีฬาและนันทนาการ กองกิจการนิสิต มหาวิทยาลัยพะเยา<br />
                โทร. 054-466-666 ต่อ 6290-6295 หรืออีเมล: <span className="font-mono text-blue-900">dsa@up.ac.th</span>
              </p>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => guideRef.current?.close()}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              เข้าใจแล้ว / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
