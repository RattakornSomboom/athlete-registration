"use client";

import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData } from "@/components/shared/RequestState";


import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Competition = {
  id: string;
  clubId: string;
  name: string;
  sport: string;
  round: string;
  year: number;
  status: string;
  _count: { applications: number };
};

type Club = {
  id: string;
  name: string;
  sport: string;
  email: string;
};

const ROUND_LABEL: Record<string, string> = {
  qualifier: "รอบคัดเลือกเขตภาคเหนือ",
  final: "รอบมหกรรม"
};

export default function StaffClubCompetitionsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const load = useCallback(() => fetchJson<{ club: Club; competitions: Competition[] }>("/api/clubs/" + encodeURIComponent(clubId) + "/competitions"), [clubId]);
  const resource = useRemoteData(load);
  const club = resource.data?.club;
  const competitions = resource.data?.competitions ?? [];
  const loading = resource.loading;
  if (resource.error) return <main className="mx-auto max-w-3xl p-6"><RequestState error={resource.error} retry={resource.retry} /><button onClick={() => router.back()}>ย้อนกลับ</button></main>;

  if (!loading && !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <p className="text-slate-500 text-xs">ไม่พบข้อมูลชมรมในระบบ</p>
          <button onClick={() => router.back()} className="mt-3 px-4 py-2 rounded-lg bg-blue-900 text-white text-xs cursor-pointer">
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  const totalApplicants = competitions.reduce((sum, c) => sum + c._count.applications, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · รายการแข่งขันประจำชมรม
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {club?.name || "กำลังโหลด..."}
            </h1>
            <p className="text-xs text-slate-500">
              ชนิดกีฬา: {club?.sport} · อีเมล: {club?.email}
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
              onClick={() => router.back()}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ย้อนกลับ
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-slate-900">{competitions.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">รายการแข่งขัน</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-blue-900">{totalApplicants}</p>
            <p className="text-xs text-slate-500 mt-0.5">ผู้สมัครทั้งหมด</p>
          </div>
        </div>

        {/* Competitions List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลด...</div>
        ) : (
          <div className="space-y-3">
            {competitions.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                ยังไม่มีรายการแข่งขันสำหรับชมรมนี้ในระบบ
              </div>
            )}
            {competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => c._count.applications > 0 && router.push(`/staff/applications/${clubId}/${c.id}`)}
                disabled={c._count.applications === 0}
                className={`w-full text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all ${
                  c._count.applications > 0
                    ? "hover:border-slate-400 hover:shadow-xs cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-slate-900 text-sm">{c.name}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {c.sport}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {ROUND_LABEL[c.round] || c.round}
                      </span>
                      {!c.status || c.status !== "OPEN" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                          ปิดรับสมัคร
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      ผู้สมัครทั้งหมด {c._count.applications} คน
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c._count.applications > 0 && <span className="text-slate-400 text-sm">→</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
