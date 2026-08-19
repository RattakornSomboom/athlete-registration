"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Competition = {
  id: string;
  name: string;
  sport: string;
  round: string;
  year: number;
  status: string;
  _count: { applications: number };
  club: { id: string; name: string; sport: string };
};

const ROUND_LABEL: Record<string, string> = {
  qualifier: "รอบคัดเลือก",
  final: "รอบมหกรรม",
};

export default function ClubCompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("club");
    if (stored) {
      const club = JSON.parse(stored);
      setClubId(club.id);
      setClubName(club.name || "");
    }
  }, []);

  const fetchCompetitions = useCallback(async (cId: string) => {
    try {
      const res = await fetch(`/api/competitions?clubId=${cId}`);
      const data = await res.json();
      setCompetitions(data.competitions ?? []);
    } catch {
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clubId) fetchCompetitions(clubId);
  }, [clubId, fetchCompetitions]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">← ย้อนกลับ</button>
            <h1 className="text-2xl font-semibold text-gray-900">รายการแข่งขัน</h1>
            <p className="text-gray-500 text-sm mt-1">{clubName || "ชมรม"} — กีฬามหาวิทยาลัยฯ ครั้งที่ 52</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/club/athletes")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">👥 นักกีฬา</button>
            <LogoutButton />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-700">📋 รายการแข่งขันที่แสดงนี้ถูกกำหนดโดยเจ้าหน้าที่กองกิจการนิสิต หากต้องการเพิ่มหรือแก้ไขรายการ กรุณาติดต่อเจ้าหน้าที่</p>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : competitions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            <p className="text-2xl mb-2">🏆</p>
            ยังไม่มีรายการแข่งขันที่ได้รับมอบหมายสำหรับชมรมนี้
          </div>
        ) : (
          <div className="space-y-3">
            {competitions.map((c) => {
              const isOpen = c.status === "OPEN";
              return (
                <button
                  key={c.id}
                  onClick={() => router.push("/club/athletes")}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="font-medium text-gray-900">{c.name}</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{c.sport}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{ROUND_LABEL[c.round] ?? c.round}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {isOpen ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">ปี พ.ศ. {c.year} · ผู้สมัคร {c._count.applications} คน</p>
                    </div>
                    <span className="text-gray-400 shrink-0">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}