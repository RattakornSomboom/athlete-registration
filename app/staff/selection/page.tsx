"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Application = {
  id: string;
  sport: string;
  squadType: string | null;
  user: {
    studentId: string;
    profile?: { firstName: string; lastName: string; faculty: string } | null;
  };
  competition: { name: string; sport: string; club: { name: string } };
};

export default function StaffSelectionPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcing, setAnnouncing] = useState(false);
  const [announced, setAnnounced] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/staff/applications?status=STAFF_APPROVED")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAnnounce = async () => {
    if (!confirm(`ยืนยันประกาศผลการคัดเลือก ${applications.length} คน?`)) return;
    setAnnouncing(true);
    try {
      const res = await fetch("/api/staff/applications/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: applications.map((a) => a.id) }),
      });
      const data = await res.json();
      if (res.ok) {
        setCount(data.count);
        setAnnounced(true);
      } else {
        alert(data.error || "ประกาศผลไม่สำเร็จ");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setAnnouncing(false);
    }
  };

  if (announced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">ประกาศผลสำเร็จ</h2>
          <p className="text-gray-500 text-sm mb-6">แจ้งผลการคัดเลือกให้นักกีฬา {count} คนทราบเรียบร้อยแล้ว</p>
          <button onClick={() => router.push("/staff/applications")} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">← ย้อนกลับ</button>
            <h1 className="text-2xl font-semibold text-gray-900">ประกาศผลการคัดเลือก</h1>
            <p className="text-gray-500 text-sm mt-1">
              นักกีฬาที่ผ่านการอนุมัติจากเจ้าหน้าที่ {loading ? "..." : applications.length} คน
            </p>
          </div>
          <LogoutButton />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            ยังไม่มีนักกีฬาที่ผ่านการอนุมัติจากเจ้าหน้าที่
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {applications.map((a, i) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900">
                        {a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.studentId}
                      </span>
                      <span className="text-gray-400 text-sm">#{a.user.studentId}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {a.user.profile?.faculty && `${a.user.profile.faculty} — `}{a.competition.name} ({a.sport})
                    </p>
                    <p className="text-xs text-gray-400">{a.competition.club.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.squadType === "main" ? "bg-green-100 text-green-800" : a.squadType === "reserve" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-800"}`}>
                    {a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ผ่านการคัดเลือก"}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">⚠️ เมื่อกดยืนยัน สถานะของนักกีฬาทั้งหมดจะเปลี่ยนเป็น "ผ่านการคัดเลือก" และไม่สามารถยกเลิกได้</p>
            </div>

            <button
              onClick={handleAnnounce}
              disabled={announcing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg text-sm transition-colors"
            >
              {announcing ? "กำลังประกาศผล..." : `ยืนยันประกาศผล ${applications.length} คน`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}