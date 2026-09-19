"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import {
  SPORTS_CATALOG,
  MOCK_ALL_APPLICANTS,
  computeMetrics,
  getSportComparisonData,
  getFacultyDistribution,
  getGenderDistribution,
  getStatusDistribution,
  getCategoryCompliance,
} from "@/lib/analytics-data";
import {
  getSnapshots,
  saveSnapshot,
  deleteSnapshot,
  AnalyticsSnapshot,
} from "@/lib/snapshot-store";
import { exportAthletesToCSV, AthleteExportRow } from "@/lib/export-helpers";

// ปฏิทินและกำหนดการสำคัญอ้างอิงเอกสารทางการ กกมท. ครั้งที่ 52
const OFFICIAL_CALENDAR_MILESTONES = [
  {
    title: "เปิดระบบรับสมัครนักกีฬาและคัดเลือกตัวแทน",
    dateRange: "15 ม.ค. - 28 ก.พ. 2568",
    status: "completed",
    statusLabel: "เสร็จสิ้น",
    responsible: "ชมรมกีฬาและกองกิจการนิสิต",
  },
  {
    title: "ส่งบัญชีรายชื่อนักกีฬาและเจ้าหน้าที่ทีม (รอบคัดเลือกเขตภาคเหนือ)",
    dateRange: "1 - 15 ก.ย. 2569",
    status: "upcoming",
    statusLabel: "กำลังจะมาถึง",
    responsible: "กองกิจการนิสิต มหาวิทยาลัยพะเยา",
  },
  {
    title: "การแข่งขันกีฬามหาวิทยาลัยฯ รอบคัดเลือกเขตภาคเหนือ",
    dateRange: "24 - 29 ต.ค. 2569",
    status: "pending",
    statusLabel: "ตามกำหนดการ",
    responsible: "มหาวิทยาลัยราชภัฏนครสวรรค์ (เจ้าภาพ)",
  },
  {
    title: "ส่งบัญชีรายชื่อรอบมหกรรม กีฬามหาวิทยาลัยฯ ครั้งที่ 52",
    dateRange: "15 - 30 พ.ย. 2569",
    status: "pending",
    statusLabel: "ตามกำหนดการ",
    responsible: "กองกิจการนิสิต สู่ระบบสารสนเทศ กกมท.",
  },
  {
    title: "การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 รอบมหกรรม",
    dateRange: "มกราคม 2570",
    status: "pending",
    statusLabel: "ตามกำหนดการ",
    responsible: "มหาวิทยาลัยเชียงใหม่ (เจ้าภาพรอบมหกรรม)",
  },
];

export default function StaffAnalyticsPage() {
  const router = useRouter();

  // State สำหรับการกรอง (Filters)
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"current" | "calendar" | "history">("current");
  const [facultyViewMode, setFacultyViewMode] = useState<"chart" | "table">("chart");

  // State สำหรับ Snapshots
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [snapshotTitle, setSnapshotTitle] = useState<string>("");
  const [snapshotYear, setSnapshotYear] = useState<string>("2568");
  const [snapshotRound, setSnapshotRound] = useState<string>("กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52");
  const [snapshotNotes, setSnapshotNotes] = useState<string>("");
  const [selectedHistoricalSnapshot, setSelectedHistoricalSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  useEffect(() => {
    setSnapshots(getSnapshots());
  }, []);

  // กรองข้อมูลตามที่เลือก
  const filteredSports = useMemo(() => {
    return SPORTS_CATALOG.filter((s) => {
      if (selectedCategory !== "all" && s.categoryType !== selectedCategory) return false;
      if (selectedSport !== "all" && s.id !== selectedSport) return false;
      return true;
    });
  }, [selectedCategory, selectedSport]);

  const filteredApplicants = useMemo(() => {
    const validSportIds = new Set(filteredSports.map((s) => s.id));
    return MOCK_ALL_APPLICANTS.filter((a) => validSportIds.has(a.sportId));
  }, [filteredSports]);

  // คำนวณ Metrics สด
  const metrics = useMemo(() => {
    return computeMetrics(filteredApplicants, filteredSports);
  }, [filteredApplicants, filteredSports]);

  const sportComparison = useMemo(() => {
    return getSportComparisonData(filteredApplicants, filteredSports);
  }, [filteredApplicants, filteredSports]);

  const facultyData = useMemo(() => {
    return getFacultyDistribution(filteredApplicants);
  }, [filteredApplicants]);

  const genderData = useMemo(() => {
    return getGenderDistribution(filteredApplicants);
  }, [filteredApplicants]);

  const statusData = useMemo(() => {
    return getStatusDistribution(filteredApplicants);
  }, [filteredApplicants]);

  const complianceData = useMemo(() => {
    return getCategoryCompliance(SPORTS_CATALOG);
  }, []);

  const handleSaveSnapshot = () => {
    if (!snapshotTitle.trim()) return;

    saveSnapshot({
      title: snapshotTitle,
      academicYear: snapshotYear,
      roundName: snapshotRound,
      authorName: "งานกีฬา กองกิจการนิสิต มหาวิทยาลัยพะเยา",
      metrics,
      notes: snapshotNotes,
      sportsSummary: sportComparison.map((s) => ({
        sportName: s.sportName,
        applicants: s.applicants,
        approved: s.approved,
        quota: s.quota,
      })),
    });

    setSnapshots(getSnapshots());
    setShowSaveModal(false);
    setSnapshotTitle("");
    setSnapshotNotes("");
    setSaveSuccessMsg("บันทึกภาพรวมข้อมูล (Snapshot) เข้าฐานข้อมูลเรียบร้อยแล้ว");
    setTimeout(() => setSaveSuccessMsg(""), 4000);
  };

  const handleDeleteSnapshot = (id: string) => {
    if (confirm("ยืนยันการลบรายการสรุปผลนี้ออกจากระบบฐานข้อมูล?")) {
      deleteSnapshot(id);
      setSnapshots(getSnapshots());
      if (selectedHistoricalSnapshot?.id === id) {
        setSelectedHistoricalSnapshot(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/" label="กลับหน้าแรก" />
          <LogoutButton />
        </div>

        {/* 1. Header & Navigation (Formal University Theme) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded border border-slate-200">
                กองกิจการนิสิต มหาวิทยาลัยพะเยา
              </span>
              <span className="text-xs text-slate-400">ระบบสารสนเทศการกีฬาและการรับสมัครตัวแทนสถาบัน</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              ระบบวิเคราะห์ข้อมูลและสรุปผลการคัดเลือกนักกีฬาตัวแทนสถาบัน
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 · การวิเคราะห์ตามระเบียบข้อบังคับ กกมท.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/staff/applications")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              จัดการใบสมัคร
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
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ตั้งค่าระบบ
            </button>
          </div>
        </div>

        {/* แจ้งเตือนเมื่อบันทึกสำเร็จ */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between text-xs shadow-xs">
            <span>{saveSuccessMsg}</span>
            <button onClick={() => setSaveSuccessMsg("")} className="text-emerald-700 font-bold hover:underline">
              ปิด
            </button>
          </div>
        )}

        {/* 2. Main Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab("current"); setSelectedHistoricalSnapshot(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "current"
                  ? "bg-blue-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              ภาพรวมและสถิติการคัดเลือกรอบปัจจุบัน
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-blue-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              ปฏิทินและกำหนดการแข่งขัน กกมท.
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "history"
                  ? "bg-blue-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              คลังข้อมูลสรุปผลย้อนหลัง
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "history" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}>
                {snapshots.length}
              </span>
            </button>
          </div>

          {activeTab === "current" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
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
                    gpaCumulative: (typeof a.gpaCumulative === "number" ? a.gpaCumulative.toFixed(2) : String(a.gpaCumulative || "0.00")),
                    phone: "-",
                  }));
                  exportAthletesToCSV("บัญชีรายชื่อนักกีฬาทั้งหมด_กกมท52_มพ", rows);
                }}
                className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                ดาวน์โหลดรายชื่อรวม (Excel / CSV)
              </button>
              <button
                onClick={() => window.print()}
                className="border border-slate-300 hover:bg-slate-100 bg-white text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                พิมพ์เอกสารรายงาน
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                บันทึกผลการวิเคราะห์เข้าฐานข้อมูล
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ข้อมูลปัจจุบันและการวิเคราะห์ (Visualizations) */}
        {/* ============================================================ */}
        {activeTab === "current" && (
          <div className="space-y-6">

            {/* แถบตัวกรอง (Filters Bar) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ตัวกรองข้อมูล:</span>

                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSport("all");
                  }}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-800 outline-none"
                >
                  <option value="all">หมวดหมู่กีฬาทั้งหมด</option>
                  <option value="mandatory">กีฬาบังคับ (ข้อ 9.1)</option>
                  <option value="international">กีฬาเลือกสากล (ข้อ 9.2)</option>
                  <option value="thai">กีฬาไทย (ข้อ 9.4)</option>
                  <option value="demonstration">กีฬาสาธิต (ข้อ 9.6)</option>
                </select>

                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-800 outline-none"
                >
                  <option value="all">ชนิดกีฬาทั้งหมด ({filteredSports.length} ชนิด)</option>
                  {filteredSports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.categoryLabel})
                    </option>
                  ))}
                </select>

                {(selectedCategory !== "all" || selectedSport !== "all") && (
                  <button
                    onClick={() => { setSelectedCategory("all"); setSelectedSport("all"); }}
                    className="text-xs text-blue-800 hover:underline cursor-pointer"
                  >
                    ล้างการกรอง
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500">
                ข้อมูลผู้สมัคร <span className="font-semibold text-slate-900">{filteredApplicants.length}</span> รายการ
              </div>
            </div>

            {/* KPI Cards สรุปตัวเลขบริหาร */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: ผู้สมัครทั้งหมด */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-medium text-slate-500 block">ผู้สมัครเข้ารับการคัดเลือก</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{metrics.totalApplicants}</span>
                  <span className="text-xs text-slate-500">คน</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  รอพิจารณา {metrics.pendingCount} คน · ไม่ผ่านเกณฑ์ {metrics.rejectedCount} คน
                </div>
              </div>

              {/* Card 2: ผ่านการคัดเลือก */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-medium text-slate-500 block">ผ่านการคัดเลือกเป็นตัวแทน</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-800">{metrics.approvedCount}</span>
                  <span className="text-xs font-semibold text-emerald-700">({metrics.acceptanceRate}%)</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  ตัวจริง <span className="font-semibold text-slate-800">{metrics.mainSquadCount}</span> คน · สำรอง <span className="font-semibold text-slate-800">{metrics.reserveSquadCount}</span> คน
                </div>
              </div>

              {/* Card 3: สัดส่วนการเติมเต็มโควตา */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-medium text-slate-500 block">อัตราการเติมเต็มโควตานักกีฬา</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-blue-900">{metrics.quotaFilledPercentage}%</span>
                  <span className="text-xs text-slate-500">จากโควตาสูงสุด {metrics.totalQuota} คน</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  คัดเลือกได้แล้ว {metrics.approvedCount} / {metrics.totalQuota} ตำแหน่ง
                </div>
              </div>

              {/* Card 4: งบประมาณการสนับสนุน */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-medium text-slate-500 block">งบประมาณสนับสนุนกิจกรรมกีฬา</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    ฿{(metrics.totalBudgetUsed).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  กรอบงบประมาณ ฿{(metrics.totalBudgetAllocated).toLocaleString()} ({metrics.budgetUtilizationRate}%)
                </div>
              </div>

            </div>

            {/* แถวชาร์ต 1: การเปรียบเทียบตามชนิดกีฬา */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ชาร์ตเปรียบเทียบผู้สมัคร vs ผ่านคัดเลือก vs โควตา */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      สถิติเปรียบเทียบ จำนวนผู้สมัคร vs ผู้ผ่านการคัดเลือก vs โควตาสูงสุด
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      แสดงอัตราการเติมเต็มโควตานักกีฬาในแต่ละชนิดกีฬาตามประกาศ
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block"></span> ผู้สมัคร</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-blue-900 inline-block"></span> ผ่านคัดเลือก</span>
                  </div>
                </div>

                {/* Progress Comparison List */}
                <div className="space-y-4 mt-4">
                  {sportComparison.map((item) => {
                    const maxScale = Math.max(...sportComparison.map((s) => Math.max(s.applicants, s.quota)), 25);
                    const appPct = (item.applicants / maxScale) * 100;
                    const approvedPct = (item.approved / maxScale) * 100;

                    return (
                      <div key={item.sportName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {item.sportName}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal border border-slate-200">
                              {item.categoryLabel}
                            </span>
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            ผ่านเกณฑ์ <strong className="text-blue-900">{item.approved}</strong> / โควตา <strong>{item.quota}</strong> (สมัคร {item.applicants} คน)
                          </span>
                        </div>

                        {/* Bars */}
                        <div className="h-4 bg-slate-100 rounded-sm p-0.5 flex flex-col justify-center gap-0.5">
                          <div className="w-full bg-slate-200 rounded-xs h-1.5 overflow-hidden">
                            <div
                              className="bg-slate-400 h-full rounded-xs"
                              style={{ width: `${Math.min(appPct, 100)}%` }}
                              title={`ผู้สมัคร: ${item.applicants} คน`}
                            />
                          </div>
                          <div className="w-full bg-slate-200 rounded-xs h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-900 h-full rounded-xs"
                              style={{ width: `${Math.min(approvedPct, 100)}%` }}
                              title={`ผ่านคัดเลือก: ${item.approved} คน`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                          <span>ความพร้อมโควตา: {item.fillRate}%</span>
                          {item.fillRate >= 100 ? (
                            <span className="text-emerald-700 font-medium">ครบตามโควตาแล้ว</span>
                          ) : (
                            <span className="text-slate-500">ขาดอีก {item.quota - item.approved} คน</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ชาร์ตสัดส่วนสถานะการคัดเลือก */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    สัดส่วนผลการตัดสินใบสมัคร
                  </h2>

                  <div className="mt-6 flex flex-col items-center">
                    <div className="w-36 h-36 rounded-full border-4 border-slate-200 flex items-center justify-center p-4">
                      <div className="text-center">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {metrics.totalApplicants}
                        </span>
                        <p className="text-[11px] text-slate-400">ใบสมัครรวม</p>
                      </div>
                    </div>

                    <div className="w-full mt-6 space-y-2">
                      {statusData.map((item) => {
                        const pct = metrics.totalApplicants > 0 ? Math.round((item.value / metrics.totalApplicants) * 100) : 0;
                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded-md">
                            <span className="text-slate-700 font-medium">{item.name}</span>
                            <span className="font-semibold text-slate-900">{item.value} คน ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* สัดส่วนเพศ */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">สัดส่วนนักกีฬาแยกตามเพศ</span>
                  <div className="flex items-center gap-2">
                    {genderData.map((g) => {
                      const pct = metrics.totalApplicants > 0 ? Math.round((g.value / metrics.totalApplicants) * 100) : 0;
                      return (
                        <div
                          key={g.name}
                          className="h-6 rounded-md flex items-center justify-center text-[11px] font-medium text-white"
                          style={{
                            width: `${Math.max(pct, 20)}%`,
                            backgroundColor: g.name === "ชาย" ? "#1e3a8a" : "#be185d",
                          }}
                        >
                          {g.name} {pct}% ({g.value})
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* แถวชาร์ต 2: สถิติแยกตามคณะ & ความสอดคล้องระเบียบกีฬา */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* การกระจายตัวตามคณะ (ข้อ 13: แดชบอร์ดสถิติรายคณะ) */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      สถิติการกระจายตัวของนักกีฬาตามคณะ/วิทยาลัย (ข้อ 13: แดชบอร์ดสถิติรายคณะ)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      จำนวนนักศึกษาที่สมัครและได้รับการคัดเลือกเป็นตัวแทนแยกตามคณะต้นสังกัด
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setFacultyViewMode("chart")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        facultyViewMode === "chart" ? "bg-white text-blue-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      แผนภูมิกราฟแท่ง
                    </button>
                    <button
                      onClick={() => setFacultyViewMode("table")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        facultyViewMode === "table" ? "bg-white text-blue-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ตารางสถิติเชิงลึก
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-blue-900 inline-block"></span>
                      ผู้สมัครรวม (คน)
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-emerald-700 inline-block"></span>
                      ผ่านการคัดเลือก (คน)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">เรียงตามจำนวนผู้สมัคร</span>
                </div>

                {/* VIEW 1: กราฟแท่ง (Bar Chart) */}
                {facultyViewMode === "chart" && (
                  <div className="space-y-3.5 pt-1">
                    {facultyData.map((f) => {
                      const maxFacultyCount = Math.max(...facultyData.map((d) => d.total), 8);
                      const totalWidthPct = (f.total / maxFacultyCount) * 100;
                      const approvedWidthPct = (f.approved / maxFacultyCount) * 100;
                      const approvalRate = f.total > 0 ? Math.round((f.approved / f.total) * 100) : 0;

                      return (
                        <div key={f.faculty} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{f.faculty}</span>
                            <span className="text-slate-500 text-[11px]">
                              สมัคร <strong className="text-blue-900 font-mono">{f.total}</strong> คน · ผ่านคัดเลือก <strong className="text-emerald-700 font-mono">{f.approved}</strong> คน ({approvalRate}%)
                            </span>
                          </div>

                          {/* Dual comparative bar */}
                          <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {/* Total Bar */}
                            <div className="w-full bg-slate-200 h-2.5 rounded-xs overflow-hidden">
                              <div
                                className="bg-blue-900 h-full rounded-xs transition-all duration-300"
                                style={{ width: `${totalWidthPct}%` }}
                                title={`สมัครรวม: ${f.total} คน`}
                              />
                            </div>
                            {/* Approved Bar */}
                            <div className="w-full bg-slate-200 h-2.5 rounded-xs overflow-hidden">
                              <div
                                className="bg-emerald-700 h-full rounded-xs transition-all duration-300"
                                style={{ width: `${approvedWidthPct}%` }}
                                title={`ผ่านคัดเลือก: ${f.approved} คน`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* VIEW 2: ตารางข้อมูลเชิงลึก (Table) */}
                {facultyViewMode === "table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-2.5 px-3">คณะ / หน่วยงาน</th>
                          <th className="py-2.5 px-3 text-center">ชาย</th>
                          <th className="py-2.5 px-3 text-center">หญิง</th>
                          <th className="py-2.5 px-3 text-center">สมัครรวม</th>
                          <th className="py-2.5 px-3 text-center">ผ่านการคัดเลือก</th>
                          <th className="py-2.5 px-3">สัดส่วนในสถาบัน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {facultyData.map((f) => {
                          const pct = metrics.totalApplicants > 0 ? Math.round((f.total / metrics.totalApplicants) * 100) : 0;
                          return (
                            <tr key={f.faculty} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-slate-900">{f.faculty}</td>
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{f.male}</td>
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{f.female}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-900">{f.total} คน</td>
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-800">{f.approved} คน</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-900 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-slate-400 w-8 text-right text-[11px]">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ความพร้อมตามเกณฑ์ระเบียบ กกมท. */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    การตรวจสอบความพร้อมตามเกณฑ์ กกมท.
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    เกณฑ์การส่งชนิดกีฬาเข้าร่วมการแข่งขันตามข้อบังคับกีฬามหาวิทยาลัยแห่งประเทศไทย
                  </p>

                  <div className="mt-4 space-y-3">
                    {complianceData.map((c) => {
                      const isOk = c.status === "complete";
                      const pct = Math.min(Math.round((c.count / c.required) * 100), 100);
                      return (
                        <div key={c.category} className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{c.label}</span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-medium ${
                              isOk ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                            }`}>
                              {isOk ? "ครบเกณฑ์" : "อยู่ระหว่างดำเนินการ"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>ปัจจุบันจัดส่ง: <strong className="text-slate-900">{c.count}</strong> ชนิด</span>
                            <span>เกณฑ์ขั้นต่ำ: {c.required} ชนิด</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isOk ? "bg-emerald-700" : "bg-slate-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                  <strong>ข้อสังเกตการดำเนินงาน:</strong> ตรวจสอบเอกสารรับรองสถานะภาพนิสิตและผลการเรียนเฉลี่ยสะสมของนักกีฬาทุกรายก่อนนำส่งบัญชีรายชื่อทางการ
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ปฏิทินและกำหนดการแข่งขันสำคัญ (กกมท. ครั้งที่ 52) */}
        {/* ============================================================ */}
        {activeTab === "calendar" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                ปฏิทินและกำหนดการสำคัญ การแข่งขันกีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดการรอบคัดเลือกเขตภาคเหนือ และรอบมหกรรม (Source: คณะกรรมการบริหารกีฬามหาวิทยาลัยแห่งประเทศไทย)
              </p>
            </div>

            <div className="space-y-4">
              {OFFICIAL_CALENDAR_MILESTONES.map((m, idx) => (
                <div key={m.title} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">ผู้รับผิดชอบ: {m.responsible}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 block">{m.dateRange}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-medium ${
                        m.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : m.status === "upcoming"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {m.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: คลังข้อมูลสรุปผลย้อนหลัง (Historical Snapshots) */}
        {/* ============================================================ */}
        {activeTab === "history" && (
          <div className="space-y-6">

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    คลังข้อมูลสรุปผลและรายงานย้อนหลัง (Historical Snapshots)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รายงานสรุปผลที่ถูกบันทึกไว้ในฐานข้อมูล สามารถเปิดดูผลและนำไปจัดทำเอกสารเสนอผู้บริหาร
                  </p>
                </div>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  บันทึก Snapshot ปัจจุบัน
                </button>
              </div>

              {snapshots.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  ไม่มีประวัติการบันทึกสรุปผลในฐานข้อมูล
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${
                        selectedHistoricalSnapshot?.id === snap.id
                          ? "border-blue-800 bg-blue-50/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-400 bg-white"
                      }`}
                      onClick={() => setSelectedHistoricalSnapshot(snap)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            ปีการศึกษา {snap.academicYear}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm mt-1">{snap.title}</h3>
                          <p className="text-xs text-slate-400">{snap.roundName}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSnapshot(snap.id);
                          }}
                          className="text-slate-400 hover:text-rose-700 text-xs p-1"
                          title="ลบรายงาน"
                        >
                          ลบ
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-400 text-[10px]">ผู้สมัคร</p>
                          <p className="font-bold text-slate-800">{snap.metrics.totalApplicants} คน</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-400 text-[10px]">ผ่านคัดเลือก</p>
                          <p className="font-bold text-emerald-800">{snap.metrics.approvedCount} คน</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-400 text-[10px]">โควตาเติมเต็ม</p>
                          <p className="font-bold text-blue-900">{snap.metrics.quotaFilledPercentage}%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3">
                        <span>บันทึกเมื่อ: {new Date(snap.timestamp).toLocaleDateString("th-TH")}</span>
                        <span className="text-blue-900 font-medium">ดูรายละเอียด →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* รายละเอียดของ Snapshot ที่เลือก */}
            {selectedHistoricalSnapshot && (
              <div className="bg-white rounded-xl border border-blue-800 p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                      รายงานย้อนหลัง: ปี {selectedHistoricalSnapshot.academicYear}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-2">
                      {selectedHistoricalSnapshot.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedHistoricalSnapshot.roundName} · บันทึกโดย {selectedHistoricalSnapshot.authorName} เมื่อ {new Date(selectedHistoricalSnapshot.timestamp).toLocaleString("th-TH")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHistoricalSnapshot(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ปิด
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">ผู้สมัครทั้งหมด</p>
                    <p className="text-lg font-bold text-slate-900">{selectedHistoricalSnapshot.metrics.totalApplicants} คน</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">ผ่านการคัดเลือก</p>
                    <p className="text-lg font-bold text-emerald-800">{selectedHistoricalSnapshot.metrics.approvedCount} คน ({selectedHistoricalSnapshot.metrics.acceptanceRate}%)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">ตัวจริง / สำรอง</p>
                    <p className="text-lg font-bold text-slate-900">{selectedHistoricalSnapshot.metrics.mainSquadCount} / {selectedHistoricalSnapshot.metrics.reserveSquadCount} คน</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">งบประมาณที่ใช้</p>
                    <p className="text-lg font-bold text-slate-900">฿{selectedHistoricalSnapshot.metrics.totalBudgetUsed.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    สรุปผลการคัดเลือกแยกตามชนิดกีฬา:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedHistoricalSnapshot.sportsSummary.map((s) => (
                      <div key={s.sportName} className="p-2.5 rounded border border-slate-100 bg-slate-50 text-xs">
                        <div className="font-semibold text-slate-900">{s.sportName}</div>
                        <div className="text-slate-500 mt-1">
                          สมัคร {s.applicants} · ผ่าน <strong className="text-emerald-800">{s.approved}</strong> / {s.quota}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedHistoricalSnapshot.notes && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <strong>บันทึกเพิ่มเติม:</strong> {selectedHistoricalSnapshot.notes}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Modal: บันทึก Snapshot เข้า Database */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl border border-slate-300 max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  บันทึกภาพรวมผลการวิเคราะห์เข้าฐานข้อมูล (Snapshot)
                </h3>
                <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อรายงานสรุปผล <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สรุปผลการคัดเลือกตัวแทนนักศึกษา ประจำปีการศึกษา 2568"
                    value={snapshotTitle}
                    onChange={(e) => setSnapshotTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ปีการศึกษา</label>
                    <input
                      type="text"
                      value={snapshotYear}
                      onChange={(e) => setSnapshotYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">รอบการแข่งขัน</label>
                    <input
                      type="text"
                      value={snapshotRound}
                      onChange={(e) => setSnapshotRound(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บันทึกข้อเสนอแนะและสรุปเชิงบริหาร
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ระบุข้อสังเกต ปัญหา อัตราการเข้าร่วม หรือข้อเสนอแนะสำหรับผู้บริหาร..."
                    value={snapshotNotes}
                    onChange={(e) => setSnapshotNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveSnapshot}
                  disabled={!snapshotTitle.trim()}
                  className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  บันทึกลงฐานข้อมูล
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
