"use client";

import { fetchJson } from "@/lib/http-client";
import { RequestState, useRemoteData } from "@/components/shared/RequestState";


import { useState, useCallback } from "react";
import LogoutButton from "@/components/shared/LogoutButton";
import Link from "next/link";


type Application = {
  id: string;
  status: string;
  sport: string;
  category: string;
  createdAt: string;
  user: {
    studentId: string;
    profile?: {
      firstName: string;
      lastName: string;
      faculty: string;
    } | null;
  };
  competition: { name: string };
};

export default function ClubAthletesPage() {
  const [notified, setNotified] = useState(false);
  const load = useCallback(async () => {
    const me = await fetchJson<{ club: { id: string; name: string } }>("/api/auth/me");
    const result = await fetchJson<{ athletes: Application[] }>("/api/clubs/" + me.club.id + "/athletes");
    return { applications: result.athletes, club: me.club };
  }, []);
  const resource = useRemoteData(load);
  const applications = resource.data?.applications ?? [];
  const clubName = resource.data?.club.name ?? "";
  const loading = resource.loading;

  const handleNotifyAdvisor = () => {
    // In a real app, this would hit an API to send an email or line message
    alert("ส่งข้อมูลแจ้งเตือนไปยังอาจารย์ที่ปรึกษาเรียบร้อยแล้ว");
    setNotified(true);
  };

  // Group applications by sport
  const groupedBySport = applications.reduce((acc, app) => {
    if (!acc[app.sport]) acc[app.sport] = [];
    acc[app.sport].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1 block">
            Club Management
          </span>
          <h2 className="text-lg font-bold text-white leading-tight">
            ประธานชมรม
          </h2>
          <p className="text-xs text-slate-400 mt-1">{clubName}</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link href="/club/athletes" className="block px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white transition-colors">รายชื่อผู้สมัคร (Phase A)</Link>
          <Link href="/club/training" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">จัดการการฝึกซ้อม (Phase B)</Link>
          <Link href="/club/review" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">คัดเลือกนักกีฬา (Phase C)</Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Phase A: สรุปข้อมูลผู้สมัคร
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                รายชื่อนักกีฬาที่สมัครเข้ามา แบ่งตามชนิดกีฬา
              </p>
            </div>
            <button
              onClick={handleNotifyAdvisor}
              disabled={notified || applications.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {notified ? "แจ้งอาจารย์ที่ปรึกษาแล้ว ✓" : "แจ้งข้อมูลให้อาจารย์ที่ปรึกษาทราบ"}
            </button>
          </div>

          <RequestState error={resource.error} retry={resource.retry} />
          {resource.error ? null : loading ? (
            <p className="text-sm text-gray-500">กำลังโหลด...</p>
          ) : applications.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
              ยังไม่มีผู้สมัครเข้าชมรม
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedBySport).map(([sport, apps]) => (
                <div key={sport} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800">{sport}</h2>
                    <span className="text-xs font-semibold bg-white border px-2 py-1 rounded text-slate-600">ผู้สมัคร: {apps.length} คน</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {apps.map((a) => (
                      <div key={a.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {a.user.profile?.firstName} {a.user.profile?.lastName} ({a.user.studentId})
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            คณะ: {a.user.profile?.faculty || "-"} | ประเภท: {a.category}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(a.createdAt).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}