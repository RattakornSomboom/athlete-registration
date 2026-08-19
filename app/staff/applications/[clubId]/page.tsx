"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

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
};

const ROUND_LABEL: Record<string, string> = {
  qualifier: "รอบคัดเลือก",
  final: "รอบมหกรรม"
};

export default function StaffClubCompetitionsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const [club, setClub] = useState<Club | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [clubsRes, compRes] = await Promise.all([
        fetch("/api/clubs"),
        fetch(`/api/competitions?clubId=${clubId}`)
      ]);
      
      const clubsData = await clubsRes.json();
      const compData = await compRes.json();

      const foundClub = clubsData.clubs?.find((c: Club) => c.id === clubId);
      if (foundClub) setClub(foundClub);

      setCompetitions(compData.competitions ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!loading && !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-sm">ไม่พบข้อมูลชมรม</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  const totalApplicants = competitions.reduce((sum, c) => sum + c._count.applications, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full lg:max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            ← ย้อนกลับ
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{club?.name || "กำลังโหลด..."}</h1>
              <p className="text-gray-500 text-sm mt-1">กีฬา: {club?.sport}</p>
            </div>
          </div>
        </div>

        {/* สรุป */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{competitions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">รายการแข่งขัน</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{totalApplicants}</p>
            <p className="text-xs text-gray-500 mt-0.5">ผู้สมัครทั้งหมด</p>
          </div>
        </div>

        {/* รายการแข่งขัน */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : (
          <div className="space-y-3">
            {competitions.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                ยังไม่มีรายการแข่งขันสำหรับชมรมนี้
              </div>
            )}
            {competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => c._count.applications > 0 && router.push(`/staff/applications/${clubId}/${c.id}`)}
                disabled={c._count.applications === 0}
                className={`w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-all ${
                  c._count.applications > 0
                    ? "hover:border-blue-300 hover:shadow-md cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-medium text-gray-900">{c.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{c.sport}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {ROUND_LABEL[c.round] || c.round}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.status === "OPEN" ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>ผู้สมัคร {c._count.applications} คน</span>
                    </div>
                  </div>
                  {c._count.applications > 0 && <span className="text-gray-400 shrink-0 ml-4">→</span>}
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
