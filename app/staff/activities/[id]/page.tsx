"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/components/shared/BackButton";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  documentUrl: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  club: { id: string; name: string; sport: string };
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  planned: { label: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-800" },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

async function loadActivity(id: string): Promise<Activity> {
  const res = await fetch(`/api/activities/${encodeURIComponent(id)}`);
  const data = (await res.json().catch(() => null)) as { activity?: Activity; error?: string } | null;
  if (!res.ok || !data?.activity) throw new Error(data?.error ?? "ไม่พบข้อมูลกิจกรรม");
  return data.activity;
}

export default function StaffActivityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadActivity(id)
      .then((result) => {
        if (cancelled) return;
        setActivity(result);
        setPageLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        setPageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{pageLoading ? "กำลังโหลดข้อมูล..." : error || "ไม่พบข้อมูลกิจกรรม"}</p>
      </div>
    );
  }

  const decide = async (status: "approved" | "rejected") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/activities/${encodeURIComponent(activity.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          status === "rejected" ? { status, rejectionReason: rejectReason.trim() } : { status }
        ),
      });
      const data = (await res.json().catch(() => null)) as { activity?: Activity; error?: string } | null;
      if (!res.ok || !data?.activity) throw new Error(data?.error ?? "ดำเนินการไม่สำเร็จ");
      setActivity(data.activity);
      setShowRejectInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = STATUS_LABEL[activity.status] ?? STATUS_LABEL.planned;
  const imageMatches = activity.description
    ? Array.from(activity.description.matchAll(/\/api\/documents\/[a-zA-Z0-9_-]+\/download/g), (m) => m[0])
    : [];
  const cleanDescription = activity.description
    ? activity.description.replace(/\n*\[ภาพถ่ายประกอบกิจกรรม\][\s\S]*$/, "").trim()
    : "-";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <BackButton href="/staff/activities" />
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">

          <div>
            <p className="text-xs text-gray-400 mb-1">{activity.club.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">{activity.title}</h1>
            <p className="text-sm text-gray-500 mt-1">ยื่นเมื่อ {formatDate(activity.createdAt)}</p>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">รายละเอียดกิจกรรม</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-gray-500">วันที่จัดกิจกรรม</span>
                <p className="font-medium text-gray-900 mt-0.5">{formatDate(activity.date)}</p>
              </div>
              <div>
                <span className="text-gray-500">สถานที่</span>
                <p className="font-medium text-gray-900 mt-0.5">{activity.location || "-"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">รายละเอียด</span>
                <p className="font-medium text-gray-900 mt-0.5 whitespace-pre-line">{cleanDescription || "-"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">เอกสารแนบ</h2>
            {activity.documentUrl ? (
              <a
                href={activity.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-blue-800 hover:underline"
              >
                เปิดเอกสารแนบ
              </a>
            ) : (
              <p className="text-sm text-gray-500">ไม่มีเอกสารแนบ</p>
            )}
          </div>

          {imageMatches.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">ภาพถ่ายประกอบกิจกรรม ({imageMatches.length} รูป)</h2>
              <div className="flex flex-wrap gap-3">
                {imageMatches.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-blue-800 hover:underline border border-gray-200"
                  >
                    📷 ดูภาพถ่ายที่ {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg px-3 py-2">{error}</div>
          )}

          {activity.status === "planned" && (
            <div className="border-t border-gray-100 pt-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">ผลการตรวจสอบ</h2>

              {showRejectInput && (
                <div className="mb-3">
                  <textarea
                    className="w-full px-3 py-2.5 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    rows={3}
                    placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3">
                {showRejectInput ? (
                  <>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => decide("rejected")}
                      disabled={!rejectReason.trim() || loading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-medium transition-colors"
                    >
                      {loading ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
                    >
                      ไม่อนุมัติ
                    </button>
                    <button
                      onClick={() => decide("approved")}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium transition-colors"
                    >
                      {loading ? "กำลังบันทึก..." : "อนุมัติกิจกรรม"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activity.status === "approved" && (
            <div className="border-t border-gray-100 pt-5">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <p className="text-green-700 font-medium text-sm">✓ อนุมัติกิจกรรมนี้แล้ว</p>
              </div>
            </div>
          )}

          {activity.status === "rejected" && (
            <div className="border-t border-gray-100 pt-5">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                <p className="text-red-700 font-medium text-sm">✕ ไม่อนุมัติกิจกรรมนี้</p>
                {activity.rejectionReason && (
                  <p className="text-red-500 text-xs mt-1">เหตุผล: {activity.rejectionReason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
