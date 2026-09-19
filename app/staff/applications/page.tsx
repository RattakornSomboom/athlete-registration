"use client";

import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData } from "@/components/shared/RequestState";


import { useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Stats = {
  total: number;
  submitted: number;
  clubApproved: number;
  clubRejected: number;
  staffApproved: number;
  staffRejected: number;
  finalSelected: number;
};

type Club = {
  id: string;
  name: string;
  sport: string;
  email: string;
  isActive: boolean;
  _count: { activities: number };
};

export default function StaffApplicationsPage() {
  const router = useRouter();
  const load = useCallback(async () => {
    const [c, a] = await Promise.all([fetchJson<{ clubs: Club[] }>("/api/clubs"), fetchJson<{ stats: Stats }>("/api/staff/applications")]);
    return { clubs: c.clubs, stats: a.stats };
  }, []);
  const resource = useRemoteData(load);
  const clubs = resource.data?.clubs ?? [];
  const stats = resource.data?.stats;
  const loading = resource.loading;

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
              กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 
              {stats && ` · รอพิจารณารวม ${stats.submitted + stats.clubApproved} คน`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/competitions")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              โปรแกรมการแข่งขัน
            </button>
            <button
              onClick={() => router.push("/staff/analytics")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
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
              onClick={() => router.push("/staff/settings")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              ตั้งค่าระบบ
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* สรุปภาพรวม */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-1">ใบสมัครทั้งหมด</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
              <p className="text-2xl font-bold text-slate-700">{stats.submitted}</p>
              <p className="text-xs text-slate-500 mt-1">รอชมรมพิจารณา</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
              <p className="text-2xl font-bold text-amber-700">{stats.clubApproved}</p>
              <p className="text-xs text-slate-500 mt-1">รอเจ้าหน้าที่</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
              <p className="text-2xl font-bold text-blue-900">{stats.finalSelected}</p>
              <p className="text-xs text-slate-500 mt-1">ผ่านการคัดเลือก</p>
            </div>
          </div>
        )}

        {/* รายชื่อชมรม */}
        <RequestState error={resource.error} retry={resource.retry} />
        {resource.error ? null : loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลด...</div>
        ) : (
          <div className="space-y-3">
            {clubs.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm shadow-xs">
                ยังไม่มีชมรม
              </div>
            )}
            {clubs.map((club) => (
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
                      {!club.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      กิจกรรม: {club._count.activities} · {club.email}
                    </p>
                  </div>
                  <span className="text-slate-400 shrink-0 text-sm">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}