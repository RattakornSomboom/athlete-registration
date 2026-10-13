"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { formatThaiDate } from "@/lib/thai-date";
import { ClubCompetition } from "@/lib/club-store";

const ROUND_LABEL = {
  qualifier: "รอบคัดเลือกเขตภาคเหนือ",
  final: "รอบมหกรรม",
};

type CompetitionCard = ClubCompetition & {
  roundLabel: string;
  year: number;
  deadline: string | null;
  maxStarters: number | null;
  maxSubstitutes: number | null;
  status: "OPEN" | "CLOSED" | "COMPLETED";
};

function getRoundLabel(round: string): string {
  const normalized = round.toLowerCase();
  if (normalized === "final") return "รอบมหกรรม";
  if (normalized === "qualifier") return "รอบคัดเลือก";
  return round.startsWith("รอบ") ? round : `รอบ${round}`;
}

type CompetitionListResponse = {
  competitions: Array<{
    id: string;
    sport: string;
    name: string;
    eventName: string;
    category: string;
    round: string;
    year: number;
    deadline: string | null;
    status: "OPEN" | "CLOSED" | "COMPLETED";
    isOpen: boolean;
    totalApplicants: number;
    pendingCount: number;
    quotas: Array<{
      maxStarters: number;
      maxSubstitutes: number;
    }>;
  }>;
  club: {
    sport: string;
  };
};

export default function ClubCompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<CompetitionCard[]>([]);
  const [selectedSport, setSelectedSport] = useState("ฟุตบอล");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/club/competitions")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("ไม่สามารถโหลดรายการแข่งขันได้");
        }
        return (await res.json()) as CompetitionListResponse;
      })
      .then((data) => {
        const mapped: CompetitionCard[] = data.competitions.map((competition) => ({
          id: competition.id,
          sport: competition.sport || data.club.sport,
          eventName: competition.eventName || competition.name,
          category: competition.category,
          round: competition.round.toLowerCase() === "final" ? "final" : "qualifier",
          roundLabel: getRoundLabel(competition.round),
          year: competition.year,
          deadline: competition.deadline,
          maxStarters: competition.quotas[0]?.maxStarters ?? null,
          maxSubstitutes: competition.quotas[0]?.maxSubstitutes ?? null,
          status: competition.status,
          totalApplicants: competition.totalApplicants,
          pendingCount: competition.pendingCount,
          isOpen: competition.isOpen,
          submissionStatus: "not_submitted",
        }));
        setCompetitions(mapped);
        if (data.club.sport) setSelectedSport(data.club.sport);
      })
      .catch((error: unknown) => {
        console.error("[ClubCompetitionsPage] Failed to load competitions", error);
        setLoadError("ไม่สามารถโหลดรายการแข่งขันได้ กรุณาลองใหม่อีกครั้ง");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const clubCompetitions = competitions.filter((c) => c.sport === selectedSport);

  const openCount = clubCompetitions.filter((c) => c.isOpen).length;
  const closedCount = clubCompetitions.filter((c) => !c.isOpen).length;
  const totalApplicants = clubCompetitions.reduce((acc, c) => acc + c.totalApplicants, 0);
  const pendingCount = clubCompetitions.reduce((acc, c) => acc + c.pendingCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              รายการแข่งขันและประเภทกีฬาที่รับผิดชอบ
            </h1>
            <p className="text-xs text-slate-500">
              ชมรม{selectedSport} — ซิงค์สถานะเปิด/ปิดรับสมัครกับกองกิจการนิสิต (การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52)
            </p>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-blue-950 font-medium">
              สถานะการเปิดรับสมัครซิงค์แบบเรียลไทม์กับระบบกองกิจการนิสิต:
            </span>
            <span className="font-semibold text-blue-900">
              เปิดรับ {openCount} รายการ · ปิดรับ/ระงับ {closedCount} รายการ
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            *รายการที่ไม่เปิดรับสมัครจะแสดงเป็นแถบสีเทาและไม่สามารถกดเลือกได้ตามระเบียบ
          </span>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">รายการที่เปิดรับสมัคร</span>
            <span className="text-xl font-bold text-emerald-800 mt-0.5 block">{openCount} รายการ</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">รายการปิดรับสมัคร</span>
            <span className="text-xl font-bold text-slate-500 mt-0.5 block">{closedCount} รายการ</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">ผู้สมัครรวมทุกรายการ</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalApplicants} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-400 block">รอพิจารณาคัดเลือก</span>
            <span className="text-xl font-bold text-blue-900 mt-0.5 block">{pendingCount} คน</span>
          </div>
        </div>

        {/* Competitions Listing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-sm font-bold text-slate-900">
              รายการแข่งขันของชมรม{selectedSport} ({clubCompetitions.length} รายการ)
            </h2>
            <span className="text-xs text-slate-500">
              คลิกที่รายการเปิดรับสมัครเพื่อพิจารณาผู้สมัครแข่งขันและตรวจเอกสาร
            </span>
          </div>

          {isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-xs">
              กำลังโหลดรายการแข่งขัน...
            </div>
          )}

          {!isLoading && loadError && (
            <div role="alert" className="bg-rose-50 rounded-xl border border-rose-200 p-6 text-center text-rose-800 text-xs">
              {loadError}
            </div>
          )}

          {!isLoading && !loadError && clubCompetitions.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              ยังไม่มีรายการแข่งขันสำหรับชมรมนี้ในระบบ
            </div>
          )}

          {!loadError && clubCompetitions.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                if (c.isOpen) {
                  router.push(`/club/competitions/${c.id}`);
                }
              }}
              className={`rounded-xl border transition-all ${
                c.isOpen
                  ? "bg-white border-slate-200 shadow-xs hover:border-blue-900 hover:shadow-md cursor-pointer p-5"
                  : "bg-slate-100/80 border-slate-300 opacity-60 cursor-not-allowed select-none p-5"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-base ${c.isOpen ? "text-slate-900" : "text-slate-500"}`}>
                      {c.eventName}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {c.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {c.roundLabel || ROUND_LABEL[c.round]}
                    </span>

                    {/* Status Badge */}
                    {c.isOpen ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        เปิดรับสมัครโดยกองกิจการนิสิต
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-slate-200 text-slate-600 border border-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        {c.status === "COMPLETED" ? "สิ้นสุดการแข่งขัน" : "ปิดรับสมัคร"}
                      </span>
                    )}

                    {/* Submission Tag */}
                    {c.isOpen && c.submissionStatus === "submitted_pending" && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                        ส่งบัญชีรายชื่อแล้ว (รอผลตรวจเอกสาร)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-x-4 gap-y-2 text-xs text-slate-500 flex-wrap">
                    <span>ปีการแข่งขัน: <strong className="text-slate-900">พ.ศ. {c.year + 543}</strong></span>
                    <span>ปิดรับสมัคร: <strong className="text-slate-900">{formatThaiDate(c.deadline, { format: "medium" }) || "ไม่ระบุ"}</strong></span>
                    <span>
                      โควตา:{" "}
                      <strong className="text-slate-900">
                        {c.maxStarters !== null && c.maxSubstitutes !== null
                          ? `ตัวจริง ${c.maxStarters} · สำรอง ${c.maxSubstitutes} คน`
                          : "ยังไม่กำหนด"}
                      </strong>
                    </span>
                    {c.isOpen && (
                      <>
                        <span>ผู้สมัคร: <strong className="text-slate-900">{c.totalApplicants} คน</strong></span>
                        <span>
                          รอพิจารณา:{" "}
                          <strong className={c.pendingCount > 0 ? "text-blue-900 font-bold" : "text-slate-600"}>
                            {c.pendingCount} คน
                          </strong>
                        </span>
                      </>
                    )}
                    {c.approvedCount !== undefined && (
                      <span className="text-emerald-800 font-medium">
                        ผ่านการคัดเลือกแล้ว {c.approvedCount} คน
                      </span>
                    )}
                    {c.returnedCount !== undefined && c.returnedCount > 0 && (
                      <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        เอกสารถูกตีกลับ {c.returnedCount} ฉบับ
                      </span>
                    )}
                  </div>
                  {!c.isOpen && c.status !== "COMPLETED" && (
                    <p className="text-xs text-slate-500 italic">
                      การรับสมัครรายการนี้ยังไม่เปิดหรือปิดรับแล้ว
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {c.isOpen ? (
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>เข้าดูรายชื่อผู้สมัคร & เอกสาร</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-medium flex items-center gap-1">
                      <span>ไม่สามารถเข้าดูได้</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}