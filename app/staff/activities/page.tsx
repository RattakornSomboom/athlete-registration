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
  planned:  { label: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-800" },
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การตรวจสอบและอนุมัติกิจกรรมของชมรมกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              {loading ? "กำลังโหลดข้อมูล..." : `กิจกรรมรอการตรวจสอบและอนุมัติ ${pendingCount} รายการ · ทั้งหมด ${activities.length} รายการ`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แดชบอร์ดวิเคราะห์ผล
            </button>
            <button
              onClick={() => router.push("/staff/applications")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ใบสมัครนักกีฬา
            </button>
            <button
              onClick={() => router.push("/staff/settings")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ตั้งค่าระบบ
            </button>
            <LogoutButton />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">กำลังโหลด...</div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm shadow-xs">ยังไม่มีกิจกรรมที่ส่งมา</div>
        ) : (
          <div className="space-y-4">
            {activities.map((a) => {
              const s = STATUS_LABEL[a.status] ?? { label: a.status, className: "bg-slate-100 text-slate-600" };
              const isLoading = actionLoading === a.id;
              return (
                <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="font-medium text-slate-900">{a.title}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {a.club.name} · {new Date(a.date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                        {a.location && ` · ${a.location}`}
                      </p>
                    </div>
                  </div>

                  {a.description && <p className="text-sm text-slate-600 mb-3">{a.description}</p>}

                  {a.rejectionReason && (
                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 mb-3 text-sm text-rose-700">
                      เหตุผลที่ไม่อนุมัติ: {a.rejectionReason}
                    </div>
                  )}

                  {/* Reject reason input */}
                  {showRejectInput === a.id && (
                    <div className="mb-3">
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                        placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                        value={rejectReason[a.id] || ""}
                        onChange={(e) => setRejectReason((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => router.push(`/staff/activities/${a.id}`)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      ดูรายละเอียด →
                    </button>

                    {a.status === "planned" && (
                      <div className="flex gap-2">
                        {showRejectInput === a.id ? (
                          <>
                            <button onClick={() => setShowRejectInput(null)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer">ยกเลิก</button>
                            <button
                              onClick={() => handleAction(a.id, "rejected")}
                              disabled={isLoading || !rejectReason[a.id]}
                              className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-sm transition-colors cursor-pointer"
                            >
                              {isLoading ? "กำลังดำเนินการ..." : "ยืนยันไม่อนุมัติ"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setShowRejectInput(a.id)} className="flex-1 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-sm hover:bg-rose-50 transition-colors cursor-pointer">ไม่อนุมัติ</button>
                            <button
                              onClick={() => handleAction(a.id, "approved")}
                              disabled={isLoading}
                              className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm transition-colors cursor-pointer"
                            >
                              {isLoading ? "กำลังดำเนินการ..." : "อนุมัติ"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}