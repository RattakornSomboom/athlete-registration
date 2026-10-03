"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { getTeamOfficials, TeamOfficialApplication, POSITION_LABEL } from "@/lib/team-official-store";

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

  const [officials, setOfficials] = useState<TeamOfficialApplication[]>([]);

  useEffect(() => {
    setOfficials(getTeamOfficials(clubId));
  }, [clubId]);

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
  const pendingOfficialsCount = officials.filter((o) => o.stage === "club_approved").length;
  const certifiedOfficialsCount = officials.filter((o) => o.stage === "staff_approved").length;

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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => router.push(`/staff/officials?clubId=${clubId}`)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>ตรวจสอบเจ้าหน้าที่ทีมชมรมนี้</span>
              {pendingOfficialsCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-amber-400 text-blue-950 text-[10px] font-bold rounded-full">
                  รอกองกิจตรวจ {pendingOfficialsCount} คน
                </span>
              ) : (
                <span className="px-1.5 py-0.2 bg-emerald-950 text-white text-[10px] font-bold rounded-full">
                  {officials.length} คน
                </span>
              )}
            </button>
            <button
              onClick={() => router.push("/staff/selection")}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <span>ออกประกาศผลทางการ</span>
              <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                กกมท.52
              </span>
            </button>
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

        {/* Section: เจ้าหน้าที่ทีม/ผู้ฝึกสอนประจำชมรมนี้ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  เจ้าหน้าที่ทีมและผู้ฝึกสอน (ประจำชมรม{club.sport})
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold border border-blue-200">
                  {officials.length} ท่าน
                </span>
                {pendingOfficialsCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-300">
                    รอกองกิจตรวจ {pendingOfficialsCount} ท่าน
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ผู้จัดการทีม / ผู้ฝึกสอน / ผู้ช่วยผู้ฝึกสอน ที่ขึ้นทะเบียนสังกัดชมรม{club.sport}
              </p>
            </div>

            <button
              onClick={() => router.push(`/staff/officials?clubId=${clubId}`)}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>เปิดระบบตรวจสอบเจ้าหน้าที่ทีมชมรมนี้</span>
              <span className="text-blue-200">→</span>
            </button>
          </div>

          {officials.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              ยังไม่มีข้อมูลการสมัครของเจ้าหน้าที่ทีมในชมรมนี้
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {officials.map((o) => (
                <div
                  key={o.id}
                  onClick={() => router.push(`/staff/officials?clubId=${clubId}`)}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-900/40 bg-slate-50/50 hover:bg-white transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {o.firstName} {o.lastName}
                      </span>
                      <span className="text-[11px] text-blue-900 font-semibold block">
                        {POSITION_LABEL[o.appliedPosition]}
                      </span>
                    </div>
                    <div>
                      {o.stage === "staff_approved" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          ขึ้นทะเบียนแล้ว ✓
                        </span>
                      ) : o.stage === "club_approved" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                          รอกองกิจตรวจ
                        </span>
                      ) : o.stage === "staff_returned" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                          ตีกลับแก้ไข
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                          รอชมรมตรวจ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                    <p>หน่วยงาน: <span className="text-slate-700">{o.workplace}</span></p>
                    {o.officialLicenseId && (
                      <p className="font-mono text-[10px] text-blue-900 font-semibold">
                        License: {o.officialLicenseId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
