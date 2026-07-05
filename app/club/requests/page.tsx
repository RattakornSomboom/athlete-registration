"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SpecialRequest = {
  id: string;
  title: string;
  reason: string;
  date: string;
  document: string;
  status: "pending" | "approved" | "rejected";
  rejectedReason?: string;
};

const MOCK_REQUESTS: SpecialRequest[] = [
  {
    id: "1",
    title: "ขอผ่อนผันเกณฑ์ผลงานการแข่งขัน",
    reason: "นักกีฬามีผลงานเกิน 2 ปีย้อนหลังเล็กน้อย แต่มีศักยภาพสูงและเพิ่งกลับจากอาการบาดเจ็บ",
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

export default function ClubRequestsPage() {
  const router = useRouter();
  const [requests] = useState<SpecialRequest[]>(MOCK_REQUESTS);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">← ย้อนกลับ</button>
            <h1 className="text-2xl font-semibold text-gray-900">คำร้องกรณีพิเศษ</h1>
            <p className="text-gray-500 text-sm mt-1">ยื่นคำร้องผ่านอาจารย์ที่ปรึกษาชมรมไปยังกองกิจการนิสิต</p>
          </div>
          <button
            onClick={() => router.push("/club/requests/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + ยื่นคำร้องใหม่
          </button>
        </div>

        <div className="space-y-3">
          {requests.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              ยังไม่มีคำร้อง
            </div>
          )}
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-medium text-gray-900">{r.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[r.status].className}`}>
                  {STATUS_LABEL[r.status].label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{r.reason}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>📅 ยื่นเมื่อ {r.date}</span>
                <span>📄 {r.document}</span>
              </div>
              {r.status === "rejected" && r.rejectedReason && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
                  เหตุผล: {r.rejectedReason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}