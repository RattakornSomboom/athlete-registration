"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

type SportCategory = "mandatory" | "international" | "general" | "thai" | "demonstration" | "";

type Sport = {
  id: string;
  name: string;
  category: SportCategory;
  maxAthletes: number;
  isOpen: boolean;
  positions: string[];
  requirements: string;
  competitionType: "qualifier" | "final_only" | "";
  qualifierNote: string;
  reachedTop16LastYear: boolean | null;
  top16Note: string;
};

const CATEGORY_LABEL: Record<string, { label: string; className: string }> = {
  mandatory: { label: "กีฬาบังคับ", className: "bg-rose-50 text-rose-800 border-rose-200" },
  international: { label: "กีฬาเลือกสากล", className: "bg-blue-50 text-blue-900 border-blue-200" },
  general: { label: "กีฬาเลือกทั่วไป", className: "bg-purple-50 text-purple-900 border-purple-200" },
  thai: { label: "กีฬาไทย", className: "bg-amber-50 text-amber-900 border-amber-200" },
  demonstration: { label: "กีฬาสาธิต", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

const CATEGORY_REQUIREMENT: Record<string, string> = {
  mandatory: "ต้องจัดการแข่งขัน (ข้อ 9.1) — 6 ชนิด",
  international: "เลือกจัดอย่างน้อย 17 ชนิด (ข้อ 9.2)",
  general: "เลือกจัดอย่างน้อย 1 ชนิด (ข้อ 9.3)",
  thai: "เลือกจัดอย่างน้อย 1 ชนิด (ข้อ 9.4)",
  demonstration: "ชนิดกีฬาที่ไม่เคยจัดมาก่อน (ข้อ 9.6)",
};

const INITIAL_SPORTS: Sport[] = [
  { id: "1", name: "ฟุตบอล", category: "mandatory", maxAthletes: 22, isOpen: true, positions: ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู"], requirements: "ต้องผ่านการคัดเลือกจากชมรม", competitionType: "qualifier", qualifierNote: "ต้องเป็นตัวแทนภาคเหนือก่อนเข้ารอบมหกรรม", reachedTop16LastYear: null, top16Note: "" },
  { id: "2", name: "บาสเกตบอล", category: "mandatory", maxAthletes: 12, isOpen: true, positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"], requirements: "ประสบการณ์อย่างน้อย 1 ปี", competitionType: "final_only", qualifierNote: "ต้องเคยผ่านเข้ารอบ 16 ทีม ปีที่ผ่านมา", reachedTop16LastYear: true, top16Note: "ผ่านเข้ารอบ 16 ทีม กีฬามหาวิทยาลัยฯ ครั้งที่ 48" },
  { id: "3", name: "วอลเลย์บอล", category: "mandatory", maxAthletes: 12, isOpen: false, positions: ["ตัวรับ", "ตัวต้าน", "ตัวเซต", "ตัวรุก"], requirements: "", competitionType: "", qualifierNote: "", reachedTop16LastYear: null, top16Note: "" },
  { id: "4", name: "เปตอง", category: "international", maxAthletes: 8, isOpen: true, positions: ["เดี่ยว", "คู่", "ทีม"], requirements: "", competitionType: "", qualifierNote: "", reachedTop16LastYear: null, top16Note: "" },
  { id: "5", name: "ดาบไทย", category: "thai", maxAthletes: 6, isOpen: false, positions: [], requirements: "", competitionType: "", qualifierNote: "", reachedTop16LastYear: null, top16Note: "" },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

type QualifierSchedule = {
  region: string;
  hostUniversity: string;
  startDate: string;
  endDate: string;
  location: string;
  note: string;
};

const INITIAL_SCHEDULE: QualifierSchedule = {
  region: "เขตภาคเหนือ",
  hostUniversity: "มหาวิทยาลัยราชภัฏนครสวรรค์",
  startDate: "2026-10-24",
  endDate: "2026-10-29",
  location: "มหาวิทยาลัยราชภัฏนครสวรรค์",
  note: "การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 รอบคัดเลือกเขตภาคเหนือ",
};

export default function StaffSettingsPage() {
  const router = useRouter();
  const [sports, setSports] = useState<Sport[]>(INITIAL_SPORTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saved, setSaved] = useState(false);

  const [schedule, setSchedule] = useState<QualifierSchedule>(INITIAL_SCHEDULE);
  const [editingSchedule, setEditingSchedule] = useState(false);

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return "ยังไม่กำหนด";
    const s = new Date(start);
    const e = new Date(end);
    const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const sBE = s.getFullYear() + 543;
    const eBE = e.getFullYear() + 543;
    if (s.getMonth() === e.getMonth() && sBE === eBE) {
      return `${s.getDate()} - ${e.getDate()} ${thMonths[e.getMonth()]} ${eBE}`;
    }
    return `${s.getDate()} ${thMonths[s.getMonth()]} ${sBE} - ${e.getDate()} ${thMonths[e.getMonth()]} ${eBE}`;
  };

  const [newSport, setNewSport] = useState<Omit<Sport, "id">>({
    name: "",
    category: "",
    maxAthletes: 10,
    isOpen: true,
    positions: [],
    requirements: "",
    competitionType: "",
    qualifierNote: "",
    reachedTop16LastYear: null,
    top16Note: "",
  });

  const [positionInput, setPositionInput] = useState("");
  const [editPositionInput, setEditPositionInput] = useState("");

  const toggleOpen = (id: string) =>
    setSports((prev) => prev.map((s) => s.id === id ? { ...s, isOpen: !s.isOpen } : s));

  const deleteSport = (id: string) => {
    if (confirm("ยืนยันการลบชนิดกีฬานี้ออกจากระบบ?")) {
      setSports((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const addPosition = () => {
    if (!positionInput.trim()) return;
    setNewSport((prev) => ({ ...prev, positions: [...prev.positions, positionInput.trim()] }));
    setPositionInput("");
  };

  const addEditPosition = (id: string) => {
    if (!editPositionInput.trim()) return;
    setSports((prev) => prev.map((s) => s.id === id ? { ...s, positions: [...s.positions, editPositionInput.trim()] } : s));
    setEditPositionInput("");
  };

  const handleAddSport = () => {
    if (!newSport.name.trim() || !newSport.category) return;
    setSports((prev) => [...prev, { ...newSport, id: generateId() }]);
    setNewSport({
      name: "",
      category: "",
      maxAthletes: 10,
      isOpen: true,
      positions: [],
      requirements: "",
      competitionType: "",
      qualifierNote: "",
      reachedTop16LastYear: null,
      top16Note: "",
    });
    setShowAddForm(false);
  };

  const handleEdit = (id: string, field: keyof Sport, value: unknown) =>
    setSports((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/staff/applications" />
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              ตั้งค่าชนิดกีฬาและเงื่อนไขการรับสมัคร
            </h1>
            <p className="text-xs text-slate-500">
              จัดการโควตานักกีฬา และคุณสมบัติตามระเบียบ กกมท. ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แดชบอร์ดวิเคราะห์ผล
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer border border-slate-300"
            >
              + เพิ่มชนิดกีฬา
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {saved ? "บันทึกข้อมูลแล้ว ✓" : "บันทึกการตั้งค่า"}
            </button>
          </div>
        </div>

        {/* Category summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["mandatory", "international", "general", "thai", "demonstration"] as const).map((cat) => {
            const count = sports.filter((s) => s.category === cat).length;
            return (
              <div key={cat} className="bg-white rounded-xl border border-slate-200 p-3.5 text-center shadow-xs">
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-slate-500 text-xs mt-1">{CATEGORY_LABEL[cat].label}</p>
              </div>
            );
          })}
        </div>

        {/* Qualifier schedule */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">กำหนดการแข่งขันรอบคัดเลือกเขตภาคเหนือ</h2>
              <p className="text-[11px] text-slate-500">ข้อมูลสถานที่และช่วงวันแข่งขันตามประกาศ กกมท.</p>
            </div>
            <button
              onClick={() => setEditingSchedule(!editingSchedule)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              {editingSchedule ? "ปิดการแก้ไข" : "แก้ไขกำหนดการ"}
            </button>
          </div>

          {!editingSchedule ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block">เขตการแข่งขัน</span>
                <p className="font-semibold text-slate-900 mt-0.5">{schedule.region}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block">มหาวิทยาลัยเจ้าภาพ</span>
                <p className="font-semibold text-slate-900 mt-0.5">{schedule.hostUniversity}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block">ช่วงวันแข่งขัน</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formatDateRange(schedule.startDate, schedule.endDate)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block">สถานที่จัดการแข่งขัน</span>
                <p className="font-semibold text-slate-900 mt-0.5">{schedule.location}</p>
              </div>
              {schedule.note && (
                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">หมายเหตุ</span>
                  <p className="font-medium text-slate-900 mt-0.5">{schedule.note}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เขตการแข่งขัน</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    value={schedule.region}
                    onChange={(e) => setSchedule((p) => ({ ...p, region: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">มหาวิทยาลัยเจ้าภาพ</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    value={schedule.hostUniversity}
                    onChange={(e) => setSchedule((p) => ({ ...p, hostUniversity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่เริ่มแข่งขัน</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    value={schedule.startDate}
                    onChange={(e) => setSchedule((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่สิ้นสุดแข่งขัน</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    value={schedule.endDate}
                    onChange={(e) => setSchedule((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สถานที่จัดการแข่งขัน</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  value={schedule.location}
                  onChange={(e) => setSchedule((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  value={schedule.note}
                  onChange={(e) => setSchedule((p) => ({ ...p, note: e.target.value }))}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setEditingSchedule(false)}
                  className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  บันทึกกำหนดการแข่งขัน
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Sport Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">เพิ่มชนิดกีฬาและเงื่อนไขการรับสมัครใหม่</h2>
                <p className="text-[11px] text-slate-500">กำหนดโควตาและประเภทการแข่งขันตามข้อบังคับ กกมท.</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมวดหมู่ชนิดกีฬา <span className="text-rose-600">*</span></label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                  value={newSport.category}
                  onChange={(e) => setNewSport((p) => ({ ...p, category: e.target.value as SportCategory }))}
                >
                  <option value="">-- เลือกหมวดหมู่กีฬาตามระเบียบ --</option>
                  <option value="mandatory">กีฬาบังคับ (ข้อ 9.1)</option>
                  <option value="international">กีฬาเลือกสากล (ข้อ 9.2)</option>
                  <option value="general">กีฬาเลือกทั่วไป (ข้อ 9.3)</option>
                  <option value="thai">กีฬาไทย (ข้อ 9.4)</option>
                  <option value="demonstration">กีฬาสาธิต (ข้อ 9.6)</option>
                </select>
                {newSport.category && (
                  <p className="text-[11px] text-slate-500 mt-1">{CATEGORY_REQUIREMENT[newSport.category]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อชนิดกีฬา <span className="text-rose-600">*</span></label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="เช่น กรีฑา, เทนนิส"
                    value={newSport.name}
                    onChange={(e) => setNewSport((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">โควตานักกีฬาสูงสุด (คน) <span className="text-rose-600">*</span></label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    value={newSport.maxAthletes}
                    onChange={(e) => setNewSport((p) => ({ ...p, maxAthletes: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทการแข่งขัน</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                  value={newSport.competitionType}
                  onChange={(e) => setNewSport((p) => ({ ...p, competitionType: e.target.value as Sport["competitionType"] }))}
                >
                  <option value="">เลือกประเภทการแข่งขัน</option>
                  <option value="qualifier">มีรอบคัดเลือก (ต้องเป็นตัวแทนเขตภาคเหนือก่อน)</option>
                  <option value="final_only">มีเฉพาะรอบมหกรรม (ต้องเคยผ่านเข้ารอบ 16 ทีม)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เงื่อนไขศักยภาพ / คุณสมบัติพิเศษ</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="เช่น ต้องมีผลงานระดับจังหวัดขึ้นไป"
                  value={newSport.qualifierNote}
                  onChange={(e) => setNewSport((p) => ({ ...p, qualifierNote: e.target.value }))}
                />
              </div>

              {newSport.competitionType === "final_only" && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <label className="block text-xs font-semibold text-slate-800">ผลการแข่งขันปีที่ผ่านมา (ตามประกาศข้อ 8(2))</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewSport((p) => ({ ...p, reachedTop16LastYear: true }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        newSport.reachedTop16LastYear === true ? "bg-emerald-800 text-white border-emerald-800 font-bold" : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                      }`}
                    >
                      ผ่านเข้ารอบ 16 ทีม
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSport((p) => ({ ...p, reachedTop16LastYear: false }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        newSport.reachedTop16LastYear === false ? "bg-rose-700 text-white border-rose-700 font-bold" : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                      }`}
                    >
                      ไม่ผ่านเข้ารอบ
                    </button>
                  </div>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="หมายเหตุ เช่น ผ่านเข้ารอบ 16 ทีม กีฬามหาวิทยาลัยฯ ครั้งที่ 51"
                    value={newSport.top16Note}
                    onChange={(e) => setNewSport((p) => ({ ...p, top16Note: e.target.value }))}
                  />
                  {newSport.reachedTop16LastYear === false && (
                    <p className="text-[11px] text-rose-700 font-medium">
                      หมายเหตุ: ตามประกาศข้อ 8(2) ชนิดกีฬานี้อาจไม่มีสิทธิ์ส่งเข้าร่วมแข่งขัน เนื่องจากไม่ผ่านเข้ารอบ 16 ทีมปีที่ผ่านมา
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง / ประเภทการแข่งขันย่อย</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="เช่น กองหน้า หรือ รุ่นน้ำหนักไม่เกิน 60 กก."
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPosition()}
                  />
                  <button onClick={addPosition} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer">เพิ่มตำแหน่ง</button>
                </div>
                {newSport.positions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newSport.positions.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded border border-slate-200">
                        {p}
                        <button onClick={() => setNewSport((prev) => ({ ...prev, positions: prev.positions.filter((_, idx) => idx !== i) }))} className="text-slate-400 hover:text-slate-700">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เงื่อนไขการรับสมัครเพิ่มเติม</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none resize-none"
                  rows={2}
                  placeholder="ระบุข้อกำหนดหรือเงื่อนไขพิเศษ"
                  value={newSport.requirements}
                  onChange={(e) => setNewSport((p) => ({ ...p, requirements: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer">ยกเลิก</button>
                <button onClick={handleAddSport} disabled={!newSport.name || !newSport.category} className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer">บันทึกชนิดกีฬา</button>
              </div>
            </div>
          </div>
        )}

        {/* Sport Cards */}
        <div className="space-y-3">
          {sports.map((sport) => (
            <div key={sport.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-slate-900 text-sm">{sport.name}</h2>
                  {sport.category && (
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${CATEGORY_LABEL[sport.category].className}`}>
                      {CATEGORY_LABEL[sport.category].label}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                    sport.isOpen
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {sport.isOpen ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleOpen(sport.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      sport.isOpen
                        ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                        : "bg-blue-900 text-white hover:bg-blue-800"
                    }`}
                  >
                    {sport.isOpen ? "ปิดรับสมัคร" : "เปิดรับสมัคร"}
                  </button>
                  <button
                    onClick={() => setEditingId(editingId === sport.id ? null : sport.id)}
                    className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {editingId === sport.id ? "ปิด" : "แก้ไข"}
                  </button>
                  <button
                    onClick={() => deleteSport(sport.id)}
                    className="px-2.5 py-1 rounded border border-rose-300 text-rose-700 text-xs font-medium hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    ลบ
                  </button>
                </div>
              </div>

              {/* Info */}
              {editingId !== sport.id && (
                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                  <p>โควตานักกีฬาสูงสุด: <strong className="text-slate-900">{sport.maxAthletes} คน</strong></p>
                  {sport.competitionType && (
                    <p className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.2 rounded border font-medium ${
                        sport.competitionType === "qualifier"
                          ? "bg-blue-50 text-blue-900 border-blue-200"
                          : "bg-amber-50 text-amber-900 border-amber-200"
                      }`}>
                        {sport.competitionType === "qualifier" ? "มีรอบคัดเลือกเขตภาคเหนือ" : "ส่งเฉพาะรอบมหกรรม"}
                      </span>
                      {sport.qualifierNote && <span className="text-slate-400">{sport.qualifierNote}</span>}
                    </p>
                  )}
                  {sport.competitionType === "final_only" && sport.reachedTop16LastYear !== null && (
                    <p className="text-[11px] mt-1">
                      <span className={sport.reachedTop16LastYear ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                        {sport.reachedTop16LastYear ? "✓ ผ่านเข้ารอบ 16 ทีมปีที่ผ่านมา" : "✕ ไม่ผ่านเข้ารอบ 16 ทีมปีที่ผ่านมา"}
                      </span>
                      {sport.top16Note && <span className="text-slate-400 ml-2">({sport.top16Note})</span>}
                    </p>
                  )}
                  {sport.positions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {sport.positions.map((p, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.2 rounded border border-slate-200">{p}</span>
                      ))}
                    </div>
                  )}
                  {sport.requirements && <p className="text-[11px] text-slate-400 mt-1">เงื่อนไข: {sport.requirements}</p>}
                </div>
              )}

              {/* Edit Form */}
              {editingId === sport.id && (
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">หมวดหมู่ชนิดกีฬา</label>
                    <select
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                      value={sport.category}
                      onChange={(e) => handleEdit(sport.id, "category", e.target.value)}
                    >
                      <option value="">เลือกหมวดหมู่กีฬา</option>
                      <option value="mandatory">กีฬาบังคับ</option>
                      <option value="international">กีฬาเลือกสากล</option>
                      <option value="general">กีฬาเลือกทั่วไป</option>
                      <option value="thai">กีฬาไทย</option>
                      <option value="demonstration">กีฬาสาธิต</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อชนิดกีฬา</label>
                      <input
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                        value={sport.name}
                        onChange={(e) => handleEdit(sport.id, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">โควตานักกีฬาสูงสุด</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                        value={sport.maxAthletes}
                        onChange={(e) => handleEdit(sport.id, "maxAthletes", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทการแข่งขัน</label>
                      <select
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 bg-white outline-none"
                        value={sport.competitionType}
                        onChange={(e) => handleEdit(sport.id, "competitionType", e.target.value)}
                      >
                        <option value="">เลือกประเภท</option>
                        <option value="qualifier">มีรอบคัดเลือกเขตภาคเหนือ</option>
                        <option value="final_only">เฉพาะรอบมหกรรม</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">เงื่อนไขศักยภาพ</label>
                      <input
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                        value={sport.qualifierNote}
                        onChange={(e) => handleEdit(sport.id, "qualifierNote", e.target.value)}
                      />
                    </div>
                  </div>

                  {sport.competitionType === "final_only" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                      <label className="block text-xs font-semibold text-slate-800">ผลการแข่งขันปีที่ผ่านมา</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(sport.id, "reachedTop16LastYear", true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            sport.reachedTop16LastYear === true ? "bg-emerald-800 text-white border-emerald-800 font-bold" : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                          }`}
                        >
                          ผ่านเข้ารอบ 16 ทีม
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(sport.id, "reachedTop16LastYear", false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            sport.reachedTop16LastYear === false ? "bg-rose-700 text-white border-rose-700 font-bold" : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                          }`}
                        >
                          ไม่ผ่านเข้ารอบ
                        </button>
                      </div>
                      <input
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                        placeholder="หมายเหตุ"
                        value={sport.top16Note}
                        onChange={(e) => handleEdit(sport.id, "top16Note", e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง / ประเภท</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                        placeholder="เพิ่มตำแหน่ง"
                        value={editPositionInput}
                        onChange={(e) => setEditPositionInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addEditPosition(sport.id)}
                      />
                      <button onClick={() => addEditPosition(sport.id)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer">เพิ่ม</button>
                    </div>
                    {sport.positions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sport.positions.map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[11px] px-2.5 py-0.5 rounded border border-slate-200">
                            {p}
                            <button onClick={() => handleEdit(sport.id, "positions", sport.positions.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-slate-700">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">เงื่อนไขการรับสมัคร</label>
                    <textarea
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none resize-none"
                      rows={2}
                      value={sport.requirements}
                      onChange={(e) => handleEdit(sport.id, "requirements", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
