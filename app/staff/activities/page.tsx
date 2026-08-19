"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: string;
  rejectionReason: string | null;
  club: { id: string; name: string; sport: string };
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  planned:  { label: "รอการรับรอง", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "อนุมัติแล้ว",  className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่ผ่าน",      className: "bg-red-100 text-red-800" },
};

export default function StaffActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data.activities ?? []);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectReason[id]) {
      alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "rejected" && { rejectionReason: rejectReason[id] }),
        }),
      });
      if (res.ok) {
        setShowRejectInput(null);
        await fetchActivities();
      } else {
        const data = await res.json();
        alert(data.error || "ดำเนินการไม่สำเร็จ");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = activities.filter((a) => a.status === "planned").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ตรวจสอบกิจกรรมชมรม</h1>
            <p className="text-gray-500 text-sm mt-1">
              {loading ? "กำลังโหลด..." : `รอตรวจสอบ ${pendingCount} กิจกรรม · ทั้งหมด ${activities.length} กิจกรรม`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/staff/applications")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">← ใบสมัคร</button>
            <LogoutButton />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">ยังไม่มีกิจกรรมที่ส่งมา</div>
        ) : (
          <div className="space-y-4">
            {activities.map((a) => {
              const s = STATUS_LABEL[a.status] ?? { label: a.status, className: "bg-gray-100 text-gray-600" };
              const isLoading = actionLoading === a.id;
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="font-medium text-gray-900">{a.title}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {a.club.name} · {new Date(a.date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                        {a.location && ` · ${a.location}`}
                      </p>
                    </div>
                  </div>

                  {a.description && <p className="text-sm text-gray-600 mb-3">{a.description}</p>}

                  {a.rejectionReason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3 text-sm text-red-700">
                      เหตุผลที่ไม่อนุมัติ: {a.rejectionReason}
                    </div>
                  )}

                  {/* Reject reason input */}
                  {showRejectInput === a.id && (
                    <div className="mb-3">
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                        value={rejectReason[a.id] || ""}
                        onChange={(e) => setRejectReason((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      />
                    </div>
                  )}

                  {a.status === "planned" && (
                    <div className="flex gap-2">
                      {showRejectInput === a.id ? (
                        <>
                          <button onClick={() => setShowRejectInput(null)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">ยกเลิก</button>
                          <button
                            onClick={() => handleAction(a.id, "rejected")}
                            disabled={isLoading || !rejectReason[a.id]}
                            className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm transition-colors"
                          >
                            {isLoading ? "กำลังดำเนินการ..." : "ยืนยันไม่อนุมัติ"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setShowRejectInput(a.id)} className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่อนุมัติ</button>
                          <button
                            onClick={() => handleAction(a.id, "approved")}
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm transition-colors"
                          >
                            {isLoading ? "กำลังดำเนินการ..." : "อนุมัติ"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}