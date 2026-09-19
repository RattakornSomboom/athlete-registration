"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { MOCK_ALL_APPLICANTS, RawApplicant } from "@/lib/analytics-data";
import { exportAthletesToCSV, AthleteExportRow } from "@/lib/export-helpers";

type Club = {
  id: string;
  name: string;
  sport: string;
  presidentName: string;
  totalCompetitions: number;
  pendingApplicants: number;
  totalApplicants: number;
};

// TODO: ดึงจาก database จริงตอน Backend พร้อม
const MOCK_CLUBS: Club[] = [
  {
    id: "football",
    name: "ชมรมฟุตบอล",
    sport: "ฟุตบอล",
    presidentName: "นายสมชาย ใจดี",
    totalCompetitions: 2,
    pendingApplicants: 8,
    totalApplicants: 22,
  },
  {
    id: "basketball",
    name: "ชมรมบาสเกตบอล",
    sport: "บาสเกตบอล",
    presidentName: "นางสาวสมหญิง รักดี",
    totalCompetitions: 2,
    pendingApplicants: 3,
    totalApplicants: 18,
  },
  {
    id: "volleyball",
    name: "ชมรมวอลเลย์บอล",
    sport: "วอลเลย์บอล",
    presidentName: "-",
    totalCompetitions: 1,
    pendingApplicants: 0,
    totalApplicants: 0,
  },
  {
    id: "swimming",
    name: "ชมรมว่ายน้ำ",
    sport: "ว่ายน้ำ",
    presidentName: "นายธนา มั่งมี",
    totalCompetitions: 3,
    pendingApplicants: 5,
    totalApplicants: 14,
  },
];

export default function StaffApplicationsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"clubs" | "all_applicants">("clubs");
  const [search, setSearch] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSquad, setSelectedSquad] = useState("all");

  const totalPending = MOCK_CLUBS.reduce((sum, c) => sum + c.pendingApplicants, 0);

  const filteredApplicants = useMemo(() => {
    return MOCK_ALL_APPLICANTS.filter((a) => {
      const matchSearch = `${a.firstName} ${a.lastName} ${a.studentId} ${a.faculty}`.toLowerCase().includes(search.toLowerCase());
      const matchSport = selectedSport === "all" || a.sportId === selectedSport;
      const matchStatus = selectedStatus === "all" || a.status === selectedStatus;
      const matchSquad = selectedSquad === "all" || a.squadType === selectedSquad;
      return matchSearch && matchSport && matchStatus && matchSquad;
    });
  }, [search, selectedSport, selectedStatus, selectedSquad]);

  const handleExportCSV = () => {
    const rows: AthleteExportRow[] = filteredApplicants.map((a, idx) => ({
      index: idx + 1,
      fullName: `${a.firstName} ${a.lastName}`,
      studentId: a.studentId,
      nationalId: "1-xxxx-xxxxx-xx-x",
      gender: a.gender,
      faculty: a.faculty,
      major: "-",
      studentLevel: a.studentLevel === "bachelor" ? "ปริญญาตรี" : "บัณฑิตศึกษา",
      year: a.year,
      sportName: a.sportName,
      position: a.category,
      squadType: a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ยังไม่จัดประเภท",
      status: a.status === "approved" ? "ผ่านการคัดเลือก" : a.status === "rejected" ? "ไม่ผ่านเกณฑ์" : "รอการพิจารณา",
      gpaCumulative: typeof a.gpaCumulative === "number" ? a.gpaCumulative.toFixed(2) : String(a.gpaCumulative),
      phone: "-",
    }));

    exportAthletesToCSV("บัญชีรายชื่อผู้สมัครรวมทุกชมรม_กกมท52_มพ", rows);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              การบริหารจัดการใบสมัครและคัดเลือกนักกีฬา
            </h1>
            <p className="text-xs text-slate-500">
              กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 · ผู้สมัครรอการพิจารณารวม {totalPending} คน
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/analytics")}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              แดชบอร์ดวิเคราะห์ผล
            </button>
            <button
              onClick={() => router.push("/staff/activities")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              กิจกรรมชมรม
            </button>
            <button
              onClick={() => router.push("/staff/selection")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ประกาศผล
            </button>
            <button
              onClick={() => router.push("/staff/settings")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              ตั้งค่าระบบ
            </button>
          </div>
        </div>

        {/* สรุปภาพรวม */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-slate-900">{MOCK_CLUBS.length}</p>
            <p className="text-xs text-slate-500 mt-1">ชมรมสังกัดทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-slate-700">{totalPending}</p>
            <p className="text-xs text-slate-500 mt-1">ผู้สมัครรอการพิจารณา</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-blue-900">
              {MOCK_CLUBS.reduce((sum, c) => sum + c.totalApplicants, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">ผู้สมัครรวมทุกชนิดกีฬา</p>
          </div>
        </div>

        {/* View Mode Toggle Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("clubs")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === "clubs"
                  ? "bg-blue-900 text-white shadow-2xs font-semibold"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              สรุปรายชื่อแยกตามชมรมกีฬา ({MOCK_CLUBS.length} ชมรม)
            </button>
            <button
              onClick={() => setViewMode("all_applicants")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "all_applicants"
                  ? "bg-blue-900 text-white shadow-2xs font-semibold"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              ตารางใบสมัครรวมทุกชมรม (ข้อ 10)
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${viewMode === "all_applicants" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}>
                {MOCK_ALL_APPLICANTS.length}
              </span>
            </button>
          </div>

          {viewMode === "all_applicants" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                ดาวน์โหลดบัญชีรายชื่อรวม (Excel / CSV)
              </button>
            </div>
          )}
        </div>

        {/* VIEW 1: รายชื่อชมรม */}
        {viewMode === "clubs" && (
          <div className="space-y-3">
            {MOCK_CLUBS.map((club) => (
              <button
                key={club.id}
                onClick={() => router.push(`/staff/applications/${club.id}`)}
                className="w-full text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-400 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-slate-900">{club.name}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {club.sport}
                      </span>
                      {club.pendingApplicants > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-semibold">
                          รอพิจารณา {club.pendingApplicants} คน
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      ประธานชมรม: {club.presidentName} · {club.totalCompetitions} รายการแข่งขัน · ผู้สมัคร {club.totalApplicants} คน
                    </p>
                  </div>
                  <span className="text-slate-400 shrink-0 text-sm">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* VIEW 2: ตารางใบสมัครรวมทุกชมรม (ข้อ 10) */}
        {viewMode === "all_applicants" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, สกุล, รหัสนิสิต, คณะ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-60 focus:ring-2 focus:ring-blue-900 outline-none"
                />

                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                >
                  <option value="all">ชนิดกีฬาทั้งหมด</option>
                  <option value="football">ฟุตบอล</option>
                  <option value="basketball">บาสเกตบอล</option>
                  <option value="volleyball">วอลเลย์บอล</option>
                  <option value="swimming">ว่ายน้ำ</option>
                  <option value="petanque">เปตอง</option>
                  <option value="badminton">แบดมินตัน</option>
                  <option value="thaifencing">ดาบไทย</option>
                  <option value="esports">อีสปอร์ต</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                >
                  <option value="all">สถานะการพิจารณาทั้งหมด</option>
                  <option value="approved">ผ่านการคัดเลือก</option>
                  <option value="pending">รอการพิจารณา</option>
                  <option value="rejected">ไม่ผ่านเกณฑ์</option>
                </select>

                <select
                  value={selectedSquad}
                  onChange={(e) => setSelectedSquad(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                >
                  <option value="all">ประเภทการจัดสรรทั้งหมด</option>
                  <option value="main">นักกีฬาตัวจริง</option>
                  <option value="reserve">นักกีฬาตัวสำรอง</option>
                  <option value="unassigned">ยังไม่ระบุประเภท</option>
                </select>

                {(search || selectedSport !== "all" || selectedStatus !== "all" || selectedSquad !== "all") && (
                  <button
                    onClick={() => { setSearch(""); setSelectedSport("all"); setSelectedStatus("all"); setSelectedSquad("all"); }}
                    className="text-xs text-blue-900 hover:underline cursor-pointer"
                  >
                    ล้างการกรอง
                  </button>
                )}
              </div>

              <div className="text-slate-500 text-[11px]">
                แสดงผล <strong className="text-slate-900">{filteredApplicants.length}</strong> จาก {MOCK_ALL_APPLICANTS.length} รายชื่อ
              </div>
            </div>

            {/* Consolidated Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">ลำดับ</th>
                      <th className="py-3 px-3.5">รหัสนิสิต</th>
                      <th className="py-3 px-3.5">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-3.5">คณะต้นสังกัด</th>
                      <th className="py-3 px-3.5">ชนิดกีฬา / ตำแหน่ง</th>
                      <th className="py-3 px-3.5 text-center">GPAX</th>
                      <th className="py-3 px-3.5 text-center">ประเภทที่จัดสรร</th>
                      <th className="py-3 px-3.5 text-center">ผลการพิจารณา</th>
                      <th className="py-3 px-3.5 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplicants.map((a, idx) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3.5 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-3.5 font-mono font-medium text-slate-700">{a.studentId}</td>
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-900 block">{a.firstName} {a.lastName}</span>
                          <span className="text-[10px] text-slate-400">ระดับ {a.studentLevel === "bachelor" ? "ป.ตรี" : "บัณฑิตศึกษา"} ปี {a.year}</span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">{a.faculty}</td>
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-800 block">{a.sportName}</span>
                          <span className="text-[10px] text-slate-500">{a.category}</span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`font-mono font-bold ${a.gpaCumulative < 2.0 ? "text-rose-600" : "text-slate-800"}`}>
                            {a.gpaCumulative.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            a.squadType === "main"
                              ? "bg-blue-100 text-blue-900"
                              : a.squadType === "reserve"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ยังไม่จัดสรร"}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-medium border ${
                            a.status === "approved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : a.status === "rejected"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {a.status === "approved" ? "ผ่านการคัดเลือก" : a.status === "rejected" ? "ไม่ผ่านเกณฑ์" : "รอการพิจารณา"}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => router.push(`/staff/applications/${a.sportId}/1`)}
                            className="text-xs text-blue-900 hover:underline font-medium cursor-pointer"
                          >
                            ตรวจเอกสาร →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}