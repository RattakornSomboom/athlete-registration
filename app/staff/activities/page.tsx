"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
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
  pending: { label: "รอการตรวจสอบ", className: "bg-slate-100 text-slate-700 border-slate-200" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-rose-50 text-rose-800 border-rose-200" },
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
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/staff/applications" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
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
          </div>
        </div>

        <div className="space-y-4">
          {activities.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm">{a.title}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${STATUS_LABEL[a.status].className}`}>
                      {STATUS_LABEL[a.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{a.clubName} · {a.date} · {a.location}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>ผู้เข้าร่วม {a.participants} คน</span>
                <span>เอกสารประกอบ {a.documents.length} ฉบับ</span>
                <span>ภาพถ่าย {a.images.length} ภาพ</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1 text-xs text-slate-700">
                {a.documents.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">เอกสาร:</span>
                    <span className="font-medium text-slate-900">{d}</span>
                  </div>
                ))}
                {a.images.map((img, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">ไฟล์ภาพ:</span>
                    <span className="font-medium text-slate-900">{img}</span>
                  </div>
                ))}
              </div>

              {showRejectInput === a.id && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">ระบุเหตุผลที่ไม่อนุมัติ</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="ระบุเหตุผล เช่น เอกสารไม่ครบถ้วน หรือไม่เป็นไปตามเกณฑ์โครงการ..."
                    value={rejectReason[a.id] || ""}
                    onChange={(e) => setRejectReason((prev) => ({ ...prev, [a.id]: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => router.push(`/staff/activities/${a.id}`)}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ดูรายละเอียดกิจกรรม →
                </button>

                {a.status === "pending" && (
                  <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                    {showRejectInput === a.id ? (
                      <>
                        <button
                          onClick={() => setShowRejectInput(null)}
                          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          disabled={!rejectReason[a.id]}
                          className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          ยืนยันไม่อนุมัติ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowRejectInput(a.id)}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          ไม่อนุมัติ
                        </button>
                        <button
                          onClick={() => handleApprove(a.id)}
                          className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          อนุมัติกิจกรรม
                        </button>
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
