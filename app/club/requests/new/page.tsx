"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    reason: "",
    advisorName: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) setDocument(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("submit request", { ...form, document: document?.name });
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/club/requests");
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.title && form.reason && form.advisorName && document;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">
            ← ย้อนกลับ
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">ยื่นคำร้องกรณีพิเศษ</h1>
          <p className="text-gray-500 text-sm mt-1">
            สำหรับเหตุจำเป็นนอกเหนือจากหลักเกณฑ์ปกติ ต้องผ่านอาจารย์ที่ปรึกษาชมรมเสนอเรื่องไปยังกองกิจการนิสิต
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เรื่องที่ขอร้องขอ</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น ขอผ่อนผันเกณฑ์ผลงานการแข่งขัน"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล / รายละเอียดคำร้อง</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="อธิบายเหตุผลความจำเป็นโดยละเอียด..."
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่ออาจารย์ที่ปรึกษาชมรม</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น อาจารย์สมศักดิ์ ดีใจ"
              value={form.advisorName}
              onChange={(e) => set("advisorName", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หนังสือร้องขอ (ลงนามโดยอาจารย์ที่ปรึกษา)</label>
            <p className="text-xs text-gray-400 mb-2">รองรับ PDF — ไม่เกิน 10MB</p>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-xl mb-1">📄</span>
              <span className="text-sm text-gray-500">คลิกเพื่อแนบหนังสือร้องขอ</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            </label>
            {document && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <span className="truncate text-gray-700">{document.name}</span>
                </div>
                <button onClick={() => setDocument(null)} className="text-red-400 hover:text-red-600">✕</button>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "กำลังส่งคำร้อง..." : "ยื่นคำร้อง"}
          </button>
        </div>
      </div>
    </div>
  );
}