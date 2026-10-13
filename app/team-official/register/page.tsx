"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import ThaiDateInput from "@/components/shared/ThaiDateInput";
import { POSITION_LABEL, type OfficialPosition } from "@/lib/team-official-store";
import { requestJson, type CompetitionOption } from "@/lib/phase4-client";
import { EDITABLE_OFFICIAL } from "@/lib/phase4-policy";
import {
  ALL_THAI_PROVINCES,
  getAmphuresByProvince,
  getTambonsByAmphure,
} from "@/lib/thailand-addresses";
import {
  NAME_GENDER_OPTIONS,
  NAME_TITLE_OPTIONS,
  combineTitleWithFirstName,
  genderFromTitle,
  isNameGender,
  isNameTitle,
  splitTitleFromName,
  type NameGender,
  type NameTitle,
} from "@/lib/thai-name-title";

type ClubOption = { id: string; name: string; sport: string; isActive: boolean };
type CompetitionListItem = CompetitionOption & { deadline: string | null };
type FormErrors = Record<string, string>;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400";
const errorInputClass =
  "w-full rounded-lg border border-rose-400 bg-rose-50/40 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-100 disabled:text-slate-400";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";

// ลำดับช่องบังคับ ใช้ทั้งการเลื่อนไปยังช่องแรกที่ผิด และสรุปรายการที่ยังไม่ครบ
const FIELD_ANCHORS: ReadonlyArray<{ key: string; anchor: string }> = [
  { key: "competitionId", anchor: "official-competition" },
  { key: "clubId", anchor: "official-club" },
  { key: "title", anchor: "official-title" },
  { key: "gender", anchor: "official-gender" },
  { key: "firstName", anchor: "official-first-name" },
  { key: "lastName", anchor: "official-last-name" },
  { key: "nationalId", anchor: "official-national-id" },
  { key: "nationality", anchor: "official-nationality" },
  { key: "birthDate", anchor: "official-birth-date" },
  { key: "addressNo", anchor: "team-official-address-no" },
  { key: "province", anchor: "team-official-province" },
  { key: "district", anchor: "team-official-district" },
  { key: "subDistrict", anchor: "team-official-subdistrict" },
  { key: "postalCode", anchor: "team-official-postal-code" },
  { key: "phone", anchor: "team-official-phone" },
  { key: "email", anchor: "team-official-email" },
  { key: "workplace", anchor: "team-official-workplace" },
  { key: "workPosition", anchor: "team-official-work-position" },
  { key: "appliedPosition", anchor: "official-applied-position" },
  { key: "appliedPositionOther", anchor: "official-applied-position-other" },
  { key: "previousCount", anchor: "team-official-previous-count" },
  { key: "idCard", anchor: "official-document-id-card" },
  { key: "plan", anchor: "official-document-plan" },
  { key: "acceptedRules", anchor: "official-accepted-rules" },
];

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id ? `${id}-error` : undefined} role="alert" className="mt-1 text-[11px] font-medium text-rose-600">
      {message}
    </p>
  );
}

function scrollToField(anchor: string) {
  if (!anchor || typeof document === "undefined") return;
  const target = document.getElementById(anchor);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = target.querySelector<HTMLElement>("input, select, textarea, button");
  focusable?.focus({ preventScroll: true });
}

function responseError(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return fallback;
}

function Section({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FileField({
  id,
  label,
  required = false,
  file,
  hint,
  accept,
  error,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  file: File | null;
  hint: string;
  accept: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div id={id}>
      <label className={labelClass}>
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3 transition-colors ${
          error
            ? "border-rose-400 bg-rose-50/40 hover:border-rose-500"
            : "border-slate-300 bg-slate-50/60 hover:border-blue-900 hover:bg-blue-50/50"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm">
          📎
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-xs font-medium ${file ? "text-blue-900" : "text-slate-600"}`}
          >
            {file ? file.name : "คลิกเพื่อเลือกไฟล์"}
          </span>
          <span className="block text-[11px] text-slate-400">{hint}</span>
        </span>
        <span className="hidden shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 sm:block">
          เลือกไฟล์
        </span>
        <input type="file" accept={accept} className="hidden" onChange={onChange} />
      </label>
      <FieldError id={id} message={error} />
    </div>
  );
}

export default function TeamOfficialRegisterPage() {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [error, setError] = useState("");
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [nameChangeFile, setNameChangeFile] = useState<File | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<Record<string, string>>({});
  const [applicationVersion, setApplicationVersion] = useState(0);
  const [editingLoaded, setEditingLoaded] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [form, setForm] = useState({
    title: "" as NameTitle | "",
    gender: "" as NameGender | "",
    clubId: "",
    firstName: "",
    lastName: "",
    nationalId: "",
    nationality: "ไทย",
    birthDate: "",
    addressNo: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    workplace: "",
    workPosition: "",
    previousCount: "",
    appliedPosition: "" as OfficialPosition | "",
    appliedPositionOther: "",
    acceptedRules: "false",
  });

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // เลือกคำนำหน้า → ระบบเลือกเพศให้อัตโนมัติ (ผู้ใช้ยังเปลี่ยนเพศเองภายหลังได้)
  const handleTitleChange = (value: string) => {
    const title = isNameTitle(value) ? value : "";
    setForm((current) => ({
      ...current,
      title,
      gender: genderFromTitle(title) || current.gender,
    }));
  };

  const handleGenderChange = (value: string) => {
    setForm((current) => ({ ...current, gender: isNameGender(value) ? value : "" }));
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      requestJson<{ clubs: ClubOption[] }>("/api/clubs"),
      requestJson<{ competitions: CompetitionListItem[] }>("/api/competitions?status=OPEN"),
    ])
      .then(([clubData, competitionData]) => {
        if (!active) return;
        const openCompetitions = competitionData.competitions.filter(
          (competition) => !competition.deadline || new Date(competition.deadline) >= new Date(),
        );
        setClubs(clubData.clubs.filter((club) => club.isActive));
        setCompetitions(openCompetitions);
        if (!new URLSearchParams(window.location.search).get("id")) {
          if (openCompetitions.length > 0) setCompetitionId(openCompetitions[0].id);
          setEditingLoaded(true);
        }
      })
      .catch((cause: unknown) => {
        if (active) setOptionsError(cause instanceof Error ? cause.message : "โหลดข้อมูลการแข่งขันและชมรมไม่สำเร็จ");
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get("id");
    if (!requestedId) return;
    let active = true;
    requestJson<{ applications: Array<{
      id: string;
      competitionId: string;
      clubId: string;
      version: number;
      profile: unknown;
      documents: unknown;
      status: string;
    }> }>("/api/team-official/applications")
      .then(({ applications }) => {
        const application = applications.find((item) => item.id === requestedId);
        if (!application) throw new Error("ไม่พบใบสมัครที่ต้องการแก้ไข");
        if (!EDITABLE_OFFICIAL.includes(application.status)) {
          throw new Error("ใบสมัครนี้ไม่อยู่ในสถานะที่แก้ไขได้");
        }
        if (!application.profile || typeof application.profile !== "object" || Array.isArray(application.profile)) {
          throw new Error("ข้อมูลใบสมัครไม่ถูกต้อง");
        }
        const profile = application.profile as Record<string, unknown>;
        const documents = application.documents && typeof application.documents === "object" && !Array.isArray(application.documents)
          ? application.documents as Record<string, unknown>
          : {};
        if (!active) return;
        setEditId(requestedId);
        setCompetitionId(application.competitionId);
        setApplicationVersion(application.version);
        setExistingDocuments(Object.fromEntries(
          Object.entries(documents).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        ));
        const storedName = splitTitleFromName(typeof profile.firstName === "string" ? profile.firstName : "");
        setForm((current) => ({
          ...current,
          clubId: application.clubId,
          title: storedName.title,
          gender: storedName.gender,
          firstName: storedName.firstName,
          lastName: typeof profile.lastName === "string" ? profile.lastName : "",
          nationalId: typeof profile.nationalId === "string" ? profile.nationalId : "",
          nationality: typeof profile.nationality === "string" ? profile.nationality : "ไทย",
          birthDate: typeof profile.birthDate === "string" ? profile.birthDate : "",
          addressNo: typeof profile.addressNo === "string" ? profile.addressNo : "",
          subDistrict: typeof profile.subDistrict === "string" ? profile.subDistrict : "",
          district: typeof profile.district === "string" ? profile.district : "",
          province: typeof profile.province === "string" ? profile.province : "",
          postalCode: typeof profile.postalCode === "string" ? profile.postalCode : "",
          phone: typeof profile.phone === "string" ? profile.phone : "",
          email: typeof profile.email === "string" ? profile.email : "",
          workplace: typeof profile.workplace === "string" ? profile.workplace : "",
          workPosition: typeof profile.workPosition === "string" ? profile.workPosition : "",
          previousCount: typeof profile.previousCount === "string" ? profile.previousCount : "0",
          appliedPosition: profile.appliedPosition === "manager" || profile.appliedPosition === "coach"
            || profile.appliedPosition === "assistant_coach" || profile.appliedPosition === "other"
            ? profile.appliedPosition
            : "",
          appliedPositionOther: typeof profile.appliedPositionOther === "string" ? profile.appliedPositionOther : "",
          acceptedRules: "false",
        }));
        setEditingLoaded(true);
      })
      .catch((cause: unknown) => {
        if (active) setOptionsError(cause instanceof Error ? cause.message : "โหลดใบสมัครไม่สำเร็จ");
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedCompetition = competitions.find((competition) => competition.id === competitionId);
  const availableClubs = selectedCompetition
    ? clubs.filter((club) => selectedCompetition.quotas.some((quota) => quota.sport === club.sport))
    : [];
  const amphures = getAmphuresByProvince(form.province);
  const tambons = getTambonsByAmphure(form.province, form.district);

  const handleProvinceChange = (province: string) => {
    setForm((current) => ({
      ...current,
      province,
      district: "",
      subDistrict: "",
      postalCode: "",
    }));
  };

  const handleDistrictChange = (district: string) => {
    setForm((current) => ({
      ...current,
      district,
      subDistrict: "",
      postalCode: "",
    }));
  };

  const handleSubDistrictChange = (subDistrict: string) => {
    const postalCode = tambons.find((tambon) => tambon.name === subDistrict)?.postalCode ?? "";
    setForm((current) => ({ ...current, subDistrict, postalCode }));
  };

  const fileHandler = (setter: (f: File | null) => void, maxMB = 5) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`ไฟล์ต้องมีขนาดไม่เกิน ${maxMB} MB`);
      e.target.value = "";
      return;
    }
    setError("");
    setter(file);
  };

  const handleSubmit = async () => {
    if (loading || !editingLoaded) return;
    if (!isValid) {
      setShowErrors(true);
      setError("กรุณาตรวจสอบข้อมูลที่กรอกให้ถูกต้องครบถ้วน");
      scrollToField(FIELD_ANCHORS.find((item) => errors[item.key])?.anchor ?? "");
      return;
    }
    setError("");
    setLoading(true);
    const uploadedDocumentIds: string[] = [];
    try {
      const uploadDoc = async (file: File | null) => {
        if (!file) return undefined;
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/documents", { method: "POST", body });
        const data: unknown = await response.json();
        if (!response.ok) throw new Error(responseError(data, "อัปโหลดเอกสารไม่สำเร็จ"));
        if (!data || typeof data !== "object" || !("document" in data) || !data.document
          || typeof data.document !== "object" || !("id" in data.document) || typeof data.document.id !== "string") {
          throw new Error("ระบบไม่ได้ส่งรหัสเอกสารกลับมา");
        }
        uploadedDocumentIds.push(data.document.id);
        return data.document.id;
      };

      const photoId = await uploadDoc(photo) ?? existingDocuments.photo;
      const planId = await uploadDoc(planFile) ?? existingDocuments.plan;
      const idCardId = await uploadDoc(idCardFile) ?? existingDocuments.idCard;
      const nameChangeId = await uploadDoc(nameChangeFile) ?? existingDocuments.nameChange;
      if (!planId || !idCardId) throw new Error("กรุณาแนบแผนการฝึกซ้อมและสำเนาบัตรประชาชน");

      const result = await requestJson<{ application: { id: string } }>("/api/team-official/applications", {
        competitionId,
        clubId: form.clubId,
        version: applicationVersion,
        action: "submit",
        acceptedRules: form.acceptedRules === "true",
        profile: {
          // ต่อคำนำหน้าเข้ากับชื่อจริงโดยตรง (ไม่ต้องเพิ่มคอลัมน์ในฐานข้อมูล)
          firstName: combineTitleWithFirstName(form.title, form.firstName),
          lastName: form.lastName.trim(),
          nationalId: form.nationalId.replace(/\D/g, ""),
          nationality: form.nationality.trim(),
          birthDate: form.birthDate,
          addressNo: form.addressNo.trim(),
          subDistrict: form.subDistrict.trim(),
          district: form.district.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          workplace: form.workplace.trim(),
          workPosition: form.workPosition.trim(),
          previousCount: form.previousCount.trim() || "0",
          appliedPosition: form.appliedPosition,
          appliedPositionOther: form.appliedPositionOther.trim(),
        },
        documents: {
          ...(photoId ? { photo: photoId } : {}),
          plan: planId,
          idCard: idCardId,
          ...(nameChangeId ? { nameChange: nameChangeId } : {}),
        },
      });
      router.push(`/team-official/status?id=${encodeURIComponent(result.application.id)}`);
    } catch (cause) {
      for (const id of uploadedDocumentIds) {
        try {
          const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
          if (!response.ok) console.error("Failed to remove unretained official document", id, response.status);
        } catch (cleanupError) {
          console.error("Failed to remove unretained official document", id, cleanupError);
        }
      }
      setError(cause instanceof Error ? cause.message : "นำส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // Input Validation — ตรวจทุกช่องฝั่ง client ก่อนส่ง (เซิร์ฟเวอร์ตรวจซ้ำอีกชั้นใน officialProfileValid)
  const validate = (): FormErrors => {
    const found: FormErrors = {};

    if (!competitionId) found.competitionId = "กรุณาเลือกการแข่งขันที่สมัคร";

    if (!form.clubId) found.clubId = "กรุณาเลือกชมรมกีฬาต้นสังกัด";
    else if (!availableClubs.some((club) => club.id === form.clubId)) {
      found.clubId = "ชมรมที่เลือกไม่อยู่ในโควตาของการแข่งขันนี้";
    }

    if (!form.title) found.title = "กรุณาเลือกคำนำหน้าชื่อ";
    if (!form.gender) found.gender = "กรุณาเลือกเพศ";

    if (!form.firstName.trim()) found.firstName = "กรุณากรอกชื่อ";
    else if (form.firstName.trim().length > 100) found.firstName = "ชื่อยาวเกินกำหนด (ไม่เกิน 100 ตัวอักษร)";

    if (!form.lastName.trim()) found.lastName = "กรุณากรอกนามสกุล";
    else if (form.lastName.trim().length > 100) found.lastName = "นามสกุลยาวเกินกำหนด (ไม่เกิน 100 ตัวอักษร)";

    const nationalId = form.nationalId.replace(/\D/g, "");
    if (!nationalId) found.nationalId = "กรุณากรอกเลขประจำตัวประชาชน";
    else if (nationalId.length !== 13) found.nationalId = "เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก";

    if (!form.nationality.trim()) found.nationality = "กรุณากรอกสัญชาติ";

    if (!form.birthDate) found.birthDate = "กรุณาระบุวันเดือนปีเกิด";
    else {
      const birthDate = new Date(form.birthDate);
      if (Number.isNaN(birthDate.getTime())) found.birthDate = "วันเดือนปีเกิดไม่ถูกต้อง";
      else if (birthDate > new Date()) found.birthDate = "วันเดือนปีเกิดต้องไม่เป็นวันที่ในอนาคต";
    }

    if (!form.addressNo.trim()) found.addressNo = "กรุณากรอกบ้านเลขที่ / หมู่";
    if (!form.province) found.province = "กรุณาเลือกจังหวัด";
    if (!form.district) found.district = "กรุณาเลือกอำเภอ / เขต";
    if (!form.subDistrict) found.subDistrict = "กรุณาเลือกตำบล / แขวง";
    if (!form.postalCode) found.postalCode = "กรุณาระบุรหัสไปรษณีย์";
    else if (!/^\d{5}$/.test(form.postalCode)) found.postalCode = "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";

    const phone = form.phone.replace(/[-\s]/g, "");
    if (!phone) found.phone = "กรุณากรอกเบอร์โทรศัพท์ติดต่อ";
    else if (!/^0\d{8,9}$/.test(phone)) found.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0xxxxxxxxx)";

    if (!form.email.trim()) found.email = "กรุณากรอกอีเมลติดต่อ";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = "รูปแบบอีเมลไม่ถูกต้อง";

    if (!form.workplace.trim()) found.workplace = "กรุณากรอกหน่วยงาน / สถานที่ทำงานปัจจุบัน";
    if (!form.workPosition.trim()) found.workPosition = "กรุณากรอกตำแหน่งในที่ทำงาน";

    if (!form.appliedPosition) found.appliedPosition = "กรุณาเลือกตำแหน่งเจ้าหน้าที่ทีมที่ขอขึ้นทะเบียน";
    else if (form.appliedPosition === "other" && !form.appliedPositionOther.trim()) {
      found.appliedPositionOther = "กรุณาระบุตำแหน่งที่ขอขึ้นทะเบียน";
    }

    const previousCount = form.previousCount.trim();
    if (previousCount && (!/^\d+$/.test(previousCount) || Number(previousCount) > 999)) {
      found.previousCount = "จำนวนครั้งต้องเป็นตัวเลขจำนวนเต็มระหว่าง 0 - 999";
    }

    if (!idCardFile && !existingDocuments.idCard) found.idCard = "กรุณาแนบสำเนาบัตรประจำตัวประชาชน";
    if (!planFile && !existingDocuments.plan) found.plan = "กรุณาแนบแผนการฝึกซ้อมกีฬาและเก็บตัว (อย่างน้อย 1 เดือน)";

    if (form.acceptedRules !== "true") found.acceptedRules = "กรุณายอมรับระเบียบและข้อบังคับก่อนนำส่งใบสมัคร";

    return found;
  };

  const errors = validate();
  const isValid = editingLoaded && Object.keys(errors).length === 0;
  const visibleErrors = showErrors ? errors : {};

  const documentLabels: Record<string, string> = {
    photo: "รูปถ่าย",
    plan: "แผนการฝึกซ้อม",
    idCard: "สำเนาบัตรประชาชน",
    nameChange: "หลักฐานเปลี่ยนชื่อ",
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 font-sans sm:py-10">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Top navigation */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">
                กองกิจการนิสิต มหาวิทยาลัยพะเยา · การขึ้นทะเบียนบุคลากรกีฬา
              </span>
              <h1 className="mt-1 text-xl font-bold text-slate-900">
                แบบคำขอขึ้นทะเบียนเจ้าหน้าที่ทีมกีฬาตัวแทนสถาบัน
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedCompetition?.name || "กำลังโหลดการแข่งขันที่เปิดรับสมัคร"} · ผู้จัดการทีม / ผู้ฝึกสอน / ผู้ช่วยผู้ฝึกสอน
              </p>
            </div>
            <button
              onClick={() => router.push("/team-official/status")}
              className="shrink-0 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ตรวจสอบสถานะ
            </button>
          </div>
        </div>

        {optionsLoading && (
          <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            กำลังโหลดการแข่งขันและชมรมจากระบบ...
          </p>
        )}
        {optionsError && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            โหลดข้อมูลการแข่งขันและชมรมไม่สำเร็จ: {optionsError}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}
        {!optionsLoading && !optionsError && competitions.length === 0 && (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            ขณะนี้ไม่มีการแข่งขันที่เปิดรับสมัคร กรุณากลับมาตรวจสอบอีกครั้ง
          </p>
        )}

        {!optionsLoading && !optionsError && editingLoaded && competitions.length > 0 && (
          <div className="space-y-5">

            {editId && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
                <p className="font-medium">แก้ไขใบสมัครเดิม</p>
                <p className="text-xs leading-relaxed">
                  หากไม่เลือกไฟล์ใหม่ ระบบจะใช้เอกสารเดิม หลังส่งข้อมูลจะตรวจเอกสารใหม่อีกครั้ง
                </p>
                {!selectedCompetition && (
                  <p role="alert" className="text-xs font-medium text-rose-700">
                    การแข่งขันเดิมปิดรับสมัครหรือพ้นกำหนดแล้ว ไม่สามารถแก้ไขได้
                  </p>
                )}
                {Object.keys(existingDocuments).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {Object.entries(existingDocuments).map(([field, documentId]) => (
                      <a
                        key={field}
                        href={`/api/documents/${encodeURIComponent(documentId)}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-900 transition-colors hover:bg-blue-100"
                      >
                        {documentLabels[field] ?? field} (ไฟล์เดิม)
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. การแข่งขันและชมรมผู้รับรอง */}
            <Section
              step="1"
              title="การแข่งขันและชมรมผู้รับรอง"
              description="เลือกการแข่งขันที่ต้องการขึ้นทะเบียน และชมรมกีฬาต้นสังกัดที่เสนอตัวปฏิบัติหน้าที่"
            >
              <div>
                <label htmlFor="official-competition" className={labelClass}>
                  การแข่งขันที่สมัคร <span className="text-rose-600">*</span>
                </label>
                <select
                  id="official-competition"
                  value={competitionId}
                  disabled={loading || !!editId}
                  aria-invalid={visibleErrors.competitionId ? true : undefined}
                  onChange={(event) => {
                    setCompetitionId(event.target.value);
                    set("clubId", "");
                  }}
                  className={visibleErrors.competitionId ? errorInputClass : inputClass}
                >
                  {competitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>{competition.name}</option>
                  ))}
                </select>
                <FieldError id="official-competition" message={visibleErrors.competitionId} />
              </div>

              <div id="official-club">
                <label className={labelClass}>
                  ชมรมกีฬาต้นสังกัดที่เสนอตัวปฏิบัติหน้าที่ <span className="text-rose-600">*</span>
                </label>
                <p className="mb-2.5 text-[11px] leading-relaxed text-slate-500">
                  ใบสมัครจะถูกส่งไปยังประธานชมรมกีฬาดังกล่าวเพื่อตรวจสอบและลงนามรับรอง ก่อนส่งต่อกองกิจการนิสิต
                </p>
                {availableClubs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {availableClubs.map((club) => (
                      <button
                        key={club.id}
                        type="button"
                        disabled={loading}
                        onClick={() => set("clubId", club.id)}
                        className={`rounded-lg border p-3 text-left text-xs font-semibold transition-all cursor-pointer ${
                          form.clubId === club.id
                            ? "border-blue-900 bg-blue-50 text-blue-900 shadow-2xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block font-bold">{club.name}</span>
                        <span className="block text-[10px] font-normal text-slate-400">{club.sport}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    ไม่มีชมรมที่เปิดใช้งานและอยู่ในโควตาของการแข่งขันนี้
                  </p>
                )}
                <FieldError id="official-club" message={visibleErrors.clubId} />
              </div>
            </Section>

            {/* 2. ข้อมูลส่วนบุคคล */}
            <Section
              step="2"
              title="ข้อมูลส่วนบุคคล"
              description="กรอกข้อมูลให้ตรงกับเอกสารราชการที่แนบมา"
            >
              <div className="grid gap-5 sm:grid-cols-[9rem_1fr]">
                <div>
                  <label className={labelClass}>รูปถ่ายหน้าตรงชุดสุภาพ</label>
                  <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/60 text-center transition-colors hover:border-blue-900 hover:bg-blue-50/50">
                    {photo ? (
                      <span className="px-2 text-[11px] font-medium break-all text-blue-900">{photo.name}</span>
                    ) : (
                      <>
                        <span className="text-lg text-slate-400">🖼️</span>
                        <span className="px-2 text-[11px] leading-relaxed text-slate-500">
                          คลิกแนบรูปถ่าย
                          <br />(ขนาด 1 นิ้ว)
                        </span>
                      </>
                    )}
                    <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={fileHandler(setPhoto, 5)} />
                  </label>
                  <p className="mt-1 w-32 text-[10px] text-slate-400">JPG/PNG ไม่เกิน 5 MB</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="official-title" className={labelClass}>
                        คำนำหน้าชื่อ <span className="text-rose-600">*</span>
                      </label>
                      <select
                        id="official-title"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        aria-invalid={visibleErrors.title ? true : undefined}
                        className={visibleErrors.title ? errorInputClass : inputClass}
                      >
                        <option value="">-- เลือกคำนำหน้าชื่อ --</option>
                        {NAME_TITLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <FieldError id="official-title" message={visibleErrors.title} />
                    </div>
                    <div>
                      <label htmlFor="official-gender" className={labelClass}>
                        เพศ <span className="text-rose-600">*</span>
                      </label>
                      <select
                        id="official-gender"
                        value={form.gender}
                        onChange={(e) => handleGenderChange(e.target.value)}
                        aria-invalid={visibleErrors.gender ? true : undefined}
                        className={visibleErrors.gender ? errorInputClass : inputClass}
                      >
                        <option value="">-- เลือกเพศ --</option>
                        {NAME_GENDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <FieldError id="official-gender" message={visibleErrors.gender} />
                    </div>
                  </div>

                  {form.gender && genderFromTitle(form.title) && form.gender !== genderFromTitle(form.title) ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                      คำนำหน้าชื่อกับเพศที่เลือกไม่สอดคล้องกัน — ระบบจะบันทึกเพศจากคำนำหน้าชื่อ จึงควรตรวจสอบอีกครั้ง
                    </p>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="official-first-name" className={labelClass}>ชื่อ <span className="text-rose-600">*</span></label>
                      <input
                        id="official-first-name"
                        value={form.firstName}
                        onChange={(e) => set("firstName", e.target.value)}
                        aria-invalid={visibleErrors.firstName ? true : undefined}
                        className={visibleErrors.firstName ? errorInputClass : inputClass}
                      />
                      <p className="mt-1 text-[10px] text-slate-400">ไม่ต้องพิมพ์คำนำหน้า ระบบจะต่อคำนำหน้าให้อัตโนมัติ</p>
                      <FieldError id="official-first-name" message={visibleErrors.firstName} />
                    </div>
                    <div>
                      <label htmlFor="official-last-name" className={labelClass}>นามสกุล <span className="text-rose-600">*</span></label>
                      <input
                        id="official-last-name"
                        value={form.lastName}
                        onChange={(e) => set("lastName", e.target.value)}
                        aria-invalid={visibleErrors.lastName ? true : undefined}
                        className={visibleErrors.lastName ? errorInputClass : inputClass}
                      />
                      <FieldError id="official-last-name" message={visibleErrors.lastName} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="official-national-id" className={labelClass}>เลขประจำตัวประชาชน (13 หลัก) <span className="text-rose-600">*</span></label>
                      <input
                        id="official-national-id"
                        inputMode="numeric"
                        maxLength={13}
                        value={form.nationalId}
                        onChange={(e) => set("nationalId", e.target.value.replace(/\D/g, "").slice(0, 13))}
                        aria-invalid={visibleErrors.nationalId ? true : undefined}
                        className={`${visibleErrors.nationalId ? errorInputClass : inputClass} font-mono`}
                      />
                      <FieldError id="official-national-id" message={visibleErrors.nationalId} />
                    </div>
                    <div>
                      <label htmlFor="official-nationality" className={labelClass}>สัญชาติ <span className="text-rose-600">*</span></label>
                      <input
                        id="official-nationality"
                        value={form.nationality}
                        onChange={(e) => set("nationality", e.target.value)}
                        aria-invalid={visibleErrors.nationality ? true : undefined}
                        className={visibleErrors.nationality ? errorInputClass : inputClass}
                      />
                      <FieldError id="official-nationality" message={visibleErrors.nationality} />
                    </div>
                  </div>

                  <div id="official-birth-date">
                    <ThaiDateInput
                      id="team-official-birth-date"
                      label="วันเดือนปีเกิด"
                      value={form.birthDate}
                      onChange={(value) => set("birthDate", value)}
                      required
                    />
                    <FieldError id="official-birth-date" message={visibleErrors.birthDate} />
                  </div>
                </div>
              </div>
            </Section>

            {/* 3. ที่อยู่ */}
            <Section
              step="3"
              title="ที่อยู่ตามทะเบียนบ้าน / ที่อยู่ปัจจุบัน"
              description="เลือกจังหวัด อำเภอ และตำบล เพื่อให้ระบบเติมรหัสไปรษณีย์อัตโนมัติ"
            >
              <div>
                <label htmlFor="team-official-address-no" className={labelClass}>
                  บ้านเลขที่ / หมู่ <span className="text-rose-600">*</span>
                </label>
                <input
                  id="team-official-address-no"
                  required
                  className={inputClass}
                  value={form.addressNo}
                  onChange={(event) => set("addressNo", event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="team-official-province" className={labelClass}>
                    จังหวัด <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="team-official-province"
                    required
                    value={form.province}
                    onChange={(event) => handleProvinceChange(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- เลือกจังหวัด --</option>
                    {ALL_THAI_PROVINCES.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="team-official-district" className={labelClass}>
                    อำเภอ / เขต <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="team-official-district"
                    required
                    value={form.district}
                    onChange={(event) => handleDistrictChange(event.target.value)}
                    disabled={!form.province}
                    className={inputClass}
                  >
                    <option value="">-- เลือกอำเภอ / เขต --</option>
                    {amphures.map((amphure) => (
                      <option key={amphure.name} value={amphure.name}>{amphure.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="team-official-subdistrict" className={labelClass}>
                    ตำบล / แขวง <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="team-official-subdistrict"
                    required
                    value={form.subDistrict}
                    onChange={(event) => handleSubDistrictChange(event.target.value)}
                    disabled={!form.district}
                    className={inputClass}
                  >
                    <option value="">-- เลือกตำบล / แขวง --</option>
                    {tambons.map((tambon) => (
                      <option key={tambon.name} value={tambon.name}>{tambon.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="team-official-postal-code" className={labelClass}>
                    รหัสไปรษณีย์ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="team-official-postal-code"
                    required
                    maxLength={5}
                    inputMode="numeric"
                    value={form.postalCode}
                    onChange={(event) => set("postalCode", event.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>
            </Section>

            {/* 4. ข้อมูลติดต่อและหน่วยงาน */}
            <Section
              step="4"
              title="ข้อมูลติดต่อและหน่วยงานต้นสังกัด"
              description="ใช้สำหรับติดต่อประสานงานระหว่างการตรวจสอบใบสมัคร"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="team-official-phone" className={labelClass}>
                    เบอร์โทรศัพท์ติดต่อ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="team-official-phone"
                    required
                    type="tel"
                    placeholder="0XX-XXX-XXXX"
                    className={inputClass}
                    value={form.phone}
                    onChange={(event) => set("phone", event.target.value.slice(0, 10))}
                  />
                </div>
                <div>
                  <label htmlFor="team-official-email" className={labelClass}>
                    อีเมลติดต่อ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="team-official-email"
                    type="email"
                    className={inputClass}
                    placeholder="example@up.ac.th"
                    value={form.email}
                    onChange={(event) => set("email", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="team-official-workplace" className={labelClass}>
                    หน่วยงาน / สถานที่ทำงานปัจจุบัน <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="team-official-workplace"
                    className={inputClass}
                    placeholder="เช่น มหาวิทยาลัยพะเยา"
                    value={form.workplace}
                    onChange={(event) => set("workplace", event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="team-official-work-position" className={labelClass}>
                    ตำแหน่งในที่ทำงาน <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="team-official-work-position"
                    className={inputClass}
                    placeholder="เช่น อาจารย์, เจ้าหน้าที่, บุคลากรภายนอก"
                    value={form.workPosition}
                    onChange={(event) => set("workPosition", event.target.value)}
                  />
                </div>
              </div>
            </Section>

            {/* 5. ตำแหน่งเจ้าหน้าที่ทีม */}
            <Section
              step="5"
              title="ตำแหน่งเจ้าหน้าที่ทีมที่ขอขึ้นทะเบียน"
              description="เลือกได้ 1 ตำแหน่งต่อใบสมัคร"
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["manager", "coach", "assistant_coach", "other"] as OfficialPosition[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("appliedPosition", p)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      form.appliedPosition === p
                        ? "border-blue-900 bg-blue-900 font-bold text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {POSITION_LABEL[p]}
                  </button>
                ))}
              </div>
              {form.appliedPosition === "other" && (
                <input
                  className={inputClass}
                  placeholder="โปรดระบุตำแหน่ง เช่น นักกายภาพบำบัด, เจ้าหน้าที่ประสานงาน"
                  value={form.appliedPositionOther}
                  onChange={(event) => set("appliedPositionOther", event.target.value)}
                />
              )}
              <div className="sm:max-w-xs">
                <label htmlFor="team-official-previous-count" className={labelClass}>
                  เคยปฏิบัติหน้าที่นี้ในกีฬามหาวิทยาลัยฯ กี่ครั้ง
                </label>
                <input
                  id="team-official-previous-count"
                  type="number"
                  min={0}
                  className={inputClass}
                  placeholder="0"
                  value={form.previousCount}
                  onChange={(event) => set("previousCount", event.target.value)}
                />
              </div>
            </Section>

            {/* 6. เอกสารประกอบ */}
            <Section
              step="6"
              title="เอกสารประกอบการสมัคร"
              description="รองรับไฟล์ PDF / JPG / PNG ขนาดไม่เกิน 5 MB ต่อไฟล์"
            >
              <FileField
                id="official-document-id-card"
                label="สำเนาบัตรประจำตัวประชาชน"
                required
                file={idCardFile}
                hint={existingDocuments.idCard ? "มีไฟล์เดิมในระบบแล้ว — แนบใหม่เพื่อแทนที่" : "PDF / JPG / PNG"}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={fileHandler(setIdCardFile)}
              />
              <FileField
                id="official-document-name-change"
                label="สำเนาหลักฐานเปลี่ยนชื่อ - นามสกุล (ถ้ามี)"
                file={nameChangeFile}
                hint={existingDocuments.nameChange ? "มีไฟล์เดิมในระบบแล้ว — แนบใหม่เพื่อแทนที่" : "PDF / JPG / PNG"}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={fileHandler(setNameChangeFile)}
              />
              <FileField
                id="official-document-plan"
                label="แผนการฝึกซ้อมกีฬาและเก็บตัว (อย่างน้อย 1 เดือน)"
                required
                file={planFile}
                hint={existingDocuments.plan ? "มีไฟล์เดิมในระบบแล้ว — แนบใหม่เพื่อแทนที่" : "เฉพาะไฟล์ PDF"}
                accept=".pdf"
                onChange={fileHandler(setPlanFile)}
              />
            </Section>

            {/* 7. การรับรองและยื่นคำขอ */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 sm:p-6">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700 transition-colors hover:bg-slate-100">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  checked={form.acceptedRules === "true"}
                  onChange={(e) => set("acceptedRules", e.target.checked ? "true" : "false")}
                />
                <span>
                  ข้าพเจ้ารับทราบระเบียบและข้อบังคับการจัดการแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทยโดยละเอียด
                  และยินดีปฏิบัติตามคำตัดสินของคณะกรรมการฯ ทุกประการ
                </span>
              </label>

              {!isValid && (
                <p className="text-[11px] text-slate-400">
                  ปุ่มนำส่งจะใช้งานได้เมื่อกรอกข้อมูลบังคับ เอกสารแนบ และยอมรับข้อตกลงครบถ้วนแล้ว
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="w-full rounded-lg bg-blue-900 py-3 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
              >
                {loading ? "กำลังนำส่งข้อมูล..." : "ลงนามส่งแบบคำขอขึ้นทะเบียนเจ้าหน้าที่ทีม"}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
