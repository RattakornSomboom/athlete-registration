"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Application = {
  id: string;
  status: string;
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
};

type Competition = {
  name: string;
  sport: string;
};

export default function ClubCompetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectReasonInput, setRejectReasonInput] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [compRes, appsRes] = await Promise.all([
        fetch(`/api/competitions/${competitionId}`),
        fetch(`/api/applications?competitionId=${competitionId}`)
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePrint = () => window.print();

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLUB_APPROVED", label: "ผ่านการคัดเลือกโดยชมรม", by: "club" })
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "CLUB_APPROVED" } : a));
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
        body: JSON.stringify({ status: "CLUB_REJECTED", label: `ไม่ผ่าน: ${reason}`, by: "club" })
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "CLUB_REJECTED" } : a));
        setShowRejectInput(null);
      } else {
        alert("ดำเนินการไม่สำเร็จ");
      }
    } catch {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  const approvedCount = applications.filter(a => a.status !== "SUBMITTED" && a.status !== "CLUB_REJECTED").length;
  const pendingCount = applications.filter(a => a.status === "SUBMITTED").length;
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
            <button onClick={() => router.push("/club/competitions")} className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">← กลับไปรายการแข่งขัน</button>
            <h1 className="text-2xl font-semibold text-gray-900">{competition?.name || "กำลังโหลด..."}</h1>
            <p className="text-gray-500 text-sm mt-1">
              ผ่านพิจารณาแล้ว {approvedCount} คน · รอพิจารณา {pendingCount} คน
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">ยังไม่มีผู้สมัคร</div>
            ) : applications.map((a) => {
              const profile = a.user.profile;
              if (!profile) return null;
              const isPending = a.status === "SUBMITTED";
              const isApproved = a.status !== "SUBMITTED" && a.status !== "CLUB_REJECTED";
              const isRejected = a.status === "CLUB_REJECTED";

              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <button onClick={() => setDetailId(a.id)} className="flex-1 text-left hover:bg-gray-50 -m-1 p-1 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900">{profile.firstName} {profile.lastName}</span>
                        <span className="text-gray-400 text-sm">#{a.user.studentId}</span>
                        {isPending && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800">รอพิจารณา</span>}
                        {isApproved && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                            ผ่าน
                          </span>
                        )}
                        {isRejected && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800">ไม่ผ่าน</span>}
                      </div>
                      <div className="text-sm text-gray-500 space-y-0.5">
                        <p>{profile.faculty} — {a.category}{a.division ? ` (รุ่น ${a.division})` : ''}</p>
                      </div>
                    </button>

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
                            <button onClick={() => handleApprove(a.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ที่อยู่ปัจจุบัน</h3>
                  <p className="text-sm text-gray-900">
                    {detailAthlete.user.profile.addressNo} ตำบล{detailAthlete.user.profile.subDistrict} อำเภอ{detailAthlete.user.profile.district} จังหวัด{detailAthlete.user.profile.province} {detailAthlete.user.profile.postalCode}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">ข้อมูลการสมัคร</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-gray-500">ตำแหน่ง/ประเภท</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.category}</p></div>
                    <div><span className="text-gray-500">รุ่น</span><p className="font-medium text-gray-900 mt-0.5">{detailAthlete.division}</p></div>
                  </div>
                </div>

                {detailAthlete.note && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">หมายเหตุ</h3>
                    <p className="text-sm text-gray-900">{detailAthlete.note}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 no-print">
                {detailAthlete.status === "SUBMITTED" && (
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
                        <button onClick={() => { handleApprove(detailAthlete.id); setDetailId(null); }} className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                      </>
                    )}
                  </>
                )}
                {detailAthlete.status !== "SUBMITTED" && (
                  <button onClick={() => setDetailId(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">ปิด</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}