"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { documentId, documentReference } from "@/lib/athlete-document-policy";
import { fetchJson, HttpError } from "@/lib/http-client";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import LogoutButton from "@/components/shared/LogoutButton";
import BackButton from "@/components/shared/BackButton";
import AthleteProfilePhoto from "@/components/shared/AthleteProfilePhoto";
import AthleteProfileEditModal from "@/components/shared/AthleteProfileEditModal";
import { type AthleteProfile } from "@/lib/athlete-profile-types";
import { getSportConfig, filterCategoriesByGender, filterDivisionsByGender } from "@/lib/sports-categories";
import { detectAthleteGender, getGenderLabel } from "@/lib/thai-name-title";
import { countParticipationForLevel, evaluateAge, evaluateParticipationCount, evaluateGpax, isFirstSemesterGradeExempt } from "@/lib/rule-checker";
import { UNIVERSITY_CLUBS, suggestClubForSport } from "@/lib/university-clubs";
import { getSportEntryLimit, getSportType, isTeamSport, MAX_INDIVIDUAL_SPORT_ENTRIES } from "@/lib/sport-type";

const CURRENT_YEAR_CE = new Date().getFullYear();
const CURRENT_YEAR_BE = CURRENT_YEAR_CE + 543;

type CompetitionResult = {
  id: string;
  competitionName: string;
  year: string;
  result: string;
  evidenceFile: File | null;
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
const MAX_SPORTS_PER_APPLICATION = MAX_INDIVIDUAL_SPORT_ENTRIES;

export default function AthleteRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const action = useRequestAction();
  const loading = action.busy;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [studentCertFile, setStudentCertFile] = useState<File | null>(null);

  const fileHandler = (setter: (f: File | null) => void, maxMB = 5) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= maxMB * 1024 * 1024) setter(file);
  };

  type OpenCompetition = { id: string; name: string; round: string; year: number; quotas: { sport: string; ageLimit: number | null }[] };
  type ClubOption = { id: string; name: string; sport: string };
  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");
  const load = useCallback(async () => {
    const [me, competitions, clubsData, dynamicCategoriesData] = await Promise.all([
      fetchJson<{ user: { studentId: string; profile: (Omit<AthleteProfile, "studentLevel"> & { studentLevel: string }) | null } }>("/api/auth/me"),
      fetchJson<{ competitions: OpenCompetition[] }>("/api/competitions?status=OPEN"),
      fetchJson<{ clubs: ClubOption[] }>("/api/clubs").catch(() => ({ clubs: [] as ClubOption[] })),
      fetchJson<{ config: Record<string, { categories: string[]; divisions: string[] }> }>("/api/sport-categories").catch(() => ({ config: {} })),
    ]);
    const p = me.user.profile;
    if (!p) throw new HttpError(404, "ยังไม่มีข้อมูลประวัตินักกีฬา กรุณากรอกประวัติก่อนสมัคร");
    const birthDate = p.birthDate ? new Date(p.birthDate).toISOString().split("T")[0] : "";
    const persistedEntriesCount = countParticipationForLevel({ bachelor: p.participateCountBachelor, master: p.participateCountMaster, phd: p.participateCountPhd }, p.studentLevel);
    const athleteGender = detectAthleteGender(p.firstName);
    const profile: AthleteProfile = { ...p, studentId: me.user.studentId, gender: athleteGender, studentLevel: p.studentLevel === "GRADUATE" ? "graduate" : "bachelor", birthDate, birthYearCE: Number(birthDate.slice(0, 4)), previousEntriesCount: persistedEntriesCount };
    return { profile, competitions: competitions.competitions, clubs: clubsData.clubs, sportConfigs: dynamicCategoriesData.config || {} };
  }, []);
  const resource = useRemoteData(load);
  const studentProfile = resource.data?.profile;
  const athleteGender = studentProfile?.gender || detectAthleteGender(studentProfile?.firstName ?? "");
  const athleteGenderLabel = getGenderLabel(athleteGender);
  const profilePhotoId = documentId(studentProfile?.photoUrl);
  const savedPhoto = profilePhotoId ? documentReference(profilePhotoId) : null;
  const openCompetitions = resource.data?.competitions ?? [];
  const clubOptions = resource.data?.clubs ?? [];
  const dynamicSportConfigs = (resource.data?.sportConfigs ?? {}) as Record<string, { categories: string[]; divisions: string[]; sportType?: "TEAM" | "INDIVIDUAL" }>;

  const [form, setForm] = useState({
    round: "" as "qualifier" | "final" | "",
    hasPreviousEntry: "" as "none" | "has" | "",
    previousBachelorCount: "",
    previousGraduateCount: "",
    previousLastYear: "",
    note: "",
  });

  const [hasSportClub, setHasSportClub] = useState<"yes" | "no" | "">("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedClubName, setSelectedClubName] = useState<string>("");
  const [noClubFile, setNoClubFile] = useState<File | null>(null);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPosition, setSupervisorPosition] = useState("");

  const [sportEntries, setSportEntries] = useState<SportEntry[]>([]);
  const [newSportEntry, setNewSportEntry] = useState({ sport: "", category: "", division: "" });

  const [competitions, setCompetitions] = useState<CompetitionResult[]>([]);
  const [newComp, setNewComp] = useState<{ competitionName: string; year: string; result: string; evidenceFile: File | null }>({ competitionName: "", year: "", result: "", evidenceFile: null });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState("");

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const athleteBirthDate = new Date(studentProfile?.birthDate ?? "");
  const isGradeExempt = isFirstSemesterGradeExempt(studentProfile ?? {});
  const gpaxEvaluation = evaluateGpax(studentProfile?.gpaCumulative);
  const isGpaxEligible = isGradeExempt || gpaxEvaluation.passed;
  const selectedCompetition = openCompetitions.find(c => c.id === selectedCompetitionId);
  const selectedQuotas = selectedCompetition?.quotas ?? [];
  const selectedCompetitionYear = selectedCompetition?.year ?? new Date().getFullYear();
  const athleteAge = evaluateAge(athleteBirthDate, selectedCompetitionYear).age;
  const isAgeEligible = !selectedCompetitionId || selectedQuotas.length === 0 || selectedQuotas.some(q =>
    evaluateAge(athleteBirthDate, selectedCompetitionYear, q.ageLimit ?? 28).passed
  );

  const studentLevel = studentProfile?.studentLevel ?? "bachelor";
  const maxEntries = MAX_ENTRIES[studentLevel];
  const normalizedStudentLevel = studentLevel.toUpperCase() === "GRADUATE" ? "GRADUATE" : "BACHELOR";
  const previousEntriesCount = studentProfile?.previousEntriesCount ?? 0;
  const declaredEntriesCount = form.hasPreviousEntry === "has"
    ? Number((normalizedStudentLevel === "GRADUATE" ? form.previousGraduateCount : form.previousBachelorCount) || "0")
    : 0;
  const effectiveEntriesCount = Math.max(previousEntriesCount, declaredEntriesCount);
  const participationEvaluation = evaluateParticipationCount(effectiveEntriesCount, normalizedStudentLevel);
  const isEntryCountEligible = participationEvaluation.passed;
  const isOverMaxStrict = participationEvaluation.count > MAX_ENTRIES_STRICT;
  const remainingEntries = Math.max(0, maxEntries - effectiveEntriesCount);

  const handleNoClubFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) setNoClubFile(file);
  };

  const addSportEntry = () => {
    if (!newSportEntry.sport || sportEntries.length >= getSportEntryLimit(newSportEntry.sport, dynamicSportConfigs[newSportEntry.sport]?.sportType)) return;
    setSportEntries((prev) => [...prev, { ...newSportEntry, id: generateId() }]);
    if (hasSportClub === "yes" && !selectedClubName) {
      const suggested = suggestClubForSport(newSportEntry.sport);
      if (suggested) {
        setSelectedClubName(suggested);
        const match = clubOptions.find(c => c.name === suggested || c.sport === newSportEntry.sport);
        if (match) setSelectedClubId(match.id);
      }
    }
    setNewSportEntry(prev => ({ sport: prev.sport, category: "", division: "" }));
  };

  const removeSportEntry = (id: string) => setSportEntries((prev) => {
    const next = prev.filter((s) => s.id !== id);
    if (next.length === 0) {
      setNewSportEntry({ sport: "", category: "", division: "" });
    }
    return next;
  });

  const addCompetition = () => {
    if (!newComp.competitionName || !newComp.year || !newComp.result) return;
    setCompetitions((prev) => [...prev, { ...newComp, id: generateId() }]);
    setNewComp({ competitionName: "", year: "", result: "", evidenceFile: null });
  };

  const removeCompetition = (id: string) => setCompetitions((prev) => prev.filter((c) => c.id !== id));

  const isWithinTwoYears = (year: string) => parseInt(year) >= CURRENT_YEAR_BE - 2;

  const handleSubmit = () => action.run(async () => {
      if (!isGpaxEligible) throw new HttpError(400, gpaxEvaluation.message ?? "ข้อมูล GPAX ไม่ผ่านเกณฑ์");
      if (!selectedCompetitionId) throw new HttpError(400, "กรุณาเลือกรายการแข่งขัน");
      if (missingRequiredDocuments.length > 0) throw new HttpError(400, "กรุณาแนบเอกสารบังคับให้ครบถ้วน: " + missingRequiredDocuments.join(", "));
      if (hasSportClub === "no" && !noClubFile) throw new HttpError(400, "กรณีชนิดกีฬานี้ไม่มีชมรมดูแล กรุณาแนบหนังสือขออนุญาต (PDF)");
      const me = await fetchJson<{ user: { studentId: string } }>("/api/auth/me");
      const studentId = me.user.studentId;

      const uploadFile = async (file: File) => {
        const form = new FormData(); form.set("file", file);
        const result = await fetchJson<{ document: { id: string } }>("/api/documents", { method: "POST", body: form });
        return documentReference(result.document.id);
      };

      const competitionResults = await Promise.all(competitions.map(async ({ competitionName, year, result, evidenceFile }) => ({
        competitionName,
        year,
        result,
        evidenceFileUrl: evidenceFile ? await uploadFile(evidenceFile) : null,
      })));

      let noClubFileUrl = null;
      if (hasSportClub === "no" && noClubFile) {
        noClubFileUrl = await uploadFile(noClubFile);
      }

      const [
        photoFileUrl,
        idCardFileUrl,
        studentCardFileUrl,
        studentCertFileUrl
      ] = await Promise.all([
        photoFile ? uploadFile(photoFile) : savedPhoto!,
        uploadFile(idCardFile!),
        uploadFile(studentCardFile!),
        uploadFile(studentCertFile!)
      ]);

      // ส่งใบสมัครไป API จริง
      await fetchJson("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          competitionId: selectedCompetitionId,
          sport: sportEntries[0]?.sport ?? "",
          category: sportEntries[0]?.category ?? "",
          division: sportEntries[0]?.division ?? null,
          note: form.note,
          clubId: hasSportClub === "yes" ? (selectedClubId || null) : null,
          sportClubName: hasSportClub === "yes" ? selectedClubName : null,

          round: form.round,
          previousBachelorCount: form.hasPreviousEntry === "has" ? parseInt(form.previousBachelorCount || "0", 10) : 0,
          previousGraduateCount: form.hasPreviousEntry === "has" ? parseInt(form.previousGraduateCount || "0", 10) : 0,
          previousLastYear: form.hasPreviousEntry === "has" ? parseInt(form.previousLastYear || "0", 10) : null,

          sportEntries: sportEntries.map(({ sport, category, division }) => ({ sport, category, division })),
          competitionResults,

          photoFileUrl,
          idCardFileUrl,
          studentCardFileUrl,
          studentCertFileUrl,
          noClubFileUrl,
          supervisorName: hasSportClub === "no" ? supervisorName : null,
          supervisorPosition: hasSportClub === "no" ? supervisorPosition : null,
        }),
      });

      router.push("/athlete/status");
  });

  // Step validation — ตรวจสอบข้อมูลและเอกสารบังคับ
  const missingStep1Fields: string[] = [];
  if (!selectedCompetitionId) missingStep1Fields.push("รายการแข่งขัน");
  if (!form.round) missingStep1Fields.push("รอบการแข่งขัน");
  if (!hasSportClub) missingStep1Fields.push("ชมรมที่ดูแลชนิดกีฬา");
  if (hasSportClub === "yes" && !selectedClubName.trim()) missingStep1Fields.push("ชมรมกีฬาที่สังกัด / ดูแลชนิดกีฬา");
  if (hasSportClub === "no") {
    if (!supervisorName.trim()) missingStep1Fields.push("ชื่อ-นามสกุล บุคลากรผู้รับรอง");
    if (!supervisorPosition.trim()) missingStep1Fields.push("ตำแหน่ง/สังกัด บุคลากรผู้รับรอง");
    if (!noClubFile) missingStep1Fields.push("หนังสือขออนุญาต (PDF)");
  }

  const step1Valid = !missingStep1Fields.length;
  const step2Valid = sportEntries.length > 0;
  const activeSport = sportEntries[0]?.sport || newSportEntry.sport;
  const activeSportType = activeSport ? getSportType(activeSport) : null;
  const activeSportEntryLimit = activeSport ? getSportEntryLimit(activeSport) : MAX_SPORTS_PER_APPLICATION;

  const missingRequiredDocuments: string[] = [];
  if (!photoFile && !savedPhoto) missingRequiredDocuments.push("รูปถ่ายชุดนิสิต (ขนาด 1 นิ้ว)");
  if (!idCardFile) missingRequiredDocuments.push("สำเนาบัตรประจำตัวประชาชน");
  if (!studentCardFile) missingRequiredDocuments.push("สำเนาบัตรนิสิต");
  if (!studentCertFile) missingRequiredDocuments.push("ใบรับรองการเป็นนิสิต");

  const step3Valid = !!(
    form.hasPreviousEntry &&
    (form.hasPreviousEntry === "none" || (form.previousBachelorCount || form.previousGraduateCount) && form.previousLastYear) &&
    missingRequiredDocuments.length === 0
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3"><BackButton href="/" label="กลับหน้าหลัก" /></div>
            <span className="text-xs uppercase tracking-[0.16em] font-semibold text-blue-800">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              แบบคำขอขึ้นทะเบียนและสมัครเข้ารับการคัดเลือกนักกีฬาตัวแทนสถาบัน
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/athlete/status")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ตรวจสอบสถานะ
            </button>
            <LogoutButton />
          </div>
          </div>
        </div>

        <RequestState loading={resource.loading} error={resource.error} retry={resource.retry} />
        <RequestState error={action.error} retry={resource.retry} />
        {!resource.loading && !resource.error && openCompetitions.length === 0 && <p role="status">ยังไม่มีการแข่งขันที่เปิดรับสมัคร</p>}
        {!resource.loading && studentProfile && (
          <>
            {/* Profile Card — ข้อมูลนิสิตจาก Register ครั้งแรก */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                ข้อมูลประวัตินักศึกษา
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditSuccessMessage("");
                  setIsEditModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-900 bg-blue-50/60 hover:bg-blue-100 text-blue-900 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                aria-label="แก้ไขข้อมูลนิสิต"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไขข้อมูลนิสิต
              </button>
            </div>
            {editSuccessMessage && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-800">
                <span>✓ {editSuccessMessage}</span>
                <button
                  type="button"
                  onClick={() => setEditSuccessMessage("")}
                  className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              <AthleteProfilePhoto
                key={studentProfile.studentId}
                studentId={studentProfile.studentId}
                name={studentProfile.firstName + " " + studentProfile.lastName}
                photoUrl={studentProfile.photoUrl}
                disabled={loading}
                onSaved={photoUrl => resource.update(data => ({ ...data, profile: { ...data.profile, photoUrl } }))}
              />
            <div className="grid w-full min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <span className="text-slate-400">ชื่อ - นามสกุล</span>
                <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.firstName} {studentProfile.lastName}</p>
              </div>
              <div>
                <span className="text-slate-400">รหัสประจำตัวนิสิต</span>
                <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.studentId}</p>
              </div>
              <div>
                <span className="text-slate-400">คณะ / วิทยาลัย</span>
                <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.faculty}</p>
              </div>
              <div>
                <span className="text-slate-400">สาขาวิชา</span>
                <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.major}</p>
              </div>
              <div>
                <span className="text-slate-400">ระดับการศึกษา / ชั้นปี</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {studentProfile.studentLevel === "bachelor" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปีที่ {studentProfile.year}{studentProfile.semester ? ` (ภาคเรียนที่ ${studentProfile.semester})` : ""}
                </p>
              </div>
              <div>
                <span className="text-gray-500">เพศ</span>
                <p className="font-medium text-gray-900 mt-0.5">{athleteGenderLabel || "ไม่ระบุ"}</p>
              </div>
              <div>
                <span className="text-gray-500">อายุ (ปีบริบูรณ์)</span>
                <p className="font-medium text-gray-900 mt-0.5">{athleteAge} ปี</p>
              </div>
              {studentProfile.phone && (
                <div>
                  <span className="text-gray-500">เบอร์โทรศัพท์</span>
                  <p className="font-medium text-gray-900 mt-0.5">{studentProfile.phone}</p>
                </div>
              )}
              {studentProfile.nationality && (
                <div>
                  <span className="text-gray-500">สัญชาติ</span>
                  <p className="font-medium text-gray-900 mt-0.5">{studentProfile.nationality}</p>
                </div>
              )}
              {studentProfile.nationalId && (
                <div>
                  <span className="text-gray-500">เลขประจำตัวประชาชน</span>
                  <p className="font-medium text-gray-900 mt-0.5">{studentProfile.nationalId}</p>
                </div>
              )}
              {studentProfile.birthDate && (
                <div>
                  <span className="text-gray-500">วันเดือนปีเกิด</span>
                  <p className="font-medium text-gray-900 mt-0.5">{studentProfile.birthDate}</p>
                </div>
              )}
              {studentProfile.province && (
                <div className="col-span-2">
                  <span className="text-gray-500">ที่อยู่</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {[studentProfile.addressNo, studentProfile.subDistrict ? ("ต." + studentProfile.subDistrict) : "", studentProfile.district ? ("อ." + studentProfile.district) : "", studentProfile.province ? ("จ." + studentProfile.province) : "", studentProfile.postalCode].filter(Boolean).join(" ")}
                  </p>
                </div>
              )}
              {isGradeExempt ? (
                <div className="col-span-2 rounded-lg border border-blue-200 bg-blue-50/80 p-2.5 text-xs text-blue-900">
                  <span className="font-semibold">ℹ️ นิสิตชั้นปีที่ 1 ภาคเรียนที่ 1:</span> ยังไม่มีผลการเรียนเฉลี่ยสะสม (ได้รับการยกเว้นเกณฑ์ GPAX สำหรับการสมัครแข่งขัน)
                </div>
              ) : (studentProfile.gpaSemester || studentProfile.gpaCumulative) ? (
                <div className="col-span-2 flex flex-wrap gap-x-6 gap-y-1">
                  {studentProfile.gpaSemester && (
                    <div>
                      <span className="text-gray-500">เกรดเฉลี่ยล่าสุด:</span>{" "}
                      <span className="font-medium text-gray-900">{studentProfile.gpaSemester}</span>
                    </div>
                  )}
                  {studentProfile.gpaCumulative && (
                    <div>
                      <span className="text-gray-500">เกรดเฉลี่ยสะสม (GPAX):</span>{" "}
                      <span className="font-medium text-gray-900">{studentProfile.gpaCumulative}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            </div>

            {isEditModalOpen && <AthleteProfileEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              studentProfile={studentProfile}
              onSaved={(updated) => {
                const updatedGender = detectAthleteGender(updated.firstName);
                resource.update((prev) => prev ? ({ ...prev, profile: { ...updated, gender: updatedGender } }) : prev);
                setEditSuccessMessage("บันทึกการแก้ไขข้อมูลประวัตินิสิตเรียบร้อยแล้ว");
              }}
            />}
          </div>

        {/* แจ้งเตือนสิทธิ์ */}
        {isOverMaxStrict && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-red-900 mb-1">🚫 ไม่มีสิทธิ์สมัครเข้าร่วมการแข่งขัน</p>
            <p className="text-sm text-red-700">การสมัครครั้งนี้จะทำให้จำนวนครั้งที่เข้าร่วมการแข่งขันกีฬามหาวิทยาลัยฯ เกิน 5 ครั้ง ตามระเบียบ กกมท. ข้อ 7.2</p>
          </div>
        )}
        {selectedCompetition && isAgeEligible && isEntryCountEligible && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800">
              อายุตามปีมหกรรม {selectedCompetition.year}: {athleteAge} ปี · เหลือสิทธิ์ลงแข่งได้อีก {Math.max(0, participationEvaluation.maxAllowed - participationEvaluation.count)} ครั้ง (สมัครครั้งนี้เป็นครั้งที่ {participationEvaluation.count} จากสูงสุด {participationEvaluation.maxAllowed})
            </p>
          </div>
        )}
        {!isOverMaxStrict && (!isAgeEligible || !isEntryCountEligible || (studentProfile.gpaCumulative ? !isGpaxEligible : false)) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-red-800 mb-1">⚠️ ไม่มีสิทธิ์สมัครเข้าร่วมการแข่งขัน</p>
            {!isAgeEligible && <p className="text-sm text-red-600">อายุของท่าน ({athleteAge} ปี) ไม่ผ่านเกณฑ์ปีมหกรรม {selectedCompetition?.year} ตามเกณฑ์อายุของกีฬา</p>}
            {!isEntryCountEligible && <p className="text-sm text-red-600">{participationEvaluation.message}</p>}
            {studentProfile.gpaCumulative && !isGpaxEligible && <p className="text-sm text-red-600">{gpaxEvaluation.message || "เกรดเฉลี่ยสะสม (GPAX) ไม่ผ่านเกณฑ์การแข่งขัน (ต้องไม่ต่ำกว่า 2.00)"}</p>}
          </div>
        )}
        {!isGradeExempt && !studentProfile.gpaCumulative && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-amber-900 mb-0.5">⚠️ ยังไม่พบข้อมูลเกรดเฉลี่ยสะสม (GPAX)</p>
            <p className="text-xs text-amber-800">กรุณากดปุ่ม &ldquo;แก้ไขข้อมูลนิสิต&rdquo; ด้านบนเพื่อระบุเกรดเฉลี่ยสะสมก่อนดำเนินการสมัครเข้าร่วมการแข่งขัน</p>
          </div>
        )}
        {isGradeExempt && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-0.5">ℹ️ ได้รับการยกเว้นเกณฑ์ผลการเรียนสะสม (GPAX)</p>
            <p className="text-xs text-blue-800">เนื่องจากท่านเป็นนิสิตชั้นปีที่ 1 ภาคเรียนที่ 1 ที่ยังไม่มีผลการเรียนสะสม ระบบจึงยกเว้นการระบุ GPAX สำหรับการสมัครแข่งขัน</p>
          </div>
        )}
        {isAgeEligible && isEntryCountEligible && remainingEntries === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">⚠️ นี่จะเป็นการสมัครครั้งสุดท้ายของท่าน ({previousEntriesCount + 1}/{maxEntries} ครั้ง)</p>
          </div>
        )}

        {/* Step indicator — 3 ขั้นตอน */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-blue-900 text-white shadow-sm" : "bg-slate-200 text-slate-500"}`}>{s}</div>
              <span className={`text-xs ${step >= s ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                {s === 1 ? "1. รายการแข่งขันและชมรมผู้ดูแล" : s === 2 ? "2. ชนิดกีฬาและรายการ" : "3. ผลงานและเอกสารแนบ"}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-900" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">

          เลือกรายการแข่งขัน
          {step === 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">รายการแข่งขันที่เปิดรับสมัคร</label>
              {resource.loading ? <p>กำลังโหลดการแข่งขัน…</p> : resource.error ? <p>โหลดรายการแข่งขันไม่สำเร็จ</p> : openCompetitions.length > 0 ? (
                <div>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={selectedCompetitionId}
                    onChange={(e) => { setSelectedCompetitionId(e.target.value); setSportEntries([]); setNewSportEntry(prev => ({ sport: prev.sport, category: "", division: "" })); }}
                  >
                    <option value="">-- เลือกรายการแข่งขัน --</option>
                    {openCompetitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.round === "qualifier" ? "รอบคัดเลือก" : "รอบมหกรรม"} {c.year} BE)
                      </option>
                    ))}
                  </select>
                  {selectedCompetitionId && selectedQuotas.length === 0 && (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                      รายการแข่งขันนี้ยังไม่ได้กำหนดชนิดกีฬา กรุณาติดต่อกองกิจการนิสิต
                    </p>
                  )}
                  {selectedCompetitionId && selectedQuotas.length > 0 && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-slate-700">กีฬาที่เปิดรับสมัครในรายการนี้</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedQuotas.map((quota) => {
                          const eligible = athleteAge <= (quota.ageLimit ?? 28);
                          return (
                            <span
                              key={quota.sport}
                              className={`rounded-full border px-2.5 py-1 text-xs ${eligible ? "border-blue-200 bg-blue-50 text-blue-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}
                            >
                              {quota.sport}{eligible ? "" : ` · อายุเกิน ${quota.ageLimit ?? 28} ปี`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200 text-sm">
                  ไม่มีรายการแข่งขันที่เปิดรับสมัครในขณะนี้ กรุณาติดตามประกาศจากกองกิจการนิสิต
                </div>
              )}
            </div>
          )}

          {/* Step 1: รอบแข่งขัน + ชมรมผู้ดูแลชนิดกีฬา */}
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
                    ? "📅 กำหนดการทดสอบสมรรถภาพรอบคัดเลือก: วันพุธที่ 2 ก.ย. 2569 (สำหรับ เปตอง, วอลเลย์บอล, บาสเกตบอล, ฟุตซอล)"
                    : "📅 กำหนดการทดสอบสมรรถภาพรอบมหกรรม: วันอังคารที่ 1 ธ.ค. 2569 (สำหรับกีฬา 11 ชนิด และกีฬาที่ผ่านรอบคัดเลือก)"}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สังกัดชมรมกีฬา (นิสิตที่เป็นสมาชิกชมรมกีฬาในมหาวิทยาลัยพะเยา)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => {
                    setHasSportClub("yes");
                    if (!selectedClubName) {
                      const currentSport = sportEntries[0]?.sport || newSportEntry.sport;
                      const suggested = suggestClubForSport(currentSport);
                      if (suggested) setSelectedClubName(suggested);
                    }
                  }} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${hasSportClub === "yes" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>เป็นสมาชิกชมรมกีฬา</button>
                  <button type="button" onClick={() => setHasSportClub("no")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${hasSportClub === "no" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ชนิดกีฬาที่ไม่มีชมรมจัดตั้ง</button>
                </div>
              </div>

              {hasSportClub === "yes" && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2">
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    เลือกชมรมกีฬาที่ท่านสังกัด / เป็นสมาชิก <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedClubId || selectedClubName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = clubOptions.find(c => c.id === val || c.name === val);
                      if (match) {
                        setSelectedClubId(match.id);
                        setSelectedClubName(match.name);
                      } else {
                        setSelectedClubId("");
                        setSelectedClubName(val);
                      }
                    }}
                  >
                    <option value="">-- กรุณาเลือกชมรมกีฬา --</option>
                    {clubOptions.length > 0 ? clubOptions.map((club) => (
                      <option key={club.id} value={club.id}>{club.name} ({club.sport})</option>
                    )) : UNIVERSITY_CLUBS.map((club) => (
                      <option key={club} value={club}>{club}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    ผู้สมัครแข่งขันต้องเป็นสมาชิกชมรมกีฬาที่เลือก โดยชมรมจะเป็นผู้ตรวจสอบคุณสมบัติและคัดเลือกนักกีฬาเข้าสู่บัญชีรายชื่อของชมรมต่อไป
                  </p>
                </div>
              )}

              {hasSportClub === "no" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <div className="bg-orange-100 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium text-orange-900 mb-1">📋 สำหรับชนิดกีฬาที่ยังไม่มีการจัดตั้งเป็นชมรมกีฬาของมหาวิทยาลัย</p>
                    <ol className="text-xs text-orange-800 space-y-1 list-decimal list-inside">
                      <li>กรอกข้อมูลและแนบหนังสือขออนุญาตพร้อมบุคลากรรับรองอย่างน้อย 1 คน</li>
                      <li>ระบบจะส่งข้อมูลไปยัง <strong>กองกิจการนิสิต</strong> โดยตรง (ไม่ผ่านชมรม)</li>
                      <li>กองกิจจะพิจารณาและแต่งตั้งเจ้าหน้าที่รับผิดชอบแยกต่างหาก</li>
                      <li>รอการแจ้งผลการพิจารณาจากกองกิจการนิสิต</li>
                    </ol>
                  </div>
                  <p className="text-sm text-orange-800 font-medium">⚠️ ต้องทำหนังสือขออนุญาตพร้อมมีบุคลากรในสังกัดมหาวิทยาลัยอย่างน้อย 1 คน รับรองและรับผิดชอบทีม</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล บุคลากรผู้รับรอง</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง / สังกัด</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={supervisorPosition} onChange={(e) => setSupervisorPosition(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หนังสือขออนุญาต</label>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors bg-white">
                      <span className="text-sm text-gray-500">{noClubFile ? noClubFile.name : "คลิกเพื่อแนบไฟล์ (PDF)"}</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={handleNoClubFile} />
                    </label>
                  </div>
                </div>
              )}

              {missingStep1Fields.length > 0 && (
                <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <span className="font-semibold">⚠️ ข้อมูลและเอกสารที่ต้องระบุก่อนไปขั้นตอนถัดไป:</span>
                  <ul className="mt-1 list-disc list-inside space-y-0.5">
                    {missingStep1Fields.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => setStep(2)}
                disabled={resource.loading || !!resource.error || !step1Valid || !isAgeEligible || !isEntryCountEligible || !isGpaxEligible || !selectedCompetitionId || selectedQuotas.length === 0}
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
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">ชนิดกีฬาที่สมัคร / ประเภท / รุ่น</label>

                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {activeSportType === "TEAM"
                    ? "กีฬาแบบทีมเลือกได้ 1 ประเภทหรือรุ่นแข่งขัน"
                    : `กีฬาแบบเดี่ยวเลือกได้สูงสุด ${MAX_SPORTS_PER_APPLICATION} ประเภทหรือรุ่นแข่งขัน`}
                  {activeSport && ` (${sportEntries.length}/${activeSportEntryLimit})`}
                </p>

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
                {activeSportType === "TEAM" && sportEntries.length > 0 && (
                  <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">กีฬาแบบทีมเลือกได้เพียง 1 ประเภทหรือรุ่นแข่งขันต่อใบสมัคร</p>
                )}

                {(sportEntries.length === 0 || (sportEntries.length < activeSportEntryLimit && !isTeamSport(activeSport, dynamicSportConfigs[activeSport]?.sportType))) && (() => {
                  const dynamicItem = newSportEntry.sport ? dynamicSportConfigs[newSportEntry.sport] : null;
                  const config = newSportEntry.sport
                    ? (dynamicItem
                        ? {
                            categories: filterCategoriesByGender(dynamicItem.categories, athleteGender),
                            divisions: filterDivisionsByGender(dynamicItem.divisions, athleteGender),
                          }
                        : getSportConfig(newSportEntry.sport, athleteGender))
                    : null;
                  return (
                  <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={newSportEntry.sport} onChange={(e) => setNewSportEntry({ sport: e.target.value, category: "", division: "" })} disabled={sportEntries.length > 0}>
                      <option value="">เลือกชนิดกีฬา</option>
                      {selectedQuotas.map((quota) => {
                        const eligible = athleteAge <= (quota.ageLimit ?? 28);
                        return (
                          <option key={quota.sport} value={quota.sport} disabled={!eligible}>
                            {quota.sport}{eligible ? "" : ` (อายุเกินเกณฑ์ ${quota.ageLimit ?? 28} ปี)`}
                          </option>
                        );
                      })}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={newSportEntry.category} onChange={(e) => setNewSportEntry((p) => ({ ...p, category: e.target.value }))} disabled={!newSportEntry.sport}>
                        <option value="">เลือกประเภท{athleteGenderLabel}</option>
                        {config?.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={newSportEntry.division} onChange={(e) => setNewSportEntry((p) => ({ ...p, division: e.target.value }))} disabled={!newSportEntry.sport}>
                        <option value="">เลือกรุ่น</option>
                        {config?.divisions.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <button onClick={addSportEntry} disabled={!newSportEntry.sport || !newSportEntry.category || (config?.divisions && config.divisions.length > 0 && !newSportEntry.division)} className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors">{sportEntries.length > 0 ? "+ เพิ่มประเภท/รุ่นแข่งขัน (ชนิดกีฬาเดิม)" : "+ เพิ่มชนิดกีฬา"}</button>
                  </div>
                )})()}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ย้อนกลับ</button>
                <button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors">ถัดไป</button>
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
                      <div key={c.id} className="bg-gray-50 rounded-lg p-3 flex items-start justify-between gap-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{c.competitionName}</p>
                          <p className="text-gray-500 text-xs mt-0.5">พ.ศ. {c.year} · ผลการแข่งขัน: {c.result}</p>
                          {c.evidenceFile && <p className="text-blue-600 text-xs mt-1">แนบรูปหลักฐาน: {c.evidenceFile.name}</p>}
                          {!isWithinTwoYears(c.year) && <p className="text-red-500 text-xs mt-1">⚠️ เกิน 2 ปีย้อนหลัง อาจไม่นำมาพิจารณา</p>}
                        </div>
                        <button onClick={() => removeCompetition(c.id)} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <input className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="รายการที่เข้าร่วมแข่งขัน / ผู้จัดการแข่งขัน" value={newComp.competitionName} onChange={(e) => setNewComp((p) => ({ ...p, competitionName: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ปี พ.ศ." value={newComp.year} onChange={(e) => setNewComp((p) => ({ ...p, year: e.target.value }))} />
                    <input className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ผลการแข่งขัน เช่น อันดับ 1" value={newComp.result} onChange={(e) => setNewComp((p) => ({ ...p, result: e.target.value }))} />
                  </div>
                  <label className="flex flex-col items-center justify-center w-full min-h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors px-3 py-2">
                    <span className="text-xs text-gray-600 text-center break-all">{newComp.evidenceFile ? newComp.evidenceFile.name : "แนบรูปหลักฐานผลงาน (ถ้ามี) JPG/PNG ไม่เกิน 5 MB"}</span>
                    {!newComp.evidenceFile && (
                      <span className="text-[11px] text-gray-400 text-center mt-0.5">
                        (หากมีภาพหลักฐานหลายภาพ เช่น เกียรติบัตรและรูปถ่ายแข่งขัน สามารถรวมภาพเป็นรูปเดียวแบบตาราง/Collage แล้วอัปโหลดได้)
                      </span>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (!file || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png"].includes(file.type)) {
                          setNewComp((previous) => ({ ...previous, evidenceFile: null }));
                          return;
                        }
                        setNewComp((previous) => ({ ...previous, evidenceFile: file }));
                      }}
                    />
                  </label>
                  <button onClick={addCompetition} disabled={!newComp.competitionName || !newComp.year || !newComp.result} className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors">+ เพิ่มผลงาน</button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">หลักฐานประกอบการสมัคร (เอกสารบังคับ)</label>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    missingRequiredDocuments.length === 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {missingRequiredDocuments.length === 0 ? "✅ แนบเอกสารครบ 4 รายการ" : `⚠️ ขาดอีก ${missingRequiredDocuments.length} รายการ`}
                  </span>
                </div>

                {missingRequiredDocuments.length > 0 ? (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 shadow-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-base text-rose-600 font-bold">⚠️</span>
                      <div>
                        <p className="font-semibold text-rose-950">ยังไม่ได้แนบเอกสารบังคับ ({missingRequiredDocuments.length} รายการ)</p>
                        <p className="mt-0.5 text-rose-800">ระบบจะไม่สามารถส่งใบสมัครได้จนกว่าจะแนบเอกสารต่อไปนี้ให้ครบถ้วน:</p>
                        <ul className="mt-1 list-disc list-inside font-medium text-rose-900 space-y-0.5">
                          {missingRequiredDocuments.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 shadow-xs flex items-center gap-2">
                    <span className="text-base text-emerald-600">✅</span>
                    <span className="font-medium">แนบเอกสารบังคับครบถ้วนแล้ว (4/4 รายการ)</span>
                  </div>
                )}

                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed">
                  ℹ️ <strong>ข้อควรทราบ:</strong> การอัปโหลดเอกสารหมายถึงการส่งเอกสารเข้าสู่ระบบ <u>ยังไม่ถือว่าเอกสารผ่านการอนุมัติ</u> จนกว่าชมรมหรือกองกิจการนิสิตจะตรวจสอบแล้ว
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>รูปถ่ายชุดนิสิตถูกระเบียบ (ขนาด 1 นิ้ว) <span className="text-red-500">*</span></span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${photoFile || savedPhoto ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                        {photoFile || savedPhoto ? "✅ แนบแล้ว" : "⚠️ ยังไม่แนบ"}
                      </span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <span className="text-xs text-gray-500 text-center px-2 truncate max-w-full">{photoFile ? photoFile.name : savedPhoto ? "ใช้รูปประจำตัวที่บันทึกแล้ว (คลิกแนบรูปอื่น)" : "แนบไฟล์ (JPG/PNG)"}</span>
                      <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setPhotoFile, 5)} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>สำเนาบัตรประจำตัวประชาชน <span className="text-red-500">*</span></span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${idCardFile ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                        {idCardFile ? "✅ แนบแล้ว" : "⚠️ ยังไม่แนบ"}
                      </span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <span className="text-xs text-gray-500 text-center px-2 truncate max-w-full">{idCardFile ? idCardFile.name : "แนบไฟล์ (PDF/JPG)"}</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setIdCardFile)} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>สำเนาบัตรนิสิต <span className="text-red-500">*</span></span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${studentCardFile ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                        {studentCardFile ? "✅ แนบแล้ว" : "⚠️ ยังไม่แนบ"}
                      </span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <span className="text-xs text-gray-500 text-center px-2 truncate max-w-full">{studentCardFile ? studentCardFile.name : "แนบไฟล์ (PDF/JPG)"}</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setStudentCardFile)} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>ใบรับรองการเป็นนิสิต <span className="text-red-500">*</span></span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${studentCertFile ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                        {studentCertFile ? "✅ แนบแล้ว" : "⚠️ ยังไม่แนบ"}
                      </span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <span className="text-xs text-gray-500 text-center px-2 truncate max-w-full">{studentCertFile ? studentCertFile.name : "แนบไฟล์ (PDF/JPG)"}</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setStudentCertFile)} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <textarea className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} />
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ย้อนกลับ</button>
                <button onClick={handleSubmit} disabled={resource.loading || !!resource.error || !step3Valid || !isGpaxEligible || !isAgeEligible || !isEntryCountEligible || loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  {loading ? "กำลังส่งข้อมูล..." : "ส่งใบสมัคร"}
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
