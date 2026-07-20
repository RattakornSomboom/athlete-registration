"use client";

import { useParams, useRouter } from "next/navigation";

// ข้อมูลชมรม
const CLUB_INFO: Record<string, { name: string; sport: string; presidentName: string }> = {
  football: { name: "ชมรมฟุตบอล", sport: "ฟุตบอล", presidentName: "นายสมชาย ใจดี" },
  basketball: { name: "ชมรมบาสเกตบอล", sport: "บาสเกตบอล", presidentName: "นางสาวสมหญิง รักดี" },
  volleyball: { name: "ชมรมวอลเลย์บอล", sport: "วอลเลย์บอล", presidentName: "-" },
  swimming: { name: "ชมรมว่ายน้ำ", sport: "ว่ายน้ำ", presidentName: "นายธนา มั่งมี" },
};

type Competition = {
  id: string;
  clubId: string;
  sport: string;
  eventName: string;
  category: string;
  round: "qualifier" | "final";
  totalApplicants: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  isOpen: boolean;
};

// TODO: ดึงจาก database จริงตอน Backend พร้อม
const MOCK_COMPETITIONS: Competition[] = [
  { id: "1", clubId: "football", sport: "ฟุตบอล", eventName: "ฟุตบอล 11 คน", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 22, pendingCount: 8, approvedCount: 12, rejectedCount: 2, isOpen: true },
  { id: "2", clubId: "football", sport: "ฟุตบอล", eventName: "ฟุตบอล 7 คน", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 10, pendingCount: 3, approvedCount: 6, rejectedCount: 1, isOpen: true },
  { id: "3", clubId: "basketball", sport: "บาสเกตบอล", eventName: "บาสเกตบอล 5 คน", category: "กีฬาบังคับ", round: "final", totalApplicants: 12, pendingCount: 2, approvedCount: 9, rejectedCount: 1, isOpen: true },
  { id: "4", clubId: "basketball", sport: "บาสเกตบอล", eventName: "บาสเกตบอล 3x3", category: "กีฬาบังคับ", round: "final", totalApplicants: 6, pendingCount: 1, approvedCount: 5, rejectedCount: 0, isOpen: true },
  { id: "5", clubId: "swimming", sport: "ว่ายน้ำ", eventName: "100 เมตร ผีเสื้อ", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 8, pendingCount: 3, approvedCount: 4, rejectedCount: 1, isOpen: true },
  { id: "6", clubId: "swimming", sport: "ว่ายน้ำ", eventName: "200 เมตร กบ", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 4, pendingCount: 2, approvedCount: 2, rejectedCount: 0, isOpen: true },
  { id: "7", clubId: "swimming", sport: "ว่ายน้ำ", eventName: "ผลัด 4×100 เมตร", category: "กีฬาบังคับ", round: "final", totalApplicants: 2, pendingCount: 0, approvedCount: 2, rejectedCount: 0, isOpen: false },
  { id: "8", clubId: "volleyball", sport: "วอลเลย์บอล", eventName: "วอลเลย์บอล 6 คน", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0, isOpen: true },
];

const ROUND_LABEL = { qualifier: "รอบคัดเลือก", final: "รอบมหกรรม" };

export default function StaffClubCompetitionsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const club = CLUB_INFO[clubId];
  const competitions = MOCK_COMPETITIONS.filter((c) => c.clubId === clubId);

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-sm">ไม่พบข้อมูลชมรม</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  const totalPending = competitions.reduce((sum, c) => sum + c.pendingCount, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            ← ย้อนกลับ
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{club.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                กีฬา: {club.sport} · ประธาน: {club.presidentName}
                {totalPending > 0 && (
                  <span className="text-yellow-600 ml-2">· รอพิจารณา {totalPending} คน</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* สรุป */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{competitions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">รายการแข่งขัน</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-blue-600">
              {competitions.reduce((s, c) => s + c.totalApplicants, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">ผู้สมัครทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-yellow-600">{totalPending}</p>
            <p className="text-xs text-gray-500 mt-0.5">รอพิจารณา</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-green-600">
              {competitions.reduce((s, c) => s + c.approvedCount, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">คัดเลือกแล้ว</p>
          </div>
        </div>

        {/* รายการแข่งขัน */}
        <div className="space-y-3">
          {competitions.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              ยังไม่มีรายการแข่งขันสำหรับชมรมนี้
            </div>
          )}
          {competitions.map((c) => (
            <button
              key={c.id}
              onClick={() => c.totalApplicants > 0 && router.push(`/staff/applications/${clubId}/${c.id}`)}
              disabled={c.totalApplicants === 0}
              className={`w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-all ${
                c.totalApplicants > 0
                  ? "hover:border-blue-300 hover:shadow-md cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-medium text-gray-900">{c.eventName}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{c.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {ROUND_LABEL[c.round]}
                    </span>
                    {!c.isOpen && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">ปิดรับสมัคร</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>ผู้สมัคร {c.totalApplicants} คน</span>
                    {c.pendingCount > 0 && (
                      <span className="text-yellow-600 font-medium">รอพิจารณา {c.pendingCount} คน</span>
                    )}
                    {c.approvedCount > 0 && (
                      <span className="text-green-600">คัดเลือกแล้ว {c.approvedCount} คน</span>
                    )}
                    {c.rejectedCount > 0 && (
                      <span className="text-red-500">ไม่ผ่าน {c.rejectedCount} คน</span>
                    )}
                  </div>
                </div>
                {c.totalApplicants > 0 && <span className="text-gray-400 shrink-0 ml-4">→</span>}
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
