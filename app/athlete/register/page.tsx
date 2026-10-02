"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { getAthleteProfile, saveAthleteProfile, calcBirthYearCE, DEFAULT_MOCK_PHOTO, type AthleteProfile } from "@/lib/athlete-profile";
import { UP_FACULTIES } from "@/lib/up-faculties";
import {
  ALL_THAI_PROVINCES,
  getAmphuresByProvince,
  getTambonsByAmphure,
} from "@/lib/thailand-addresses";
import { getSportConfig } from "@/lib/sports-categories";

const SPORTS = [
  // กีฬาบังคับ (7 ชนิด)
  "กรีฑา", "กีฬาทางน้ำ", "วอลเลย์บอล", "เทควันโด", "มวยไทยสมัครเล่น", "ฟุตบอล", "บาสเกตบอล",
  // กีฬาเลือกสากล (28 ชนิด)
  "เปตอง", "จักรยาน", "เซปักตะกร้อ", "ยูยิตสู", "เทเบิลเทนนิส", "ปันจักสีลัต", "แบดมินตัน", "เทนนิส",
  "ฟุตซอล", "ฮับกิโด", "อีสปอร์ต", "จานร่อน", "ปีนหน้าผา", "วู้ดบอล", "สควอช", "คิกบ็อกซิ่ง",
  "ซอฟท์บอล", "ปัญจกีฬา", "เรือพาย", "โอเรียนเทียริ่ง", "คาราเต้", "ฟันดาบสากล", "เชียร์",
  "แฮนด์บอล", "ฮอกกี้", "รักบี้ฟุตบอล", "คอร์ฟบอล", "วูซู",
  // กีฬาเลือกทั่วไป (3 ชนิด)
  "หมากรุกสากล", "บริดจ์", "หมากล้อม",
  // กีฬาไทย (1 ชนิด)
  "ดาบไทย",
  // กีฬาสาธิต (3 ชนิด)
  "ซอฟท์เทนนิส", "กาบัดดี้", "พิกเคิลบอล",
];

const CURRENT_YEAR_BE = 2569;
const CURRENT_YEAR_CE = 2026;

type CompetitionResult = {
  id: string;
  competitionName: string;
  year: string;
  result: string;
  certificateName?: string;
  certificateFile?: File | null;
  certificateFiles?: File[];
  certificateNames?: string[];
};

type SportEntry = {
  id: string;
  sport: string;
  category: string;
  division: string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const MAX_ENTRIES = { bachelor: 5, graduate: 3 };
const MAX_ENTRIES_STRICT = 5;
const MAX_SPORTS_PER_APPLICATION = 4;

export default function AthleteRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [studentCertFile, setStudentCertFile] = useState<File | null>(null);
  const [docFileError, setDocFileError] = useState<string>("");

  const fileHandler = (setter: (f: File | null) => void, maxMB = 10) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setDocFileError(`ไฟล์ "${file.name}" มีขนาดใหญ่เกินกำหนด (${sizeMB} MB) กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน ${maxMB} MB`);
      e.target.value = "";
      return;
    }
    setDocFileError("");
    setter(file);
  };

  // โหลดข้อมูลส่วนตัวจาก localStorage (กรอกตอน Register ครั้งแรก)
  const [studentProfile, setStudentProfile] = useState<AthleteProfile | null>(null);

  useEffect(() => {
    // TODO: เปลี่ยนเป็น fetch /api/athletes/profile เมื่อ Backend พร้อม
    const profile = getAthleteProfile();
    if (profile) {
      setStudentProfile({
        ...profile,
        photoUrl: profile.photoUrl || DEFAULT_MOCK_PHOTO,
      });
    } else {
      // ข้อมูลตัวอย่างเริ่มต้นสำหรับนำเสนองานและบันทึกภาพหน้าจอ
      setStudentProfile({
        studentId: "66027012",
        firstName: "สมชาย",
        lastName: "ใจดี",
        gender: "male",
        faculty: "คณะวิทยาศาสตร์",
        major: "สาขาวิทยาการคอมพิวเตอร์",
        studentLevel: "bachelor",
        year: "4",
        nationalId: "1-2345-67890-12-3",
        nationality: "ไทย",
        birthDate: "2003-05-12",
        birthYearCE: 2003,
        gpaSemester: "3.45",
        gpaCumulative: "3.50",
        addressNo: "99/1 หมู่ 2",
        subDistrict: "แม่กา",
        district: "เมือง",
        province: "พะเยา",
        postalCode: "56000",
        phone: "081-234-5678",
        previousEntriesCount: 0,
        photoName: "photo_somchai.jpg",
        photoUrl: DEFAULT_MOCK_PHOTO,
      });
    }
  }, []);

  // State สำหรับ Modal แก้ไขข้อมูลประวัตินิสิต
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState<AthleteProfile | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const handleOpenEditProfileModal = () => {
    if (!studentProfile) return;
    setEditProfileForm({ ...studentProfile });
    setEditPhotoPreview(studentProfile.photoUrl || DEFAULT_MOCK_PHOTO);
    setEditPhotoFile(null);
    setShowEditProfileModal(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setEditPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileForm) return;

    const birthYear = editProfileForm.birthDate
      ? calcBirthYearCE(editProfileForm.birthDate)
      : editProfileForm.birthYearCE;

    const updated: AthleteProfile = {
      ...editProfileForm,
      birthYearCE: birthYear || editProfileForm.birthYearCE,
      photoUrl: editPhotoPreview || editProfileForm.photoUrl || DEFAULT_MOCK_PHOTO,
      photoName: editPhotoFile ? editPhotoFile.name : editProfileForm.photoName,
    };

    saveAthleteProfile(updated);
    setStudentProfile(updated);
    setProfileSaveSuccess(true);
    setTimeout(() => {
      setProfileSaveSuccess(false);
      setShowEditProfileModal(false);
    }, 700);
  };

  // ตัวเลือกอำเภอและตำบลแบบ Cascading Dropdown สำหรับหน้าต่างแก้ไขประวัติ
  const editAmphureOptions = useMemo(() => {
    if (!editProfileForm?.province) return [];
    return getAmphuresByProvince(editProfileForm.province);
  }, [editProfileForm?.province]);

  const editTambonOptions = useMemo(() => {
    if (!editProfileForm?.province || !editProfileForm?.district) return [];
    return getTambonsByAmphure(editProfileForm.province, editProfileForm.district);
  }, [editProfileForm?.province, editProfileForm?.district]);

  const [form, setForm] = useState({
    round: "" as "qualifier" | "final" | "",
    hasPreviousEntry: "" as "none" | "has" | "",
    previousBachelorCount: "",
    previousGraduateCount: "",
    previousLastYear: "",
    note: "",
  });

  const [hasClub, setHasClub] = useState<"yes" | "no" | "">("");
  const [noClubFile, setNoClubFile] = useState<File | null>(null);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPosition, setSupervisorPosition] = useState("");

  const [sportEntries, setSportEntries] = useState<SportEntry[]>([]);
  const [newSportEntry, setNewSportEntry] = useState({ sport: "", category: "", division: "" });

  const [competitions, setCompetitions] = useState<CompetitionResult[]>([]);
  const [newComp, setNewComp] = useState<{
    competitionName: string;
    year: string;
    result: string;
    certificateFiles: File[];
  }>({
    competitionName: "",
    year: "",
    result: "",
    certificateFiles: [],
  });
  const [compFileError, setCompFileError] = useState<string>("");

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // นิสิตปี 1 เทอม 1 ตรวจจับจากข้อมูลประวัตินิสิตที่กรอกไว้ตอนลงทะเบียนครั้งแรก
  const isFreshmanFirstTerm = !!(
    studentProfile?.isFreshmanFirstTerm ||
    (studentProfile?.year === "1" && (studentProfile?.gpaCumulative?.includes("ไม่มี") || !studentProfile?.gpaCumulative))
  );

  // คำนวณอายุจาก birthYearCE ที่ดึงมาจาก profile
  const birthYearCE = studentProfile?.birthYearCE ?? CURRENT_YEAR_CE - 20;
  const calculateAge = (year: number) => CURRENT_YEAR_CE - year;
  const athleteAge = calculateAge(birthYearCE);
  const isAgeEligible = athleteAge <= 28;

  const studentLevel = studentProfile?.studentLevel ?? "bachelor";
  const maxEntries = MAX_ENTRIES[studentLevel];
  const previousEntriesCount = studentProfile?.previousEntriesCount ?? 0;
  const isEntryCountEligible = previousEntriesCount < maxEntries;
  const isOverMaxStrict = previousEntriesCount >= MAX_ENTRIES_STRICT;
  const remainingEntries = maxEntries - previousEntriesCount;

  const handleNoClubFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setDocFileError(`ไฟล์ "${file.name}" มีขนาดใหญ่เกินกำหนด (${sizeMB} MB) กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10 MB`);
      e.target.value = "";
      return;
    }
    setDocFileError("");
    setNoClubFile(file);
  };

  const addSportEntry = () => {
    if (!newSportEntry.sport || sportEntries.length >= MAX_SPORTS_PER_APPLICATION) return;
    setSportEntries((prev) => [...prev, { ...newSportEntry, id: generateId() }]);
    setNewSportEntry({ sport: "", category: "", division: "" });
  };

  const removeSportEntry = (id: string) => setSportEntries((prev) => prev.filter((s) => s.id !== id));

  const handleCompFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    const newFiles: File[] = [];
    const oversizedFiles: string[] = [];
    const MAX_MB = 10;

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (file.size <= MAX_MB * 1024 * 1024) {
        newFiles.push(file);
      } else {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        oversizedFiles.push(`"${file.name}" (${sizeMB} MB)`);
      }
    }

    if (oversizedFiles.length > 0) {
      setCompFileError(
        `ไฟล์ต่อไปนี้มีขนาดใหญ่เกิน ${MAX_MB} MB: ${oversizedFiles.join(", ")} กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน ${MAX_MB} MB`
      );
    } else {
      setCompFileError("");
    }

    if (newFiles.length > 0) {
      setNewComp((prev) => {
        const existingKeys = new Set(prev.certificateFiles.map((f) => `${f.name}-${f.size}`));
        const unique = newFiles.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
        return {
          ...prev,
          certificateFiles: [...prev.certificateFiles, ...unique],
        };
      });
    }
    e.target.value = "";
  };

  const removeCompFile = (index: number) => {
    setNewComp((prev) => ({
      ...prev,
      certificateFiles: prev.certificateFiles.filter((_, i) => i !== index),
    }));
  };

  const addCompetition = () => {
    if (!newComp.competitionName || !newComp.year || !newComp.result) return;
    setCompetitions((prev) => [
      ...prev,
      {
        id: generateId(),
        competitionName: newComp.competitionName,
        year: newComp.year,
        result: newComp.result,
        certificateFiles: newComp.certificateFiles,
        certificateNames: newComp.certificateFiles.map((f) => f.name),
        certificateName: newComp.certificateFiles[0]?.name || "",
        certificateFile: newComp.certificateFiles[0] || null,
      },
    ]);
    setNewComp({
      competitionName: "",
      year: "",
      result: "",
      certificateFiles: [],
    });
    setCompFileError("");
  };

  const removeCompetition = (id: string) => setCompetitions((prev) => prev.filter((c) => c.id !== id));

  const isWithinTwoYears = (year: string) => parseInt(year) >= CURRENT_YEAR_BE - 2;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: ส่ง API POST /api/applications เมื่อ Backend พร้อม
      console.log("submit", {
        ...studentProfile,
        ...form,
        sportEntries,
        competitions,
        hasClub,
        supervisorName: hasClub === "no" ? supervisorName : null,
        supervisorPosition: hasClub === "no" ? supervisorPosition : null,
        noClubFile: hasClub === "no" ? noClubFile?.name : null,
        files: {
          photoFile: photoFile?.name || studentProfile?.photoName || "photo_profile.jpg",
          idCardFile: idCardFile?.name,
          studentCardFile: studentCardFile?.name || null,
          studentCertFile: studentCertFile?.name,
          isFreshmanFirstTerm,
        }
      });

      // บันทึกสถานะเริ่มต้นเข้าสู่ระบบเป็น pending (ขั้นตอนที่ 1)
      if (typeof window !== "undefined") {
        localStorage.setItem("athlete_application_status", "pending");
        localStorage.setItem("athlete_application_stage", "1");
        localStorage.setItem("athlete_is_freshman_first_term", isFreshmanFirstTerm ? "true" : "false");
        localStorage.setItem(
          "athlete_application_submitted_at",
          new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
        );
        if (sportEntries.length > 0) {
          localStorage.setItem("athlete_registered_sport", sportEntries.map((s) => `${s.sport} (${s.category || s.division || "ทั่วไป"})`).join(", "));
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
      router.push("/athlete/status");
    } finally {
      setLoading(false);
    }
  };

  // Step validation — 3 ขั้นตอนใหม่
  const step1Valid = !!(form.round && hasClub && (hasClub === "yes" || (supervisorName && supervisorPosition && noClubFile)));
  const step2Valid = sportEntries.length > 0;
  const step3Valid = !!(
    form.hasPreviousEntry &&
    (form.hasPreviousEntry === "none" || ((form.previousBachelorCount || form.previousGraduateCount) && form.previousLastYear)) &&
    (photoFile || studentProfile?.photoUrl) && idCardFile && studentCertFile && studentCardFile
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              แบบคำขอขึ้นทะเบียนและสมัครเข้ารับการคัดเลือกนักกีฬาตัวแทนสถาบัน
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/athlete/status")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ตรวจสอบสถานะ
            </button>
          </div>
        </div>

        {/* Profile Card — ข้อมูลนิสิตจาก Register ครั้งแรก */}
        {studentProfile ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  ข้อมูลประวัตินักศึกษา (จากฐานข้อมูลทะเบียนกลาง มหาวิทยาลัยพะเยา)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenEditProfileModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-900 hover:text-white bg-blue-50 hover:bg-blue-900 border border-blue-200 hover:border-blue-900 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไขข้อมูลประวัติ
                </button>
                <span className="text-[11px] px-2.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  สถานะ: นิสิตปัจจุบัน มีสิทธิ์สมัคร
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* รูปถ่ายประจำตัวนิสิต (ขนาด 1 นิ้ว) จากที่กรอกตอนแรก */}
              <div className="flex flex-col items-center shrink-0 mx-auto sm:mx-0">
                <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-100 shadow-xs relative flex items-center justify-center">
                  <img
                    src={studentProfile.photoUrl || DEFAULT_MOCK_PHOTO}
                    alt={`รูปถ่ายของ ${studentProfile.firstName} ${studentProfile.lastName}`}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/75 to-transparent pt-3 pb-1 px-1 text-center">
                    <span className="text-[9px] text-white/95 font-medium block">
                      รูปขนาด 1 นิ้ว
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-1.5 text-center max-w-[110px] truncate" title={studentProfile.photoName || "รูปถ่ายหน้าตรงชุดนิสิต"}>
                  {studentProfile.photoName || "รูปถ่ายหน้าตรงชุดนิสิต"}
                </span>
              </div>

              {/* รายละเอียดข้อมูลส่วนตัว */}
              <div className="flex-1 min-w-0 w-full space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 text-xs border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">ชื่อ - นามสกุล</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.firstName} {studentProfile.lastName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">เพศ</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {studentProfile.gender === "male" ? "ชาย" : studentProfile.gender === "female" ? "หญิง" : studentProfile.gender === "other" ? "อื่นๆ" : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">รหัสประจำตัวนิสิต</span>
                    <p className="font-semibold text-slate-900 mt-0.5 font-mono">{studentProfile.studentId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">คณะ / วิทยาลัย</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.faculty}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">สาขาวิชา</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.major}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ระดับการศึกษา / ชั้นปี</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {studentProfile.studentLevel === "bachelor" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปีที่ {studentProfile.year}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">อายุ (ปีปฏิทิน กกมท.)</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-slate-900">{athleteAge} ปี</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${isAgeEligible ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                        {isAgeEligible ? "≤ 28 ปี" : "เกินเกณฑ์"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">เกรดเฉลี่ยสะสม (GPAX)</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isFreshmanFirstTerm ? (
                        <>
                          <span className="font-bold text-blue-900 font-mono text-xs">
                            ยังไม่มีเกรด
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            ปี 1 เทอม 1 (ยกเว้นเกรด)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-blue-900 font-mono text-sm">{studentProfile.gpaCumulative || "3.50"}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ≥ 2.00 ผ่านเกณฑ์
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">เกรดเฉลี่ยภาคล่าสุด (GPA)</span>
                    <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                      {isFreshmanFirstTerm ? "ยังไม่มีผลการเรียน" : (studentProfile.gpaSemester || "3.45")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[11px] pt-1 text-slate-500">
                  <div>เบอร์ติดต่อ: <span className="font-medium text-slate-700">{studentProfile.phone || "081-234-5678"}</span></div>
                  <div>สัญชาติ: <span className="font-medium text-slate-700">{studentProfile.nationality || "ไทย"}</span></div>
                  <div>สิทธิ์แข่งสะสม: <span className="font-medium text-slate-700">{previousEntriesCount}/{maxEntries} ครั้ง</span></div>
                  <div>โควตาคงเหลือ: <span className="font-semibold text-emerald-700">{remainingEntries} ครั้ง</span></div>
                </div>
                <div className="text-[11px] pt-1.5 text-slate-500 border-t border-slate-100 mt-1 flex flex-wrap items-center gap-1">
                  <span>ที่อยู่ปัจจุบัน:</span>
                  <span className="font-medium text-slate-700">
                    {[
                      studentProfile.addressNo,
                      studentProfile.subDistrict ? `ต.${studentProfile.subDistrict}` : "",
                      studentProfile.district ? `อ.${studentProfile.district}` : "",
                      studentProfile.province ? `จ.${studentProfile.province}` : "",
                      studentProfile.postalCode,
                    ].filter(Boolean).join(" ") || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // กรณีไม่มีข้อมูลใน localStorage (ยังไม่ได้ลงทะเบียน)
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-xs text-amber-700">ไม่พบข้อมูลส่วนตัว กรุณา<button onClick={() => router.push("/login")} className="underline font-medium">ลงทะเบียนครั้งแรก</button>ก่อนสมัครแข่งขัน</p>
          </div>
        )}

        {/* แจ้งเตือนสิทธิ์ */}
        {isOverMaxStrict && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-red-900 mb-1">ไม่มีสิทธิ์สมัครเข้าร่วมการแข่งขัน</p>
            <p className="text-sm text-red-700">ท่านเคยเข้าร่วมการแข่งขันกีฬามหาวิทยาลัยฯ ครบ 5 ครั้งแล้ว ตามระเบียบ กกมท. ข้อ 7.2</p>
          </div>
        )}
        {!isOverMaxStrict && (!isAgeEligible || !isEntryCountEligible) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-red-800 mb-1">ไม่มีสิทธิ์สมัครเข้าร่วมการแข่งขัน</p>
            {!isAgeEligible && <p className="text-sm text-red-600">อายุของท่าน ({athleteAge} ปี) เกิน 28 ปี ตามระเบียบ กกมท. ข้อ 6.5</p>}
            {!isEntryCountEligible && <p className="text-sm text-red-600">ท่านสมัครครบ {maxEntries} ครั้งแล้ว ตามระเบียบ กกมท. ข้อ 7.2</p>}
          </div>
        )}
        {isAgeEligible && isEntryCountEligible && remainingEntries === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">นี่จะเป็นการสมัครครั้งสุดท้ายของท่าน ({previousEntriesCount + 1}/{maxEntries} ครั้ง)</p>
          </div>
        )}

        {/* Step indicator — 3 ขั้นตอน */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-blue-900 text-white" : "bg-slate-200 text-slate-500"}`}>{s}</div>
              <span className={`text-xs ${step >= s ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                {s === 1 ? "1. ชมรมและรอบการแข่งขัน" : s === 2 ? "2. ชนิดกีฬาและรายการ" : "3. ผลงานและเอกสารแนบ"}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-900" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">

          {/* Step 1: รอบแข่งขัน + ชมรม */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สมัครรอบ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => set("round", "qualifier")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.round === "qualifier" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>รอบคัดเลือก</button>
                  <button type="button" onClick={() => set("round", "final")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.round === "final" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>รอบมหกรรม</button>
                </div>
              </div>

              {form.round && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                  {form.round === "qualifier"
                    ? "กำหนดการทดสอบสมรรถภาพรอบคัดเลือก: วันพุธที่ 2 ก.ย. 2569 (สำหรับ เปตอง, วอลเลย์บอล, บาสเกตบอล, ฟุตซอล)"
                    : "กำหนดการทดสอบสมรรถภาพรอบมหกรรม: วันอังคารที่ 1 ธ.ค. 2569 (สำหรับกีฬา 11 ชนิด และกีฬาที่ผ่านรอบคัดเลือก)"}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ท่านเป็นสมาชิกชมรมกีฬาที่จัดตั้งในมหาวิทยาลัยหรือไม่?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setHasClub("yes")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${hasClub === "yes" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>มีชมรม</button>
                  <button type="button" onClick={() => setHasClub("no")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${hasClub === "no" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ไม่มีชมรม</button>
                </div>
              </div>

              {hasClub === "no" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <div className="bg-orange-100 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium text-orange-900 mb-1">ขั้นตอนสำหรับนักกีฬาที่ไม่มีชมรม</p>
                    <ol className="text-xs text-orange-800 space-y-1 list-decimal list-inside">
                      <li>กรอกข้อมูลและแนบหนังสือขออนุญาตพร้อมบุคลากรรับรองอย่างน้อย 1 คน</li>
                      <li>ระบบจะส่งข้อมูลไปยัง <strong>กองกิจการนิสิต</strong> โดยตรง (ไม่ผ่านชมรม)</li>
                      <li>กองกิจจะพิจารณาและแต่งตั้งเจ้าหน้าที่รับผิดชอบแยกต่างหาก</li>
                      <li>รอการแจ้งผลการพิจารณาจากกองกิจการนิสิต</li>
                    </ol>
                  </div>
                  <p className="text-sm text-orange-800 font-medium">ต้องทำหนังสือขออนุญาตพร้อมมีบุคลากรในสังกัดมหาวิทยาลัยอย่างน้อย 1 คน รับรองและรับผิดชอบทีม</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล บุคลากรผู้รับรอง</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง / สังกัด</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={supervisorPosition} onChange={(e) => setSupervisorPosition(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หนังสือขออนุญาต <span className="text-xs text-gray-400 font-normal">(PDF ขนาดไม่เกิน 10 MB)</span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors bg-white">
                      <span className="text-sm text-gray-500">{noClubFile ? noClubFile.name : "คลิกเพื่อแนบไฟล์ (PDF)"}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">ขนาดไฟล์ไม่เกิน 10 MB</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={handleNoClubFile} />
                    </label>
                    {docFileError && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{docFileError}</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid || !isAgeEligible || !isEntryCountEligible}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
              >
                ถัดไป
              </button>
            </div>
          )}

          {/* Step 2: ชนิดกีฬาที่สมัคร (สูงสุด 4 ชนิด) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชนิดกีฬาที่สมัคร / ประเภท / รุ่น</label>
                <p className="text-xs text-gray-400 mb-2">สมัครได้สูงสุด {MAX_SPORTS_PER_APPLICATION} ชนิดกีฬาต่อใบสมัคร ({sportEntries.length}/{MAX_SPORTS_PER_APPLICATION})</p>

                {sportEntries.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {sportEntries.map((s, i) => (
                      <div key={s.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{i + 1}. {s.sport}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{s.category || "-"} {s.division && `· รุ่น ${s.division}`}</p>
                        </div>
                        <button onClick={() => removeSportEntry(s.id)} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {sportEntries.length < MAX_SPORTS_PER_APPLICATION && (() => {
                  const config = newSportEntry.sport ? getSportConfig(newSportEntry.sport) : null;
                  return (
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={newSportEntry.sport} onChange={(e) => setNewSportEntry({ sport: e.target.value, category: "", division: "" })}>
                        <option value="">เลือกชนิดกีฬา</option>
                        {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={newSportEntry.category} onChange={(e) => setNewSportEntry((p) => ({ ...p, category: e.target.value }))} disabled={!newSportEntry.sport}>
                          <option value="">เลือกประเภท</option>
                          {config?.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={newSportEntry.division} onChange={(e) => setNewSportEntry((p) => ({ ...p, division: e.target.value }))} disabled={!newSportEntry.sport}>
                          <option value="">เลือกรุ่น</option>
                          {config?.divisions.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <button onClick={addSportEntry} disabled={!newSportEntry.sport || !newSportEntry.category || !newSportEntry.division} className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors">+ เพิ่มชนิดกีฬา</button>
                    </div>
                  )
                })()}
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <BackButton onClick={() => setStep(1)} label="ย้อนกลับขั้นตอนที่ 1" className="flex-1 justify-center py-2.5" />
                <button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer">ถัดไป: ผลงานและเอกสารแนบ →</button>
              </div>
            </div>
          )}

          {/* Step 3: ประวัติเข้าร่วมแข่งขัน + ผลงาน + ไฟล์แนบ */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ท่านเคยเข้าร่วมการแข่งขันกีฬามหาวิทยาลัยฯ มาก่อนหรือไม่ (ไม่รวมครั้งนี้)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => set("hasPreviousEntry", "none")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.hasPreviousEntry === "none" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ไม่เคย</button>
                  <button type="button" onClick={() => set("hasPreviousEntry", "has")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.hasPreviousEntry === "has" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>เคยเข้าร่วม</button>
                </div>
              </div>

              {form.hasPreviousEntry === "has" && (
                <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ระดับปริญญาตรี (ครั้ง)</label>
                    <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.previousBachelorCount} onChange={(e) => set("previousBachelorCount", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ระดับโท/เอก (ครั้ง)</label>
                    <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.previousGraduateCount} onChange={(e) => set("previousGraduateCount", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ปีล่าสุดที่เข้าร่วม</label>
                    <input className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="พ.ศ." value={form.previousLastYear} onChange={(e) => set("previousLastYear", e.target.value)} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติผลงานการเข้าร่วมแข่งขัน</label>
                <p className="text-xs text-gray-400 mb-2">ตามประกาศ ข้อ 6(1-11) ไม่เกิน 2 ปีนับย้อนหลัง (พ.ศ. {CURRENT_YEAR_BE - 2} เป็นต้นไป)</p>

                {competitions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {competitions.map((c) => (
                      <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3">
                        <div className="text-sm space-y-1">
                          <p className="font-semibold text-slate-900">{c.competitionName}</p>
                          <p className="text-slate-500 text-xs">พ.ศ. {c.year} · ผลการแข่งขัน: {c.result}</p>
                          {((c.certificateNames && c.certificateNames.length > 0) || c.certificateName) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[11px] text-slate-500 font-medium">หลักฐาน ({c.certificateNames ? c.certificateNames.length : 1} ไฟล์):</span>
                              {(c.certificateNames && c.certificateNames.length > 0
                                ? c.certificateNames
                                : c.certificateName
                                  ? [c.certificateName]
                                  : []
                              ).map((name, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium"
                                >
                                  <svg className="w-3 h-3 text-blue-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                          {!isWithinTwoYears(c.year) && <p className="text-rose-600 text-xs mt-1">เกิน 2 ปีย้อนหลัง อาจไม่นำมาพิจารณา</p>}
                        </div>
                        <button onClick={() => removeCompetition(c.id)} className="text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-white">
                  <input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="รายการที่เข้าร่วมแข่งขัน / ผู้จัดการแข่งขัน" value={newComp.competitionName} onChange={(e) => setNewComp((p) => ({ ...p, competitionName: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="ปี พ.ศ." value={newComp.year} onChange={(e) => setNewComp((p) => ({ ...p, year: e.target.value }))} />
                    <input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="ผลการแข่งขัน เช่น ชนะเลิศ / อันดับ 1" value={newComp.result} onChange={(e) => setNewComp((p) => ({ ...p, result: e.target.value }))} />
                  </div>

                  {/* แสดงรายการไฟล์ที่แนบไว้สำหรับรายการแข่งขันนี้ */}
                  {newComp.certificateFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">
                          หลักฐานที่เลือกสำหรับรายการนี้ ({newComp.certificateFiles.length} ไฟล์):
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewComp((p) => ({ ...p, certificateFiles: [] }))}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          ล้างไฟล์ทั้งหมด
                        </button>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {newComp.certificateFiles.map((file, idx) => (
                          <div
                            key={`${file.name}-${idx}`}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <svg className="w-4 h-4 text-blue-900 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="truncate font-medium text-slate-800 text-[11px]">{file.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCompFile(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
                              title="ลบไฟล์นี้"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* แจ้งเตือนเมื่อมีไฟล์ขนาดเกิน 10 MB ในรายการแข่งขันนี้ */}
                  {compFileError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                      <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="space-y-0.5">
                        <span className="font-semibold block">พบไฟล์ขนาดใหญ่เกินกำหนด:</span>
                        <span className="leading-relaxed">{compFileError}</span>
                      </div>
                    </div>
                  )}

                  {/* แนบเกียรติบัตรหรือรูปถ่ายผลงานสำหรับรายการแข่งขัน (เพิ่มได้ทีละหลายไฟล์) */}
                  <label className="flex flex-col items-center justify-center w-full py-2.5 px-3 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>
                        {newComp.certificateFiles.length > 0
                          ? "คลิกเพื่อเลือกไฟล์หลักฐานเพิ่มเติมสำหรับรายการนี้ (เลือกได้หลายไฟล์พร้อมกัน)"
                          : "แนบเกียรติบัตรหรือรูปถ่ายผลงานสำหรับรายการนี้ (เลือกได้หลายไฟล์พร้อมกัน)"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      รองรับไฟล์ PDF, JPG, PNG (ขนาดไฟล์ละไม่เกิน 10 MB)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleCompFiles}
                    />
                  </label>

                  <button onClick={addCompetition} disabled={!newComp.competitionName || !newComp.year || !newComp.result} className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed">+ เพิ่มผลงาน</button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    หลักฐานและเอกสารแนบประกอบการสมัคร
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    กรุณาแนบไฟล์เอกสารหลักฐานทางการให้ครบถ้วน เพื่อให้คณะกรรมการตรวจสอบ (ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์ หรือไม่เกิน 5 MB สำหรับรูปถ่าย)
                  </p>
                </div>

                {/* กล่องแจ้งเตือนเมื่อไฟล์เอกสารมีขนาดเกินกำหนด */}
                {docFileError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="space-y-0.5">
                      <span className="font-semibold block">พบไฟล์ขนาดใหญ่เกินกำหนด:</span>
                      <span className="leading-relaxed">{docFileError}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        1. รูปถ่ายชุดนิสิตถูกระเบียบ (ขนาด 1 นิ้ว) <span className="text-rose-600">*</span>
                      </label>
                      {(photoFile || studentProfile?.photoUrl) && (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          {photoFile ? "แนบไฟล์ใหม่แล้ว" : "ใช้จากประวัตินิสิต"}
                        </span>
                      )}
                    </div>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-white transition-colors">
                      <span className="text-xs text-slate-600 text-center px-2 truncate max-w-full font-medium">
                        {photoFile
                          ? photoFile.name
                          : studentProfile?.photoName
                            ? `${studentProfile.photoName} (ดึงจากข้อมูลประวัตินิสิต)`
                            : studentProfile?.photoUrl
                              ? "ใช้รูปถ่ายจากข้อมูลประวัตินิสิตแล้ว (คลิกเพื่อเปลี่ยน)"
                              : "คลิกแนบไฟล์รูปถ่าย (JPG/PNG)"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">ขนาดไฟล์ไม่เกิน 5 MB</span>
                      <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setPhotoFile, 5)} />
                    </label>
                  </div>

                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        2. สำเนาบัตรประจำตัวประชาชน <span className="text-rose-600">*</span>
                      </label>
                      {idCardFile && <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">แนบแล้ว</span>}
                    </div>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-white transition-colors">
                      <span className="text-xs text-slate-600 text-center px-2 truncate max-w-full font-medium">
                        {idCardFile ? idCardFile.name : "คลิกแนบสำเนาบัตร ปชช. (PDF/JPG)"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">ขนาดไฟล์ไม่เกิน 10 MB</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setIdCardFile, 10)} />
                    </label>
                  </div>

                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        3. สำเนาบัตรประจำตัวนิสิต <span className="text-rose-600">*</span>
                      </label>
                      {studentCardFile && <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">แนบแล้ว</span>}
                    </div>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-white transition-colors">
                      <span className="text-xs text-slate-600 text-center px-2 truncate max-w-full font-medium">
                        {studentCardFile ? studentCardFile.name : "คลิกแนบสำเนาบัตรนิสิต หรือภาพแคปหน้าจอระบบ REG (PDF/JPG)"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">ขนาดไฟล์ไม่เกิน 10 MB</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setStudentCardFile, 10)} />
                    </label>
                    <p className="text-[10px] text-blue-900/80 font-medium leading-relaxed">
                      *กรณีเป็นนิสิตชั้นปีที่ 1 ที่ยังไม่ได้รับบัตร หรือนิสิตชั้นปีอื่นๆ ที่ไม่มีบัตร สามารถแคปหน้าจอทะเบียนนิสิตจากระบบ REG มาแนบแทนได้
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        4. ใบรับรองการเป็นนิสิต (UP 02) <span className="text-rose-600">*</span>
                      </label>
                      {studentCertFile && <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">แนบแล้ว</span>}
                    </div>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-white transition-colors">
                      <span className="text-xs text-slate-600 text-center px-2 truncate max-w-full font-medium">
                        {studentCertFile ? studentCertFile.name : "คลิกแนบใบรับรอง UP 02 (PDF)"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">ขนาดไฟล์ไม่เกิน 10 MB</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setStudentCertFile, 10)} />
                    </label>
                    {isFreshmanFirstTerm && (
                      <p className="text-[10px] text-blue-800 font-medium">
                        *นิสิตปี 1 เทอม 1 ใช้ใบรับรองสภาพนิสิตและการลงทะเบียนเรียนแทนผลการเรียนตามระเบียบ กกมท.
                      </p>
                    )}
                  </div>
                </div>

                {/* ข้อความแจ้งเตือนเกี่ยวกับการทดสอบสมรรถภาพทางกาย และ UP Academy */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">
                      ข้อมูลเกี่ยวกับการทดสอบสมรรถภาพทางกาย และใบผ่านการอบรม UP Academy:
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      • <strong>การทดสอบสมรรถภาพทางกาย (Fitness Test):</strong> นิสิตจะเข้ารับการทดสอบหลังจากการยื่นใบสมัครเรียบร้อยแล้ว โดยศูนย์ทดสอบสมรรถภาพทางกาย มหาวิทยาลัยพะเยา จะนัดหมายตามกำหนดการของแต่ละชนิดกีฬาและรอบแข่งขัน
                      <br />
                      • <strong>ใบผ่านการอบรม UP Academy:</strong> ปรับเป็นเอกสารประกอบเสริมตามความสมัครใจ ไม่นำมาเป็นเงื่อนไขบังคับในการสมัคร
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none resize-none" rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} />
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <BackButton onClick={() => setStep(2)} label="ย้อนกลับขั้นตอนที่ 2" className="flex-1 justify-center py-2.5" />
                <button onClick={handleSubmit} disabled={!step3Valid || loading} className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer">
                  {loading ? "กำลังส่งข้อมูล..." : "ลงนามส่งใบสมัคร"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== POPUP MODAL: แก้ไขข้อมูลประวัตินิสิต ===== */}
        {showEditProfileModal && editProfileForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col">

              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      แก้ไขข้อมูลประวัตินิสิต (ฐานข้อมูลกลาง)
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-4.5">
                    ปรับปรุงข้อมูลประวัติส่วนบุคคล ผลการเรียน และรูปถ่ายประจำตัวนักกีฬา มหาวิทยาลัยพะเยา
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Form (Scrollable) */}
              <form onSubmit={handleSaveProfile} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">

                {/* 1. รูปถ่ายประจำตัว (ขนาด 1 นิ้ว) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-900 block mb-2 text-xs">
                    1. รูปถ่ายประจำตัวหน้าตรงชุดนิสิต (ขนาด 1 นิ้ว)
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-28 rounded-lg border-2 border-slate-300 overflow-hidden bg-slate-200 relative shrink-0">
                      <img
                        src={editPhotoPreview || DEFAULT_MOCK_PHOTO}
                        alt="รูปถ่ายนิสิต"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-900 text-slate-700 hover:text-blue-900 rounded-lg cursor-pointer text-xs font-medium transition-colors shadow-xs">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>เลือกรูปถ่ายใหม่ (JPG / PNG)</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          onChange={handleEditPhotoChange}
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">
                        *รูปถ่ายหน้าตรงชุดนิสิต พื้นหลังสีฟ้าหรือขาว ขนาดไฟล์ไม่เกิน 5 MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. ข้อมูลส่วนบุคคล */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="font-semibold text-slate-900 block text-xs">
                    2. ข้อมูลส่วนบุคคล
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">รหัสนิสิต</label>
                      <input
                        type="text"
                        disabled
                        value={editProfileForm.studentId}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ชื่อจริง</label>
                      <input
                        type="text"
                        required
                        value={editProfileForm.firstName}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, firstName: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">นามสกุล</label>
                      <input
                        type="text"
                        required
                        value={editProfileForm.lastName}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, lastName: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">เพศ</label>
                      <select
                        value={editProfileForm.gender}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value as "male" | "female" | "other" })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      >
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">เลขประจำตัวประชาชน</label>
                      <input
                        type="text"
                        value={editProfileForm.nationalId}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, nationalId: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">วัน/เดือน/ปี เกิด (ค.ศ.)</label>
                      <input
                        type="date"
                        value={editProfileForm.birthDate}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, birthDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. ข้อมูลสังกัดและการศึกษา */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="font-semibold text-slate-900 block text-xs">
                    3. ข้อมูลสังกัดและการศึกษา
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">คณะ / วิทยาลัย</label>
                      <select
                        value={editProfileForm.faculty}
                        onChange={(e) => {
                          const newFac = e.target.value;
                          setEditProfileForm({ ...editProfileForm, faculty: newFac, major: "" });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      >
                        <option value="">-- เลือกคณะ / วิทยาลัย --</option>
                        {UP_FACULTIES.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">สาขาวิชา</label>
                      <select
                        value={editProfileForm.major}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, major: e.target.value })}
                        disabled={!editProfileForm.faculty}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">{editProfileForm.faculty ? "-- เลือกสาขาวิชา --" : "กรุณาเลือกคณะก่อน"}</option>
                        {UP_FACULTIES.find((f) => f.name === editProfileForm.faculty)?.majors.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ระดับการศึกษา</label>
                      <select
                        value={editProfileForm.studentLevel}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, studentLevel: e.target.value as "bachelor" | "graduate" })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      >
                        <option value="bachelor">ปริญญาตรี</option>
                        <option value="graduate">บัณฑิตศึกษา (ป.โท / ป.เอก)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ชั้นปี</label>
                      <select
                        value={editProfileForm.year}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, year: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      >
                        <option value="1">ปี 1</option>
                        <option value="2">ปี 2</option>
                        <option value="3">ปี 3</option>
                        <option value="4">ปี 4</option>
                        <option value="5">ปี 5</option>
                        <option value="6">ปี 6</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. ผลการเรียนสะสม (GPAX) & ข้อยกเว้นปี 1 เทอม 1 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="font-semibold text-slate-900 block text-xs">
                    4. ผลการเรียนและคุณสมบัติด้านวิชาการ
                  </span>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editProfileForm.isFreshmanFirstTerm}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditProfileForm({
                          ...editProfileForm,
                          isFreshmanFirstTerm: checked,
                          gpaCumulative: checked ? "" : editProfileForm.gpaCumulative || "3.50",
                          gpaSemester: checked ? "" : editProfileForm.gpaSemester || "3.50",
                        });
                      }}
                      className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-blue-950 block">
                        เป็นนิสิตปี 1 เทอม 1 (ยังไม่มีเกรดเฉลี่ยสะสม)
                      </span>
                      <span className="text-[10px] text-slate-600 block">
                        *กรณีเป็นนิสิตชั้นปีที่ 1 ภาคเรียนที่ 1 ได้รับการยกเว้นไม่ต้องมีผลการเรียนสะสมตามระเบียบ กกมท. โดยใช้ใบรับรองสภาพนิสิต UP 02 แนบแทน
                      </span>
                    </div>
                  </label>

                  {!editProfileForm.isFreshmanFirstTerm && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          เกรดเฉลี่ยสะสม (GPAX) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required={!editProfileForm.isFreshmanFirstTerm}
                          placeholder="เช่น 3.50 (ต้อง ≥ 2.00)"
                          value={editProfileForm.gpaCumulative}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, gpaCumulative: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs font-mono"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">เกณฑ์ กกมท. ข้อ 7.2 ต้องไม่ต่ำกว่า 2.00</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">เกรดเฉลี่ยภาคการศึกษาล่าสุด (GPA)</label>
                        <input
                          type="text"
                          placeholder="เช่น 3.45"
                          value={editProfileForm.gpaSemester}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, gpaSemester: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. ข้อมูลการติดต่อและที่อยู่ */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="font-semibold text-slate-900 block text-xs">
                    5. ข้อมูลการติดต่อและที่อยู่
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                      <input
                        type="text"
                        value={editProfileForm.phone}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">สัญชาติ</label>
                      <input
                        type="text"
                        value={editProfileForm.nationality || "ไทย"}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, nationality: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* ที่อยู่แบบ Cascading Dropdown */}
                  <div className="pt-2 border-t border-slate-200/70 space-y-2.5">
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      ที่อยู่ตามทะเบียนบ้าน / ที่อยู่ปัจจุบัน (เลือกผ่าน Dropdown ตามลำดับ)
                    </span>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        บ้านเลขที่ / หมู่ / ซอย / ถนน
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น 99/1 หมู่ 2 ซ.สุขสวัสดิ์"
                        value={editProfileForm.addressNo}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, addressNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* จังหวัด Dropdown */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          จังหวัด <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={editProfileForm.province}
                          onChange={(e) => {
                            const newProv = e.target.value;
                            setEditProfileForm({
                              ...editProfileForm,
                              province: newProv,
                              district: "",
                              subDistrict: "",
                              postalCode: "",
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs bg-white cursor-pointer"
                        >
                          <option value="">-- เลือกจังหวัด --</option>
                          {ALL_THAI_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* อำเภอ / เขต Dropdown */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          อำเภอ / เขต <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={editProfileForm.district}
                          onChange={(e) => {
                            const newDist = e.target.value;
                            setEditProfileForm({
                              ...editProfileForm,
                              district: newDist,
                              subDistrict: "",
                              postalCode: "",
                            });
                          }}
                          disabled={!editProfileForm.province}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {editProfileForm.province ? "-- เลือกอำเภอ / เขต --" : "กรุณาเลือกจังหวัดก่อน"}
                          </option>
                          {editAmphureOptions.map((a) => (
                            <option key={a.name} value={a.name}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ตำบล / แขวง Dropdown */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          ตำบล / แขวง <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={editProfileForm.subDistrict}
                          onChange={(e) => {
                            const newSub = e.target.value;
                            const found = editTambonOptions.find((t) => t.name === newSub);
                            setEditProfileForm({
                              ...editProfileForm,
                              subDistrict: newSub,
                              postalCode: found?.postalCode || editProfileForm.postalCode || "",
                            });
                          }}
                          disabled={!editProfileForm.district}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {editProfileForm.district ? "-- เลือกตำบล / แขวง --" : "กรุณาเลือกอำเภอก่อน"}
                          </option>
                          {editTambonOptions.map((t, idx) => (
                            <option key={`${t.name}-${idx}`} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* รหัสไปรษณีย์ */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          รหัสไปรษณีย์
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น 56000"
                          value={editProfileForm.postalCode}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, postalCode: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {profileSaveSuccess && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        ✓ บันทึกข้อมูลประวัตินิสิตเรียบร้อยแล้ว
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditProfileModal(false)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
                    >
                      บันทึกการแก้ไขข้อมูล
                    </button>
                  </div>
                </div>

              </form>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}