"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
            clubName: data.activity.club.name,
            submittedBy: "ประธาน" + data.activity.club.name,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">ไม่พบข้อมูลกิจกรรม</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← ย้อนกลับ
          </button>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${activity.status === 'approved' ? 'bg-green-100 text-green-800' : activity.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {activity.status === 'approved' ? 'อนุมัติแล้ว' : activity.status === 'rejected' ? 'ไม่ผ่าน' : 'รอตรวจสอบ'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

          {/* ชื่อกิจกรรม */}
          <div>
            <p className="text-xs text-gray-400 mb-1">{activity.clubName}</p>
            <h1 className="text-xl font-semibold text-gray-900">{activity.title}</h1>
            <p className="text-sm text-gray-500 mt-1">ยื่นโดย {activity.submittedBy} · {activity.submittedAt}</p>
          </div>

          {/* ข้อมูลกิจกรรม */}
          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">รายละเอียดกิจกรรม</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-gray-500">วันที่จัดกิจกรรม</span>
                <p className="font-medium text-gray-900 mt-0.5">{activity.date}</p>
              </div>
              <div>
                <span className="text-gray-500">จำนวนผู้เข้าร่วม</span>
                <p className="font-medium text-gray-900 mt-0.5">{activity.participants} คน</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">สถานที่</span>
                <p className="font-medium text-gray-900 mt-0.5">{activity.location}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">รายละเอียด</span>
                <p className="font-medium text-gray-900 mt-0.5">{activity.description}</p>
              </div>
              {activity.note && (
                <div className="col-span-2">
                  <span className="text-gray-500">หมายเหตุ</span>
                  <p className="font-medium text-gray-900 mt-0.5">{activity.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* เอกสารแนบ */}
          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">เอกสารและรูปภาพ</h2>
            <div className="space-y-2">
              {activity.documents.map((d: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <span>📄</span>
                  <span>{d}</span>
                </div>
              ))}
              {activity.images.map((img: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <span>🖼️</span>
                  <span>{img}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ปุ่มอนุมัติ/ไม่อนุมัติ */}
          {activity.status === "pending" && (
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
                      onClick={handleReject}
                      disabled={!rejectReason || actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-medium transition-colors"
                    >
                      {actionLoading ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
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
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium transition-colors"
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
                {rejectReason && <p className="text-red-500 text-xs mt-1">เหตุผล: {rejectReason}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}