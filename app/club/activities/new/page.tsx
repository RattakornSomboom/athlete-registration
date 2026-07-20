"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: "",
    date: "",
    location: "",
    participants: "",
    description: "",
    note: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.size <= 10 * 1024 * 1024);
    setDocuments((prev) => [...prev, ...files]);
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.size <= 10 * 1024 * 1024);
    setImages((prev) => [...prev, ...files]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: ส่งข้อมูลไป API จริง
      console.log("submit activity", { ...form, documents, images });
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/club/activities");
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.title && form.date && form.location && form.participants && form.description;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-5xl mx-auto">

        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">
            ← ย้อนกลับ
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">เพิ่มกิจกรรมชมรม</h1>
          <p className="text-gray-500 text-sm mt-1">กรอกรายละเอียดกิจกรรมที่จัดขึ้นภายในชมรม</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อกิจกรรม</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น การแข่งขันฟุตบอลภายในชมรม ครั้งที่ 1"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จัดกิจกรรม</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้เข้าร่วม</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 22"
                value={form.participants}
                onChange={(e) => set("participants", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่จัดกิจกรรม</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น สนามฟุตบอล มหาวิทยาลัยพะเยา"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดกิจกรรม</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="อธิบายรายละเอียดกิจกรรม วัตถุประสงค์ และสิ่งที่ทำ..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* เอกสารรับรอง */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เอกสารรับรองการจัดกิจกรรม</label>
            <p className="text-xs text-gray-400 mb-2">รองรับ PDF — ไม่เกิน 10MB ต่อไฟล์</p>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-xl mb-1">📄</span>
              <span className="text-sm text-gray-500">คลิกเพื่อแนบเอกสาร</span>
              <input type="file" multiple accept=".pdf" className="hidden" onChange={handleDocuments} />
            </label>
            {documents.length > 0 && (
              <div className="mt-2 space-y-1">
                {documents.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>📄</span>
                      <span className="truncate text-gray-700">{f.name}</span>
                    </div>
                    <button onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* รูปภาพ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพประกอบกิจกรรม</label>
            <p className="text-xs text-gray-400 mb-2">รองรับ JPG, PNG — ไม่เกิน 10MB ต่อไฟล์</p>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-xl mb-1">🖼️</span>
              <span className="text-sm text-gray-500">คลิกเพื่อแนบรูปภาพ</span>
              <input type="file" multiple accept=".jpg,.jpeg,.png" className="hidden" onChange={handleImages} />
            </label>
            {images.length > 0 && (
              <div className="mt-2 space-y-1">
                {images.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>🖼️</span>
                      <span className="truncate text-gray-700">{f.name}</span>
                    </div>
                    <button onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">✕</button>
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
              placeholder="ข้อมูลเพิ่มเติม"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
          </button>
        </div>
      </div>
    </div>
  );
}