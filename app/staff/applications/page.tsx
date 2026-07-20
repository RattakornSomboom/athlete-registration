"use client";

import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Club = {
  id: string;
  name: string;
  sport: string;
  presidentName: string;
  totalCompetitions: number;
  pendingApplicants: number;
  totalApplicants: number;
};

// TODO: ดึงจาก database จริงตอน Backend พร้อม
const MOCK_CLUBS: Club[] = [
  {
    id: "football",
    name: "ชมรมฟุตบอล",
    sport: "ฟุตบอล",
    presidentName: "นายสมชาย ใจดี",
    totalCompetitions: 2,
    pendingApplicants: 8,
    totalApplicants: 22,
  },
  {
    id: "basketball",
    name: "ชมรมบาสเกตบอล",
    sport: "บาสเกตบอล",
    presidentName: "นางสาวสมหญิง รักดี",
    totalCompetitions: 2,
    pendingApplicants: 3,
    totalApplicants: 18,
  },
  {
    id: "volleyball",
    name: "ชมรมวอลเลย์บอล",
    sport: "วอลเลย์บอล",
    presidentName: "-",
    totalCompetitions: 1,
    pendingApplicants: 0,
    totalApplicants: 0,
  },
  {
    id: "swimming",
    name: "ชมรมว่ายน้ำ",
    sport: "ว่ายน้ำ",
    presidentName: "นายธนา มั่งมี",
    totalCompetitions: 3,
    pendingApplicants: 5,
    totalApplicants: 14,
  },
];

export default function StaffApplicationsPage() {
  const router = useRouter();

  const totalPending = MOCK_CLUBS.reduce((sum, c) => sum + c.pendingApplicants, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">จัดการใบสมัครนักกีฬา</h1>
            <p className="text-gray-500 text-sm mt-1">
              กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 · รอพิจารณารวม {totalPending} คน
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/staff/activities")}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              📋 กิจกรรมชมรม
            </button>
            <button
              onClick={() => router.push("/staff/selection")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              🏆 ประกาศผล
            </button>
            <button
              onClick={() => router.push("/staff/settings")}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ⚙️ ตั้งค่าระบบ
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* สรุปภาพรวม */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{MOCK_CLUBS.length}</p>
            <p className="text-sm text-gray-500 mt-1">ชมรมทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
            <p className="text-sm text-gray-500 mt-1">รอพิจารณา</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {MOCK_CLUBS.reduce((sum, c) => sum + c.totalApplicants, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">ผู้สมัครทั้งหมด</p>
          </div>
        </div>

        {/* รายชื่อชมรม */}
        <div className="space-y-3">
          {MOCK_CLUBS.map((club) => (
            <button
              key={club.id}
              onClick={() => router.push(`/staff/applications/${club.id}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-medium text-gray-900">{club.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {club.sport}
                    </span>
                    {club.pendingApplicants > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                        รอพิจารณา {club.pendingApplicants} คน
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    ประธาน: {club.presidentName} · {club.totalCompetitions} รายการแข่งขัน · ผู้สมัคร {club.totalApplicants} คน
                  </p>
                </div>
                <span className="text-gray-400 shrink-0">→</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}