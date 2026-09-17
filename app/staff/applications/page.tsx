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
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การบริหารจัดการใบสมัครและคัดเลือกนักกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 · ผู้สมัครรอการพิจารณารวม {totalPending} คน
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
              onClick={() => router.push("/staff/activities")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              กิจกรรมชมรม
            </button>
            <button
              onClick={() => router.push("/staff/selection")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ประกาศผล
            </button>
            <button
              onClick={() => router.push("/staff/settings")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              ตั้งค่าระบบ
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* สรุปภาพรวม */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-slate-900">{MOCK_CLUBS.length}</p>
            <p className="text-xs text-slate-500 mt-1">ชมรมสังกัดทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-slate-700">{totalPending}</p>
            <p className="text-xs text-slate-500 mt-1">ผู้สมัครรอการพิจารณา</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-blue-900">
              {MOCK_CLUBS.reduce((sum, c) => sum + c.totalApplicants, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">ผู้สมัครรวมทุกชนิดกีฬา</p>
          </div>
        </div>

        {/* รายชื่อชมรม */}
        <div className="space-y-3">
          {MOCK_CLUBS.map((club) => (
            <button
              key={club.id}
              onClick={() => router.push(`/staff/applications/${club.id}`)}
              className="w-full text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900">{club.name}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {club.sport}
                    </span>
                    {club.pendingApplicants > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-semibold">
                        รอพิจารณา {club.pendingApplicants} คน
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ประธานชมรม: {club.presidentName} · {club.totalCompetitions} รายการแข่งขัน · ผู้สมัคร {club.totalApplicants} คน
                  </p>
                </div>
                <span className="text-slate-400 shrink-0 text-sm">→</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}