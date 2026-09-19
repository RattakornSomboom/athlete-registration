"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

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
      console.log("submit activity", { ...form, documents, images });
      await new Promise((r) => setTimeout(r, 800));
      router.push("/club/activities");
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.title && form.date && form.location && form.participants && form.description;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/activities" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              บันทึกรายงานผลการดำเนินกิจกรรมของชมรมกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันภายในชมรม / การฝึกซ้อมทดสอบสมรรถภาพ เพื่อประกอบการประเมินเกณฑ์
            </p>
          </div>
          <div className="flex items-center gap-2">
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อโครงการ / กิจกรรม <span className="text-rose-600">*</span>
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
              placeholder="เช่น การแข่งขันกีฬาภายในชมรมเพื่อคัดเลือกตัวแทน ครั้งที่ 1"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่จัดกิจกรรม <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานที่จัดกิจกรรม <span className="text-rose-600">*</span>
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                placeholder="เช่น สนามฟุตบอล 1 มหาวิทยาลัยพะเยา"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              จำนวนนิสิตที่เข้าร่วมกิจกรรม (คน) <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
              placeholder="ระบุจำนวนผู้เข้าร่วมทั้งหมด"
              value={form.participants}
              onChange={(e) => set("participants", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดสรุปผลการจัดกิจกรรม <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none leading-relaxed"
              placeholder="สรุปวัตถุประสงค์ ผลการแข่งขัน การทดสอบสมรรถภาพ และรายชื่อผู้ผ่านเกณฑ์เบื้องต้น..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เอกสารประกอบโครงการ (เช่น โครงการ, บัญชีรายชื่อผู้เข้าร่วม)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleDocuments}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ภาพถ่ายประกอบการดำเนินกิจกรรม (ไฟล์ภาพ)
              </label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={handleImages}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * กิจกรรมที่ส่งจะต้องผ่านการตรวจสอบและอนุมัติจากกองกิจการนิสิต
            </span>
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? "กำลังบันทึกข้อมูล..." : "บันทึกและส่งรายงานกิจกรรม"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
