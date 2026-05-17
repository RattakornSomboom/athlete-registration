"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SELECTED_ATHLETES = [
  { id: "3", firstName: "นภา", lastName: "ฟ้าใส", studentId: "66045002", faculty: "มนุษยศาสตร์", sport: "วอลเลย์บอล", position: "ตัวรับ", club: "ชมรมวอลเลย์บอล" },
];

export default function StaffSelectionPage() {
  const router = useRouter();
  const [announced, setAnnounced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnnounce = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setAnnounced(true);
    setLoading(false);
  };

  if (announced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">ประกาศผลสำเร็จ</h2>
          <p className="text-gray-500 text-sm mb-6">แจ้งผลการคัดเลือกให้นักกีฬาทราบเรียบร้อยแล้ว</p>
          <button onClick={() => router.push("/staff/applications")} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">← ย้อนกลับ</button>
          <h1 className="text-2xl font-semibold text-gray-900">ประกาศผลการคัดเลือก</h1>
          <p className="text-gray-500 text-sm mt-1">นักกีฬาที่ผ่านการคัดเลือก {SELECTED_ATHLETES.length} คน</p>
        </div>

        <div className="space-y-3 mb-6">
          {SELECTED_ATHLETES.map((a, i) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-gray-900">{a.firstName} {a.lastName}</span>
                  <span className="text-gray-400 text-sm">#{a.studentId}</span>
                </div>
                <p className="text-sm text-gray-500">{a.faculty} — {a.sport} ({a.position})</p>
                <p className="text-xs text-gray-400">{a.club}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">ผ่านการคัดเลือก</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleAnnounce}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg text-sm transition-colors"
        >
          {loading ? "กำลังประกาศผล..." : `ยืนยันประกาศผล ${SELECTED_ATHLETES.length} คน`}
        </button>
      </div>
    </div>
  );
}