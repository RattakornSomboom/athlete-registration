"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import { RequestState, useRemoteData } from "@/components/shared/RequestState";
import { fetchJson } from "@/lib/http-client";
import { positionLabels } from "@/lib/official-labels";
import type { OfficialRecord } from "@/lib/phase4-client";

type ClubDto = {
  id: string;
  name: string;
  sport: string;
  presidentName: string | null;
};

type CompetitionDto = {
  id: string;
  name: string;
  round: string;
  year: number;
  status: string;
  totalApplicants: number;
  submittedApplicants: number;
  rosterStatus: "DRAFT" | "SUBMITTED" | "RETURNED" | null;
  pendingCount: number;
};

const ROUND_LABEL: Record<string, string> = {
  qualifier: "รอบคัดเลือกเขตภาคเหนือ",
  final: "รอบมหกรรม",
};

async function loadClubData(clubId: string) {
  const id = encodeURIComponent(clubId);
  const [competitionData, officialData] = await Promise.all([
    fetchJson<{ competitions: CompetitionDto[]; club: ClubDto }>(`/api/clubs/${id}/competitions`),
    fetchJson<{ applications: OfficialRecord[] }>("/api/staff/officials"),
  ]);
  return {
    club: competitionData.club,
    competitions: competitionData.competitions,
    officials: officialData.applications.filter((o) => o.clubId === clubId),
  };
}

export default function StaffClubCompetitionsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const load = useCallback(() => loadClubData(clubId), [clubId]);
  const resource = useRemoteData(load);
  const club = resource.data?.club;
  const competitions = resource.data?.competitions ?? [];
  const officials = resource.data?.officials ?? [];

  if (resource.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-xs text-slate-500">
        กำลังโหลด...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-3">
          <RequestState error={resource.error} retry={resource.retry} />
          {!resource.error && <p className="text-slate-500 text-xs">ไม่พบข้อมูลชมรมในระบบ</p>}
          <BackButton href="/staff/applications" />
        </div>
      </div>
    );
  }

  const totalPending = competitions.reduce((sum, c) => sum + c.pendingCount, 0);
  const totalApplicants = competitions.reduce((sum, c) => sum + c.totalApplicants, 0);
  const totalSubmittedApplicants = competitions.reduce((sum, c) => sum + (c.submittedApplicants ?? 0), 0);
  const pendingOfficialsCount = officials.filter((o) => o.status === "CLUB_APPROVED").length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <BackButton href="/staff/applications" />
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · รายการแข่งขันประจำชมรม
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{club.name}</h1>
            <p className="text-xs text-slate-500">
              ชนิดกีฬา: {club.sport} · ประธานชมรม: {club.presidentName || "-"}
              {totalPending > 0 && (
                <span className="text-slate-900 font-semibold ml-2">· ผู้สมัครรอการพิจารณา {totalPending} คน</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-slate-900">{competitions.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">รายการแข่งขัน</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-blue-900">{totalApplicants}</p>
            <p className="text-xs text-slate-500 mt-0.5">ผู้สมัครทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-slate-700">{totalSubmittedApplicants}</p>
            <p className="text-xs text-slate-500 mt-0.5">ส่งให้กองกิจแล้ว</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">เจ้าหน้าที่ทีมและผู้ฝึกสอน (ประจำชมรม{club.sport})</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold border border-blue-200">
              {officials.length} ท่าน
            </span>
            {pendingOfficialsCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-300">
                รอกองกิจตรวจ {pendingOfficialsCount} ท่าน
              </span>
            )}
          </div>

          {officials.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              ยังไม่มีเจ้าหน้าที่ทีมที่ชมรมนี้ส่งมาให้กองกิจตรวจสอบ
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {officials.map((o) => (
                <div
                  key={o.id}
                  onClick={() => router.push("/staff/officials")}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-900/40 bg-slate-50/50 hover:bg-white transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {o.profile.firstName} {o.profile.lastName}
                      </span>
                      <span className="text-[11px] text-blue-900 font-semibold block">
                        {positionLabels[o.profile.appliedPosition] ?? o.profile.appliedPosition ?? "-"}
                      </span>
                    </div>
                    {o.status === "STAFF_APPROVED" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        ขึ้นทะเบียนแล้ว ✓
                      </span>
                    ) : o.status === "STAFF_REJECTED" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                        ไม่อนุมัติ
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                        รอกองกิจตรวจ
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    หน่วยงาน: <span className="text-slate-700">{o.profile.workplace || "-"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <RequestState error={resource.error} retry={resource.retry} />
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
                c.totalApplicants > 0 ? "hover:border-slate-400 cursor-pointer" : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm">{c.name}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {ROUND_LABEL[c.round] ?? c.round}
                    </span>
                    {c.status !== "OPEN" && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600">ปิดรับสมัคร</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ผู้สมัคร {c.totalApplicants} คน · ส่งแล้ว {c.submittedApplicants ?? 0} คน (รอตรวจ {c.pendingCount} คน)
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
