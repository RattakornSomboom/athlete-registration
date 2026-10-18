"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import { RequestState, useRemoteData, useRequestAction } from "@/components/shared/RequestState";
import { fetchJson } from "@/lib/http-client";
import { ATHLETE_VISIBLE_DOCUMENT_FIELDS, ATHLETE_DOCUMENT_LABELS } from "@/lib/athlete-document-policy";
import { exportAthletesToCSV, AthleteExportRow } from "@/lib/export-helpers";
import { detectGenderFromName } from "@/lib/fitness-excel-parser";
import EvidenceChecklist from "@/components/shared/EvidenceChecklist";
import { isEvidenceHistory } from "@/lib/evidence-verification";
import { checkAthleteEligibility, countParticipationForLevel } from "@/lib/rule-checker";
import { isTeamSport } from "@/lib/sport-type";

type ProfileDto = {
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studentLevel: string;
  year: string;
  semester: string | null;
  nationalId: string;
  birthDate: string;
  gpaCumulative: string | null;
  phone: string;
  participateCountBachelor: number | null;
  participateCountMaster: number | null;
  participateCountPhd: number | null;
};

type ApplicationDto = {
  id: string;
  sport: string;
  category: string;
  squadType: string | null;
  status: string;
  note: string | null;
  user: { studentId: string; profile: ProfileDto | null };
  competition: { id: string; name: string; year?: number };
  statusHistory: { id: string; label: string; status: string }[];
  competitionResults: { id: string; competitionName: string; year: string; result: string; evidenceFileUrl?: string | null }[];
  fitnessTestResult?: {
    id: string;
    status: string;
    totalScore: number | null;
    scores?: unknown;
    notes?: string | null;
    testedAt?: string | null;
  } | null;
} & Record<string, unknown>;

type ClubDto = { id: string; name: string; sport: string };

async function loadApplicants(clubId: string, competitionId: string) {
  const query = new URLSearchParams({ clubId, competitionId });
  const [applicationData, clubData] = await Promise.all([
    fetchJson<{ applications: ApplicationDto[] }>(`/api/staff/applications?${query.toString()}`),
    fetchJson<{ club: ClubDto; competitions: { id: string; name: string }[] }>(`/api/clubs/${encodeURIComponent(clubId)}/competitions`),
  ]);
  return {
    applications: applicationData.applications,
    club: clubData.club,
    competitionName: clubData.competitions.find((c) => c.id === competitionId)?.name ?? "รายการแข่งขัน",
  };
}

// ใช้ Rule Engine กลางเดียวกับ API: อายุอ้างอิงปีมหกรรม และเพดานจำนวนครั้งตามระดับการศึกษา
function evaluateEligibility(profile: ProfileDto | null, competitionYear: number | undefined) {
  const year = competitionYear ?? new Date().getFullYear();
  const prevCount = profile
    ? countParticipationForLevel({ bachelor: profile.participateCountBachelor, master: profile.participateCountMaster, phd: profile.participateCountPhd }, profile.studentLevel)
    : 0;
  const result = checkAthleteEligibility({
    birthDate: new Date(profile?.birthDate ?? ""),
    competitionYear: year,
    year: profile?.year,
    semester: profile?.semester,
    gpaCumulative: profile?.gpaCumulative,
    studentLevel: profile?.studentLevel,
    participationCount: prevCount,
  });
  const { gpax, age, participationCount } = result.rules;
  return {
    isEligible: result.isEligible,
    issues: result.issues,
    gpa: gpax.value ?? 0,
    isGpaExempt: gpax.exempt ?? false,
    prevCount,
    maxCount: participationCount.maxAllowed,
    age: age.age,
    isGpaEligible: gpax.passed,
    isCountEligible: participationCount.passed,
    isAgeEligible: age.passed,
  };
}
function statusView(status: string) {
  if (status === "STAFF_APPROVED" || status === "FINAL_SELECTED") return { label: "ผ่านการคัดเลือก", style: "bg-emerald-100 text-emerald-800" };
  if (status === "STAFF_REJECTED") return { label: "ไม่ผ่านเกณฑ์", style: "bg-rose-100 text-rose-800" };
  if (status === "CLUB_REJECTED") return { label: "ชมรมปฏิเสธ", style: "bg-rose-100 text-rose-800" };
  if (status === "CLUB_APPROVED") return { label: "ชมรมอนุมัติ รอกองกิจ", style: "bg-amber-100 text-amber-800" };
  return { label: "รอการพิจารณา", style: "bg-slate-100 text-slate-700" };
}

const canDecide = (app: ApplicationDto) => (app.noClubFileUrl ? app.status === "SUBMITTED" : app.status === "CLUB_APPROVED");
// กีฬาประเภททีมใช้ตัวจริง/ตัวสำรอง ส่วนประเภทบุคคลใช้ "selected" อย่างเดียว (lib/roster-service.ts)
const squadLabel = (squad: string | null) =>
  squad === "main" ? "ตัวจริง" : squad === "reserve" ? "ตัวสำรอง" : squad === "selected" ? "ผ่านการคัดเลือก" : "ยังไม่ได้ระบุ";

export default function StaffCompetitionApplicantsPage() {
  const params = useParams();
  const clubId = params.clubId as string;
  const competitionId = params.competitionId as string;

  const load = useCallback(() => loadApplicants(clubId, competitionId), [clubId, competitionId]);
  const resource = useRemoteData(load);
  const action = useRequestAction();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const applications = resource.data?.applications ?? [];
  const eventName = resource.data?.competitionName ?? "รายการแข่งขัน";
  const clubName = resource.data?.club.name ?? "";
  const clubSport = resource.data?.club.sport ?? "";
  const detail = applications.find((a) => a.id === detailId);

  async function decide(id: string, status: "STAFF_APPROVED" | "STAFF_REJECTED", label: string) {
    await action.run(async () => {
      await fetchJson(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, label }),
      });
      setRejectingId(null);
      setRejectReason("");
      resource.retry();
    }, status === "STAFF_APPROVED" ? "อนุมัติเรียบร้อย" : "บันทึกการปฏิเสธเรียบร้อย");
  }

  function exportCsv() {
    const rows: AthleteExportRow[] = applications.map((a, idx) => ({
      index: idx + 1,
      fullName: `${a.user.profile?.firstName ?? ""} ${a.user.profile?.lastName ?? ""}`.trim(),
      studentId: a.user.studentId,
      nationalId: a.user.profile?.nationalId ?? "",
      gender: detectGenderFromName(a.user.profile?.firstName ?? ""),
      faculty: a.user.profile?.faculty ?? "",
      major: a.user.profile?.major ?? "",
      studentLevel: a.user.profile?.studentLevel === "BACHELOR" ? "ปริญญาตรี" : "บัณฑิตศึกษา",
      year: a.user.profile?.year ?? "",
      sportName: eventName,
      position: a.category,
      squadType: squadLabel(a.squadType),
      status: statusView(a.status).label,
      gpaCumulative: a.user.profile?.gpaCumulative ?? "",
      phone: a.user.profile?.phone ?? "",
    }));
    exportAthletesToCSV(`บัญชีรายชื่อนักกีฬา_${clubName || "ชมรม"}_${eventName}`, rows);
  }

  const mainCount = applications.filter((a) => a.squadType === "main").length;
  const reserveCount = applications.filter((a) => a.squadType === "reserve").length;
  const selectedCount = applications.filter((a) => a.squadType === "selected").length;
  const pendingCount = applications.filter((a) => canDecide(a)).length;
  // อ่านชนิดกีฬาจากชมรม ไม่ใช่จากใบสมัคร เพื่อให้ชมรมที่ยังไม่มีใบสมัครขึ้นคำที่ถูกต้อง
  const isTeam = isTeamSport(clubSport);
  const squadSummary = isTeam
    ? `ตัวจริง ${mainCount} คน · ตัวสำรอง ${reserveCount} คน`
    : `ผ่านการคัดเลือก ${selectedCount} คน`;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <BackButton />
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              กองกิจการนิสิต มหาวิทยาลัยพะเยา · {clubName}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{eventName}</h1>
            <p className="text-xs text-slate-500">
              {squadSummary} · รอการพิจารณา {pendingCount} คน
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={applications.length === 0}
            className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            ดาวน์โหลดบัญชีรายชื่อ (Excel / CSV)
          </button>
        </div>

        <RequestState loading={resource.loading} error={resource.error} retry={resource.retry} />
        {action.error && <p role="alert" className="text-xs text-rose-700">{action.error}</p>}
        {action.success && <p role="status" className="text-xs text-emerald-700">{action.success}</p>}

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">รายชื่อผู้สมัครเข้ารับการคัดเลือก</h2>
            <span className="text-xs text-slate-500">คลิกที่ชื่อเพื่อดูเอกสารประวัติแบบละเอียด</span>
          </div>

          <div className="divide-y divide-slate-100">
            {!resource.loading && applications.length === 0 && (
              <p className="p-8 text-center text-xs text-slate-400">ยังไม่มีผู้สมัครในรายการนี้</p>
            )}
            {applications.map((a) => {
              const check = evaluateEligibility(a.user.profile, a.competition.year);
              const view = statusView(a.status);
              return (
                <div key={a.id} className="p-4 hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div onClick={() => setDetailId(a.id)} className="flex-1 cursor-pointer space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {a.user.profile?.firstName} {a.user.profile?.lastName}
                      </span>
                      <span className="font-mono text-xs text-slate-500">#{a.user.studentId}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${view.style}`}>{view.label}</span>
                      {a.squadType && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${a.squadType === "main" ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-800"}`}>
                          {squadLabel(a.squadType)}
                        </span>
                      )}
                      {check.isEligible ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ ผ่านเกณฑ์ กกมท. ครบ 3 ด้าน
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          เสี่ยงผิดระเบียบ กกมท. ({check.issues.join(", ")})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${check.isGpaEligible ? "bg-slate-50 text-slate-700 border-slate-200" : "bg-rose-50 text-rose-700 border-rose-200 font-bold"}`}>
                        {check.isGpaExempt
                          ? "เกณฑ์ 1: GPAX ได้รับการยกเว้น (นิสิตปี 1 เทอม 1)"
                          : `เกณฑ์ 1: GPAX ${check.gpa.toFixed(2)} (${check.isGpaEligible ? "≥ 2.00 ผ่าน" : "ตกเกณฑ์"})`}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${check.isCountEligible ? "bg-slate-50 text-slate-700 border-slate-200" : "bg-rose-50 text-rose-700 border-rose-200 font-bold"}`}>
                        เกณฑ์ 2: แข่งสะสม {check.prevCount}/{check.maxCount} ครั้ง (สมัครครั้งนี้ +1) ({check.isCountEligible ? "ผ่าน" : "ครบโควตา"})
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${check.isAgeEligible ? "bg-slate-50 text-slate-700 border-slate-200" : "bg-rose-50 text-rose-700 border-rose-200 font-bold"}`}>
                        เกณฑ์ 3: อายุ {check.age} ปี ({check.isAgeEligible ? "ตามปีมหกรรม ผ่าน" : "เกินเกณฑ์"})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 pt-0.5">
                      {a.user.profile?.faculty} · ตำแหน่ง: <strong className="text-slate-700">{a.category}</strong> · เบอร์ติดต่อ: {a.user.profile?.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* ข้อมูลสมรรถภาพทางกายเบื้องต้น */}
                    {a.fitnessTestResult && (
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                        a.fitnessTestResult.status === "PASSED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : a.fitnessTestResult.status === "FAILED"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                        🏃 สมรรถภาพ: {a.fitnessTestResult.status === "PASSED" ? "ผ่านเกณฑ์" : a.fitnessTestResult.status === "FAILED" ? "ไม่ผ่าน" : "รอทดสอบ"}
                        {a.fitnessTestResult.totalScore != null && ` (${a.fitnessTestResult.totalScore}%)`}
                      </span>
                    )}
                    {a.competitionResults && a.competitionResults.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailId(a.id);
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-blue-200 inline-flex items-center gap-1"
                      >
                        🏆 ผลงาน ({a.competitionResults.length})
                      </button>
                    )}
                    {canDecide(a) && (rejectingId === a.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="ระบุเหตุผลที่ไม่ผ่าน..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="bg-slate-50 border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg outline-none w-48"
                        />
                        <button
                          disabled={action.busy || rejectReason.trim().length < 2}
                          onClick={() => decide(a.id, "STAFF_REJECTED", rejectReason.trim())}
                          className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs px-2.5 py-1.5 rounded-lg"
                        >
                          ยืนยัน
                        </button>
                        <button onClick={() => setRejectingId(null)} className="border border-slate-300 text-slate-600 text-xs px-2 py-1.5 rounded-lg">
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { setRejectingId(a.id); setRejectReason(""); }}
                          className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg"
                        >
                          ไม่ผ่าน
                        </button>
                        <button
                          disabled={action.busy}
                          onClick={() => decide(a.id, "STAFF_APPROVED", "กองกิจการนิสิตอนุมัติ")}
                          className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg"
                        >
                          อนุมัติ
                        </button>
                      </>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {detail && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl border border-slate-300 max-w-2xl w-full p-6 space-y-4 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-mono">รหัสนิสิต {detail.user.studentId}</span>
                  <h2 className="text-base font-bold text-slate-900">{detail.user.profile?.firstName} {detail.user.profile?.lastName}</h2>
                </div>
                <button onClick={() => setDetailId(null)} className="text-slate-400 hover:text-slate-600 text-lg" aria-label="ปิด">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">คณะ / สาขาวิชา</span>
                  <span className="font-semibold text-slate-900">{detail.user.profile?.faculty} · {detail.user.profile?.major}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เลขประจำตัวประชาชน</span>
                  <span className="font-semibold text-slate-900 font-mono">{detail.user.profile?.nationalId}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">ระดับการศึกษา / ชั้นปี</span>
                  <span className="font-semibold text-slate-900">
                    {detail.user.profile?.studentLevel === "BACHELOR" ? "ปริญญาตรี" : "บัณฑิตศึกษา"} ปีที่ {detail.user.profile?.year}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">เกรดเฉลี่ยสะสม (GPAX)</span>
                  <span className="font-semibold text-slate-900 font-mono">{detail.user.profile?.gpaCumulative ?? "-"}</span>
                </div>
              </div>

              {detail.note && <p className="text-xs text-slate-600">หมายเหตุ: {detail.note}</p>}

              {/* ข้อมูลผลการทดสอบสมรรถภาพทางกายรายบุคคล */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">ผลการทดสอบสมรรถภาพทางกาย</h4>
                {detail.fitnessTestResult ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">สถานะผลการทดสอบ:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        detail.fitnessTestResult.status === "PASSED"
                          ? "bg-emerald-100 text-emerald-800"
                          : detail.fitnessTestResult.status === "FAILED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {detail.fitnessTestResult.status === "PASSED" ? "✓ ผ่านเกณฑ์" : detail.fitnessTestResult.status === "FAILED" ? "✕ ไม่ผ่านเกณฑ์" : "รอทดสอบ"}
                      </span>
                    </div>
                    {detail.fitnessTestResult.totalScore != null && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>คะแนนรวม / ร้อยละ:</span>
                        <span className="font-mono font-bold text-blue-900">{detail.fitnessTestResult.totalScore}%</span>
                      </div>
                    )}
                    {detail.fitnessTestResult.testedAt && (
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>วันที่ทดสอบ:</span>
                        <span>{new Date(detail.fitnessTestResult.testedAt).toLocaleDateString("th-TH")}</span>
                      </div>
                    )}
                    {detail.fitnessTestResult.notes && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        หมายเหตุ: {detail.fitnessTestResult.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 italic">
                    ยังไม่มีการบันทึกผลการทดสอบสมรรถภาพทางกายรายบุคคลสำหรับนักกีฬานี้
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">ประวัติผลงานการแข่งขันที่ผ่านมา</h4>
                {detail.competitionResults.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลผลงานที่ระบุ</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail.competitionResults.map((c) => (
                      <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded text-xs flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">{c.competitionName} (ปี {c.year})</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded">{c.result}</span>
                          {c.evidenceFileUrl && (
                            <a
                              href={c.evidenceFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-800 underline font-medium hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded"
                            >
                              ดูหลักฐาน
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">เอกสารแนบ</h4>
                <ul className="space-y-1.5">
                  {ATHLETE_VISIBLE_DOCUMENT_FIELDS.map((field) => {
                    const url = detail[field];
                    return (
                      <li key={field} className="p-2.5 bg-slate-50 border border-slate-100 rounded text-xs flex justify-between">
                        <span className="text-slate-800">{ATHLETE_DOCUMENT_LABELS[field]}</span>
                        {typeof url === "string" && url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-900 underline">เปิดเอกสาร</a>
                        ) : (
                          <span className="text-slate-400">ไม่มีเอกสาร</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <EvidenceChecklist applicationId={detail.id} />

              {detail.statusHistory.some((h) => !isEvidenceHistory(h.status)) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">ประวัติการพิจารณา</h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {detail.statusHistory.filter((h) => !isEvidenceHistory(h.status)).map((h) => (
                      <li key={h.id}>{statusView(h.status).label}: {h.label}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
