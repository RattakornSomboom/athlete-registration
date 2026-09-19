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

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  SUBMITTED:      { label: "รอชมรมพิจารณา",           bg: "bg-yellow-50", text: "text-yellow-700" },
  CLUB_APPROVED:  { label: "ชมรมอนุมัติ — รอเจ้าหน้าที่", bg: "bg-blue-50", text: "text-blue-700" },
  CLUB_REJECTED:  { label: "ชมรมไม่อนุมัติ",           bg: "bg-red-50", text: "text-red-700" },
  STAFF_APPROVED: { label: "เจ้าหน้าที่อนุมัติ",       bg: "bg-green-50", text: "text-green-700" },
  STAFF_REJECTED: { label: "เจ้าหน้าที่ไม่อนุมัติ",   bg: "bg-red-50", text: "text-red-700" },
  FINAL_SELECTED: { label: "ผ่านการคัดเลือกขั้นสุดท้าย", bg: "bg-emerald-50", text: "text-emerald-700" },
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบรับสมัครและรายงานตัวนักกีฬาตัวแทนสถาบัน
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              สถานะการสมัครและรายงานตัวนักกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1.5 bg-white hover:bg-slate-50 transition-colors"
            >
              หน้าแรก
            </button>
            <LogoutButton />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">ยังไม่มีใบสมัคร</h2>
            <p className="text-slate-500 text-sm mb-4">คุณยังไม่ได้ส่งใบสมัครแข่งขัน</p>
            <button onClick={() => router.push("/athlete/register")} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm rounded-lg transition-colors">สมัครแข่งขัน</button>
          </div>
        ) : (
          <div className="space-y-8">
            {applications.map((app) => {
              const cfg = STATUS_CONFIG[app.status] ?? { label: app.status, bg: "bg-slate-100", text: "text-slate-700" };
              
              const isClubApproved = app.status !== "SUBMITTED" && app.status !== "CLUB_REJECTED";
              const isStaffApproved = app.status === "STAFF_APPROVED" || app.status === "FINAL_SELECTED";
              const isFinal = app.status === "FINAL_SELECTED";
              const isRejected = app.status.includes("REJECTED");

              return (
                <div key={app.id} className="space-y-6">
                  {/* Step Progress Tracker */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
                      ขั้นตอนการคัดเลือก ({app.competition.name})
                    </h2>
                    <div className="grid grid-cols-4 gap-2 relative">
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">1</div>
                        <p className="text-xs font-semibold text-slate-900">ยื่นใบสมัคร</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">สำเร็จแล้ว</p>
                      </div>

                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                          isClubApproved ? "bg-emerald-700 text-white" : isRejected && app.status === "CLUB_REJECTED" ? "bg-rose-700 text-white" : "bg-slate-200 text-slate-500"
                        }`}>2</div>
                        <p className="text-xs font-semibold text-slate-900">พิจารณาคัดเลือก (ชมรม)</p>
                        <p className={`text-[11px] mt-0.5 ${isClubApproved ? "text-emerald-700" : isRejected && app.status === "CLUB_REJECTED" ? "text-rose-700" : "text-slate-400"}`}>
                          {isClubApproved ? "ผ่านเกณฑ์ชมรม" : isRejected && app.status === "CLUB_REJECTED" ? "ไม่ผ่าน" : "รอพิจารณา"}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                          isStaffApproved ? "bg-emerald-700 text-white" : isRejected && app.status === "STAFF_REJECTED" ? "bg-rose-700 text-white" : "bg-slate-200 text-slate-500"
                        }`}>3</div>
                        <p className="text-xs font-semibold text-slate-900">พิจารณา (เจ้าหน้าที่)</p>
                        <p className={`text-[11px] mt-0.5 ${isStaffApproved ? "text-emerald-700" : isRejected && app.status === "STAFF_REJECTED" ? "text-rose-700" : "text-slate-400"}`}>
                          {isStaffApproved ? "อนุมัติ" : isRejected && app.status === "STAFF_REJECTED" ? "ไม่ผ่าน" : "รอพิจารณา"}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2 ${
                          isFinal ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"
                        }`}>4</div>
                        <p className="text-xs font-semibold text-slate-900">ประกาศผล</p>
                        <p className={`text-[11px] mt-0.5 ${isFinal ? "text-emerald-700 font-medium" : "text-slate-400"}`}>
                          {isFinal ? "ผ่านการคัดเลือก" : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Application Details Card */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono tracking-widest text-slate-300">
                            {app.id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-white mt-1">{app.competition.name}</h2>
                        <p className="text-xs text-slate-300">
                          {app.competition.round === "qualifier" ? "รอบคัดเลือก" : "รอบมหกรรม"} ปี {app.competition.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">สถานะผลการพิจารณา</span>
                        <span className={`text-sm font-semibold ${isFinal ? "text-emerald-400" : isRejected ? "text-rose-400" : "text-amber-400"}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-slate-500 block">ชนิดกีฬา / รายการ</span>
                          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                            {app.sportEntries.length > 0 ? app.sportEntries.map(e => e.sport).join(', ') : app.sport}
                          </span>
                          <span className="text-slate-500 mt-1 block">
                            ประเภท: {app.sportEntries.length > 0 ? app.sportEntries.map(e => e.category).join(', ') : app.category}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-slate-500 block">ชมรมสังกัด</span>
                          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{app.competition.club.name}</span>
                          <span className="text-slate-500 mt-1 block">สังกัดกองกิจการนิสิต มพ.</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-slate-500 block">วันที่สมัคร</span>
                          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                            {new Date(app.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">ประวัติการดำเนินการ</h3>
                        <div className="space-y-3">
                          {app.statusHistory.map((h, i) => (
                            <div key={h.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-900 mt-1 shrink-0" />
                                {i < app.statusHistory.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 mt-1" />}
                              </div>
                              <div className="pb-2">
                                <p className="text-sm font-medium text-slate-900">{h.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(h.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} — {h.by}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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