"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

const COMPETITION_LEVELS = [
  "ทีมชาติ / เยาวชนทีมชาติ",
  "การแข่งขันกีฬาแห่งชาติ (รอบมหกรรม)",
  "การแข่งขันกีฬาเยาวชนแห่งชาติ (รอบมหกรรม)",
  "ชิงชนะเลิศแห่งประเทศไทย",
  "กีฬานักเรียนนักศึกษาแห่งประเทศไทย (รอบมหกรรม)",
  "กีฬาระหว่างโรงเรียน (กรมพลศึกษา)",
  "กีฬานักเรียนนักศึกษาแห่งประเทศไทย (รอบคัดเลือกตัวแทนเขต)",
  "กีฬาแห่งชาติ/เยาวชนแห่งชาติ (รอบคัดเลือกตัวแทนภาค)",
  "ชิงชนะเลิศระดับจังหวัด/ภูมิภาค",
  "อื่น ๆ",
];

const CURRENT_YEAR_BE = 2569; // ปี พ.ศ. ปัจจุบัน

type CompetitionResult = {
  id: string;
  level: string;
  competitionName: string;
  rank: string;
  year: string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const SPORTS = [
  "กรีฑา", "ว่ายน้ำ", "ฟุตบอล", "บาสเกตบอล", "วอลเลย์บอล",
  "เทนนิส", "แบดมินตัน", "ตะกร้อ", "มวยสากล", "ยูโด",
  "เทควันโด", "ยิงปืน", "ขี่จักรยาน", "เรือพาย", "กอล์ฟ",
];

export default function AthleteRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    // ข้อมูลส่วนตัว
    firstName: "",
    lastName: "",
    studentId: "",
    faculty: "",
    major: "",
    year: "",
    phone: "",
    // ข้อมูลกีฬา
    sport: "",
    position: "",
    experience: "",
    achievement: "",
    note: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = Array.from(e.target.files || []);
  const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024);
  setFiles((prev) => [...prev, ...valid]);
};

  const [competitions, setCompetitions] = useState<CompetitionResult[]>([]);
  const [newComp, setNewComp] = useState({ level: "", competitionName: "", rank: "", year: "" });

  const [hasClub, setHasClub] = useState<"yes" | "no" | "">("");
  const [noClubFile, setNoClubFile] = useState<File | null>(null);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPosition, setSupervisorPosition] = useState("");

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNoClubFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      setNoClubFile(file);
    }
  };

  const addCompetition = () => {
    if (!newComp.level || !newComp.competitionName || !newComp.rank || !newComp.year) return;
    setCompetitions((prev) => [...prev, { ...newComp, id: generateId() }]);
    setNewComp({ level: "", competitionName: "", rank: "", year: "" });
  };

  const removeCompetition = (id: string) => {
    setCompetitions((prev) => prev.filter((c) => c.id !== id));
  };

  const isWithinTwoYears = (year: string) => {
    const y = parseInt(year);
    return y >= CURRENT_YEAR_BE - 2;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("submit", {
        ...form,
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ลงทะเบียนนักกีฬา</h1>
          <p className="text-gray-500 text-sm mt-1">กีฬามหาวิทยาลัยแห่งประเทศไทย</p>
        </div>
          <LogoutButton />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                {s === 1 ? "ข้อมูลส่วนตัว" : "ข้อมูลกีฬา"}
              </span>
              {s < 2 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {/* Step 1: ข้อมูลส่วนตัว */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="สมชาย"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ใจดี"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนิสิต</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="66027012"
                  value={form.studentId}
                  onChange={(e) => set("studentId", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คณะ</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="วิทยาศาสตร์"
                  value={form.faculty}
                  onChange={(e) => set("faculty", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สาขา</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="วิทยาการคอมพิวเตอร์"
                    value={form.major}
                    onChange={(e) => set("major", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={form.year}
                    onChange={(e) => set("year", e.target.value)}
                  >
                    <option value="">เลือกชั้นปี</option>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>ปี {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="08X-XXX-XXXX"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.firstName || !form.lastName || !form.studentId || !form.faculty || !form.year}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
              >
                ถัดไป
              </button>
            </div>
          )}

          {/* Step 2: ข้อมูลกีฬา */}
{step === 2 && (
  <div className="space-y-4">

    {/* เลือกว่ามีชมรมหรือไม่ */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ท่านเป็นสมาชิกชมรมกีฬาที่จัดตั้งในมหาวิทยาลัยหรือไม่?
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setHasClub("yes")}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            hasClub === "yes" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          มีชมรม
        </button>
        <button
          type="button"
          onClick={() => setHasClub("no")}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            hasClub === "no" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          ไม่มีชมรม
        </button>
      </div>
    </div>

    {/* กรณีไม่มีชมรม: ต้องมีบุคลากรรับรอง + หนังสือขออนุญาต */}
    {hasClub === "no" && (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <p className="text-sm text-amber-800 font-medium">
          ⚠️ กรณีไม่มีชมรม ต้องทำหนังสือขออนุญาตพร้อมมีบุคลากรในสังกัดมหาวิทยาลัยอย่างน้อย 1 คน เป็นผู้รับรองและรับผิดชอบทีม
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล บุคลากรผู้รับรอง</label>
          <input
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น อาจารย์สมศักดิ์ ดีใจ"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง / สังกัด</label>
          <input
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น อาจารย์คณะวิทยาศาสตร์"
            value={supervisorPosition}
            onChange={(e) => setSupervisorPosition(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หนังสือขออนุญาตจัดส่งนักกีฬา</label>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors bg-white">
            <span className="text-xl mb-1">📄</span>
            <span className="text-sm text-gray-500">คลิกเพื่อแนบหนังสือขออนุญาต (PDF)</span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleNoClubFile} />
          </label>
          {noClubFile && (
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm mt-2 border border-gray-200">
              <div className="flex items-center gap-2">
                <span>📄</span>
                <span className="truncate text-gray-700">{noClubFile.name}</span>
              </div>
              <button onClick={() => setNoClubFile(null)} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          )}
        </div>
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">ชนิดกีฬาที่สมัคร</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.sport}
                  onChange={(e) => set("sport", e.target.value)}
                >
                  <option value="">เลือกชนิดกีฬา</option>
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง / ประเภท</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น กองหน้า, 100 เมตร, รุ่น 60 กก."
                  value={form.position}
                  onChange={(e) => set("position", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประสบการณ์ (ปี)</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                >
                  <option value="">เลือกประสบการณ์</option>
                  <option value="น้อยกว่า 1 ปี">น้อยกว่า 1 ปี</option>
                  <option value="1-3 ปี">1-3 ปี</option>
                  <option value="3-5 ปี">3-5 ปี</option>
                  <option value="มากกว่า 5 ปี">มากกว่า 5 ปี</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ผลงานการแข่งขัน
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  ตามประกาศมหาวิทยาลัย ต้องมีผลงานไม่เกิน 2 ปีย้อนหลัง (พ.ศ. {CURRENT_YEAR_BE - 2} เป็นต้นไป)
                </p>

                {/* รายการผลงานที่เพิ่มแล้ว */}
                {competitions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {competitions.map((c) => (
                      <div key={c.id} className="bg-gray-50 rounded-lg p-3 flex items-start justify-between gap-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{c.competitionName}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{c.level} · อันดับที่ {c.rank} · พ.ศ. {c.year}</p>
                          {!isWithinTwoYears(c.year) && (
                            <p className="text-red-500 text-xs mt-1">⚠️ ผลงานนี้เกิน 2 ปีย้อนหลัง อาจไม่นำมาพิจารณา</p>
                          )}
                        </div>
                        <button onClick={() => removeCompetition(c.id)} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ฟอร์มเพิ่มผลงาน */}
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={newComp.level}
                    onChange={(e) => setNewComp((p) => ({ ...p, level: e.target.value }))}
                  >
                    <option value="">เลือกระดับการแข่งขัน</option>
                    {COMPETITION_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>

                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อการแข่งขัน เช่น กีฬาแห่งชาติ ครั้งที่ 49"
                    value={newComp.competitionName}
                    onChange={(e) => setNewComp((p) => ({ ...p, competitionName: e.target.value }))}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="อันดับที่ได้รับ เช่น 1"
                      value={newComp.rank}
                      onChange={(e) => setNewComp((p) => ({ ...p, rank: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ปี พ.ศ. เช่น 2568"
                      value={newComp.year}
                      onChange={(e) => setNewComp((p) => ({ ...p, year: e.target.value }))}
                    />
                  </div>

                  <button
                    onClick={addCompetition}
                    disabled={!newComp.level || !newComp.competitionName || !newComp.rank || !newComp.year}
                    className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    + เพิ่มผลงาน
                  </button>
                </div>
              </div>

              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">แนบไฟล์ผลงาน (ถ้ามี)</label>
            <p className="text-xs text-gray-400 mb-2">รองรับ PDF, JPG, PNG — ไม่เกิน 10MB ต่อไฟล์</p>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-2xl mb-1">📎</span>
              <span className="text-sm text-gray-500">คลิกเพื่อเลือกไฟล์</span>
              <span className="text-xs text-gray-400">หรือลากไฟล์มาวางที่นี่</span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{file.type.includes("pdf") ? "📄" : "🖼️"}</span>
                      <span className="truncate text-gray-700">{file.name}</span>
                      <span className="text-gray-400 shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-red-400 hover:text-red-600 ml-2 shrink-0 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="ข้อมูลเพิ่มเติมที่ต้องการแจ้ง"
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !form.sport || !form.position || !form.experience || !hasClub ||
                    (hasClub === "no" && (!supervisorName || !supervisorPosition || !noClubFile)) ||
                    loading
                  }
                  className="flex-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
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