"use client";

import { useState } from "react";
import { type AthleteProfile } from "@/lib/athlete-profile-types";
import { UP_FACULTIES } from "@/lib/up-faculties";
import {
  ALL_THAI_PROVINCES,
  getAmphuresByProvince,
  getTambonsByAmphure,
} from "@/lib/thailand-addresses";
import { fetchJson, HttpError } from "@/lib/http-client";
import { calculateExactAge, countParticipationForLevel, evaluateAge, evaluateParticipationCount } from "@/lib/rule-checker";
import ThaiDateInput from "@/components/shared/ThaiDateInput";
import {
  NAME_GENDER_OPTIONS,
  NAME_TITLE_OPTIONS,
  combineTitleWithFirstName,
  genderFromTitle,
  isNameGender,
  isNameTitle,
  splitTitleFromName,
} from "@/lib/thai-name-title";

interface AthleteProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: AthleteProfile;
  onSaved: (updatedProfile: AthleteProfile) => void;
}

export default function AthleteProfileEditModal({
  isOpen,
  onClose,
  studentProfile,
  onSaved,
}: AthleteProfileEditModalProps) {
  const parsedName = splitTitleFromName(studentProfile.firstName);

  const [form, setForm] = useState({
    title: parsedName.title,
    gender: parsedName.gender,
    firstName: parsedName.firstName,
    lastName: studentProfile.lastName || "",
    faculty: studentProfile.faculty || "",
    major: studentProfile.major || "",
    studentLevel: (studentProfile.studentLevel === "graduate" ? "graduate" : "bachelor") as "bachelor" | "graduate",
    year: studentProfile.year || "1",
    semester: studentProfile.semester || "",
    nationalId: studentProfile.nationalId || "",
    nationality: studentProfile.nationality || "ไทย",
    birthDate: studentProfile.birthDate ? studentProfile.birthDate.slice(0, 10) : "",
    phone: studentProfile.phone || "",
    addressNo: studentProfile.addressNo || "",
    province: studentProfile.province || "",
    district: studentProfile.district || "",
    subDistrict: studentProfile.subDistrict || "",
    postalCode: studentProfile.postalCode || "",
    gpaSemester: studentProfile.gpaSemester || "",
    gpaCumulative: studentProfile.gpaCumulative || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const amphures = getAmphuresByProvince(form.province);
  const tambons = getTambonsByAmphure(form.province, form.district);

  const selectedFacultyObj = UP_FACULTIES.find((f) => f.name === form.faculty);
  const availableMajors = selectedFacultyObj ? selectedFacultyObj.majors : [];

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleTitleChange = (value: string) => {
    const title = isNameTitle(value) ? value : "";
    const autoGender = genderFromTitle(title) || form.gender;

    setForm((prev) => ({
      ...prev,
      title,
      gender: autoGender,
    }));
    if (fieldErrors.title) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
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
    handleFieldChange(field, val);
  };

  const handleGpaBlur = (field: "gpaSemester" | "gpaCumulative") => {
    const raw = form[field].trim();
    if (!raw) return;
    const num = Number(raw);
    if (!Number.isNaN(num) && num >= 0 && num <= 4) {
      handleFieldChange(field, num.toFixed(2));
    }
  };

  const handleProvinceChange = (province: string) => {
    setForm((prev) => ({
      ...prev,
      province,
      district: "",
      subDistrict: "",
      postalCode: "",
    }));
  };

  const handleDistrictChange = (district: string) => {
    setForm((prev) => ({
      ...prev,
      district,
      subDistrict: "",
      postalCode: "",
    }));
  };

  const handleSubDistrictChange = (subDistrict: string) => {
    const postalCode = tambons.find((t) => t.name === subDistrict)?.postalCode ?? "";
    setForm((prev) => ({
      ...prev,
      subDistrict,
      postalCode: postalCode || prev.postalCode,
    }));
  };

  const handleFacultyChange = (faculty: string) => {
    const fac = UP_FACULTIES.find((f) => f.name === faculty);
    const hasMajor = fac && fac.majors.includes(form.major);
    setForm((prev) => ({
      ...prev,
      faculty,
      major: hasMajor ? prev.major : "",
    }));
  };

  const birthDateObj = form.birthDate ? new Date(form.birthDate) : null;
  const dynamicAge = birthDateObj && !Number.isNaN(birthDateObj.getTime())
    ? calculateExactAge(birthDateObj)
    : null;
  const ageEvaluation = birthDateObj && !Number.isNaN(birthDateObj.getTime())
    ? evaluateAge(birthDateObj, new Date().getFullYear())
    : null;
  const participationEvaluation = evaluateParticipationCount(
    studentProfile.previousEntriesCount ?? 0,
    form.studentLevel === "graduate" ? "GRADUATE" : "BACHELOR",
  );
  const eligibilityOk = (ageEvaluation?.passed ?? true) && participationEvaluation.passed;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.title) errors.title = "กรุณาเลือกคำนำหน้าชื่อ";
    if (!form.gender) errors.gender = "กรุณาเลือกเพศ";
    if (!form.firstName.trim()) errors.firstName = "กรุณากรอกชื่อจริง";
    if (!form.lastName.trim()) errors.lastName = "กรุณากรอกนามสกุล";
    if (!form.faculty.trim()) errors.faculty = "กรุณาเลือกคณะ / วิทยาลัย";
    if (!form.major.trim()) errors.major = "กรุณาเลือกสาขาวิชา";
    if (!form.year.trim()) errors.year = "กรุณาเลือกชั้นปี";
    if (!form.nationalId.trim()) {
      errors.nationalId = "กรุณากรอกเลขบัตรประจำตัวประชาชน";
    } else if (!/^\d{13}$/.test(form.nationalId.trim())) {
      errors.nationalId = "เลขบัตรประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก";
    }

    if (!form.birthDate.trim()) {
      errors.birthDate = "กรุณาระบุวันเดือนปีเกิด";
    } else {
      const d = new Date(form.birthDate);
      if (Number.isNaN(d.getTime()) || d > new Date()) {
        errors.birthDate = "วันเดือนปีเกิดไม่ถูกต้อง";
      }
    }

    if (!form.phone.trim()) {
      errors.phone = "กรุณากรอกเบอร์โทรศัพท์ติดต่อ";
    } else if (!/^0[0-9]{8,9}$/.test(form.phone.trim().replace(/[-\s]/g, ""))) {
      errors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)";
    }

    if (!form.addressNo.trim()) errors.addressNo = "กรุณากรอกบ้านเลขที่ / ที่อยู่";
    if (!form.province.trim()) errors.province = "กรุณาเลือกจังหวัด";
    if (!form.district.trim()) errors.district = "กรุณาเลือกอำเภอ / เขต";
    if (!form.subDistrict.trim()) errors.subDistrict = "กรุณาเลือกตำบล / แขวง";
    if (!form.postalCode.trim()) errors.postalCode = "กรุณาระบุรหัสไปรษณีย์";

    if (form.gpaSemester.trim()) {
      const gpa = Number(form.gpaSemester);
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 4) {
        errors.gpaSemester = "เกรดเฉลี่ยต้องอยู่ระหว่าง 0.00 ถึง 4.00";
      }
    }

    if (form.gpaCumulative.trim()) {
      const gpax = Number(form.gpaCumulative);
      if (Number.isNaN(gpax) || gpax < 0 || gpax > 4) {
        errors.gpaCumulative = "เกรดเฉลี่ยสะสมต้องอยู่ระหว่าง 0.00 ถึง 4.00";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) {
      setError("กรุณาตรวจสอบข้อมูลที่กรอกให้ถูกต้องครบถ้วน");
      return;
    }

    setSaving(true);
    try {
      // ต่อคำนำหน้าเข้ากับชื่อจริง (ระบบไม่เก็บคำนำหน้าเป็นคอลัมน์แยก)
      const finalFirstName = combineTitleWithFirstName(form.title, form.firstName);

      const payload = {
        studentId: studentProfile.studentId,
        firstName: finalFirstName,
        lastName: form.lastName.trim(),
        faculty: form.faculty.trim(),
        major: form.major.trim(),
        studentLevel: form.studentLevel === "graduate" ? "GRADUATE" : "BACHELOR",
        year: form.year.trim(),
        semester: form.semester.trim() || null,
        nationalId: form.nationalId.trim(),
        nationality: form.nationality.trim() || "ไทย",
        birthDate: form.birthDate.trim(),
        phone: form.phone.trim().replace(/[-\s]/g, ""),
        addressNo: form.addressNo.trim(),
        province: form.province.trim(),
        district: form.district.trim(),
        subDistrict: form.subDistrict.trim(),
        postalCode: form.postalCode.trim(),
        gpaSemester: form.gpaSemester.trim() || null,
        gpaCumulative: form.gpaCumulative.trim() || null,
      };

      const result = await fetchJson<{
        message: string;
        profile: Record<string, unknown>;
      }>("/api/athletes/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const p = result.profile;
      const bDate = typeof p.birthDate === "string" ? p.birthDate.slice(0, 10) : form.birthDate;
      const persistedEntriesCount = countParticipationForLevel(
        { bachelor: Number(p.participateCountBachelor) || 0, master: Number(p.participateCountMaster) || 0, phd: Number(p.participateCountPhd) || 0 },
        String(p.studentLevel ?? form.studentLevel),
      );

      const updated: AthleteProfile = {
        ...studentProfile,
        firstName: String(p.firstName || finalFirstName),
        lastName: String(p.lastName || form.lastName),
        faculty: String(p.faculty || form.faculty),
        major: String(p.major || form.major),
        studentLevel: String(p.studentLevel).toUpperCase() === "GRADUATE" ? "graduate" : "bachelor",
        year: String(p.year || form.year),
        semester: typeof p.semester === "string" ? p.semester : (form.semester.trim() || null),
        nationalId: String(p.nationalId || form.nationalId),
        nationality: String(p.nationality || form.nationality),
        birthDate: bDate,
        birthYearCE: Number(bDate.slice(0, 4)) || new Date().getFullYear(),
        phone: String(p.phone || form.phone),
        addressNo: String(p.addressNo || form.addressNo),
        province: String(p.province || form.province),
        district: String(p.district || form.district),
        subDistrict: String(p.subDistrict || form.subDistrict),
        postalCode: String(p.postalCode || form.postalCode),
        gpaSemester: typeof p.gpaSemester === "string" ? p.gpaSemester : form.gpaSemester,
        gpaCumulative: typeof p.gpaCumulative === "string" ? p.gpaCumulative : form.gpaCumulative,
        previousEntriesCount: persistedEntriesCount || studentProfile.previousEntriesCount,
      };

      onSaved(updated);
      onClose();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="relative my-8 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl text-slate-800"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="edit-profile-title" className="text-lg font-bold text-slate-900">
              แก้ไขข้อมูลประวัตินิสิต
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลนี้จะใช้ในการลงทะเบียน สมัครแข่งขัน และตรวจสอบคุณสมบัตินักกีฬา
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
              >
                {error}
              </div>
            )}

            {/* ส่วนที่ 1: ข้อมูลส่วนตัว */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
                1. ข้อมูลส่วนตัว
              </h3>

              {/* รหัสนิสิต และ เลขบัตรประจำตัวประชาชน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    รหัสประจำตัวนิสิต
                  </label>
                  <input
                    type="text"
                    value={studentProfile.studentId}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-slate-500 cursor-not-allowed outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ผูกกับบัญชี ไม่สามารถเปลี่ยนได้
                  </span>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    เลขบัตรประจำตัวประชาชน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={form.nationalId}
                    onChange={(e) => handleFieldChange("nationalId", e.target.value.replace(/\D/g, ""))}
                    placeholder="เลข 13 หลัก"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                  {fieldErrors.nationalId && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.nationalId}</p>
                  )}
                </div>
              </div>

              {/* คำนำหน้าชื่อ, เพศ, ชื่อจริง, นามสกุล */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="modal-title" className="block font-medium text-slate-700 mb-1">
                    คำนำหน้าชื่อ <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-title"
                    name="title"
                    value={form.title}
                    aria-invalid={fieldErrors.title ? true : undefined}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 cursor-pointer"
                  >
                    <option value="">-- เลือกคำนำหน้าชื่อ --</option>
                    {NAME_TITLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {fieldErrors.title && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.title}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-gender" className="block font-medium text-slate-700 mb-1">
                    เพศ <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-gender"
                    name="gender"
                    value={form.gender}
                    aria-invalid={fieldErrors.gender ? true : undefined}
                    onChange={(e) => handleFieldChange("gender", isNameGender(e.target.value) ? e.target.value : "")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 cursor-pointer"
                  >
                    <option value="">-- เลือกเพศ --</option>
                    {NAME_GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {fieldErrors.gender && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.gender}</p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ชื่อจริง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleFieldChange("firstName", e.target.value)}
                    placeholder="เช่น สมชาย"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                  {fieldErrors.firstName && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleFieldChange("lastName", e.target.value)}
                    placeholder="เช่น ใจดี"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                  {fieldErrors.lastName && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* วันเดือนปีเกิด และ ข้อมูลติดต่อ/สัญชาติ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    วันเดือนปีเกิด <span className="text-red-500">*</span>
                  </label>
                  <ThaiDateInput
                    compact
                    value={form.birthDate}
                    onChange={(val) => handleFieldChange("birthDate", val)}
                    minYearBE={2520}
                    maxYearBE={2555}
                    ariaLabel="วันเดือนปีเกิด"
                  />
                  {dynamicAge !== null && (
                    <span className="text-[11px] text-blue-800 font-medium mt-0.5 block">
                      อายุ {dynamicAge} ปีบริบูรณ์
                    </span>
                  )}
                  {fieldErrors.birthDate && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.birthDate}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      สัญชาติ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nationality}
                      onChange={(e) => handleFieldChange("nationality", e.target.value)}
                      placeholder="ไทย"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                    />
                    {fieldErrors.nationality && (
                      <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.nationality}</p>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                      placeholder="0812345678"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                    />
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ส่วนที่ 2: ข้อมูลการศึกษา */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
                2. ข้อมูลการศึกษา
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    คณะ / วิทยาลัย <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.faculty}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  >
                    <option value="">-- กรุณาเลือกคณะ / วิทยาลัย --</option>
                    {UP_FACULTIES.map((fac) => (
                      <option key={fac.name} value={fac.name}>
                        {fac.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.faculty && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.faculty}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    สาขาวิชา <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.major}
                    onChange={(e) => handleFieldChange("major", e.target.value)}
                    disabled={!form.faculty}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  >
                    <option value="">
                      {form.faculty ? "-- กรุณาเลือกสาขาวิชา --" : "-- เลือกคณะก่อน --"}
                    </option>
                    {availableMajors.map((maj) => (
                      <option key={maj} value={maj}>
                        {maj}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.major && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.major}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ระดับการศึกษา <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("studentLevel", "bachelor")}
                      className={`rounded-lg border px-3 py-2 text-center transition-colors cursor-pointer ${
                        form.studentLevel === "bachelor"
                          ? "border-blue-900 bg-blue-900 text-white font-bold"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      ปริญญาตรี
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("studentLevel", "graduate")}
                      className={`rounded-lg border px-3 py-2 text-center transition-colors cursor-pointer ${
                        form.studentLevel === "graduate"
                          ? "border-blue-900 bg-blue-900 text-white font-bold"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      บัณฑิตศึกษา
                    </button>
                  </div>
                </div>

                <div className={`rounded-lg border px-3 py-2 text-xs ${eligibilityOk ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                  <p className="font-medium mb-0.5">{eligibilityOk ? "สถานะคุณสมบัติเบื้องต้น: ผ่าน" : "สถานะคุณสมบัติเบื้องต้น: ไม่ผ่าน"}</p>
                  {ageEvaluation && <p>{ageEvaluation.message}</p>}
                  <p>{participationEvaluation.message}</p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ชั้นปี <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => handleFieldChange("year", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  >
                    {["1", "2", "3", "4", "5", "6", "7", "8"].map((y) => (
                      <option key={y} value={y}>
                        ปีที่ {y}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.year && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.year}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ภาคเรียน
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) => handleFieldChange("semester", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                    <option value="3">ภาคเรียนที่ 3 (ฤดูร้อน)</option>
                  </select>
                </div>
              </div>

              {form.studentLevel === "bachelor" && form.year === "1" && form.semester === "1" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-2.5 text-xs text-blue-900">
                  💡 <strong>นิสิตชั้นปีที่ 1 ภาคเรียนที่ 1:</strong> สามารถเว้นว่างเกรดเฉลี่ยภาคเรียนและ GPAX ได้ โดยระบบยกเว้นเกณฑ์ GPAX สำหรับการสมัครแข่งขัน
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    เกรดเฉลี่ยภาคเรียนล่าสุด (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={form.gpaSemester}
                    onChange={(e) => handleGpaChange("gpaSemester", e.target.value)}
                    onBlur={() => handleGpaBlur("gpaSemester")}
                    placeholder="เช่น 3.25"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                  {fieldErrors.gpaSemester && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.gpaSemester}</p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    เกรดเฉลี่ยสะสม GPAX (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={form.gpaCumulative}
                    onChange={(e) => handleGpaChange("gpaCumulative", e.target.value)}
                    onBlur={() => handleGpaBlur("gpaCumulative")}
                    placeholder="เช่น 3.40"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                  {fieldErrors.gpaCumulative && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.gpaCumulative}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ส่วนที่ 3: ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ติดต่อ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
                3. ที่อยู่ตามทะเบียนบ้าน / ที่อยู่ปัจจุบัน
              </h3>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  บ้านเลขที่ / หมู่ / ซอย / ถนน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.addressNo}
                  onChange={(e) => handleFieldChange("addressNo", e.target.value)}
                  placeholder="เช่น 19 หมู่ 2 ต.แม่กา"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                />
                {fieldErrors.addressNo && (
                  <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.addressNo}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  >
                    <option value="">-- เลือกจังหวัด --</option>
                    {ALL_THAI_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.province && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.province}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    อำเภอ / เขต <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!form.province}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  >
                    <option value="">-- เลือกอำเภอ / เขต --</option>
                    {amphures.map((amp) => (
                      <option key={amp.name} value={amp.name}>
                        {amp.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.district && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.district}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ตำบล / แขวง <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.subDistrict}
                    onChange={(e) => handleSubDistrictChange(e.target.value)}
                    disabled={!form.district}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  >
                    <option value="">-- เลือกตำบล / แขวง --</option>
                    {tambons.map((tam) => (
                      <option key={tam.name} value={tam.name}>
                        {tam.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.subDistrict && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.subDistrict}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    รหัสไปรษณีย์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={form.postalCode}
                    onChange={(e) => handleFieldChange("postalCode", e.target.value.replace(/\D/g, ""))}
                    placeholder="เช่น 56000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                  />
                  {fieldErrors.postalCode && (
                    <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.postalCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  กำลังบันทึกข้อมูล...
                </>
              ) : (
                "บันทึกการแก้ไข"
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
