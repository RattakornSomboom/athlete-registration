"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Application = {
  id: string;
  status: string;
  squadType: string | null;
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
  sportEntries: unknown[];
  competitionResults: unknown[];
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
    setSquadChoice(current?.squadType === "main" || current?.squadType === "reserve" ? current.squadType : "");
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

  const handlePrint = () => window.print();

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

  const mainCount = applications.filter(a => (a.status === "STAFF_APPROVED" || a.status === "FINAL_SELECTED") && a.squadType === "main").length;
  const reserveCount = applications.filter(a => (a.status === "STAFF_APPROVED" || a.status === "FINAL_SELECTED") && a.squadType === "reserve").length;
  const pendingCount = applications.filter(a => a.status === "CLUB_APPROVED").length;
  const detailAthlete = applications.find(a => a.id === detailId);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-modal { position: static !important; background: white !important; padding: 0 !important; }
          .print-card { box-shadow: none !important; border: none !important; max-height: none !important; overflow: visible !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-full lg:max-w-7xl mx-auto">

          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
            >
              ← ย้อนกลับ
            </button>
            <div className="flex items-start justify-between">
              <div>
                {competition?.club && (
                  <p className="text-sm text-blue-600 font-medium mb-1">{competition.club.name}</p>
                )}
                <h1 className="text-2xl font-semibold text-gray-900">{competition?.name || "กำลังโหลด..."}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  ตัวจริง {mainCount} คน · ตัวสำรอง {reserveCount} คน · รอพิจารณา {pendingCount} คน
                </p>
              </div>

            </div>
          </div>

          {/* รายชื่อผู้สมัคร */}
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              ยังไม่มีผู้สมัคร
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => {
                const profile = a.user.profile;
                if (!profile) return null;
                const isPending = a.status === "CLUB_APPROVED";
                const isApproved = a.status === "STAFF_APPROVED" || a.status === "FINAL_SELECTED";
                const isRejected = a.status === "STAFF_REJECTED";
                
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* ชื่อ + สถานะ — กดดูรายละเอียด */}
                      <button
                        onClick={() => setDetailId(a.id)}
                        className="flex-1 text-left hover:bg-gray-50 -m-1 p-1 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900">{profile.firstName} {profile.lastName}</span>
                          <span className="text-gray-400 text-sm">#{a.user.studentId}</span>
                          {isPending && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800">รอพิจารณา</span>
                          )}
                          {isApproved && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.squadType === "main" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-700"}`}>
                              {a.squadType === "main" ? "ตัวจริง" : a.squadType === "reserve" ? "ตัวสำรอง" : "ผ่านการพิจารณา"}
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800">ไม่ผ่าน</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>{profile.faculty} — {a.category}{a.division ? ` (รุ่น ${a.division})` : ''}</p>
                        </div>
                      </button>

                      {/* ปุ่มพิจารณา */}
                      {isPending && (
                        <div className="flex flex-col gap-2 shrink-0">
                          {showRejectInput === a.id ? (
                            <div className="flex flex-col gap-2 min-w-48">
                              <input
                                className="w-full px-3 py-1.5 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                placeholder="ระบุเหตุผล (เอกสารไม่ครบ, ฯลฯ)"
                                value={rejectReasonInput[a.id] || ""}
                                onChange={(e) => setRejectReasonInput((prev) => ({ ...prev, [a.id]: e.target.value }))}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => setShowRejectInput(null)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors">ยกเลิก</button>
                                <button onClick={() => handleReject(a.id, rejectReasonInput[a.id] || "")} disabled={!rejectReasonInput[a.id]} className="flex-1 px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs transition-colors">ยืนยัน</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => setShowRejectInput(a.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                              <button onClick={() => openSquadModal(a.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                            </div>
                          )}
                        </div>
                      )}
                      {isApproved && (
                        <button onClick={() => openSquadModal(a.id)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors shrink-0">
                          เปลี่ยนตัวจริง/สำรอง
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal รายละเอียดใบสมัครเต็ม */}
        {detailAthlete && detailAthlete.user.profile && (
          <div className="print-modal fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto print-card">
              <div className="flex items-start justify-between mb-4 no-print">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{detailAthlete.user.profile.firstName} {detailAthlete.user.profile.lastName}</h2>
                  <p className="text-gray-500 text-sm">#{detailAthlete.user.studentId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
                    🖨️ พิมพ์ PDF
                  </button>
                  <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
              </div>

              {/* หัวเรื่องสำหรับพิมพ์ */}
              <div className="hidden print:block mb-4 text-center border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">ใบสมัครนักกีฬา — {detailAthlete.user.profile.firstName} {detailAthlete.user.profile.lastName}</h2>
                <p className="text-gray-500 text-sm">รหัสนิสิต {detailAthlete.user.studentId} · {competition?.name} · กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52</p>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ข้อมูลส่วนตัว</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-gray-500">คณะ</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.faculty}</p></div>
                    <div><span className="text-gray-500">สาขา</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.major}</p></div>
                    <div><span className="text-gray-500">ระดับ/ชั้นปี</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.studentLevel === "BACHELOR" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปี {detailAthlete.user.profile.year}</p></div>
                    <div><span className="text-gray-500">เลขบัตรประชาชน</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.nationalId}</p></div>
                    <div><span className="text-gray-500">สัญชาติ</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.nationality}</p></div>
                    <div><span className="text-gray-500">เกรดเฉลี่ย (ภาคล่าสุด)</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.gpaSemester || "-"}</p></div>
                    <div><span className="text-gray-500">เกรดเฉลี่ยสะสม</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.gpaCumulative || "-"}</p></div>
                    <div><span className="text-gray-500">เบอร์โทรศัพท์</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.user.profile.phone}</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ข้อมูลการสมัคร</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-gray-500">ตำแหน่ง/ประเภท</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.category}</p></div>
                    <div><span className="text-gray-500">รุ่น</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.division || "-"}</p></div>
                  </div>
                </div>

                {/* เอกสารแนบ */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">เอกสารแนบ</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {detailAthlete.photoFileUrl && (
                      <a href={detailAthlete.photoFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                        <span className="text-xl">🖼️</span>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-medium text-gray-900">รูปถ่าย</p>
                          <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                        </div>
                      </a>
                    )}
                    {detailAthlete.idCardFileUrl && (
                      <a href={detailAthlete.idCardFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                        <span className="text-xl">📄</span>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-medium text-gray-900">สำเนาบัตร ปชช.</p>
                          <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                        </div>
                      </a>
                    )}
                    {detailAthlete.studentCardFileUrl && (
                      <a href={detailAthlete.studentCardFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                        <span className="text-xl">📄</span>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-medium text-gray-900">สำเนาบัตรนิสิต</p>
                          <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                        </div>
                      </a>
                    )}
                    {detailAthlete.studentCertFileUrl && (
                      <a href={detailAthlete.studentCertFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                        <span className="text-xl">📄</span>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-medium text-gray-900">ใบรับรองนิสิต</p>
                          <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                        </div>
                      </a>
                    )}
                    {detailAthlete.upAcademyFileUrl && (
                      <a href={detailAthlete.upAcademyFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                        <span className="text-xl">📄</span>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-medium text-gray-900">UP Academy</p>
                          <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                        </div>
                      </a>
                    )}
                    {detailAthlete.fitnessTestFileUrl && (
                      <a href={detailAthlete.fitnessTestFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                        <span className="text-xl">📊</span>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-medium text-gray-900">ผลทดสอบสมรรถภาพ</p>
                          <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
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

                {detailAthlete.note && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">หมายเหตุ</h3>
                    <p className="text-sm text-gray-700">{detailAthlete.note}</p>
                  </div>
                )}
              </div>

              {/* ปุ่มพิจารณาใน Modal */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 no-print">
                {detailAthlete.status === "CLUB_APPROVED" && (
                  <>
                    {showRejectInput === detailAthlete.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                          placeholder="ระบุเหตุผลที่ไม่ผ่าน (เอกสารไม่ครบ, ฯลฯ)"
                          value={rejectReasonInput[detailAthlete.id] || ""}
                          onChange={(e) => setRejectReasonInput((prev) => ({ ...prev, [detailAthlete.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setShowRejectInput(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm transition-colors">ยกเลิก</button>
                          <button onClick={() => { handleReject(detailAthlete.id, rejectReasonInput[detailAthlete.id] || ""); setDetailId(null); }} disabled={!rejectReasonInput[detailAthlete.id]} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm transition-colors">ยืนยันไม่ผ่าน</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setShowRejectInput(detailAthlete.id)} className="flex-1 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                        <button onClick={() => { setDetailId(null); openSquadModal(detailAthlete.id); }} className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                      </>
                    )}
                  </>
                )}
                {detailAthlete.status !== "CLUB_APPROVED" && (
                  <button onClick={() => setDetailId(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">ปิด</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal เลือกตัวจริง/ตัวสำรอง */}
        {squadModalId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">เลือกสถานะนักกีฬา</h2>
              <p className="text-gray-500 text-sm mb-4">
                {applications.find((a) => a.id === squadModalId)?.user.profile?.firstName} {applications.find((a) => a.id === squadModalId)?.user.profile?.lastName}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button type="button" onClick={() => setSquadChoice("main")} className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${squadChoice === "main" ? "bg-green-600 text-white border-green-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ตัวจริง</button>
                <button type="button" onClick={() => setSquadChoice("reserve")} className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${squadChoice === "reserve" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>ตัวสำรอง</button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setSquadModalId(null); setSquadChoice(""); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">ยกเลิก</button>
                <button onClick={handleApprove} disabled={!squadChoice} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">ยืนยัน</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
