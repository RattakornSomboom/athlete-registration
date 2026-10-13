"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";
import { fetchJson, requestMessage } from "@/lib/http-client";
import { formatThaiDate, toBuddhistYear } from "@/lib/thai-date";
import type { TeamReadiness } from "@/lib/team-readiness";
import type { ClubAthleteApplication, ApplicantDocument } from "@/lib/club-store";

const EVENT_NAMES: Record<string, string> = {
  "1": "ฟุตบอล 11 คน (ทีมชาย)",
  "2": "ฟุตบอล 7 คน (ทีมชาย)",
  "3": "ฟุตบอล 11 คน (ทีมหญิง)",
  "4": "ฟุตซอล 5 คน",
};

type CompetitionInfo = {
  name: string;
  round: string;
  year: number;
  deadline: string | null;
  status: "OPEN" | "CLOSED" | "COMPLETED";
};

type CompetitionQuota = {
  maxStarters: number;
  maxSubstitutes: number;
  ageLimit: number | null;
};

type CompetitionApplicantResponse = Omit<
  ClubAthleteApplication,
  "competitionId" | "gender" | "documents"
> & {
  gender?: ClubAthleteApplication["gender"];
};

type CompetitionDetailResponse = {
  competition: CompetitionInfo;
  quota: CompetitionQuota | null;
  club: { name: string };
  roster: { status: string } | null;
  teamReadiness?: TeamReadiness;
  clubReadiness?: { isActive: boolean; approvedActivities: number; requiredActivities: number };
  applicants: (CompetitionApplicantResponse & { documents: ApplicantDocument[] })[];
};

export default function ClubCompetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = (params.id as string) || "1";

  const [applicants, setApplicants] = useState<ClubAthleteApplication[]>([]);
  const [competitionInfo, setCompetitionInfo] = useState<CompetitionInfo | null>(null);
  const [competitionQuota, setCompetitionQuota] = useState<CompetitionQuota | null>(null);
  const [isRosterSubmitted, setIsRosterSubmitted] = useState(false);
  const [clubName, setClubName] = useState("");
  const [teamReadiness, setTeamReadiness] = useState<TeamReadiness | null>(null);
  const [clubReadiness, setClubReadiness] = useState<CompetitionDetailResponse["clubReadiness"] | null>(null);
  const [competitionLoadError, setCompetitionLoadError] = useState("");
  const [detailAthleteId, setDetailAthleteId] = useState<string | null>(null);
  const [squadModalId, setSquadModalId] = useState<string | null>(null);
  const [squadChoice, setSquadChoice] = useState<"main" | "reserve" | "">("main");
  const [workflowActionBusy, setWorkflowActionBusy] = useState<string | null>(null);
  const [workflowActionError, setWorkflowActionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Document comment dialog state
  const [rejectingDoc, setRejectingDoc] = useState<{ athleteId: string; doc: ApplicantDocument } | null>(null);
  const [rejectCommentInput, setRejectCommentInput] = useState<string>("");
  const [documentActionBusy, setDocumentActionBusy] = useState<string | null>(null);
  const [documentActionError, setDocumentActionError] = useState("");

  // Document Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    filename: string;
    category: string;
    athleteName: string;
    documentUrl: string | null;
    mimeType: string | null;
  } | null>(null);

  // Overall reject reason input
  const [rejectModalAthleteId, setRejectModalAthleteId] = useState<string | null>(null);
  const [rejectModalReason, setRejectModalReason] = useState<string>("");

  useEffect(() => {
    let isCurrent = true;
    fetch(`/api/club/competitions/${competitionId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลการแข่งขันได้");
        }
        return res.json() as Promise<CompetitionDetailResponse>;
      })
      .then((data) => {
        if (!isCurrent) return;
        setCompetitionInfo(data.competition);
        setCompetitionQuota(data.quota);
        setIsRosterSubmitted(data.roster?.status === "SUBMITTED");
        setClubName(data.club.name);
        setTeamReadiness(data.teamReadiness ?? null);
        setClubReadiness(data.clubReadiness ?? null);
        setCompetitionLoadError("");
        const serverApplicants: ClubAthleteApplication[] = data.applicants.map((sa) => {
          return {
            ...sa,
            competitionId,
            gender: sa.gender || "ชาย",
            documents: sa.documents,
          };
        });
        setApplicants(serverApplicants);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          console.error("[ClubCompetitionDetailPage] Failed to load competition", error);
          setCompetitionLoadError("ไม่สามารถโหลดข้อมูลการแข่งขันได้ กรุณาลองใหม่อีกครั้ง");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [competitionId]);

  const eventName = competitionInfo?.name || EVENT_NAMES[competitionId] || (isLoading ? "กำลังโหลดข้อมูลรายการแข่งขัน..." : `รายการแข่งขัน #${competitionId}`);
  const roundLabel = competitionInfo?.round.toLowerCase() === "final"
    ? "รอบมหกรรม"
    : competitionInfo?.round.toLowerCase() === "qualifier"
      ? "รอบคัดเลือก"
      : competitionInfo?.round
        ? competitionInfo.round.startsWith("รอบ")
          ? competitionInfo.round
          : `รอบ${competitionInfo.round}`
        : "ไม่ระบุรอบ";
  const competitionYear = competitionInfo
    ? competitionInfo.year >= 2400 ? competitionInfo.year : toBuddhistYear(competitionInfo.year)
    : null;

  const detailAthlete = applicants.find((a) => a.id === detailAthleteId);
  const attachedDetailDocuments = detailAthlete?.documents.filter((document) => Boolean(document.documentUrl)) ?? [];

  // Count summaries
  const mainCount = applicants.filter((a) => a.squadType === "main").length;
  const reserveCount = applicants.filter((a) => a.squadType === "reserve").length;
  const pendingCount = applicants.filter((a) => a.status === "pending").length;

  async function saveDocumentReview(athleteId: string, doc: ApplicantDocument, status: "approved" | "rejected", comment = "") {
    setDocumentActionBusy(doc.id);
    setDocumentActionError("");
    try {
      await fetchJson(`/api/club/competitions/${encodeURIComponent(competitionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: athleteId,
          action: status === "approved" ? "approve_document" : "reject_document",
          documentField: doc.id,
          reason: comment,
        }),
      });
      setApplicants((current) => current.map((applicant) =>
        applicant.id !== athleteId
          ? applicant
          : {
              ...applicant,
              documents: applicant.documents.map((document) =>
                document.id !== doc.id
                  ? document
                  : { ...document, status, comment: status === "rejected" ? comment : undefined, updatedAt: new Date().toISOString() }
              ),
            }
      ));
      return true;
    } catch (error) {
      setDocumentActionError(requestMessage(error));
      return false;
    } finally {
      setDocumentActionBusy(null);
    }
  };

  const handleApproveDoc = (athleteId: string, doc: ApplicantDocument) => {
    void saveDocumentReview(athleteId, doc, "approved").then((ok) => {
      if (ok) void refreshReadiness();
    });
  };

  // Open rejection modal for a document
  const openRejectDocModal = (athleteId: string, doc: ApplicantDocument) => {
    setDocumentActionError("");
    setRejectingDoc({ athleteId, doc });
    setRejectCommentInput(doc.comment || "");
  };

  // Confirm document rejection with comment
  const confirmRejectDoc = async () => {
    if (!rejectingDoc) return;
    if (!rejectCommentInput.trim()) {
      alert("กรุณาระบุเหตุผลที่ไม่ผ่าน เพื่อให้ผู้สมัครทราบและนำส่งเอกสารฉบับแก้ไข");
      return;
    }
    const saved = await saveDocumentReview(
      rejectingDoc.athleteId,
      rejectingDoc.doc,
      "rejected",
      rejectCommentInput.trim()
    );
    if (saved) {
      setRejectingDoc(null);
      setRejectCommentInput("");
      await refreshReadiness();
    }
  };

  const refreshReadiness = async () => {
    try {
      const data = await fetchJson<CompetitionDetailResponse>(`/api/club/competitions/${encodeURIComponent(competitionId)}`);
      setTeamReadiness(data.teamReadiness ?? null);
      setClubReadiness(data.clubReadiness ?? null);
    } catch (error) {
      console.error("[ClubCompetitionDetailPage] Failed to refresh readiness", error);
    }
  };

  // Confirm Squad Allocation (Main / Reserve)
  const confirmSquadAllocation = async () => {
    if (!squadModalId || !squadChoice) return;
    const targetId = squadModalId;
    setWorkflowActionBusy(targetId);
    setWorkflowActionError("");
    try {
      await fetchJson(`/api/club/competitions/${encodeURIComponent(competitionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: targetId, action: "assign_squad", squadType: squadChoice }),
      });
      setApplicants((current) => current.map((applicant) =>
        applicant.id === targetId
          ? { ...applicant, status: "approved", squadType: squadChoice, rejectReason: "" }
          : applicant
      ));
      setSquadModalId(null);
      await refreshReadiness();
    } catch (error) {
      setWorkflowActionError(requestMessage(error));
    } finally {
      setWorkflowActionBusy(null);
    }
  };

  // Confirm Overall Rejection
  const handleOverallReject = async (athleteId: string, reason: string) => {
    if (!reason.trim()) return;
    setWorkflowActionBusy(athleteId);
    setWorkflowActionError("");
    try {
      await fetchJson(`/api/club/competitions/${encodeURIComponent(competitionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: athleteId, action: "reject", reason }),
      });
      setApplicants((current) => current.map((applicant) =>
        applicant.id === athleteId
          ? { ...applicant, status: "rejected", squadType: "", rejectReason: reason }
          : applicant
      ));
      await refreshReadiness();
    } catch (error) {
      setWorkflowActionError(requestMessage(error));
    } finally {
      setWorkflowActionBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top navigation: Backward */}
        <div className="flex items-center justify-between">
          <BackButton href="/club/competitions" label="กลับรายการแข่งขัน" />
          <LogoutButton />
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              ระบบสารสนเทศชมรมกีฬา · การตรวจสอบและคัดเลือกนักกีฬา
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {competitionInfo ? (
                competitionInfo.name
              ) : isLoading ? (
                <span className="inline-block animate-pulse text-slate-400">กำลังโหลดข้อมูลการแข่งขัน...</span>
              ) : (
                eventName
              )}
            </h1>
            <p className="text-xs text-slate-500">
              ตรวจสอบเอกสารรายฉบับของผู้สมัคร อนุมัติ/ส่งกลับแก้ไข และจัดสรรประเภทตัวจริง/ตัวสำรอง
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/club/tracking")}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ติดตามสถานะส่งกองกิจ
            </button>
            <button
              onClick={() => router.push(`/club/review?competitionId=${encodeURIComponent(competitionId)}`)}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              จัดทำบัญชีรายชื่อส่งกองกิจ →
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-950 to-blue-800 p-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                ข้อมูลการแข่งขัน
              </span>
              <h2 className="mt-1 text-lg font-bold">
                {competitionInfo ? (
                  competitionInfo.name
                ) : isLoading ? (
                  <span className="inline-block animate-pulse text-blue-200">กำลังโหลดข้อมูลการแข่งขัน...</span>
                ) : (
                  eventName
                )}
              </h2>
              <p className="mt-1 text-xs text-blue-100">
                {competitionInfo && competitionYear !== null
                  ? `${roundLabel} · ปีการแข่งขัน พ.ศ. ${competitionYear}`
                  : "กำลังโหลดข้อมูลการแข่งขัน..."}
              </p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              competitionInfo?.status === "OPEN"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-white/15 text-white"
            }`}>
              {competitionInfo?.status === "OPEN"
                ? "เปิดรับสมัคร"
                : competitionInfo?.status === "COMPLETED"
                  ? "สิ้นสุดการแข่งขัน"
                  : competitionInfo
                    ? "ปิดรับสมัคร"
                    : "สถานะไม่พร้อมใช้งาน"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-blue-200">ชมรมที่รับผิดชอบ</span>
              <strong className="mt-1 block">{clubName || "—"}</strong>
            </div>
            <div>
              <span className="block text-blue-200">กำหนดปิดรับสมัคร</span>
              <strong className="mt-1 block">
                {formatThaiDate(competitionInfo?.deadline, { format: "medium" }) || "ไม่ระบุ"}
              </strong>
            </div>
            <div>
              <span className="block text-blue-200">อายุผู้สมัครสูงสุด</span>
              <strong className="mt-1 block">
                {competitionQuota?.ageLimit ? `${competitionQuota.ageLimit} ปี` : "ไม่จำกัด"}
              </strong>
            </div>
            <div>
              <span className="block text-blue-200">ผู้สมัครในรายการ</span>
              <strong className="mt-1 block">{applicants.length} คน</strong>
            </div>
          </div>
        </section>

        {teamReadiness && (() => {
          const clubOk = !teamReadiness.isTeamSport || (clubReadiness?.isActive && (clubReadiness.approvedActivities >= clubReadiness.requiredActivities));
          const ready = teamReadiness.passed && Boolean(clubOk);
          const reasons: string[] = [];
          if (teamReadiness.isTeamSport && !teamReadiness.passed) reasons.push(teamReadiness.message);
          if (teamReadiness.isTeamSport && clubReadiness && !clubReadiness.isActive) reasons.push("ชมรมยังไม่มีสถานะ ACTIVE");
          if (teamReadiness.isTeamSport && clubReadiness && clubReadiness.approvedActivities < clubReadiness.requiredActivities) {
            reasons.push(`ชมรมมีกิจกรรมที่อนุมัติแล้ว ${clubReadiness.approvedActivities}/${clubReadiness.requiredActivities} กิจกรรม`);
          }
          return (
            <section className={`rounded-xl border p-4 shadow-xs ${ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">สรุปความพร้อมของทีม (Team Eligibility)</h2>
                <button type="button" onClick={refreshReadiness} className="text-xs text-blue-800 hover:text-blue-900 font-semibold cursor-pointer">
                  [รีเฟรชข้อมูล]
                </button>
              </div>
              {teamReadiness.isTeamSport ? (
                <div className="mt-2 text-xs text-slate-700 space-y-1">
                  <p>นักกีฬาทั้งหมด: {teamReadiness.total} คน</p>
                  <p>
                    ผ่านเกณฑ์ผลงานแล้ว: {teamReadiness.verifiedCount} คน ({teamReadiness.percent.toFixed(1)}%)
                    {teamReadiness.passed ? " — ครบ 50% แล้ว" : teamReadiness.total > 0 ? ` — ขาดอีก ${teamReadiness.shortfall} คนจึงจะครบ 50%` : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-700">{teamReadiness.message}</p>
              )}
              {reasons.length > 0 && (
                <ul role="alert" className="mt-2 list-disc pl-5 text-xs text-amber-900">
                  {reasons.map((reason) => (
                    <li key={reason}>
                      {reason}
                      {reason.includes("กิจกรรมที่อนุมัติแล้ว") && (
                        <span className="block mt-0.5 text-[11px] text-amber-800/80">
                          (หากส่งเรื่องกิจกรรมแล้วแต่ยังไม่ผ่าน กรุณาติดต่อกองกิจการนิสิต หรือ <a href="/club/activities" className="underline hover:text-blue-800">คลิกที่นี่เพื่อไปหน้ากิจกรรม</a>)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                disabled={!ready}
                onClick={() => router.push(`/club/review?competitionId=${encodeURIComponent(competitionId)}`)}
                title={ready ? undefined : reasons.join(" / ")}
                className="mt-3 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                ส่งบัญชีรายชื่อให้อาจารย์ที่ปรึกษาลงนาม
              </button>
            </section>
          );
        })()}

        {/* Status Quota Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">นักกีฬาตัวจริง (Main Squad)</span>
            <span className="text-2xl font-bold text-blue-900">{mainCount} คน</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {competitionQuota ? `จากโควตา ${competitionQuota.maxStarters} คน` : "ยังไม่กำหนดโควตา"}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
            <span className="text-2xl font-bold text-emerald-800">{reserveCount} คน</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {competitionQuota ? `จากโควตา ${competitionQuota.maxSubstitutes} คน` : "ยังไม่กำหนดโควตา"}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">รอผลพิจารณาอย่างเป็นทางการ</span>
            <span className="text-2xl font-bold text-slate-700">{pendingCount} คน</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">จากผู้สมัครทั้งหมด {applicants.length} คน</span>
          </div>
        </div>

        {/* Applicants Table List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                บัญชีรายชื่อผู้สมัครเข้ารับการคัดเลือก ({applicants.length} คน)
              </h2>
              <p className="text-xs text-slate-500">
                คลิกที่ชื่อหรือปุ่ม &quot;ตรวจเอกสาร & รายละเอียด&quot; เพื่อเปิดตรวจเอกสารแนบรายฉบับ
              </p>
            </div>
            <span className="text-xs text-blue-900 font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              รองรับการตรวจและอนุมัติเอกสารแยกรายฉบับ 100%
            </span>
          </div>

          {competitionLoadError && (
            <p role="alert" className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {competitionLoadError}
            </p>
          )}
          {workflowActionError && (
            <p role="alert" className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              ไม่สามารถบันทึกการพิจารณาได้: {workflowActionError}
            </p>
          )}

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center space-y-3">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-900 border-r-transparent"></div>
                <p className="text-xs text-slate-500">กำลังโหลดรายชื่อผู้สมัครและเอกสาร...</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                ยังไม่มีผู้สมัครในรายการแข่งขันนี้
              </div>
            ) : applicants.map((a) => {
              const attachedDocuments = a.documents.filter((document) => Boolean(document.documentUrl));
              const approvedDocs = attachedDocuments.filter((document) => document.status === "approved").length;
              const rejectedDocs = attachedDocuments.filter((document) => document.status === "rejected").length;
              const totalDocs = attachedDocuments.length;

              return (
                <div
                  key={a.id}
                  className="p-4.5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  {/* Left: Applicant basic info */}
                  <div
                    onClick={() => setDetailAthleteId(a.id)}
                    className="flex-1 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-900 transition-colors">
                        {a.firstName} {a.lastName}
                      </span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        #{a.studentId}
                      </span>

                      {/* Club decision status */}
                      {a.status === "approved" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {isRosterSubmitted ? "✓ ยืนยันรายชื่อแล้ว · ส่งบัญชีแล้ว" : "✓ ผ่านพิจารณาแล้ว · รอส่งบัญชี"}
                        </span>
                      )}
                      {a.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          ✕ ชมรมพิจารณาไม่ผ่าน
                        </span>
                      )}
                      {a.status === "pending" && !a.squadType && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          a.squadType
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {a.squadType ? "คัดเลือกเข้าบัญชีแล้ว · รอส่งยืนยัน" : "รอชมรมพิจารณา"}
                        </span>
                      )}
                      {a.squadType && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.squadType === "main"
                            ? "bg-blue-100 text-blue-900 border border-blue-200"
                            : "bg-violet-100 text-violet-800 border border-violet-200"
                        }`}>
                          {a.squadType === "main" ? "ตัวจริง" : "ตัวสำรอง"}
                        </span>
                      )}

                      {/* Documents Status Counter Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        rejectedDocs > 0
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : totalDocs > 0 && approvedDocs === totalDocs
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        ไฟล์แนบผ่าน {approvedDocs}/{totalDocs} ฉบับ
                        {rejectedDocs > 0 && ` (แจ้งแก้ไข ${rejectedDocs} ฉบับ)`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {a.faculty} · สาขา{a.major} (ปี {a.year}) · ตำแหน่ง: <strong className="text-slate-800">{a.category}</strong> · GPAX: <strong className="text-slate-800 font-mono">{a.gpaCumulative}</strong> · เบอร์โทร: {a.phone}
                    </p>

                    {a.note && (
                      <p className="text-[11px] text-blue-900/80 bg-blue-50/60 px-2 py-0.5 rounded inline-block">
                        หมายเหตุ: {a.note}
                      </p>
                    )}
                    {a.status === "rejected" && a.rejectReason && (
                      <p className="text-[11px] text-rose-800">
                        เหตุผลที่ไม่ผ่าน: {a.rejectReason}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions (3 ปุ่ม: ตรวจเอกสาร & รายละเอียด, ไม่ผ่าน, อนุมัติคัดเลือก) */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        {/* ปุ่มที่ 1: ตรวจเอกสาร & รายละเอียด (รวมผลงาน) */}
                    <button
                      type="button"
                      onClick={() => setDetailAthleteId(a.id)}
                      className={"px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border " + (
                        a.competitions && a.competitions.length > 0
                          ? "bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                      )}
                    >
                      {a.competitions && a.competitions.length > 0
                        ? `🏆 ตรวจเอกสาร & ผลงาน (${a.competitions.length})`
                        : "ตรวจเอกสาร & รายละเอียด"}
                    </button>

                    {/* ปุ่มที่ 2: ไม่ผ่าน */}
                    <button
                      type="button"
                      disabled={workflowActionBusy !== null || isRosterSubmitted}
                      onClick={() => {
                        setWorkflowActionError("");
                        setRejectModalAthleteId(a.id);
                        setRejectModalReason(a.rejectReason || "");
                      }}
                      className={"px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border " + (
                        a.status === "rejected"
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "border-slate-300 hover:bg-rose-50 text-rose-700 hover:border-rose-200"
                      ) + " disabled:cursor-not-allowed disabled:opacity-50"}
                    >
                      {a.status === "rejected" ? "✕ ไม่ผ่าน (บันทึกแล้ว)" : "ไม่ผ่าน"}
                    </button>

                    {/* ปุ่มที่ 3: อนุมัติคัดเลือก */}
                    <button
                      type="button"
                      disabled={workflowActionBusy !== null || isRosterSubmitted}
                      onClick={() => {
                        setWorkflowActionError("");
                        setSquadModalId(a.id);
                        setSquadChoice(a.squadType || "main");
                      }}
                      className={"px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs " + (
                        a.status === "approved"
                          ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                          : "bg-blue-900 hover:bg-blue-800 text-white"
                      ) + " disabled:cursor-not-allowed disabled:bg-slate-300"}
                    >
                      {a.status === "approved"
                        ? ("อนุมัติแล้ว (" + (a.squadType === "main" ? "ตัวจริง" : "ตัวสำรอง") + ")")
                        : "อนุมัติคัดเลือก"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== MODAL: ตรวจเอกสารและประวัติผู้สมัครแบบละเอียด ===== */}
        {detailAthlete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">

              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3.5">
                <div>
                  <span className="text-[11px] text-blue-900 font-mono font-semibold">
                    รหัสนิสิต {detailAthlete.studentId} · ผู้สมัคร {eventName}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {detailAthlete.firstName} {detailAthlete.lastName}
                  </h2>
                  <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    detailAthlete.status === "approved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : detailAthlete.status === "rejected"
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                  }`}>
                    {detailAthlete.status === "approved"
                      ? isRosterSubmitted ? "✓ ยืนยันรายชื่อแล้ว · ส่งบัญชีแล้ว" : "✓ ผ่านพิจารณาแล้ว · รอส่งบัญชี"
                      : detailAthlete.status === "rejected"
                        ? "✕ ชมรมพิจารณาไม่ผ่าน"
                        : detailAthlete.squadType
                          ? "คัดเลือกเข้าบัญชีแล้ว · รอส่งยืนยัน"
                          : "รอชมรมพิจารณา"}
                  </span>
                  {detailAthlete.status === "rejected" && detailAthlete.rejectReason && (
                    <p className="mt-1 text-xs text-rose-700">เหตุผล: {detailAthlete.rejectReason}</p>
                  )}
                </div>
                <button
                  onClick={() => setDetailAthleteId(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Personal & Academic Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">คณะต้นสังกัด</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{detailAthlete.faculty}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">สาขาวิชา / ชั้นปี</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {detailAthlete.major} (ปี {detailAthlete.year})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">เกรดเฉลี่ยสะสม (GPAX)</span>
                  <span className="font-bold text-blue-900 font-mono text-sm block mt-0.5">
                    {detailAthlete.gpaCumulative}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">ตำแหน่งที่สมัคร</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{detailAthlete.category}</span>
                </div>
              </div>

              {/* Previous Sports Achievements */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  ประวัติผลงานการแข่งขันกีฬาที่ผ่านมา
                </h4>
                {detailAthlete.competitions.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 italic">
                    ไม่มีประวัติการแข่งขันที่ระบุ (นักกีฬาหน้าใหม่)
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {detailAthlete.competitions.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center"
                      >
                        <span className="font-medium text-slate-800">
                          {c.competitionName} (ปีการศึกษา {c.year})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded">
                            {c.result}
                          </span>
                          {c.evidenceFileUrl && (
                            <a
                              href={c.evidenceFileUrl}
                              target="_blank"
                              rel="noreferrer"
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

              {/* ===== CORE FEATURE: ตรวจเอกสารแนบรายฉบับ (พร้อมปุ่ม อนุมัติ / ปฏิเสธ + Comment) ===== */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      เอกสารหลักฐานแนบประกอบการสมัคร (ตรวจและอนุมัติแยกรายฉบับ)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ประธานชมรมสามารถเปิดพรีวิว และกดอนุมัติหรือปฏิเสธพร้อมระบุเหตุผลเพื่อให้นักศึกษานำส่งใหม่ได้
                    </p>
                  </div>
                </div>
                {documentActionError && (
                  <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                    บันทึกผลตรวจเอกสารไม่สำเร็จ: {documentActionError}
                  </p>
                )}

                <div className="space-y-2.5">
                  {detailAthlete.documents.map((doc) => {
                    const isApproved = doc.status === "approved";
                    const isRejected = doc.status === "rejected";

                    return (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isRejected
                            ? "bg-rose-50/60 border-rose-200"
                            : isApproved
                            ? "bg-white border-slate-200 shadow-2xs"
                            : "bg-amber-50/40 border-amber-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Document Title & Status */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">
                                {doc.title}
                              </span>

                              {/* Status Badge */}
                              {isApproved && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <span>✓</span>
                                  <span>ผ่านการอนุมัติ</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                  <span>✕</span>
                                  <span>ไม่ผ่าน / แจ้งให้ส่งใหม่</span>
                                </span>
                              )}
                              {doc.status === "pending" && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-900 border border-amber-200">
                                  รอการตรวจสอบ
                                </span>
                              )}

                              {doc.updatedAt && (
                                <span className="text-[10px] text-slate-400">
                                  (อัปเดตเมื่อ {doc.updatedAt})
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 font-mono">
                              ไฟล์: {doc.filename} · หมวดหมู่: {doc.category}
                            </p>
                            {!doc.documentUrl && (
                              <p className="text-[11px] text-amber-700">
                                {doc.filename === "ยังไม่ได้แนบไฟล์"
                                  ? "ผู้สมัครยังไม่ได้แนบเอกสารนี้"
                                  : doc.filename === "ไม่พบไฟล์ในระบบ"
                                    ? "ไฟล์ไม่มีอยู่หรือไม่พร้อมใช้งาน"
                                    : "พรีวิวเอกสารได้หลังจากจัดผู้สมัครเข้าบัญชีรายชื่อของชมรม"}
                              </p>
                            )}
                          </div>

                          {/* Document Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={() =>
                                doc.documentUrl && setPreviewDoc({
                                  title: doc.title,
                                  filename: doc.filename,
                                  category: doc.category,
                                  athleteName: `${detailAthlete.firstName} ${detailAthlete.lastName}`,
                                  documentUrl: doc.documentUrl,
                                  mimeType: doc.mimeType || null,
                                })
                              }
                              disabled={!doc.documentUrl}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-300 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>
                                {doc.documentUrl
                                  ? "ดูเอกสารจริง"
                                  : doc.filename === "ยังไม่ได้แนบไฟล์"
                                    ? "ยังไม่มีไฟล์แนบ"
                                    : doc.filename === "ไม่พบไฟล์ในระบบ"
                                      ? "ไม่พบไฟล์"
                                      : "รอสิทธิ์ดูเอกสาร"}
                              </span>
                            </button>

                            {/* Approve Single Document Button */}
                            <button
                              type="button"
                              onClick={() => handleApproveDoc(detailAthlete.id, doc)}
                              disabled={documentActionBusy !== null || workflowActionBusy !== null || !doc.documentUrl}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isApproved
                                  ? "bg-emerald-800 text-white shadow-2xs"
                                  : "border border-emerald-700 text-emerald-800 hover:bg-emerald-50"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {documentActionBusy === doc.id ? "กำลังบันทึก..." : !doc.documentUrl ? "ไม่มีไฟล์ให้อนุมัติ" : "✓ อนุมัติเอกสาร"}
                            </button>

                            {/* Reject / Comment Single Document Button */}
                            <button
                              type="button"
                              onClick={() => openRejectDocModal(detailAthlete.id, doc)}
                              disabled={documentActionBusy !== null || workflowActionBusy !== null || !doc.documentUrl}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isRejected
                                  ? "bg-rose-700 text-white shadow-2xs"
                                  : "border border-rose-300 text-rose-700 hover:bg-rose-50"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              ✕ ให้แก้ไข / แจ้งเหตุผล
                            </button>
                          </div>
                        </div>

                        {/* Comment Box if Rejected */}
                        {isRejected && doc.comment && (
                          <div className="mt-2.5 p-2.5 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>ข้อความแจ้งผู้สมัครเพื่อนำส่งเอกสารใหม่:</span>
                            </span>
                            <p className="leading-relaxed pl-3 font-medium">
                              &quot;{doc.comment}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  {attachedDetailDocuments.length > 0 && attachedDetailDocuments.every((document) => document.status === "approved") ? (
                    <span className="text-emerald-800 font-bold">
                      ✓ ไฟล์แนบที่ตรวจได้ผ่านการอนุมัติครบถ้วน
                    </span>
                  ) : attachedDetailDocuments.length === 0 ? (
                    <span className="text-amber-800 font-medium">
                      ยังไม่มีไฟล์แนบที่เปิดตรวจได้
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      * ยังมีไฟล์แนบที่รอตรวจหรือต้องส่งแก้ไข
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailAthleteId(null)}
                    disabled={documentActionBusy !== null || workflowActionBusy !== null}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>

                  <button
                    type="button"
                    disabled={workflowActionBusy !== null || isRosterSubmitted}
                    onClick={() => {
                      setWorkflowActionError("");
                      setRejectModalAthleteId(detailAthlete.id);
                      setRejectModalReason(detailAthlete.rejectReason || "");
                    }}
                    className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {detailAthlete.status === "rejected" ? "✕ ไม่ผ่าน (บันทึกแล้ว)" : "ไม่ผ่าน"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWorkflowActionError("");
                      setSquadModalId(detailAthlete.id);
                      setSquadChoice(detailAthlete.squadType || "main");
                    }}
                    disabled={workflowActionBusy !== null || isRosterSubmitted}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isRosterSubmitted
                      ? "ส่งบัญชีแล้ว · ล็อกการแก้ไข"
                      : detailAthlete.status === "approved"
                      ? ("อนุมัติคัดเลือกแล้ว (" + (detailAthlete.squadType === "main" ? "ตัวจริง" : "ตัวสำรอง") + ")")
                      : "อนุมัติคัดเลือก (เลือกตัวจริง / สำรอง)"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===== POPUP: ระบุเหตุผลปฏิเสธเอกสาร (Comment Modal) ===== */}
        {rejectingDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  แจ้งปฏิเสธเอกสารเพื่อให้นำส่งใหม่
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {rejectingDoc.doc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  โปรดระบุข้อบกพร่องของเอกสาร เพื่อให้นักศึกษาสามารถแก้ไขและอัปโหลดส่งใหม่ได้ถูกต้อง
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลและคำแนะนำในการแก้ไข (Comment) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={rejectCommentInput}
                  onChange={(e) => setRejectCommentInput(e.target.value)}
                  placeholder="เช่น ภาพถ่ายสำเนาไม่ชัดเจน ไม่สามารถอ่านเลขบัตรประชาชนได้ หรือ เอกสาร UP 02 ขาดลายเซ็นนายทะเบียน..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 outline-none"
                />
                {documentActionError && (
                  <p role="alert" className="mt-2 text-xs text-rose-700">
                    บันทึกผลตรวจเอกสารไม่สำเร็จ: {documentActionError}
                  </p>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  เหตุผลยอดนิยม (คลิกเพื่อเลือกด่วน):
                </span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    "ภาพถ่ายเอกสารไม่ชัดเจน / เบลอ โปรดสแกนใหม่",
                    "เอกสารยังไม่ได้ลงนามรับรองสำเนาถูกต้อง",
                    "เอกสาร UP 02 ไม่ตรงตามปีการศึกษาปัจจุบัน",
                    "ผลการทดสอบสมรรถภาพทางกายหมดอายุหรือไม่สมบูรณ์",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectCommentInput(preset)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={documentActionBusy !== null || workflowActionBusy !== null}
                  onClick={() => setRejectingDoc(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmRejectDoc}
                  disabled={documentActionBusy !== null || workflowActionBusy !== null || !rejectCommentInput.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {documentActionBusy === rejectingDoc.doc.id ? "กำลังบันทึก..." : "บันทึกและแจ้งให้นักศึกษาส่งใหม่"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== POPUP: พรีวิวเอกสารแนบจริง ===== */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-5xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-blue-900 font-bold uppercase tracking-wider">พรีวิวเอกสารแนบจริง</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {previewDoc.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {previewDoc.athleteName} · {previewDoc.filename}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {previewDoc.mimeType?.startsWith("image/") || /\.(png|jpe?g)$/i.test(previewDoc.filename) ? (
                  <div className="flex max-h-[70vh] min-h-80 items-center justify-center p-3">
                    <Image
                      src={previewDoc.documentUrl || ""}
                      alt={`${previewDoc.title} - ${previewDoc.athleteName}`}
                      width={1280}
                      height={900}
                      unoptimized
                      className="max-h-[68vh] max-w-full rounded-md object-contain"
                    />
                  </div>
                ) : previewDoc.mimeType === "application/pdf" || /\.pdf$/i.test(previewDoc.filename) ? (
                  <iframe
                    title={`พรีวิว ${previewDoc.title}`}
                    src={previewDoc.documentUrl || ""}
                    className="h-[70vh] min-h-96 w-full bg-white"
                  />
                ) : (
                  <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm font-medium text-slate-700">ไม่สามารถแสดงตัวอย่างไฟล์ชนิดนี้ในหน้านี้ได้</p>
                    <a
                      href={previewDoc.documentUrl || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                    >
                      เปิดเอกสารในแท็บใหม่
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-1">
                <a
                  href={previewDoc.documentUrl || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  เปิดในแท็บใหม่
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  ปิดหน้าต่างพรีวิว
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== POPUP: ระบุเหตุผลไม่ผ่านการคัดเลือก (Reject Modal) ===== */}
        {rejectModalAthleteId && (() => {
          const athlete = applicants.find((a) => a.id === rejectModalAthleteId);
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div>
                  <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                    พิจารณาผลการคัดเลือก (ไม่ผ่าน)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {athlete ? (athlete.firstName + " " + athlete.lastName + " (#" + athlete.studentId + ")") : "ผู้สมัคร"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    โปรดระบุเหตุผลที่ไม่ผ่านการคัดเลือก เพื่อบันทึกผลและแจ้งสถานะแก่นิสิต
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เหตุผลที่ไม่ผ่านการคัดเลือก <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={rejectModalReason}
                    onChange={(e) => setRejectModalReason(e.target.value)}
                    placeholder="เช่น สมรรถภาพทางกายหรือทักษะกีฬาไม่ผ่านเกณฑ์การคัดเลือกของชมรม..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 outline-none"
                  />
                  {workflowActionError && (
                    <p role="alert" className="mt-2 text-xs text-rose-700">
                      ไม่สามารถบันทึกผลได้: {workflowActionError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    เหตุผลแนะนำ (คลิกเพื่อเลือก):
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {[
                      "ทักษะกีฬาหรือสมรรถภาพทางกายยังไม่ผ่านเกณฑ์การคัดเลือก",
                      "เอกสารประกอบการสมัครไม่สมบูรณ์หรือไม่ถูกต้อง",
                      "โควตานักกีฬาในประเภทนี้เต็มจำนวนแล้ว",
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectModalReason(preset)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={workflowActionBusy !== null}
                    onClick={() => {
                      setRejectModalAthleteId(null);
                      setWorkflowActionError("");
                    }}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!rejectModalAthleteId || !rejectModalReason.trim()) return;
                      await handleOverallReject(rejectModalAthleteId, rejectModalReason.trim());
                      setRejectModalAthleteId(null);
                    }}
                    disabled={workflowActionBusy !== null || !rejectModalReason.trim()}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {workflowActionBusy === rejectModalAthleteId ? "กำลังบันทึก..." : "ยืนยันผลไม่ผ่าน"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===== POPUP: กำหนดสถานะตัวจริง / สำรอง ===== */}
        {squadModalId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-sm w-full p-6 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">กำหนดสถานะนักกีฬาตัวแทนชมรม</h3>
                <p className="text-xs text-slate-500 mt-0.5">เลือกประเภทบัญชีรายชื่อที่จะส่งต่อให้กองกิจการนิสิต</p>
              </div>

              <div className="space-y-2 text-xs">
                {workflowActionError && (
                  <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                    บันทึกการพิจารณาไม่สำเร็จ: {workflowActionError}
                  </p>
                )}
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="squad"
                    value="main"
                    checked={squadChoice === "main"}
                    onChange={() => setSquadChoice("main")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">นักกีฬาตัวจริง (Main Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนในบัญชีรายชื่อหลักที่เข้าแข่งขัน</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="squad"
                    value="reserve"
                    checked={squadChoice === "reserve"}
                    onChange={() => setSquadChoice("reserve")}
                    className="text-blue-900"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">นักกีฬาตัวสำรอง (Reserve Squad)</span>
                    <span className="text-[11px] text-slate-500">ขึ้นทะเบียนทดแทนกรณีตัวจริงสละสิทธิ์หรือบาดเจ็บ</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSquadModalId(null)}
                  disabled={workflowActionBusy !== null}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmSquadAllocation}
                  disabled={workflowActionBusy !== null}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {workflowActionBusy === squadModalId ? "กำลังบันทึก..." : "บันทึกผล"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
