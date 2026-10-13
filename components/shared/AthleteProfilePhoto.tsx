"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { documentId, documentReference } from "@/lib/athlete-document-policy";
import { fetchJson } from "@/lib/http-client";
import { useRequestAction } from "@/components/shared/RequestState";

function Portrait({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-36 w-28 items-center justify-center overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 text-center shadow-xs">
      {src && !failed ? (
        <Image src={src} alt={`รูปถ่ายของ ${name}`} width={112} height={144} unoptimized referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover object-top" />
      ) : (
        <p role="status" className="px-2 text-xs text-slate-500">{failed ? "โหลดรูปไม่ได้ กรุณาลองใหม่หรือเข้าสู่ระบบอีกครั้ง" : "ยังไม่มีรูปถ่ายที่บันทึกไว้"}</p>
      )}
    </div>
  );
}

export default function AthleteProfilePhoto({ studentId, name, photoUrl, onSaved, disabled = false }: {
  studentId: string;
  name: string;
  photoUrl?: string | null;
  onSaved: (reference: string) => void;
  disabled?: boolean;
}) {
  const action = useRequestAction();
  const [selection, setSelection] = useState<{ file: File; preview: string } | null>(null);
  const [fileError, setFileError] = useState("");
  const [retry, setRetry] = useState(0);
  const storedId = documentId(photoUrl);
  const preview = selection?.preview;
  const src = preview ?? (storedId ? documentReference(storedId) : null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(file?: File) {
    if (!file) return;
    setFileError("");
    if (!["image/jpeg", "image/png"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      setFileError("รองรับรูป JPEG/PNG ขนาดไม่เกิน 5 MB เท่านั้น");
      return;
    }
    setSelection({ file, preview: URL.createObjectURL(file) });
  }

  function save() {
    if (!selection) return;
    void action.run(async () => {
      const form = new FormData();
      form.set("file", selection.file);
      const uploaded = await fetchJson<{ document: { id: string } }>("/api/documents", { method: "POST", body: form });
      const reference = documentReference(uploaded.document.id);
      await fetchJson("/api/athletes/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, photoUrl: reference }),
      });
      onSaved(reference);
      setSelection(null);
    }, "บันทึกรูปประจำตัวแล้ว");
  }

  return (
    <div className="flex w-full shrink-0 flex-col items-center gap-2 sm:w-44">
      <Portrait key={`${src ?? "empty"}:${retry}`} src={src ? `${src}${preview ? "" : `?v=${retry}`}` : null} name={name} />
      <p className="text-xs text-slate-500">รูปถ่ายชุดนิสิต ขนาด 1 นิ้ว</p>
      <label className="w-full text-center text-xs font-medium text-blue-900">
        เลือกรูปประจำตัว (JPEG/PNG)
        <input type="file" accept="image/jpeg,image/png" disabled={disabled || action.busy} className="mt-2 w-full text-xs" onChange={event => { choose(event.target.files?.[0]); event.target.value = ""; }} />
      </label>
      {selection && <>
        <p className="max-w-full break-all text-xs text-slate-500">ภาพตัวอย่าง: {selection.file.name} — ยังไม่บันทึก</p>
        <button type="button" disabled={disabled || action.busy} onClick={save} className="rounded-lg bg-blue-900 px-3 py-2 text-xs text-white disabled:opacity-50">{action.busy ? "กำลังบันทึกรูป…" : "บันทึกรูปประจำตัว"}</button>
        <button type="button" disabled={disabled || action.busy} onClick={() => setSelection(null)} className="text-xs text-slate-600 underline">ยกเลิกรูปที่เลือก</button>
      </>}
      {storedId && !selection && <button type="button" onClick={() => setRetry(value => value + 1)} className="text-xs text-slate-500 underline">โหลดรูปใหม่</button>}
      {fileError && <p role="alert" className="text-xs text-red-700">{fileError}</p>}
      {action.error && <p role="alert" className="text-xs text-red-700">{action.error}</p>}
      {!selection && action.success && <p role="status" className="text-xs text-green-700">{action.success}</p>}
      {!storedId && !selection && <p className="text-xs text-slate-500">หากเคยแนบรูปตอนสมัครบัญชี กรุณาเลือกและบันทึกอีกครั้ง ระบบเดิมเก็บเพียงชื่อไฟล์</p>}
    </div>
  );
}
