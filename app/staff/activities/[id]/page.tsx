"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  planned: { label: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "ไม่ผ่าน", className: "bg-rose-100 text-rose-800" },
};

export default function StaffActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetch(`/api/activities/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.activity) {
          setActivity({
            ...data.activity,
            clubName: data.activity.club?.name || "ไม่ทราบชื่อชมรม",
            submittedBy: "ประธานชมรม " + (data.activity.club?.name || ""),
            submittedAt: new Date(data.activity.createdAt).toLocaleDateString("th-TH"),
            date: new Date(data.activity.date).toLocaleDateString("th-TH"),
            participants: 0,
            documents: [],
            images: [],
            note: ""
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <p className="text-slate-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <p className="text-slate-500">ไม่พบข้อมูลกิจกรรม</p>
      </div>
    );
  }

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      });
      if (res.ok) {
        setActivity((prev: any) => ({ ...prev, status: "approved" }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectionReason: rejectReason })
      });
      if (res.ok) {
        setActivity((prev: any) => ({ ...prev, status: "rejected", rejectionReason: rejectReason }));
        setShowRejectInput(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const s = STATUS_LABEL[activity.status] || { label: activity.status, className: "bg-slate-100 text-slate-600" };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-full lg:max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            ← ย้อนกลับ
          </button>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${s.className}`}>
            {s.label}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

          {/* ชื่อกิจกรรม */}
          <div>
            <p className="text-xs text-slate-400 mb-1">{activity.clubName}</p>
            <h1 className="text-xl font-bold text-slate-900">{activity.title}</h1>
            <p className="text-sm text-slate-500 mt-1">ยื่นโดย {activity.submittedBy} · {activity.submittedAt}</p>
          </div>

          {/* ข้อมูลกิจกรรม */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">รายละเอียดกิจกรรม</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-slate-500">วันที่จัดกิจกรรม</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activity.date}</p>
              </div>
              <div>
                <span className="text-slate-500">จำนวนผู้เข้าร่วม</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activity.participants} คน</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">สถานที่</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activity.location || "-"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">รายละเอียด</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activity.description || "-"}</p>
              </div>
              {activity.note && (
                <div className="col-span-2">
                  <span className="text-slate-500">หมายเหตุ</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{activity.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* เอกสารแนบ */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">เอกสารและรูปภาพ</h2>
            <div className="space-y-2">
              {activity.documents && activity.documents.length > 0 ? activity.documents.map((d: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700">
                  <span>📄</span>
                  <span>{d}</span>
                </div>
              )) : <div className="text-sm text-slate-400">ไม่มีเอกสารแนบ</div>}
              {activity.images && activity.images.length > 0 ? activity.images.map((img: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700">
                  <span>🖼️</span>
                  <span>{img}</span>
                </div>
              )) : null}
            </div>
          </div>

          {/* ปุ่มอนุมัติ/ไม่อนุมัติ */}
          {activity.status === "planned" && (
            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">ผลการตรวจสอบ</h2>

              {showRejectInput && (
                <div className="mb-3">
                  <textarea
                    className="w-full px-3 py-2.5 rounded-lg border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
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
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason || actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      {actionLoading ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-rose-200 text-rose-600 text-sm hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      ไม่อนุมัติ
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      {actionLoading ? "กำลังบันทึก..." : "อนุมัติกิจกรรม"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ผลอนุมัติแล้ว */}
          {activity.status === "approved" && (
            <div className="border-t border-slate-100 pt-5">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-emerald-700 font-medium text-sm">✓ อนุมัติกิจกรรมนี้แล้ว</p>
              </div>
            </div>
          )}

          {activity.status === "rejected" && (
            <div className="border-t border-slate-100 pt-5">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                <p className="text-rose-700 font-medium text-sm">✕ ไม่อนุมัติกิจกรรมนี้</p>
                {activity.rejectionReason && <p className="text-rose-500 text-xs mt-1">เหตุผล: {activity.rejectionReason}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}