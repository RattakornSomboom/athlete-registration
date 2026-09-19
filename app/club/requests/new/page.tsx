"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

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
      await new Promise((r) => setTimeout(r, 800));
      router.push("/club/requests");
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.title && form.reason && form.advisorName && document;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/requests" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              แบบคำร้องขออนุมัติกรณีพิเศษ
            </h1>
            <p className="text-xs text-slate-500">
              สำหรับเสนอเรื่องต่ออาจารย์ที่ปรึกษาชมรมและคณะกรรมการฝ่ายกีฬา กองกิจการนิสิต
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หัวข้อเรื่องที่ขออนุมัติ <span className="text-rose-600">*</span>
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
              placeholder="เช่น ขอผ่อนผันเกณฑ์ผลงานการแข่งขัน, ขอเปลี่ยนตัวนักกีฬาเนื่องจากบาดเจ็บ"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดเหตุผลและความจำเป็น <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none leading-relaxed"
              placeholder="ระบุข้อเท็จจริง เหตุผลความจำเป็น และผลกระทบต่อทีมหากไม่ได้รับการผ่อนผัน..."
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อาจารย์ที่ปรึกษาชมรมผู้ให้ความเห็นชอบ <span className="text-rose-600">*</span>
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
              placeholder="ระบุชื่อ-นามสกุล และตำแหน่งทางวิชาการของอาจารย์ที่ปรึกษา"
              value={form.advisorName}
              onChange={(e) => set("advisorName", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เอกสารประกอบคำร้อง (หนังสือรับรอง / ใบรับรองแพทย์ / ผลการแข่งขัน) <span className="text-rose-600">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center hover:border-blue-900 hover:bg-slate-50/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                id="doc-upload"
                className="hidden"
                onChange={handleFile}
              />
              <label htmlFor="doc-upload" className="cursor-pointer block">
                <span className="text-xs font-semibold text-blue-900 block">
                  {document ? document.name : "คลิกเพื่อเลือกไฟล์เอกสารแนบ"}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  รองรับไฟล์ PDF, JPG, PNG ขนาดไม่เกิน 10 MB
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนลงนามส่งคำร้อง
            </span>
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? "กำลังนำส่งคำร้อง..." : "ลงนามส่งคำร้องไปยังกองกิจการนิสิต"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
