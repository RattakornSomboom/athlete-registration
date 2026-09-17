"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Activity = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  participants: number;
  documents: string[];
  images: string[];
  status: "pending" | "approved" | "rejected";
  rejectedReason?: string;
};

export default function ClubActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activities")
      .then(res => res.json())
      .then(data => {
        if (data.activities) {
          const mapped = data.activities.map((a: any) => ({
            ...a,
            date: new Date(a.date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }),
            participants: 0,
            documents: [],
            images: []
          }));
          setActivities(mapped);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const approvedCount = activities.filter((a) => a.status === "approved").length;
  const canSubmit = approvedCount >= 2;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">← ย้อนกลับ</button>
            <h1 className="text-2xl font-semibold text-gray-900">ผลงานกิจกรรมชมรม</h1>
            <p className="text-gray-500 text-sm mt-1">
              อนุมัติแล้ว {approvedCount} กิจกรรม
              {!canSubmit && (
                <span className="text-yellow-600 ml-2">⚠️ ต้องมีอย่างน้อย 2 กิจกรรมที่อนุมัติแล้ว</span>
              )}
            </p>
          </div>
          <button
            onClick={() => router.push("/club/activities/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + เพิ่มกิจกรรม   
          </button>
        </div>
        <div className="flex items-center justify-between mb-6">
            <LogoutButton />
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">ความคืบหน้า</span>
            <span className="text-sm font-medium text-gray-900">{approvedCount} / 2 กิจกรรม</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${approvedCount >= 2 ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min((approvedCount / 2) * 100, 100)}%` }}
            />
          </div>
          {canSubmit && (
            <p className="text-green-600 text-xs mt-2 font-medium">✓ ครบเกณฑ์แล้ว สามารถส่งใบสมัครนักกีฬาได้</p>
          )}
        </div>

        {/* Activity Cards */}
        <div className="space-y-4">
          {activities.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              ยังไม่มีกิจกรรม กด + เพิ่มกิจกรรม เพื่อเริ่มต้น
            </div>
          )}
          {activities.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-medium text-gray-900">{a.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'approved' ? 'bg-green-100 text-green-800' : a.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {a.status === 'approved' ? 'อนุมัติแล้ว' : a.status === 'rejected' ? 'ไม่ผ่าน' : 'รอตรวจสอบ'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{a.date} · {a.location}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{a.description}</p>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>👥 ผู้เข้าร่วม {a.participants} คน</span>
                <span>📄 เอกสาร {a.documents.length} ไฟล์</span>
                <span>🖼️ รูปภาพ {a.images.length} รูป</span>
              </div>

              {a.status === "rejected" && a.rejectedReason && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
                  เหตุผล: {a.rejectedReason}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {canSubmit && (
          <div className="mt-6">
            <button
              onClick={() => router.push("/club/athletes")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl text-sm transition-colors"
            >
              ✓ ครบเกณฑ์แล้ว — ไปส่งใบสมัครนักกีฬา
            </button>
          </div>
        )}
      </div>
    </div>
  );
}