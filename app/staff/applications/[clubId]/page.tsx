"use client";

import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

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

const ROUND_LABEL = { qualifier: "รอบคัดเลือกเขตภาคเหนือ", final: "รอบมหกรรม" };

export default function StaffClubCompetitionsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const club = CLUB_INFO[clubId];
  const competitions = MOCK_COMPETITIONS.filter((c) => c.clubId === clubId);

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <p className="text-slate-500 text-xs mb-3">ไม่พบข้อมูลชมรมในระบบ</p>
          <BackButton href="/staff/applications" />
        </div>
      </div>
    );
  }

  const totalPending = competitions.reduce((sum, c) => sum + c.pendingCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/staff/applications" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · รายการแข่งขันประจำชมรม
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {club.name}
            </h1>
            <p className="text-xs text-slate-500">
              ชนิดกีฬา: {club.sport} · ประธานชมรม: {club.presidentName}
              {totalPending > 0 && (
                <span className="text-slate-900 font-semibold ml-2">· ผู้สมัครรอการพิจารณา {totalPending} คน</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แดชบอร์ดวิเคราะห์ผล
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-slate-900">{competitions.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">รายการแข่งขัน</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-blue-900">
              {competitions.reduce((s, c) => s + c.totalApplicants, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">ผู้สมัครทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-slate-700">{totalPending}</p>
            <p className="text-xs text-slate-500 mt-0.5">รอการพิจารณา</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-emerald-800">
              {competitions.reduce((s, c) => s + c.approvedCount, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">คัดเลือกเป็นตัวแทนแล้ว</p>
          </div>
        </div>

        {/* Competitions List */}
        <div className="space-y-3">
          {competitions.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              ยังไม่มีรายการแข่งขันสำหรับชมรมนี้ในระบบ
            </div>
          )}
          {competitions.map((c) => (
            <button
              key={c.id}
              onClick={() => c.totalApplicants > 0 && router.push(`/staff/applications/${clubId}/${c.id}`)}
              disabled={c.totalApplicants === 0}
              className={`w-full text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all ${
                c.totalApplicants > 0
                  ? "hover:border-slate-400 hover:shadow-xs cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm">{c.eventName}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {c.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {ROUND_LABEL[c.round]}
                    </span>
                    {!c.isOpen && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                        ปิดรับสมัคร
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ผู้สมัคร {c.totalApplicants} คน · ตัวจริง {c.approvedCount} คน · รอการพิจารณา {c.pendingCount} คน
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.pendingCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-semibold">
                      รอตรวจ {c.pendingCount}
                    </span>
                  )}
                  <span className="text-slate-400 text-sm">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
