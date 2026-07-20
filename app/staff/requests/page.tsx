"use client";

import { useState } from "react";
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

const MOCK_REQUESTS: SpecialRequest[] = [
  {
    id: "1",
    clubName: "ชมรมฟุตบอล",
    title: "ขอผ่อนผันเกณฑ์ผลงานการแข่งขัน",
    reason: "นักกีฬามีผลงานเกิน 2 ปีย้อนหลังเล็กน้อย แต่มีศักยภาพสูงและเพิ่งกลับจากอาการบาดเจ็บ",
    advisorName: "อาจารย์สมศักดิ์ ดีใจ",
    date: "15 พ.ค. 2568",
    document: "หนังสือร้องขอ_001.pdf",
    status: "pending",
  },
];

const STATUS_LABEL = {
  pending: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-red-100 text-red-800" },
};

export default function StaffRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SpecialRequest[]>(MOCK_REQUESTS);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const handleApprove = (id: string) =>
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
    setShowRejectInput(null);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-6xl mx-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">คำร้องกรณีพิเศษ</h1>
            <p className="text-gray-500 text-sm mt-1">รอพิจารณา {pendingCount} คำร้อง</p>
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

        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="font-medium text-gray-900">{r.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[r.status].className}`}>
                  {STATUS_LABEL[r.status].label}
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
                      <button onClick={() => handleReject(r.id)} disabled={!rejectReason[r.id]} className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm transition-colors">ยืนยันไม่อนุมัติ</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setShowRejectInput(r.id)} className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่อนุมัติ</button>
                      <button onClick={() => handleApprove(r.id)} className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">อนุมัติ</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}