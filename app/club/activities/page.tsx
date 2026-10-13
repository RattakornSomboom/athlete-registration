"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

type Activity = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  participants: number;
  documents: string[];
  images: string[];
  status: "pending" | "approved" | "rejected";
  rejectedReason?: string;
};

type ActivityRow = {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  description?: string | null;
  participants?: number | null;
  documentUrl?: string | null;
  status?: string;
  rejectionReason?: string;
};

const STATUS_LABEL = {
  pending: { label: "รอการตรวจสอบ", className: "bg-slate-100 text-slate-700 border-slate-200" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "ไม่ผ่านเกณฑ์", className: "bg-rose-50 text-rose-800 border-rose-200" },
};

export default function ClubActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let current = true;
    const loadActivities = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/activities");
        const data = (await response.json()) as { activities?: ActivityRow[]; error?: string };
        if (!response.ok) throw new Error(data.error || "ไม่สามารถโหลดข้อมูลกิจกรรมได้");
        if (!Array.isArray(data.activities)) throw new Error("รูปแบบข้อมูลกิจกรรมไม่ถูกต้อง");
        if (!current) return;
        setActivities(data.activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          date: new Date(activity.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
          location: activity.location || "-",
          description: activity.description || "",
          participants: activity.participants || 0,
          documents: activity.documentUrl ? [activity.documentUrl] : [],
          images: [],
          status: activity.status === "approved" ? "approved" : activity.status === "rejected" ? "rejected" : "pending",
          rejectedReason: activity.rejectionReason,
        })));
      } catch (error) {
        if (current) setLoadError(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลกิจกรรมได้");
      } finally {
        if (current) setIsLoading(false);
      }
    };
    void loadActivities();
    return () => {
      current = false;
    };
  }, []);

  const approvedCount = activities.filter((a) => a.status === "approved").length;
  const canSubmit = approvedCount >= 2;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/competitions" />
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การรายงานผลการดำเนินกิจกรรมของชมรมกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              กิจกรรมที่ผ่านการอนุมัติแล้ว {approvedCount} กิจกรรม
              {!canSubmit && (
                <span className="text-slate-600 font-medium ml-2">(เกณฑ์ขั้นต่ำ: ต้องมีกิจกรรมที่ผ่านการอนุมัติอย่างน้อย 2 กิจกรรม)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/activities/new")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + บันทึกกิจกรรมใหม่
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">ความพร้อมตามเกณฑ์กิจกรรมชมรม</span>
            <span className="text-xs font-bold text-slate-900">{approvedCount} / 2 กิจกรรม</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${approvedCount >= 2 ? "bg-emerald-800" : "bg-blue-900"}`}
              style={{ width: `${Math.min((approvedCount / 2) * 100, 100)}%` }}
            />
          </div>
          {canSubmit && (
            <p className="text-emerald-800 text-xs mt-2 font-medium">✓ ครบเกณฑ์แล้ว สามารถส่งใบสมัครนักกีฬาได้</p>
          )}
        </div>

        {/* Activity Cards */}
        <div className="space-y-4">
          {loadError && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {loadError}
            </div>
          )}
          {isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-xs">
              กำลังโหลดข้อมูลกิจกรรม...
            </div>
          )}
          {!isLoading && !loadError && activities.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              ยังไม่มีรายงานกิจกรรม กด + บันทึกกิจกรรมใหม่ เพื่อเริ่มต้น
            </div>
          )}
          {activities.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm">{a.title}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                      a.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : a.status === "rejected"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {STATUS_LABEL[a.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{a.date} · {a.location}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {a.description.replace(/\n*\[ภาพถ่ายประกอบกิจกรรม\][\s\S]*$/, "").trim()}
              </p>

              {a.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {a.images.map((imgUrl, i) => (
                    <a
                      key={imgUrl}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-800 hover:underline bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                    >
                      📷 ภาพที่ {i + 1}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>ผู้เข้าร่วม {a.participants} คน</span>
                <span>เอกสารประกอบ {a.documents.length} ฉบับ</span>
                <span>ภาพถ่าย {a.images.length} ภาพ</span>
              </div>

              {a.status === "rejected" && a.rejectedReason && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  <strong>เหตุผลที่ไม่อนุมัติ:</strong> {a.rejectedReason}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {canSubmit && (
          <div className="mt-6">
            <button
              onClick={() => router.push("/club/competitions")}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              ครบตามเกณฑ์กิจกรรมแล้ว — ดำเนินการคัดเลือกและจัดทำบัญชีรายชื่อนักกีฬา
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
