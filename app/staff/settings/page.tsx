"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  mandatory: { label: "กีฬาบังคับ", className: "bg-red-100 text-red-700" },
  international: { label: "กีฬาเลือกสากล", className: "bg-blue-100 text-blue-700" },
  general: { label: "กีฬาเลือกทั่วไป", className: "bg-purple-100 text-purple-700" },
  thai: { label: "กีฬาไทย", className: "bg-amber-100 text-amber-700" },
  demonstration: { label: "กีฬาสาธิต", className: "bg-slate-100 text-slate-600" },
};

const CATEGORY_REQUIREMENT: Record<string, string> = {
  mandatory: "ต้องจัดการแข่งขัน (ข้อ 9.1) — 6 ชนิด",
  international: "เลือกจัดอย่างน้อย 17 ชนิด (ข้อ 9.2)",
  general: "เลือกจัดอย่างน้อย 1 ชนิด (ข้อ 9.3)",
  thai: "เลือกจัดอย่างน้อย 1 ชนิด (ข้อ 9.4)",
  demonstration: "ชนิดกีฬาที่ไม่เคยจัดมาก่อน (ข้อ 9.6)",
};

const generateId = () => Math.random().toString(36).substring(2, 9);

type QualifierSchedule = {
  region: string;
  hostUniversity: string;
  startDate: string;
  endDate: string;
  location: string;
  note: string;
};

export default function StaffSettingsPage() {
  const router = useRouter();
  const [sports, setSports] = useState<Sport[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [schedule, setSchedule] = useState<QualifierSchedule>({
    region: "", hostUniversity: "", startDate: "", endDate: "", location: "", note: ""
  });
  const [editingSchedule, setEditingSchedule] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState({ loading: false, error: "", success: "" });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImportFile(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportStatus({ loading: true, error: "", success: "" });
    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const students = jsonData.map((row: any) => {
            // แยกชื่อ-นามสกุล
            const fullName = row["ชื่อ-นามสกุล"] || row["ชื่อ"] || row["First Name"] || row.firstName || "";
            const nameParts = fullName.trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            // จัดการวันที่ (Excel Date หรือ Text)
            let birthDateStr = "";
            const rawDate = row["วันเดือนปีเกิด"];
            if (rawDate) {
              if (typeof rawDate === "number") {
                // Excel serial date format
                const date = new Date((rawDate - 25569) * 86400 * 1000);
                birthDateStr = date.toISOString();
              } else {
                birthDateStr = String(rawDate);
              }
            }

            // จัดการระดับการศึกษา
            const levelRaw = String(row["ระดับการศึกษา"] || "").toLowerCase();
            const studentLevel = (levelRaw.includes("โท") || levelRaw.includes("เอก") || levelRaw.includes("grad")) ? "GRADUATE" : "BACHELOR";

            // ฟังก์ชันช่วยดึงคีย์ด้วยคำค้นหาบางส่วน
            const findValue = (keyword: string) => {
              const key = Object.keys(row).find(k => k.includes(keyword));
              return key ? row[key] : null;
            };

            const pastCompetitions = [];
            for (let i = 1; i <= 3; i++) {
              const res = findValue(`ผลงานรายการที่ ${i}`);
              if (res) pastCompetitions.push(res);
            }
            const extraRes = findValue("ผลงานเพิ่มเติม");
            if (extraRes) pastCompetitions.push(extraRes);

            const hasParticipated = String(findValue("เคยเข้าร่วมการแข่งขันกีฬามหาวิทยาลัย")).includes("เคย");
            const isNationalTeam = String(findValue("เคยเป็นผู้แทนประเทศไทย")).includes("เคย");

            return {
              studentId: row["รหัสนิสิต"] || row["Student ID"] || row.studentId,
              firstName: firstName,
              lastName: lastName,
              faculty: row["คณะ"] || row.faculty,
              major: row["ภาควิชา"] || row["สาขา"] || row.major,
              nationalId: row["เลขประจำตัวประชาชน"],
              nationality: row["สัญชาติ"],
              birthDate: birthDateStr,
              year: row["ชั้นปี"],
              gpaSemester: row["GPA ภาคการศึกษา"] || row["GPA"],
              gpaCumulative: row["GPAX สะสม"] || row["GPAX"],
              studentLevel: studentLevel,
              // History fields
              hasParticipated: hasParticipated,
              firstSport: findValue("ชนิดกีฬาที่สมัครเข้าร่วมครั้งแรก"),
              participateCountBachelor: findValue("จำนวนครั้งที่เข้าร่วมระดับปริญญาตรี"),
              participateCountMaster: findValue("จำนวนครั้งที่เข้าร่วมระดับปริญญาโท"),
              participateCountPhd: findValue("จำนวนครั้งที่เข้าร่วมระดับปริญญาเอก"),
              lastParticipateYear: findValue("ปี พ.ศ. ที่เข้าร่วมล่าสุด"),
              isNationalTeam: isNationalTeam,
              pastCompetitions: pastCompetitions.length > 0 ? pastCompetitions : null
            };
          }).filter((s: any) => !!s.studentId);

          if (students.length === 0) {
            setImportStatus({ loading: false, error: "ไม่พบข้อมูลรหัสนิสิตในไฟล์", success: "" });
            return;
          }

          const res = await fetch("/api/staff/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students }),
          });
          const result = await res.json();
          if (res.ok) {
            setImportStatus({ loading: false, error: "", success: `นำเข้าสำเร็จ ${result.successCount} คน (ล้มเหลว ${result.errorCount} คน)` });
            setImportFile(null);
          } else {
            setImportStatus({ loading: false, error: result.error || "เกิดข้อผิดพลาดในการนำเข้า", success: "" });
          }
        } catch (err: any) {
          setImportStatus({ loading: false, error: "รูปแบบไฟล์ไม่ถูกต้อง", success: "" });
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (err: any) {
      setImportStatus({ loading: false, error: "โหลดไลบรารีไม่สำเร็จ กรุณาลองใหม่", success: "" });
    }
  };

  useEffect(() => {
    fetch("/api/staff/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.sports) setSports(data.sports);
        if (data.schedule) setSchedule(data.schedule);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

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

  const deleteSport = (id: string) =>
    setSports((prev) => prev.filter((s) => s.id !== id));

  const handleAddSport = () => {
    if (!newSport.name || !newSport.category) return;
    setSports((prev) => [...prev, { ...newSport, id: generateId() }]);
    setNewSport({ name: "", category: "", maxAthletes: 10, isOpen: true, positions: [], requirements: "", competitionType: "", qualifierNote: "", reachedTop16LastYear: null, top16Note: "" });
    setPositionInput("");
    setShowAddForm(false);
  };

  const handleEdit = (id: string, field: keyof Sport, value: unknown) =>
    setSports((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const addPosition = () => {
    if (!positionInput.trim()) return;
    setNewSport((prev) => ({ ...prev, positions: [...prev.positions, positionInput.trim()] }));
    setPositionInput("");
  };

  const addEditPosition = (id: string) => {
    if (!editPositionInput.trim()) return;
    handleEdit(id, "positions", [...(sports.find((s) => s.id === id)?.positions || []), editPositionInput.trim()]);
    setEditPositionInput("");
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/staff/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sports, schedule }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
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
              {saved ? "บันทึกข้อมูลแล้ว" : "บันทึกการตั้งค่า"}
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* Import Students Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-900">นำเข้าข้อมูลนักศึกษา (Excel)</h2>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500">
              อัปโหลดไฟล์ข้อมูลนักศึกษา (.xlsx, .xls, .csv) เพื่อสร้างบัญชีและโปรไฟล์อัตโนมัติ 
              ระบบจะใช้ "รหัสนิสิต" เป็นรหัสผ่านเริ่มต้น หัวคอลัมน์ที่รองรับ: <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">รหัสนิสิต</span>, <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">ชื่อ-นามสกุล</span>, <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">คณะ</span>, ฯลฯ
            </p>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <button
                onClick={handleImport}
                disabled={!importFile || importStatus.loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                {importStatus.loading ? "กำลังประมวลผล..." : "นำเข้าข้อมูล"}
              </button>
            </div>
            {importStatus.error && <p className="text-xs text-rose-600">❌ {importStatus.error}</p>}
            {importStatus.success && <p className="text-xs text-emerald-600">✅ {importStatus.success}</p>}
          </div>
        </div>

        {/* Category summary */}
        <div className="grid grid-cols-5 gap-3">
          {(["mandatory", "international", "general", "thai", "demonstration"] as const).map((cat) => {
            const count = sports.filter((s) => s.category === cat).length;
            return (
              <div key={cat} className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-xs">
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-slate-500 text-xs mt-1">{CATEGORY_LABEL[cat].label}</p>
              </div>
            );
          })}
        </div>

        {/* Qualifier schedule */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-900">กำหนดการแข่งขันรอบคัดเลือก</h2>
            <button
              onClick={() => setEditingSchedule(!editingSchedule)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {editingSchedule ? "ปิด" : "แก้ไข"}
            </button>
          </div>

          {!editingSchedule ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-500">เขตการแข่งขัน</span>
                <p className="font-medium text-slate-900 mt-0.5">{schedule.region}</p>
              </div>
              <div>
                <span className="text-slate-500">มหาวิทยาลัยเจ้าภาพ</span>
                <p className="font-medium text-slate-900 mt-0.5">{schedule.hostUniversity}</p>
              </div>
              <div>
                <span className="text-slate-500">วันที่แข่งขัน</span>
                <p className="font-medium text-slate-900 mt-0.5">{formatDateRange(schedule.startDate, schedule.endDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">สถานที่</span>
                <p className="font-medium text-slate-900 mt-0.5">{schedule.location}</p>
              </div>
              {schedule.note && (
                <div className="col-span-2">
                  <span className="text-slate-500">หมายเหตุ</span>
                  <p className="font-medium text-slate-900 mt-0.5">{schedule.note}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เขตการแข่งขัน</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={schedule.region}
                    onChange={(e) => setSchedule((p) => ({ ...p, region: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">มหาวิทยาลัยเจ้าภาพ</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={schedule.hostUniversity}
                    onChange={(e) => setSchedule((p) => ({ ...p, hostUniversity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">วันที่เริ่มแข่งขัน</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={schedule.startDate}
                    onChange={(e) => setSchedule((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">วันที่สิ้นสุดแข่งขัน</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={schedule.endDate}
                    onChange={(e) => setSchedule((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">สถานที่จัดการแข่งขัน</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={schedule.location}
                  onChange={(e) => setSchedule((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 รอบคัดเลือกเขตภาคเหนือ"
                  value={schedule.note}
                  onChange={(e) => setSchedule((p) => ({ ...p, note: e.target.value }))}
                />
              </div>

              <button
                onClick={() => setEditingSchedule(false)}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                บันทึกกำหนดการ
              </button>
            </div>
          )}
        </div>
        
        {/* Add Sport Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-medium text-slate-900 mb-4">เพิ่มชนิดกีฬาใหม่</h2>
            <div className="space-y-3">

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมวดกีฬา</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newSport.category}
                  onChange={(e) => setNewSport((p) => ({ ...p, category: e.target.value as SportCategory }))}
                >
                  <option value="">เลือกหมวดกีฬา</option>
                  <option value="mandatory">กีฬาบังคับ</option>
                  <option value="international">กีฬาเลือกสากล</option>
                  <option value="general">กีฬาเลือกทั่วไป</option>
                  <option value="thai">กีฬาไทย</option>
                  <option value="demonstration">กีฬาสาธิต</option>
                </select>
                {newSport.category && (
                  <p className="text-xs text-slate-400 mt-1">{CATEGORY_REQUIREMENT[newSport.category]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อกีฬา</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น กรีฑา"
                    value={newSport.name}
                    onChange={(e) => setNewSport((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">จำนวนรับสูงสุด</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSport.maxAthletes}
                    onChange={(e) => setNewSport((p) => ({ ...p, maxAthletes: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ประเภทการแข่งขัน</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newSport.competitionType}
                  onChange={(e) => setNewSport((p) => ({ ...p, competitionType: e.target.value as Sport["competitionType"] }))}
                >
                  <option value="">เลือกประเภท</option>
                  <option value="qualifier">มีรอบคัดเลือก (ต้องเป็นตัวแทนภาคก่อน)</option>
                  <option value="final_only">มีเฉพาะรอบมหกรรม (ต้องเคยผ่านรอบ 16 ทีม)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เงื่อนไขศักยภาพ (ถ้ามี)</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น ต้องเป็นตัวแทนภาคเหนือ"
                  value={newSport.qualifierNote}
                  onChange={(e) => setNewSport((p) => ({ ...p, qualifierNote: e.target.value }))}
                />
              </div>

              {newSport.competitionType === "final_only" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                  <label className="block text-xs font-medium text-orange-800">
                    ผลการแข่งขันปีที่ผ่านมา (กีฬามหาวิทยาลัยฯ ครั้งก่อน)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewSport((p) => ({ ...p, reachedTop16LastYear: true }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                        newSport.reachedTop16LastYear === true ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      ผ่านเข้ารอบ 16 ทีม
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSport((p) => ({ ...p, reachedTop16LastYear: false }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                        newSport.reachedTop16LastYear === false ? "bg-rose-600 text-white border-rose-600" : "border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      ไม่ผ่านเข้ารอบ
                    </button>
                  </div>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="หมายเหตุ เช่น ผ่านเข้ารอบ 16 ทีม ครั้งที่ 48"
                    value={newSport.top16Note}
                    onChange={(e) => setNewSport((p) => ({ ...p, top16Note: e.target.value }))}
                  />
                  {newSport.reachedTop16LastYear === false && (
                    <p className="text-xs text-rose-600">
                      ⚠️ ตามประกาศข้อ 8(2) กีฬานี้อาจไม่มีสิทธิ์ส่งเข้าร่วมแข่งขันปีนี้ เนื่องจากไม่ผ่านเข้ารอบ 16 ทีมปีที่ผ่านมา
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่ง / ประเภท</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น กองหน้า"
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPosition()}
                  />
                  <button onClick={addPosition} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors cursor-pointer">เพิ่ม</button>
                </div>
                {newSport.positions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newSport.positions.map((p, i) => (
                      <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {p}
                        <button onClick={() => setNewSport((prev) => ({ ...prev, positions: prev.positions.filter((_, idx) => idx !== i) }))} className="text-blue-400 hover:text-blue-700 cursor-pointer">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">เงื่อนไขการสมัคร</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="เงื่อนไขหรือข้อกำหนดพิเศษ"
                  value={newSport.requirements}
                  onChange={(e) => setNewSport((p) => ({ ...p, requirements: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">ยกเลิก</button>
                <button onClick={handleAddSport} disabled={!newSport.name || !newSport.category} className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">เพิ่มกีฬา</button>
              </div>
            </div>
          </div>
        )}

        {/* Sport Cards */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="space-y-3">
            {sports.map((sport) => (
              <div key={sport.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-medium text-slate-900">{sport.name}</h2>
                    {sport.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_LABEL[sport.category].className}`}>
                        {CATEGORY_LABEL[sport.category].label}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sport.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {sport.isOpen ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleOpen(sport.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${sport.isOpen ? "border border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                    >
                      {sport.isOpen ? "ปิดรับ" : "เปิดรับ"}
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === sport.id ? null : sport.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {editingId === sport.id ? "ปิด" : "แก้ไข"}
                    </button>
                    <button
                      onClick={() => deleteSport(sport.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      ลบ
                    </button>
                  </div>
                </div>

                {/* Info */}
                {editingId !== sport.id && (
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>จำนวนรับสูงสุด: <span className="text-slate-900 font-medium">{sport.maxAthletes} คน</span></p>
                    {sport.competitionType && (
                      <p className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sport.competitionType === "qualifier" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                          {sport.competitionType === "qualifier" ? "มีรอบคัดเลือก" : "เฉพาะรอบมหกรรม"}
                        </span>
                        {sport.qualifierNote && <span className="text-xs text-slate-400">{sport.qualifierNote}</span>}
                      </p>
                    )}
                    {sport.competitionType === "final_only" && sport.reachedTop16LastYear !== null && (
                      <p className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sport.reachedTop16LastYear ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {sport.reachedTop16LastYear ? "✓ ผ่านเข้ารอบ 16 ทีมปีที่แล้ว" : "✕ ไม่ผ่านเข้ารอบปีที่แล้ว"}
                        </span>
                        {sport.top16Note && <span className="text-xs text-slate-400">{sport.top16Note}</span>}
                      </p>
                    )}
                    {sport.positions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sport.positions.map((p, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                    {sport.requirements && <p className="text-xs text-slate-400 mt-1">เงื่อนไข: {sport.requirements}</p>}
                  </div>
                )}

                {/* Edit Form */}
                {editingId === sport.id && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">หมวดกีฬา</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={sport.category}
                        onChange={(e) => handleEdit(sport.id, "category", e.target.value)}
                      >
                        <option value="">เลือกหมวดกีฬา</option>
                        <option value="mandatory">กีฬาบังคับ</option>
                        <option value="international">กีฬาเลือกสากล</option>
                        <option value="general">กีฬาเลือกทั่วไป</option>
                        <option value="thai">กีฬาไทย</option>
                        <option value="demonstration">กีฬาสาธิต</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อกีฬา</label>
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={sport.name}
                          onChange={(e) => handleEdit(sport.id, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">จำนวนรับสูงสุด</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={sport.maxAthletes}
                          onChange={(e) => handleEdit(sport.id, "maxAthletes", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">ประเภทการแข่งขัน</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          value={sport.competitionType}
                          onChange={(e) => handleEdit(sport.id, "competitionType", e.target.value)}
                        >
                          <option value="">เลือกประเภท</option>
                          <option value="qualifier">มีรอบคัดเลือก</option>
                          <option value="final_only">เฉพาะรอบมหกรรม</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">เงื่อนไขศักยภาพ</label>
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={sport.qualifierNote}
                          onChange={(e) => handleEdit(sport.id, "qualifierNote", e.target.value)}
                        />
                      </div>
                    </div>

                    {sport.competitionType === "final_only" && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                        <label className="block text-xs font-medium text-orange-800">ผลการแข่งขันปีที่ผ่านมา</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(sport.id, "reachedTop16LastYear", true)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                              sport.reachedTop16LastYear === true ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
                            }`}
                          >
                            ผ่านเข้ารอบ 16 ทีม
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(sport.id, "reachedTop16LastYear", false)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                              sport.reachedTop16LastYear === false ? "bg-rose-600 text-white border-rose-600" : "border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
                            }`}
                          >
                            ไม่ผ่านเข้ารอบ
                          </button>
                        </div>
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          placeholder="หมายเหตุ"
                          value={sport.top16Note}
                          onChange={(e) => handleEdit(sport.id, "top16Note", e.target.value)}
                        />
                        {sport.reachedTop16LastYear === false && (
                          <p className="text-xs text-rose-600">
                            ⚠️ กีฬานี้อาจไม่มีสิทธิ์ส่งเข้าร่วมแข่งขันปีนี้ ตามประกาศข้อ 8(2)
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่ง / ประเภท</label>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="เพิ่มตำแหน่ง"
                          value={editPositionInput}
                          onChange={(e) => setEditPositionInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addEditPosition(sport.id)}
                        />
                        <button onClick={() => addEditPosition(sport.id)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors cursor-pointer">เพิ่ม</button>
                      </div>
                      {sport.positions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sport.positions.map((p, i) => (
                            <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                              {p}
                              <button onClick={() => handleEdit(sport.id, "positions", sport.positions.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-blue-700 cursor-pointer">✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">เงื่อนไขการสมัคร</label>
                      <textarea
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
        )}
      </div>
    </div>
  );
}