"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import ThaiDateInput from "@/components/shared/ThaiDateInput";

export default function NewActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState("");
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
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    if (selected.some((file) => !["image/jpeg", "image/png"].includes(file.type))) {
      setSubmitError("ภาพถ่ายต้องเป็นไฟล์ JPG หรือ PNG เท่านั้น");
      e.target.value = "";
      return;
    }
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      setSubmitError("ภาพถ่ายแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB");
      e.target.value = "";
      return;
    }
    if (images.length + selected.length > 5) {
      setSubmitError(`แนบภาพถ่ายประกอบกิจกรรมได้สูงสุด 5 รูป (เลือกแล้ว ${images.length} รูป)`);
      e.target.value = "";
      return;
    }
    setSubmitError("");
    setImages((previous) => [...previous, ...selected]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError("");
    try {
      if (!documents[0]) throw new Error("กรุณาแนบเอกสารประกอบกิจกรรม");
      if (images.length === 0) throw new Error("กรุณาแนบภาพถ่ายประกอบการดำเนินกิจกรรมอย่างน้อย 1 รูป");
      if (images.length > 5) throw new Error("แนบภาพถ่ายประกอบการดำเนินกิจกรรมได้ไม่เกิน 5 รูป");
      const formData = new FormData();
      formData.append("file", documents[0]);
      const upload = await fetch("/api/documents", { method: "POST", body: formData });
      const uploaded = (await upload.json()) as { document?: { id: string }; error?: string };
      if (!upload.ok || !uploaded.document?.id) {
        throw new Error(uploaded.error || "อัปโหลดเอกสารประกอบกิจกรรมไม่สำเร็จ");
      }
      const imageUrls: string[] = [];
      for (const image of images) {
        const imageForm = new FormData();
        imageForm.append("file", image);
        const imageUpload = await fetch("/api/documents", { method: "POST", body: imageForm });
        const imageUploaded = (await imageUpload.json()) as { document?: { id: string }; error?: string };
        if (!imageUpload.ok || !imageUploaded.document?.id) {
          throw new Error(imageUploaded.error || `อัปโหลดภาพ ${image.name} ไม่สำเร็จ`);
        }
        imageUrls.push(`/api/documents/${imageUploaded.document.id}/download`);
      }
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date,
          location: form.location,
          description: `${form.description}\n(จำนวนผู้เข้าร่วม: ${form.participants} คน)${form.note ? `\nหมายเหตุ: ${form.note}` : ""}`,
          documentUrl: `/api/documents/${uploaded.document.id}/download`,
          imageUrls,
          status: "planned",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "บันทึกรายงานกิจกรรมไม่สำเร็จ");
      router.push("/club/activities");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.title && form.date && form.location && form.participants && form.description && documents.length > 0 && images.length >= 1 && images.length <= 5;

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
              <ThaiDateInput
                id="activity-date"
                value={form.date}
                onChange={(value) => set("date", value)}
                required
                compact
                ariaLabel="วันที่จัดกิจกรรม"
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
                ภาพถ่ายประกอบการดำเนินกิจกรรม (1–5 รูป รูปละไม่เกิน 5 MB) <span className="text-rose-600">*</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png"
                disabled={loading || images.length >= 5}
                onChange={handleImages}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                เลือกภาพถ่ายได้ 1–5 รูป (JPG หรือ PNG ขนาดไม่เกิน 5 MB ต่อรูป) {images.length > 0 && `(เลือกแล้ว ${images.length}/5 รูป)`}
              </p>
              {images.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {images.map((image, index) => (
                    <li key={`${image.name}-${image.size}-${index}`} className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                      <span className="truncate">📷 รูปที่ {index + 1}: {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <button type="button" disabled={loading} onClick={() => removeImage(index)} className="shrink-0 text-xs font-medium text-rose-700 hover:underline disabled:opacity-50">ลบ</button>
                    </li>
                  ))}
                </ul>
              )}
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
          {submitError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{submitError}</p>}

        </div>

      </div>
    </div>
  );
}
