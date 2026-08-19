"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type SportEntry = { sport: string; category: string; division?: string | null };

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
  competition: { name: string; sport: string };
  sportEntries: SportEntry[];
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  SUBMITTED:      { label: "รอพิจารณา",       className: "bg-yellow-100 text-yellow-800" },
  CLUB_APPROVED:  { label: "ชมรมอนุมัติ",     className: "bg-blue-100 text-blue-700" },
  CLUB_REJECTED:  { label: "ชมรมไม่อนุมัติ",  className: "bg-red-100 text-red-700" },
  STAFF_APPROVED: { label: "เจ้าหน้าที่อนุมัติ", className: "bg-green-100 text-green-800" },
  STAFF_REJECTED: { label: "เจ้าหน้าที่ไม่อนุมัติ", className: "bg-red-100 text-red-700" },
  FINAL_SELECTED: { label: "ผ่านการคัดเลือก", className: "bg-emerald-100 text-emerald-800" },
};

export default function ClubAthletesPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");

  const fetchAthletes = useCallback(async (cId: string) => {
    try {
      const url = filterStatus === "all"
        ? `/api/clubs/${cId}/athletes`
        : `/api/clubs/${cId}/athletes?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      setApplications(data.athletes ?? []);
      if (data.club) setClubName(data.club.name);
    } catch {
      console.error("Failed to fetch athletes");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    const stored = localStorage.getItem("current_club_id");
    if (!stored) { router.push("/login"); return; }
    setClubId(stored);
    fetchAthletes(stored);
  }, [router, fetchAthletes]);

  const handleDecision = async (applicationId: string, decision: "CLUB_APPROVED" | "CLUB_REJECTED") => {
    const stored = localStorage.getItem("club");
    const club = stored ? JSON.parse(stored) : null;
    const label = decision === "CLUB_APPROVED" ? "ชมรมอนุมัติ" : "ชมรมไม่อนุมัติ";

    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: decision,
        label,
        by: club?.name ?? "ชมรม",
      }),
    });

    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => a.id === applicationId ? { ...a, status: decision } : a)
      );
    } else {
      alert("ดำเนินการไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const filtered = applications.filter((a) => {
    const name = `${a.user.profile?.firstName ?? ""} ${a.user.profile?.lastName ?? ""} ${a.user.studentId}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = applications.filter((a) => a.status === "SUBMITTED").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">← ย้อนกลับ</button>
            <h1 className="text-2xl font-semibold text-gray-900">รายชื่อนักกีฬา</h1>
            <p className="text-gray-500 text-sm mt-1">{clubName} — รอพิจารณา {pendingCount} คน</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/club/activities")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">📋 กิจกรรมชมรม</button>
            <button onClick={() => router.push("/club/requests")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">📝 คำร้องพิเศษ</button>
            <LogoutButton />
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือรหัสนิสิต..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); if (clubId) fetchAthletes(clubId); }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="SUBMITTED">รอพิจารณา</option>
            <option value="CLUB_APPROVED">อนุมัติแล้ว</option>
            <option value="CLUB_REJECTED">ไม่อนุมัติ</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">ไม่พบรายชื่อนักกีฬา</div>
            )}
            {filtered.map((a) => {
              const statusInfo = STATUS_LABEL[a.status] ?? { label: a.status, className: "bg-gray-100 text-gray-500" };
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : "ไม่มีชื่อ"}
                        </span>
                        <span className="text-gray-400 text-sm">#{a.user.studentId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 space-y-0.5">
                        <p>{a.user.profile?.faculty ?? "-"} — {a.competition.name}</p>
                        <p>กีฬา: {a.sportEntries.map((e) => `${e.sport} (${e.category})`).join(", ") || a.sport}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {a.status === "SUBMITTED" && (
                        <>
                          <button onClick={() => handleDecision(a.id, "CLUB_REJECTED")} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                          <button onClick={() => handleDecision(a.id, "CLUB_APPROVED")} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                        </>
                      )}
                      <button onClick={() => router.push(`/athlete/${a.id}`)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">ดูข้อมูล</button>
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