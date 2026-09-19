"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";
import { exportAthletesToCSV, AthleteExportRow } from "@/lib/export-helpers";

type Application = {
  id: string;
  status: string;
  squadType: "main" | "reserve" | "unassigned" | "" | null;
  category: string;
  division: string | null;
  user: {
    studentId: string;
    profile: {
      firstName: string;
      lastName: string;
      faculty: string;
      major: string;
      year: string;
      studentLevel: string;
      nationalId: string;
      nationality: string;
      birthDate: string;
      gpaSemester: string;
      gpaCumulative: string;
      phone: string;
      addressNo: string;
      subDistrict: string;
      district: string;
      province: string;
      postalCode: string;
    } | null;
  };
  sportEntries: any[];
  competitionResults: any[];
  note: string | null;
  photoFileUrl: string | null;
  idCardFileUrl: string | null;
  studentCardFileUrl: string | null;
  studentCertFileUrl: string | null;
  upAcademyFileUrl: string | null;
  fitnessTestFileUrl: string | null;
  noClubFileUrl: string | null;
  supervisorName: string | null;
  supervisorPosition: string | null;
};

type Competition = {
  name: string;
  sport: string;
  club: { name: string };
};

function evaluateEligibility(a: Application) {
  const issues: string[] = [];
  const gpa = parseFloat(a.user.profile?.gpaCumulative || "0") || 0;

  if (gpa < 2.00) {
    issues.push(`เกรดเฉลี่ยสะสมต่ำกว่าเกณฑ์ (${gpa.toFixed(2)} < 2.00)`);
  }

  return {
    isEligible: issues.length === 0,
    issues,
  };
}

export default function StaffCompetitionApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = params.competitionId as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [squadModalId, setSquadModalId] = useState<string | null>(null);
  const [squadChoice, setSquadChoice] = useState<"main" | "reserve" | "">("");

  const openSquadModal = (id: string) => {
    setSquadModalId(id);
    const current = applications.find((a) => a.id === id);
    setSquadChoice(current?.squadType === "main" || current?.squadType === "reserve" ? current.squadType : "main");
  };

  const fetchData = useCallback(async () => {
    try {
      const [compRes, appsRes] = await Promise.all([
        fetch(`/api/competitions/${competitionId}`),
        fetch(`/api/staff/applications?competitionId=${competitionId}`)
      ]);
      const compData = await compRes.json();
      const appsData = await appsRes.json();
      
      setCompetition(compData.competition);
      setApplications(appsData.applications ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(); 
  }, [fetchData]);

  const handleApprove = async () => {
    if (!squadModalId || !squadChoice) return;
    try {
      const res = await fetch(`/api/applications/${squadModalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "STAFF_APPROVED", 
          label: "อนุมัติโดยเจ้าหน้าที่", 
          by: "staff",
          squadType: squadChoice
        })
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === squadModalId ? { ...a, status: "STAFF_APPROVED", squadType: squadChoice } : a));
        setSquadModalId(null);
        setSquadChoice("");
      } else {
        alert("ดำเนินการไม่สำเร็จ");
      }
    } catch {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!reason.trim()) return;
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "STAFF_REJECTED", label: `ปฏิเสธ: ${reason}`, by: "staff" })
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "STAFF_REJECTED" } : a));
        setShowRejectInput(null);
      } else {
        alert("ดำเนินการไม่สำเร็จ");
      }
    } catch {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  const handleExportCSV = () => {
    const rows: AthleteExportRow[] = applications.map((a, idx) => ({
      index: idx + 1,
      fullName: `${a.user.profile?.firstName || ""} ${a.user.profile?.lastName || ""}`,
      studentId: a.user.studentId,
      nationalId: a.user.profile?.nationalId || "",
      gender: "", // No gender field in profile currently
      faculty: a.user.profile?.faculty || "",
      major: a.user.profile?.major || "",
      studentLevel: a.user.profile?.studentLevel === "BACHELOR" ? "ปริญญาตรี" : "บัณฑิตศึกษา",
      year: a.user.profile?.year || "",
      sportName: competition?.name || "",
      position: a.category,
      squadType: a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ยังไม่ได้ระบุ",
      status: a.status === "STAFF_APPROVED" || a.status === "FINAL_SELECTED" ? "ผ่านการคัดเลือก" : a.status === "STAFF_REJECTED" ? "ไม่ผ่านเกณฑ์" : "รอการพิจารณา",
      gpaCumulative: a.user.profile?.gpaCumulative || "",
      phone: a.user.profile?.phone || "",
    }));

    exportAthletesToCSV(`บัญชีรายชื่อนักกีฬา_${competition?.club?.name || "ชมรม"}_${competition?.name || "รายการ"}`, rows);
  };

  const mainCount = applications.filter(a => (a.status === "STAFF_APPROVED" || a.status === "FINAL_SELECTED") && a.squadType === "main").length;
  const reserveCount = applications.filter(a => (a.status === "STAFF_APPROVED" || a.status === "FINAL_SELECTED") && a.squadType === "reserve").length;
  const pendingCount = applications.filter(a => a.status === "CLUB_APPROVED").length;
  const detailAthlete = applications.find(a => a.id === detailId);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · {competition?.club?.name || "กำลังโหลด..."}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{competition?.name || "กำลังโหลด..."}</h1>
            <p className="text-xs text-slate-500">
              ตัวจริง {mainCount} คน · ตัวสำรอง {reserveCount} คน · รอการพิจารณา {pendingCount} คน
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ดาวน์โหลดบัญชีรายชื่อ (Excel / CSV)
            </button>
            <button
              onClick={() => router.back()}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ย้อนกลับ
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-400 block">นักกีฬาตัวจริง</span>
            <span className="text-2xl font-bold text-blue-900">{mainCount} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-400 block">นักกีฬาตัวสำรอง</span>
            <span className="text-2xl font-bold text-emerald-800">{reserveCount} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-400 block">รอการพิจารณา</span>
            <span className="text-2xl font-bold text-slate-700">{pendingCount} คน</span>
          </div>
        </div>

        {/* Applicants List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลด...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm shadow-xs">
            ยังไม่มีผู้สมัครที่ผ่านการพิจารณาจากชมรม
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                รายชื่อผู้สมัครเข้ารับการคัดเลือก
              </h2>
              <span className="text-xs text-slate-500">
                คลิกที่ชื่อเพื่อดูเอกสารประวัติแบบละเอียด
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {applications.map((a) => {
                const profile = a.user.profile;
                if (!profile) return null;
                const isPending = a.status === "CLUB_APPROVED";
                const isApproved = a.status === "STAFF_APPROVED" || a.status === "FINAL_SELECTED";
                const isRejected = a.status === "STAFF_REJECTED";
                const ruleCheck = evaluateEligibility(a);
                
                return (
                  <div key={a.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div
                      onClick={() => setDetailId(a.id)}
                      className="flex-1 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                          {profile.firstName} {profile.lastName}
                        </span>
                        <span className="font-mono text-xs text-slate-500">#{a.user.studentId}</span>

                        {/* Squad badge */}
                        {isApproved && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            a.squadType === "main" ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ผ่านการพิจารณา"}
                          </span>
                        )}

                        {isRejected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800">
                            ไม่ผ่านเกณฑ์
                          </span>
                        )}

                        {isPending && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            รอการพิจารณา
                          </span>
                        )}

                        {/* Rule Checker Badge */}
                        {ruleCheck.isEligible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            คุณสมบัติตรงตามเกณฑ์ กกมท.
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            เสี่ยงผิดระเบียบ กกมท. ({ruleCheck.issues.join(", ")})
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500">
                        {profile.faculty} · ตำแหน่ง: {a.category} · เกรดเฉลี่ยสะสม: <strong className={parseFloat(profile.gpaCumulative) < 2 ? "text-rose-600" : "text-slate-800"}>{profile.gpaCumulative}</strong>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <>
                          {showRejectInput === a.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="ระบุเหตุผลที่ไม่ผ่าน..."
                                value={rejectReasonInput[a.id] || ""}
                                onChange={(e) => setRejectReasonInput((prev) => ({ ...prev, [a.id]: e.target.value }))}
                                className="bg-slate-50 border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg outline-none w-48"
                              />
                              <button
                                onClick={() => handleReject(a.id, rejectReasonInput[a.id] || "")}
                                className="bg-rose-700 hover:bg-rose-800 text-white text-xs px-2.5 py-1.5 rounded-lg cursor-pointer"
                              >
                                ยืนยัน
                              </button>
                              <button
                                onClick={() => setShowRejectInput(null)}
                                className="border border-slate-300 text-slate-600 text-xs px-2 py-1.5 rounded-lg cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setShowRejectInput(a.id)}
                                className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                ไม่ผ่าน
                              </button>
                              <button
                                onClick={() => openSquadModal(a.id)}
                                className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                อนุมัติ
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => openSquadModal(a.id)}
                          className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          เปลี่ยนตัวจริง / สำรอง
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal: เลือกสถานะตัวจริง / สำรอง */}
        {squadModalId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl border border-slate-300 max-w-sm w-full p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">กำหนดสถานะนักกีฬาตัวแทน</h3>
                <p className="text-xs text-slate-500 mt-0.5">เลือกประเภทบัญชีรายชื่อที่จะนำส่ง กกมท.</p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="squad"
                    value="main"
                    checked={squadChoice === "main"}
                    onChange={(e) => setSquadChoice("main")}
                    className="text-blue-900 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">นักกีฬาตัวจริง (Main Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนในรายชื่อหลักที่เข้าแข่งขัน</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="squad"
                    value="reserve"
                    checked={squadChoice === "reserve"}
                    onChange={(e) => setSquadChoice("reserve")}
                    className="text-blue-900 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนทดแทนกรณีตัวจริงสละสิทธิ์หรือบาดเจ็บ</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setSquadModalId(null); setSquadChoice(""); }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!squadChoice}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 rounded-md cursor-pointer"
                >
                  บันทึกผล
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: รายละเอียดใบสมัครเต็ม */}
        {detailAthlete && detailAthlete.user.profile && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl border border-slate-300 max-w-2xl w-full p-6 space-y-4 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-mono">รหัสนิสิต {detailAthlete.user.studentId}</span>
                  <h2 className="text-base font-bold text-slate-900">{detailAthlete.user.profile.firstName} {detailAthlete.user.profile.lastName}</h2>
                </div>
                <button onClick={() => setDetailId(null)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
              </div>

              {/* ข้อมูลทั่วไป */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">คณะ / สาขาวิชา</span>
                  <span className="font-semibold text-slate-900">{detailAthlete.user.profile.faculty} · {detailAthlete.user.profile.major}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เลขประจำตัวประชาชน</span>
                  <span className="font-semibold text-slate-900 font-mono">{detailAthlete.user.profile.nationalId}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">ระดับการศึกษา / ชั้นปี</span>
                  <span className="font-semibold text-slate-900">{detailAthlete.user.profile.studentLevel === "BACHELOR" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปีที่ {detailAthlete.user.profile.year}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เกรดเฉลี่ยสะสม (GPAX)</span>
                  <span className="font-semibold text-slate-900 font-mono">{detailAthlete.user.profile.gpaCumulative}</span>
                </div>
              </div>

              {/* ประวัติผลงานการแข่งขัน */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ประวัติผลงานการแข่งขันที่ผ่านมา</h4>
                {detailAthlete.competitionResults.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลผลงานที่ระบุ</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailAthlete.competitionResults.map((c: any, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded text-xs flex justify-between">
                        <span className="font-medium text-slate-800">{c.name} (ปี {c.year})</span>
                        <span className="font-semibold text-blue-900">{c.result}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* เอกสารแนบ */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">เอกสารแนบ</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {detailAthlete.photoFileUrl && (
                    <a href={detailAthlete.photoFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">🖼️</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-slate-900">รูปถ่าย</p>
                        <p className="text-[10px] text-slate-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {detailAthlete.idCardFileUrl && (
                    <a href={detailAthlete.idCardFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-slate-900">สำเนาบัตร ปชช.</p>
                        <p className="text-[10px] text-slate-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {detailAthlete.studentCardFileUrl && (
                    <a href={detailAthlete.studentCardFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-slate-900">สำเนาบัตรนิสิต</p>
                        <p className="text-[10px] text-slate-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {detailAthlete.studentCertFileUrl && (
                    <a href={detailAthlete.studentCertFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-slate-900">ใบรับรองนิสิต</p>
                        <p className="text-[10px] text-slate-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {detailAthlete.upAcademyFileUrl && (
                    <a href={detailAthlete.upAcademyFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-slate-900">UP Academy</p>
                        <p className="text-[10px] text-slate-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {detailAthlete.fitnessTestFileUrl && (
                    <a href={detailAthlete.fitnessTestFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📊</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-slate-900">ผลทดสอบสมรรถภาพ</p>
                        <p className="text-[10px] text-slate-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {detailAthlete.noClubFileUrl && (
                    <a href={detailAthlete.noClubFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-amber-900">หนังสือรับรอง (ไม่มีชมรม)</p>
                        <p className="text-[10px] text-amber-700 truncate">{detailAthlete.supervisorName || "ดูเอกสาร"}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDetailId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
