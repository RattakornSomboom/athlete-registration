"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";


type Activity = {
  id: string;
  clubName: string;
  title: string;
  date: string;
  location: string;
  description: string;
  participants: number;
  documents: string[];
  images: string[];
  status: "pending" | "approved" | "rejected";
};

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    clubName: "ชมรมฟุตบอล",
    title: "การแข่งขันฟุตบอลภายในชมรม ครั้งที่ 1",
    date: "10 มี.ค. 2568",
    location: "สนามฟุตบอล มหาวิทยาลัยพะเยา",
    description: "จัดการแข่งขันฟุตบอลภายในชมรมเพื่อคัดเลือกนักกีฬาตัวแทน มีผู้เข้าร่วม 22 คน",
    participants: 22,
    documents: ["เอกสารรับรอง_กิจกรรม1.pdf"],
    images: ["รูปกิจกรรม1_1.jpg", "รูปกิจกรรม1_2.jpg"],
    status: "pending",
  },
  {
    id: "2",
    clubName: "ชมรมบาสเกตบอล",
    title: "การแข่งขันบาสเกตบอลภายในชมรม ครั้งที่ 1",
    date: "15 มี.ค. 2568",
    location: "โรงยิม มหาวิทยาลัยพะเยา",
    description: "จัดการแข่งขันบาสเกตบอลภายในชมรม",
    participants: 15,
    documents: ["เอกสารรับรอง_บาส1.pdf"],
    images: ["รูปบาส1.jpg"],
    status: "approved",
  },
];

const STATUS_LABEL = {
  pending: { label: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-800" },
};

export default function StaffActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setActivities((prev) => prev.map((a) => a.id === id ? { ...a, status: "approved" } : a));
  };

  const handleReject = (id: string) => {
    setActivities((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" } : a));
    setShowRejectInput(null);
  };

  const pendingCount = activities.filter((a) => a.status === "pending").length;

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
              กิจกรรมรอการตรวจสอบและอนุมัติ {pendingCount} รายการ
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

        <div className="space-y-4">
          {activities.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-medium text-gray-900">{a.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[a.status].className}`}>
                      {STATUS_LABEL[a.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{a.clubName} · {a.date} · {a.location}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{a.description}</p>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                <span>👥 ผู้เข้าร่วม {a.participants} คน</span>
                <span>📄 เอกสาร {a.documents.length} ไฟล์</span>
                <span>🖼️ รูปภาพ {a.images.length} รูป</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                {a.documents.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📄</span><span>{d}</span>
                  </div>
                ))}
                {a.images.map((img, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🖼️</span><span>{img}</span>
                  </div>
                ))}
              </div>

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

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push(`/staff/activities/${a.id}`)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                >
                  ดูรายละเอียด →
                </button>

                {a.status === "pending" && (
                  <div className="flex gap-2">
                    {showRejectInput === a.id ? (
                      <>
                        <button onClick={() => setShowRejectInput(null)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">ยกเลิก</button>
                        <button onClick={() => handleReject(a.id)} disabled={!rejectReason[a.id]} className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm transition-colors">ยืนยันไม่อนุมัติ</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setShowRejectInput(a.id)} className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่อนุมัติ</button>
                        <button onClick={() => handleApprove(a.id)} className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">อนุมัติ</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}