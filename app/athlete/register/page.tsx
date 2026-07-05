"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";
import { UP_FACULTIES } from "@/lib/up-faculties";

const SPORTS = [
  "กรีฑา", "ว่ายน้ำ", "ฟุตบอล", "บาสเกตบอล", "วอลเลย์บอล",
  "เทนนิส", "แบดมินตัน", "ตะกร้อ", "มวยสากล", "ยูโด",
  "เทควันโด", "ยิงปืน", "ขี่จักรยาน", "เรือพาย", "กอล์ฟ", "เปตอง", "ดาบไทย",
];

const CURRENT_YEAR_BE = 2569;
const CURRENT_YEAR_CE = 2026;

// TODO: ดึงจาก reg.up จริงตอน Backend พร้อม — ตอนนี้ยังไม่เชื่อม ใช้ค่า mock สำหรับ logic การคำนวณสิทธิ์เท่านั้น
const MOCK_REG_DATA = {
  birthYearCE: 2003,
  previousEntriesCount: 1,
};

type CompetitionResult = {
  id: string;
  competitionName: string;
  year: string;
  result: string;
};

type SportEntry = {
  id: string;
  sport: string;
  category: string;
  division: string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const MAX_ENTRIES = { bachelor: 5, graduate: 3 };
const MAX_ENTRIES_STRICT = 5; // ขั้นสูงสุดไม่ว่าระดับใด
const MAX_SPORTS_PER_APPLICATION = 4;

export default function AthleteRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    faculty: "",
    major: "",
    studentLevel: "" as "bachelor" | "graduate" | "",
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
  const [newComp, setNewComp] = useState({ competitionName: "", year: "", result: "" });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const calculateAge = (birthYearCE: number) => CURRENT_YEAR_CE - birthYearCE;
  const athleteAge = calculateAge(MOCK_REG_DATA.birthYearCE);
  const isAgeEligible = athleteAge <= 28;
  const maxEntries = form.studentLevel ? MAX_ENTRIES[form.studentLevel] : MAX_ENTRIES.bachelor;
  const isEntryCountEligible = MOCK_REG_DATA.previousEntriesCount < maxEntries;
  const isOverMaxStrict = MOCK_REG_DATA.previousEntriesCount >= MAX_ENTRIES_STRICT; // เกิน 5 ครั้ง ปฏิเสธทันที
  const remainingEntries = maxEntries - MOCK_REG_DATA.previousEntriesCount;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) setPhoto(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleNoClubFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) setNoClubFile(file);
  };

  const addSportEntry = () => {
    if (!newSportEntry.sport || sportEntries.length >= MAX_SPORTS_PER_APPLICATION) return;
    setSportEntries((prev) => [...prev, { ...newSportEntry, id: generateId() }]);
    setNewSportEntry({ sport: "", category: "", division: "" });
  };

  const removeSportEntry = (id: string) => setSportEntries((prev) => prev.filter((s) => s.id !== id));

  const addCompetition = () => {
    if (!newComp.competitionName || !newComp.year || !newComp.result) return;
    setCompetitions((prev) => [...prev, { ...newComp, id: generateId() }]);
    setNewComp({ competitionName: "", year: "", result: "" });
  };

  const removeCompetition = (id: string) => setCompetitions((prev) => prev.filter((c) => c.id !== id));

  const isWithinTwoYears = (year: string) => parseInt(year) >= CURRENT_YEAR_BE - 2;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("submit", {
        ...form,
        photo: photo?.name,
        sportEntries,
        competitions,
        hasClub,
        supervisorName: hasClub === "no" ? supervisorName : null,
        supervisorPosition: hasClub === "no" ? supervisorPosition : null,
        noClubFile: hasClub === "no" ? noClubFile?.name : null,
        files: files.map((f) => f.name),
      });
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/athlete/status");
    } finally {
      setLoading(false);
    }
  };

  const step1Valid = !!(
    form.firstName && form.lastName && form.studentId && form.faculty && form.major && form.studentLevel &&
    form.nationalId && form.nationality && form.birthDate &&
    form.addressNo && form.subDistrict && form.district && form.province && form.postalCode && form.phone
  );
  const step2Valid = !!(form.round && hasClub && (hasClub === "yes" || (supervisorName && supervisorPosition && noClubFile)));
  const step3Valid = sportEntries.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ใบสมัครนักกีฬา</h1>
            <p className="text-gray-500 text-sm mt-1">กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52</p>
          </div>
          <LogoutButton />
        </div>

        {/* แจ้งเตือนชั่วคราว */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <p className="text-xs text-amber-700">⚠️ ระบบยังไม่เชื่อมต่อกับระบบทะเบียนนิสิต กรุณากรอกข้อมูลด้วยตนเองในขั้นตอนถัดไป</p>
        </div>

        {isOverMaxStrict && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-red-900 mb-1">🚫 ไม่มีสิทธิ์สมัครเข้าร่วมการแข่งขัน</p>
            <p className="text-sm text-red-700">ท่านเคยเข้าร่วมการแข่งขันกีฬามหาวิทยาลัยฯ ครบ 5 ครั้งแล้ว ตามระเบียบ กกมท. ข้อ 7.2 นักศึกษาปริญญาตรีสมัครได้ไม่เกิน 5 ครั้งตลอดระยะเวลาการศึกษา ระบบไม่สามารถรับใบสมัครของท่านได้</p>
          </div>
        )}
        {!isOverMaxStrict && (!isAgeEligible || !isEntryCountEligible) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-red-800 mb-1">⚠️ ไม่มีสิทธิ์สมัครเข้าร่วมการแข่งขัน</p>
            {!isAgeEligible && <p className="text-sm text-red-600">อายุของท่าน ({athleteAge} ปี) เกิน 28 ปี ตามระเบียบ กกมท. ข้อ 6.5</p>}
            {!isEntryCountEligible && <p className="text-sm text-red-600">ท่านสมัครครบ {maxEntries} ครั้งแล้ว ตามระเบียบ กกมท. ข้อ 7.2</p>}
          </div>
        )}

        {isAgeEligible && isEntryCountEligible && remainingEntries === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">⚠️ นี่จะเป็นการสมัครครั้งสุดท้ายของท่าน ({MOCK_REG_DATA.previousEntriesCount + 1}/{maxEntries} ครั้ง)</p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>{s}</div>
              <span className={`text-sm ${step >= s ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                {s === 1 ? "ข้อมูลส่วนตัว" : s === 2 ? "ชมรม/รอบแข่งขัน" : s === 3 ? "ชนิดกีฬา" : "ผลงาน"}
              </span>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {/* Step 1: ข้อมูลส่วนตัว */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">รูปถ่ายชุดนิสิต (ขนาด 1 นิ้ว)</p>
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <span className="text-2xl mb-1">📷</span>
                <span className="text-xs text-gray-500 text-center px-2">{photo ? photo.name : "แนบรูปถ่าย"}</span>
                <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handlePhotoChange} />
              </label>

              <p className="text-sm font-medium text-gray-700 pt-2">ข้อมูลนิสิต</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="สมชาย" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ใจดี" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนิสิต</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="66027012" value={form.studentId} onChange={(e) => set("studentId", e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คณะ</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.faculty}
                  onChange={(e) => { set("faculty", e.target.value); set("major", ""); }}
                >
                  <option value="">เลือกคณะ</option>
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
                    value={form.major}
                    onChange={(e) => set("major", e.target.value)}
                    disabled={!form.faculty}
                  >
                    <option value="">{form.faculty ? "เลือกสาขา" : "เลือกคณะก่อน"}</option>
                    {UP_FACULTIES.find((f) => f.name === form.faculty)?.majors.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ระดับการศึกษา</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => set("studentLevel", "bachelor")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.studentLevel === "bachelor" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ปริญญาตรี</button>
                  <button type="button" onClick={() => set("studentLevel", "graduate")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.studentLevel === "graduate" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>บัณฑิตศึกษา (โท/เอก)</button>
                </div>
              </div>
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประจำตัวประชาชน</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="X-XXXX-XXXXX-XX-X" value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สัญชาติ</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันเดือนปีเกิด</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="08X-XXX-XXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เกรดเฉลี่ย (ภาคล่าสุด)</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="เช่น 3.45" value={form.gpaSemester} onChange={(e) => set("gpaSemester", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เกรดเฉลี่ยสะสม</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="เช่น 3.50" value={form.gpaCumulative} onChange={(e) => set("gpaCumulative", e.target.value)} />
                </div>
              </div>

              <p className="text-sm font-medium text-gray-700 pt-2">ที่อยู่ปัจจุบัน</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.addressNo} onChange={(e) => set("addressNo", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.subDistrict} onChange={(e) => set("subDistrict", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.district} onChange={(e) => set("district", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.province} onChange={(e) => set("province", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid || !isAgeEligible || !isEntryCountEligible}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
              >
                ถัดไป
              </button>
            </div>
          )}

          {/* Step 2: รอบแข่งขัน + ชมรม */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สมัครรอบ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => set("round", "qualifier")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.round === "qualifier" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>รอบคัดเลือก</button>
                  <button type="button" onClick={() => set("round", "final")} className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.round === "final" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>รอบมหกรรม</button>
                </div>
              </div>

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
                    <p className="text-sm font-medium text-orange-900 mb-1">📋 ขั้นตอนสำหรับนักกีฬาที่ไม่มีชมรม</p>
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

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ย้อนกลับ</button>
                <button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors">ถัดไป</button>
              </div>
            </div>
          )}

          {/* Step 3: ชนิดกีฬาที่สมัคร (สูงสุด 4 ชนิด) */}
          {step === 3 && (
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

                {sportEntries.length < MAX_SPORTS_PER_APPLICATION && (
                  <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={newSportEntry.sport} onChange={(e) => setNewSportEntry((p) => ({ ...p, sport: e.target.value }))}>
                      <option value="">เลือกชนิดกีฬา</option>
                      {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ประเภท เช่น เดี่ยว/ทีม" value={newSportEntry.category} onChange={(e) => setNewSportEntry((p) => ({ ...p, category: e.target.value }))} />
                      <input className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="รุ่น เช่น 60 กก." value={newSportEntry.division} onChange={(e) => setNewSportEntry((p) => ({ ...p, division: e.target.value }))} />
                    </div>
                    <button onClick={addSportEntry} disabled={!newSportEntry.sport} className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors">+ เพิ่มชนิดกีฬา</button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ย้อนกลับ</button>
                <button onClick={() => setStep(4)} disabled={!step3Valid} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors">ถัดไป</button>
              </div>
            </div>
          )}

          {/* Step 4: ประวัติเข้าร่วมแข่งขัน + ผลงาน + ไฟล์แนบ */}
          {step === 4 && (
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
                  <button onClick={addCompetition} disabled={!newComp.competitionName || !newComp.year || !newComp.result} className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors">+ เพิ่มผลงาน</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หลักฐานประกอบการสมัคร</label>
                <p className="text-xs text-gray-400 mb-2">สำเนาบัตรประชาชน, สำเนาบัตรนิสิต, ใบรับรองการเป็นนิสิต, หลักฐานผลงาน — PDF/JPG/PNG ไม่เกิน 10MB ต่อไฟล์</p>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <span className="text-xl mb-1">📎</span>
                  <span className="text-sm text-gray-500">คลิกเพื่อเลือกไฟล์</span>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                </label>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{file.type.includes("pdf") ? "📄" : "🖼️"}</span>
                          <span className="truncate text-gray-700">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 ml-2 shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <textarea className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} />
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ย้อนกลับ</button>
                <button onClick={handleSubmit} disabled={!form.hasPreviousEntry || loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  {loading ? "กำลังส่งข้อมูล..." : "ส่งใบสมัคร"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}