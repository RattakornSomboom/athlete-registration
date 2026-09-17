"use client";

import { useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

type Competition = {
  id: string;
  sport: string;
  eventName: string; // รายการแข่งย่อย เช่น "ฟุตบอล 7 คน"
  category: string;
  round: "qualifier" | "final";
  totalApplicants: number;
  pendingCount: number;
  isOpen: boolean;
};

// TODO: ดึงจาก database จริงตอน Backend พร้อม
// สมมติ login เป็นประธานชมรมฟุตบอล ระบบจะ filter แสดงแค่รายการของชมรมตัวเอง (ฟุตบอล)
const MOCK_CLUB_SPORT = "ฟุตบอล";

const MOCK_COMPETITIONS: Competition[] = [
  { id: "1", sport: "ฟุตบอล", eventName: "ฟุตบอล 11 คน", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 22, pendingCount: 8, isOpen: true },
  { id: "2", sport: "ฟุตบอล", eventName: "ฟุตบอล 7 คน", category: "กีฬาบังคับ", round: "qualifier", totalApplicants: 10, pendingCount: 3, isOpen: true },
  { id: "3", sport: "บาสเกตบอล", eventName: "บาสเกตบอล 5 คน", category: "กีฬาบังคับ", round: "final", totalApplicants: 12, pendingCount: 0, isOpen: true },
  { id: "4", sport: "บาสเกตบอล", eventName: "บาสเกตบอล 3x3", category: "กีฬาบังคับ", round: "final", totalApplicants: 6, pendingCount: 0, isOpen: true },
];

const ROUND_LABEL = { qualifier: "รอบคัดเลือกเขตภาคเหนือ", final: "รอบมหกรรม" };

export default function ClubCompetitionsPage() {
  const router = useRouter();

  // filter เฉพาะรายการของกีฬาที่ชมรมนี้รับผิดชอบ
  const clubCompetitions = MOCK_COMPETITIONS.filter((c) => c.sport === MOCK_CLUB_SPORT);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              รายการแข่งขันและประเภทกีฬาที่รับผิดชอบ
            </h1>
            <p className="text-xs text-slate-500">
              ชมรม{MOCK_CLUB_SPORT} — กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/review")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              จัดทำบัญชีรายชื่อส่งกองกิจ
            </button>
            <button
              onClick={() => router.push("/club/activities")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              กิจกรรมชมรม
            </button>
            <button
              onClick={() => router.push("/club/requests")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              คำร้องพิเศษ
            </button>
            <LogoutButton />
          </div>
        </div>

        <div className="space-y-3">
          {clubCompetitions.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              ยังไม่มีรายการแข่งขันสำหรับชมรมนี้ในระบบ
            </div>
          )}
          {clubCompetitions.map((c) => (
            <button
              key={c.id}
              onClick={() => c.isOpen && router.push(`/club/competitions/${c.id}`)}
              disabled={!c.isOpen}
              className={`w-full text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all ${
                c.isOpen ? "hover:border-slate-400 hover:shadow-xs cursor-pointer" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm">{c.eventName}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {c.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {ROUND_LABEL[c.round]}
                    </span>
                    {!c.isOpen && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                        ปิดรับสมัคร
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ผู้สมัครทั้งหมด {c.totalApplicants} คน
                    {c.pendingCount > 0 && <span className="text-slate-900 font-semibold"> · รอการพิจารณาคัดเลือก {c.pendingCount} คน</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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