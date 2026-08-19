"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  status: string;
  sport: string;
  user: {
    studentId: string;
    profile?: { firstName: string; lastName: string; faculty: string } | null;
  };
  competition: { name: string; sport: string };
};

export default function ClubReviewPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("club");
    if (stored) {
      const club = JSON.parse(stored);
      setClubId(club.id);
    }
  }, []);

  useEffect(() => {
    if (!clubId) return;
    fetch(`/api/clubs/${clubId}/athletes?status=CLUB_APPROVED`)
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">ส่งข้อมูลสำเร็จ</h2>
          <p className="text-gray-500 text-sm mb-6">ส่งรายชื่อนักกีฬาให้กองกิจการนิสิตเรียบร้อยแล้ว เจ้าหน้าที่จะพิจารณาในขั้นตอนต่อไป</p>
          <button onClick={() => router.push("/club/athletes")} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-6xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">← ย้อนกลับ</button>
          <h1 className="text-2xl font-semibold text-gray-900">ส่งรายชื่อให้กองกิจการนิสิต</h1>
          <p className="text-gray-500 text-sm mt-1">นักกีฬาที่ผ่านการคัดเลือกจากชมรม {loading ? "..." : applications.length} คน</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            ยังไม่มีนักกีฬาที่ผ่านการอนุมัติ กรุณาอนุมัติใบสมัครในหน้านักกีฬาก่อน
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {applications.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.studentId}
                    </span>
                    <span className="text-gray-400 text-sm">#{a.user.studentId}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">ผ่านการคัดเลือก</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {a.user.profile?.faculty && `${a.user.profile.faculty} — `}{a.competition.name} ({a.sport})
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">⚠️ เมื่อกดยืนยัน รายชื่อทั้งหมดจะถูกส่งให้เจ้าหน้าที่กองกิจการนิสิตพิจารณาในขั้นตอนต่อไป</p>
            </div>

            <button
              onClick={() => setSubmitted(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg text-sm transition-colors"
            >
              ยืนยันส่งรายชื่อ {applications.length} คน
            </button>
          </>
        )}
      </div>
    </div>
  );
}