"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type StatusHistory = { id: string; status: string; label: string; by: string; createdAt: string };
type SportEntry = { sport: string; category: string; division?: string | null };
type CompetitionResult = { competitionName: string; year: string; result: string };

type Application = {
  id: string;
  status: string;
  sport: string;
  category: string;
  note?: string | null;
  createdAt: string;
  user: {
    studentId: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      faculty: string;
      major: string;
      year: string;
      phone: string;
      nationality: string;
      nationalId: string;
      studentLevel: string;
    } | null;
  };
  competition: { name: string; sport: string; round: string; year: number; club: { name: string } };
  sportEntries: SportEntry[];
  competitionResults: CompetitionResult[];
  statusHistory: StatusHistory[];
  photoFileUrl: string | null;
  idCardFileUrl: string | null;
  studentCardFileUrl: string | null;
  studentCertFileUrl: string | null;
  upAcademyFileUrl: string | null;
  fitnessTestFileUrl: string | null;
  noClubFileUrl: string | null;
  supervisorName: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED:      "bg-yellow-100 text-yellow-700",
  CLUB_APPROVED:  "bg-blue-100 text-blue-700",
  CLUB_REJECTED:  "bg-red-100 text-red-700",
  STAFF_APPROVED: "bg-green-100 text-green-700",
  STAFF_REJECTED: "bg-red-100 text-red-700",
  FINAL_SELECTED: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED:      "รอชมรมพิจารณา",
  CLUB_APPROVED:  "ชมรมอนุมัติ",
  CLUB_REJECTED:  "ชมรมไม่อนุมัติ",
  STAFF_APPROVED: "เจ้าหน้าที่อนุมัติ",
  STAFF_REJECTED: "เจ้าหน้าที่ไม่อนุมัติ",
  FINAL_SELECTED: "ผ่านการคัดเลือก",
};

export default function AthleteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    fetch(`/api/applications/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data?.application) setApplication(data.application);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">ไม่พบข้อมูลใบสมัคร</h1>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">กลับ</button>
        </div>
      </div>
    );
  }

  const profile = application.user.profile;
  const statusLabel = STATUS_LABEL[application.status] ?? application.status;
  const statusColor = STATUS_COLOR[application.status] ?? "bg-gray-100 text-gray-500";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-full lg:max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-6 no-print">
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← ย้อนกลับ</button>
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">🖨️ พิมพ์ / บันทึก PDF</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm print-container">

            <div className="border-b border-gray-100 px-8 py-6 text-center">
              <h1 className="text-xl font-semibold text-gray-900">ใบสมัครนักกีฬา</h1>
              <p className="text-gray-500 text-sm mt-1">กีฬามหาวิทยาลัยแห่งประเทศไทย — มหาวิทยาลัยพะเยา</p>
            </div>

            <div className="px-8 py-6 space-y-6">

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">สถานะปัจจุบัน</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
              </div>

              {/* ข้อมูลส่วนตัว */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">ข้อมูลส่วนตัว</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div><span className="text-gray-500">ชื่อ-นามสกุล</span><p className="font-medium">{profile ? `${profile.firstName} ${profile.lastName}` : "-"}</p></div>
                  <div><span className="text-gray-500">รหัสนิสิต</span><p className="font-medium">{application.user.studentId}</p></div>
                  <div><span className="text-gray-500">คณะ</span><p className="font-medium">{profile?.faculty ?? "-"}</p></div>
                  <div><span className="text-gray-500">สาขา</span><p className="font-medium">{profile?.major ?? "-"}</p></div>
                  <div><span className="text-gray-500">ระดับ/ชั้นปี</span><p className="font-medium">{profile?.studentLevel === "GRADUATE" ? "บัณฑิตศึกษา" : "ปริญญาตรี"} ปี {profile?.year ?? "-"}</p></div>
                  <div><span className="text-gray-500">เบอร์โทรศัพท์</span><p className="font-medium">{profile?.phone ?? "-"}</p></div>
                  <div><span className="text-gray-500">อีเมล</span><p className="font-medium">{application.user.email}</p></div>
                  <div><span className="text-gray-500">ชมรม</span><p className="font-medium">{application.competition.club.name}</p></div>
                </div>
              </div>

              {/* ข้อมูลกีฬา */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">รายการแข่งขันและชนิดกีฬา</h2>
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-500">รายการแข่งขัน: </span><span className="font-medium">{application.competition.name}</span></p>
                  <p><span className="text-gray-500">รอบ: </span><span className="font-medium">{application.competition.round === "qualifier" ? "รอบคัดเลือก" : "รอบมหกรรม"} {application.competition.year}</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {application.sportEntries.length > 0
                      ? application.sportEntries.map((e, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                            {e.sport} · {e.category}{e.division ? ` · รุ่น${e.division}` : ""}
                          </span>
                        ))
                      : <span className="text-sm">{application.sport} · {application.category}</span>
                    }
                  </div>
                </div>
              </div>

              {/* ผลงานการแข่งขัน */}
              {application.competitionResults.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">ประวัติผลงาน</h2>
                  <div className="space-y-2">
                    {application.competitionResults.map((r, i) => (
                      <div key={i} className="text-sm flex gap-4">
                        <span className="text-gray-500">พ.ศ. {r.year}</span>
                        <span className="font-medium">{r.competitionName}</span>
                        <span className="text-blue-600">{r.result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* เอกสารแนบ */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">เอกสารแนบ</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {application.photoFileUrl && (
                    <a href={application.photoFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">🖼️</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-gray-900">รูปถ่าย</p>
                        <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {application.idCardFileUrl && (
                    <a href={application.idCardFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-gray-900">สำเนาบัตร ปชช.</p>
                        <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {application.studentCardFileUrl && (
                    <a href={application.studentCardFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-gray-900">สำเนาบัตรนิสิต</p>
                        <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {application.studentCertFileUrl && (
                    <a href={application.studentCertFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-gray-900">ใบรับรองนิสิต</p>
                        <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {application.upAcademyFileUrl && (
                    <a href={application.upAcademyFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-gray-900">UP Academy</p>
                        <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {application.fitnessTestFileUrl && (
                    <a href={application.fitnessTestFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📊</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-gray-900">ผลทดสอบสมรรถภาพ</p>
                        <p className="text-[10px] text-gray-500 truncate">ดูเอกสาร</p>
                      </div>
                    </a>
                  )}
                  {application.noClubFileUrl && (
                    <a href={application.noClubFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg p-2 transition-colors">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-medium text-amber-900">หนังสือรับรอง (ไม่มีชมรม)</p>
                        <p className="text-[10px] text-amber-700 truncate">{application.supervisorName || "ดูเอกสาร"}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* หมายเหตุ */}
              {application.note && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2 pb-2 border-b border-gray-100">หมายเหตุ</h2>
                  <p className="text-sm text-gray-600">{application.note}</p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">ประวัติสถานะ</h2>
                <div className="space-y-3">
                  {application.statusHistory.map((h, i) => (
                    <div key={h.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 mt-0.5" />
                        {i < application.statusHistory.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium">{h.label}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(h.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} — {h.by}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}