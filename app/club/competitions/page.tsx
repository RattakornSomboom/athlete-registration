"use client";

import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Competition = {
  id: string;
  sport: string;
  eventName: string; // รายการแข่งย่อย เช่น "ฟุตบอล 7 คน"
  category: string;
  round: "qualifier" | "final";
  totalApplicants: number;
  pendingCount: number;
  isOpen: boolean;
};

// TODO: ดึงจาก database จริงตอน Backend พร้อม
// สมมติ login เป็นประธานชมรมฟุตบอล ระบบจะ filter แสดงแค่รายการของชมรมตัวเอง (ฟุตบอล)
const MOCK_CLUB_SPORT = "ฟุตบอล";

const MOCK_COMPETITIONS: Competition[] = [
  { id: "1", sport: "ฟุตบอล", eventName: "ฟุตบอล 11 คน", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 22, pendingCount: 8, isOpen: true },
  { id: "2", sport: "ฟุตบอล", eventName: "ฟุตบอล 7 คน", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 10, pendingCount: 3, isOpen: true },
  { id: "3", sport: "บาสเกตบอล", eventName: "บาสเกตบอล 5 คน", category: "กีฬาบังคับ", round: "final", totalApplicants: 12, pendingCount: 0, isOpen: true },
  { id: "4", sport: "บาสเกตบอล", eventName: "บาสเกตบอล 3x3", category: "กีฬาบังคับ", round: "final", totalApplicants: 6, pendingCount: 0, isOpen: true },
];

const ROUND_LABEL = { qualifier: "รอบคัดเลือก", final: "รอบมหกรรม" };

export default function ClubCompetitionsPage() {
  const router = useRouter();

  // filter เฉพาะรายการของกีฬาที่ชมรมนี้รับผิดชอบ
  const clubCompetitions = MOCK_COMPETITIONS.filter((c) => c.sport === MOCK_CLUB_SPORT);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">รายการแข่งขัน</h1>
            <p className="text-gray-500 text-sm mt-1">ชมรม{MOCK_CLUB_SPORT} — กีฬามหาวิทยาลัยฯ ครั้งที่ 52</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/club/activities")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">📋 กิจกรรมชมรม</button>
            <button onClick={() => router.push("/club/requests")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">📝 คำร้องพิเศษ</button>
            <LogoutButton />
          </div>
        </div>

        <div className="space-y-3">
          {clubCompetitions.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              ยังไม่มีรายการแข่งขันสำหรับชมรมนี้
            </div>
          )}
          {clubCompetitions.map((c) => (
            <button
              key={c.id}
              onClick={() => c.isOpen && router.push(`/club/competitions/${c.id}`)}
              disabled={!c.isOpen}
              className={`w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-colors ${c.isOpen ? "hover:border-blue-300 hover:shadow-md cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-medium text-gray-900">{c.eventName}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{c.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{ROUND_LABEL[c.round]}</span>
                    {!c.isOpen && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">ปิดรับสมัคร</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    ผู้สมัครทั้งหมด {c.totalApplicants} คน
                    {c.pendingCount > 0 && <span className="text-yellow-600"> · รอพิจารณา {c.pendingCount} คน</span>}
                  </p>
                </div>
                {c.isOpen && <span className="text-gray-400">→</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}