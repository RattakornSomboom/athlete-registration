"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type StatusHistory = {
  id: string;
  status: string;
  label: string;
  by: string;
  createdAt: string;
};

type SportEntry = { sport: string; category: string; division?: string | null };
type CompetitionResult = { competitionName: string; year: string; result: string };

type Application = {
  id: string;
  status: string;
  sport: string;
  category: string;
  createdAt: string;
  competition: { name: string; sport: string; round: string; year: number; club: { name: string } };
  sportEntries: SportEntry[];
  competitionResults: CompetitionResult[];
  statusHistory: StatusHistory[];
};

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  SUBMITTED:      { label: "รอชมรมพิจารณา",           icon: "⏳", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  CLUB_APPROVED:  { label: "ชมรมอนุมัติ — รอเจ้าหน้าที่", icon: "✅", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  CLUB_REJECTED:  { label: "ชมรมไม่อนุมัติ",           icon: "❌", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  STAFF_APPROVED: { label: "เจ้าหน้าที่อนุมัติ",       icon: "🎉", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  STAFF_REJECTED: { label: "เจ้าหน้าที่ไม่อนุมัติ",   icon: "❌", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  FINAL_SELECTED: { label: "ผ่านการคัดเลือกขั้นสุดท้าย", icon: "🏆", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

export default function AthleteStatusPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = localStorage.getItem("current_student_id");
    if (!studentId) { router.push("/login"); return; }

    fetch(`/api/applications?studentId=${studentId}`)
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push("/athlete/register")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">← กลับหน้าหลัก</button>
            <h1 className="text-2xl font-semibold text-gray-900">สถานะการสมัคร</h1>
            <p className="text-gray-500 text-sm mt-1">ติดตามผลการพิจารณาของชมรมและเจ้าหน้าที่</p>
          </div>
          <LogoutButton />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลดข้อมูล...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีใบสมัคร</h2>
            <p className="text-gray-500 text-sm mb-4">คุณยังไม่ได้ส่งใบสมัครแข่งขัน</p>
            <button onClick={() => router.push("/athlete/register")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">สมัครแข่งขัน</button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const cfg = STATUS_CONFIG[app.status] ?? { label: app.status, icon: "❓", color: "text-gray-600", bg: "bg-gray-50 border-gray-200" };
              return (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Status banner */}
                  <div className={`border-l-4 px-6 py-4 ${cfg.bg.replace("border-", "border-l-")}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cfg.icon}</span>
                      <div>
                        <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{app.competition.name} · {app.competition.round === "qualifier" ? "รอบคัดเลือก" : "รอบมหกรรม"} {app.competition.year}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-4">
                    {/* ชนิดกีฬา */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">ชนิดกีฬาที่สมัคร</p>
                      <div className="flex flex-wrap gap-2">
                        {app.sportEntries.length > 0
                          ? app.sportEntries.map((e, i) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                                {e.sport} · {e.category}{e.division ? ` · รุ่น${e.division}` : ""}
                              </span>
                            ))
                          : <span className="text-xs text-gray-400">{app.sport} · {app.category}</span>
                        }
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">ประวัติสถานะ</p>
                      <div className="space-y-3">
                        {app.statusHistory.map((h, i) => (
                          <div key={h.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                              {i < app.statusHistory.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                            </div>
                            <div className="pb-2">
                              <p className="text-sm font-medium text-gray-900">{h.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(h.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} — {h.by}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-end">
                      <button onClick={() => router.push(`/athlete/${app.id}`)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">ดูรายละเอียด →</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}