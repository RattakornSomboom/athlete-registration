"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type SpecialRequest = {
  id: string;
  clubName: string;
  title: string;
  reason: string;
  advisorName: string;
  date: string;
  document: string;
  status: "pending" | "approved" | "rejected";
};

export default function StaffRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/requests");
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests.map((r: any) => ({
          ...r,
          clubName: r.club.name,
          advisorName: r.club.presidentName || "ไม่ระบุ",
          date: new Date(r.createdAt).toLocaleDateString("th-TH"),
          document: "เอกสารแนบ"
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectReason[id]) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/staff/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectedReason: rejectReason[id] })
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        setShowRejectInput(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-6xl mx-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">คำร้องกรณีพิเศษ</h1>
            <p className="text-gray-500 text-sm mt-1">
              {loading ? "กำลังโหลด..." : `รอพิจารณา ${pendingCount} คำร้อง`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/staff/settings")}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ⚙️ ตั้งค่าระบบ
            </button>
            <LogoutButton />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">ไม่มีคำร้อง</div>
        ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="font-medium text-gray-900">{r.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {r.status === 'approved' ? 'อนุมัติแล้ว' : r.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอพิจารณา'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{r.clubName}</span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{r.reason}</p>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                <span>👤 อาจารย์ที่ปรึกษา: {r.advisorName}</span>
                <span>📅 {r.date}</span>
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 flex items-center gap-2 mb-4">
                <span>📄</span><span>{r.document}</span>
              </div>

              {showRejectInput === r.id && (
                <div className="mb-3">
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                    value={rejectReason[r.id] || ""}
                    onChange={(e) => setRejectReason((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  />
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex gap-2">
                  {showRejectInput === r.id ? (
                    <>
                      <button onClick={() => setShowRejectInput(null)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">ยกเลิก</button>
                      <button onClick={() => handleAction(r.id, "rejected")} disabled={!rejectReason[r.id] || actionLoading === r.id} className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm transition-colors">
                        {actionLoading === r.id ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setShowRejectInput(r.id)} className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่อนุมัติ</button>
                      <button onClick={() => handleAction(r.id, "approved")} disabled={actionLoading === r.id} className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm transition-colors">
                        {actionLoading === r.id ? "กำลังบันทึก..." : "อนุมัติ"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}