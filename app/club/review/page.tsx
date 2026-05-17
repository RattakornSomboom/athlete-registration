"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const APPROVED_ATHLETES = [
  { id: "3", firstName: "มานะ", lastName: "สู้งาน", studentId: "65027001", faculty: "บริหาร", sport: "ฟุตบอล", position: "ผู้รักษาประตู", experience: "มากกว่า 5 ปี", achievement: "เหรียญทองกีฬาแห่งชาติ" },
];

export default function ClubReviewPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">ส่งข้อมูลสำเร็จ</h2>
          <p className="text-gray-500 text-sm mb-6">ส่งรายชื่อนักกีฬาให้กิจการนิสิตเรียบร้อยแล้ว</p>
          <button onClick={() => router.push("/club/athletes")} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
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
          <h1 className="text-2xl font-semibold text-gray-900">ส่งรายชื่อให้กิจการนิสิต</h1>
          <p className="text-gray-500 text-sm mt-1">นักกีฬาที่ผ่านการคัดเลือกจากชมรม {APPROVED_ATHLETES.length} คน</p>
        </div>

        <div className="space-y-3 mb-6">
          {APPROVED_ATHLETES.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{a.firstName} {a.lastName}</span>
                <span className="text-gray-400 text-sm">#{a.studentId}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">ผ่านการคัดเลือก</span>
              </div>
              <p className="text-sm text-gray-500">{a.faculty} — {a.sport} ({a.position})</p>
              {a.achievement && <p className="text-sm text-gray-500">ผลงาน: {a.achievement}</p>}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors"
        >
          {loading ? "กำลังส่งข้อมูล..." : `ยืนยันส่งรายชื่อ ${APPROVED_ATHLETES.length} คน`}
        </button>
      </div>
    </div>
  );
}