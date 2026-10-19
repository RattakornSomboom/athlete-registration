"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import StaffReview from "@/components/shared/StaffReview";
import StaffRosterReview from "@/components/shared/StaffRosterReview";
import { RequestState, useRemoteData } from "@/components/shared/RequestState";
import { fetchJson } from "@/lib/http-client";
import { ArrowRightIcon } from "@/components/shared/Icons";

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

function StaffApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") === "rosters" ? "rosters" : "applications";

  const load = useCallback(async () => {
    const [c, a] = await Promise.all([
      fetchJson<{ clubs: Club[] }>("/api/clubs"),
      fetchJson<{ stats: Stats }>("/api/staff/applications"),
    ]);
    return { clubs: c.clubs, stats: a.stats };
  }, []);

  const resource = useRemoteData(load);
  const clubs = resource.data?.clubs ?? [];
  const stats = resource.data?.stats;
  const loading = resource.loading;

  const setTab = (tab: "applications" | "rosters") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "rosters") {
      params.set("tab", "rosters");
    } else {
      params.delete("tab");
    }
    const query = params.toString();
    router.replace(`/staff/applications${query ? `?${query}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-950 via-blue-700 to-violet-700" />
          <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3"><BackButton href="/" label="กลับหน้าหลัก" /></div>
              <span className="text-xs font-semibold text-blue-800">
                กองกิจการนิสิต มหาวิทยาลัยพะเยา
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                การบริหารจัดการใบสมัครและบัญชีรายชื่อนักกีฬา
              </h1>
              <p className="text-xs text-slate-500">
                กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
                {stats && ` · รอพิจารณารวม ${stats.submitted + stats.clubApproved} คน`}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab("applications")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  currentTab === "applications"
                    ? "bg-white text-blue-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ใบสมัครรายบุคคล
              </button>
              <button
                type="button"
                onClick={() => setTab("rosters")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  currentTab === "rosters"
                    ? "bg-white text-blue-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ตรวจรับบัญชีรายชื่อชมรม (Rosters)
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Applications */}
        {currentTab === "applications" && (
          <div className="space-y-6">
            {/* สรุปภาพรวม */}
            {stats && (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                  <p className="text-xs text-slate-500 mt-1">รอกองกิจการนิสิต</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
                  <p className="text-2xl font-bold text-blue-900">{stats.finalSelected}</p>
                  <p className="text-xs text-slate-500 mt-1">ผ่านการคัดเลือก</p>
                </div>
              </div>
            )}

            <StaffReview />

            {/* รายชื่อชมรม */}
            <RequestState error={resource.error} retry={resource.retry} />
            {resource.error ? null : loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลด...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pt-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    ชมรมกีฬาทั้งหมดในสังกัด ({clubs.length} ชมรม)
                  </h2>
                  <span className="text-xs text-slate-500">คลิกที่ชมรมเพื่อดูใบสมัครและรายการแข่งขันเฉพาะชมรม</span>
                </div>

                {clubs.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm shadow-xs">
                    ยังไม่มีชมรม
                  </div>
                )}
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => router.push(`/staff/applications/${club.id}`)}
                    className="w-full text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-blue-900 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{club.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                            {club.sport}
                          </span>
                          {!club.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              ปิดใช้งาน
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          กิจกรรม: {club._count.activities} · สมาชิก: {club._count.activities}
                        </p>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 shrink-0 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Rosters */}
        {currentTab === "rosters" && (
          <div className="space-y-6">
            <StaffRosterReview />
          </div>
        )}

      </div>
    </div>
  );
}

export default function StaffApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
          กำลังโหลด...
        </div>
      }
    >
      <StaffApplicationsContent />
    </Suspense>
  );
}
