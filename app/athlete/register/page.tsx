"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SPORTS = [
  "กรีฑา", "ว่ายน้ำ", "ฟุตบอล", "บาสเกตบอล", "วอลเลย์บอล",
  "เทนนิส", "แบดมินตัน", "ตะกร้อ", "มวยสากล", "ยูโด",
  "เทควันโด", "ยิงปืน", "ขี่จักรยาน", "เรือพาย", "กอล์ฟ",
];

const MOCK_STUDENT = {
  studentId: "66027012",
  firstName: "สมชาย",
  lastName: "ใจดี",
  faculty: "วิทยาศาสตร์",
  major: "วิทยาการคอมพิวเตอร์",
  year: "4",
};

export default function AthleteRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
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

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("submit", { ...MOCK_STUDENT, ...form, files: files.map((f) => f.name) });
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/athlete/status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">ลงทะเบียนนักกีฬา</h1>
          <p className="text-gray-500 text-sm mt-1">กีฬามหาวิทยาลัยแห่งประเทศไทย</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <p className="text-xs font-medium text-blue-500 uppercase tracking-wide mb-3">
            ข้อมูลนิสิต (ดึงจากระบบทะเบียน)
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500">ชื่อ-นามสกุล</span>
              <p className="font-medium text-gray-900">{MOCK_STUDENT.firstName} {MOCK_STUDENT.lastName}</p>
            </div>
            <div>
              <span className="text-gray-500">รหัสนิสิต</span>
              <p className="font-medium text-gray-900">{MOCK_STUDENT.studentId}</p>
            </div>
            <div>
              <span className="text-gray-500">คณะ</span>
              <p className="font-medium text-gray-900">{MOCK_STUDENT.faculty}</p>
            </div>
            <div>
              <span className="text-gray-500">สาขา</span>
              <p className="font-medium text-gray-900">{MOCK_STUDENT.major}</p>
            </div>
            <div>
              <span className="text-gray-500">ชั้นปี</span>
              <p className="font-medium text-gray-900">ปี {MOCK_STUDENT.year}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <p className="text-sm font-medium text-gray-700">ข้อมูลการสมัครกีฬา</p>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">ประสบการณ์</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">ผลงาน / รางวัลที่เคยได้รับ</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="เช่น แชมป์กีฬาเขต ปี 2566, เหรียญทองกีฬาแห่งชาติ..."
              value={form.achievement}
              onChange={(e) => set("achievement", e.target.value)}
            />
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

          <button
            onClick={handleSubmit}
            disabled={!form.sport || !form.position || !form.experience || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "กำลังส่งข้อมูล..." : "ส่งใบสมัคร"}
          </button>
        </div>
      </div>
    </div>
  );
}