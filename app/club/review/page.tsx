"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/shared/BackButton";
import LogoutButton from "@/components/shared/LogoutButton";

type SquadType = "main" | "reserve" | "selected" | "unassigned";
type SportType = "TEAM" | "INDIVIDUAL";

type Candidate = {
  id: string;
  name: string;
  studentId: string;
  faculty: string;
  gpa: number | null;
  category: string;
  division: string | null;
  entries: { category: string; division: string | null }[];
  resultCount: number;
  results: { competitionName: string; year: string; result: string }[];
  squadType: SquadType;
};

type RosterApplication = {
  id: string;
  status: string;
  squadType: string | null;
  category: string;
  division: string | null;
  sportEntries: { category: string; division: string | null }[];
  user: {
    studentId: string | null;
    profile: { firstName: string | null; lastName: string | null; gpaCumulative: number | string | null; faculty: string | null } | null;
  };
  competitionResults: { competitionName: string; year: string; result: string }[];
};

type RosterViewResponse = {
  roster: { version: number; status: string; items: { applicationId: string; squadType: string }[] } | null;
  applications: RosterApplication[];
  competition: { name?: string; quotas: { maxStarters: number; maxSubstitutes: number }[] } | null;
  sportType: SportType;
  club: { name: string; sport: string; presidentName: string | null };
};

const toSquad = (value: string | null | undefined): SquadType =>
  value === "main" || value === "reserve" || value === "selected" ? value : "unassigned";

const eventLabel = (entry: { category: string; division: string | null }) => `${entry.category} / ${entry.division ?? "ทั่วไป"}`;

function ClubReviewContent() {
  const router = useRouter();
  const competitionId = useSearchParams().get("competitionId") ?? "";
  const [data, setData] = useState<RosterViewResponse | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [certifyChecked, setCertifyChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<Candidate | null>(null);

  useEffect(() => {
    if (!competitionId) return;
    let current = true;
    fetch(`/api/club/rosters?competitionId=${encodeURIComponent(competitionId)}`)
      .then(async (res) => ({ ok: res.ok, body: (await res.json()) as RosterViewResponse & { error?: string } }))
      .then(({ ok, body }) => {
        if (!current) return;
        if (!ok) {
          setLoadError(body.error || "ไม่สามารถโหลดข้อมูลบัญชีรายชื่อได้");
          return;
        }
        const rosterSquads = new Map((body.roster?.items ?? []).map((item) => [item.applicationId, item.squadType]));
        setData(body);
        setCandidates(body.applications
          .filter((application) => ["SUBMITTED", "CLUB_APPROVED"].includes(application.status))
          .map((application) => {
            const baseSquad = toSquad(rosterSquads.get(application.id) ?? application.squadType);
            return {
              id: application.id,
              name: `${application.user.profile?.firstName ?? ""} ${application.user.profile?.lastName ?? ""}`.trim() || "-",
              studentId: application.user.studentId ?? "-",
              faculty: application.user.profile?.faculty ?? "-",
              gpa: application.user.profile?.gpaCumulative == null ? null : Number(application.user.profile.gpaCumulative),
              category: application.category,
              division: application.division,
              entries: application.sportEntries.length ? application.sportEntries : [{ category: application.category, division: application.division }],
              resultCount: application.competitionResults.length,
              results: application.competitionResults,
              squadType: body.sportType === "INDIVIDUAL" && baseSquad !== "unassigned" ? "selected" : baseSquad,
            };
          }));
        setLoadError("");
      })
      .catch(() => {
        if (current) setLoadError("ไม่สามารถโหลดข้อมูลบัญชีรายชื่อได้");
      });
    return () => {
      current = false;
    };
  }, [competitionId]);

  const quota = data?.competition?.quotas[0];
  const isIndividualSport = data?.sportType === "INDIVIDUAL";
  const mainCount = candidates.filter((candidate) => candidate.squadType === "main").length;
  const reserveCount = candidates.filter((candidate) => candidate.squadType === "reserve").length;
  const selectedCount = candidates.filter((candidate) => candidate.squadType === "selected").length;
  const selectedTotal = isIndividualSport ? selectedCount : mainCount + reserveCount;
  const locked = data?.roster?.status === "SUBMITTED";
  const selectedEventGroups = candidates
    .filter((candidate) => candidate.squadType !== "unassigned")
    .flatMap((candidate) => candidate.entries.map((entry) => ({ key: eventLabel(entry), candidate })))
    .reduce<Record<string, Candidate[]>>((groups, row) => {
      groups[row.key] = [...(groups[row.key] ?? []), row.candidate];
      return groups;
    }, {});

  const handleSquadChange = (id: string, squadType: SquadType) => {
    setCandidates((prev) => prev.map((candidate) => (candidate.id === id ? { ...candidate, squadType } : candidate)));
  };

  const submitRoster = async (action: "save" | "submit") => {
    if (!competitionId || !data || locked) return;
    if (action === "save") setIsSaving(true); else setIsSubmitting(true);
    setSubmitError("");
    try {
      let documentId: string | null = null;
      if (action === "submit") {
        if (!file) throw new Error("กรุณาแนบเอกสารบัญชีรายชื่อลงนาม");
        const form = new FormData();
        form.set("file", file);
        form.set("purpose", "ROSTER");
        const upload = await fetch("/api/documents", { method: "POST", body: form });
        const body = await upload.json() as { document?: { id: string }; error?: string };
        if (!upload.ok || !body.document) throw new Error(body.error || "อัปโหลดเอกสารไม่สำเร็จ");
        documentId = body.document.id;
      }

      const items = candidates
        .filter((candidate) => candidate.squadType !== "unassigned")
        .map((candidate) => ({ applicationId: candidate.id, squadType: isIndividualSport ? "selected" : candidate.squadType }));
      const response = await fetch("/api/club/rosters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId,
          action,
          version: data.roster?.version ?? 0,
          items,
          ...(action === "submit" ? { advisorApproved: certifyChecked, documentId } : {}),
        }),
      });
      const result = (await response.json()) as { error?: string; roster?: { version: number; status: string } };
      if (!response.ok || !result.roster) throw new Error(result.error || "บันทึกบัญชีรายชื่อไม่สำเร็จ");
      setData((prev) => prev ? { ...prev, roster: { version: result.roster!.version, status: result.roster!.status, items } } : prev);
      if (action === "submit") setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "ไม่สามารถบันทึกบัญชีรายชื่อได้");
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-lg w-full text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
          <h2 className="text-lg font-bold text-slate-900">ส่งบัญชีรายชื่อนักกีฬาตัวแทนเรียบร้อยแล้ว</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isIndividualSport
              ? `ระบบได้บันทึกผู้ผ่านการคัดเลือก ${selectedCount} คน`
              : `ระบบได้บันทึกบัญชีรายชื่อนักกีฬาตัวจริง ${mainCount} คน และตัวสำรอง ${reserveCount} คน`} พร้อมเอกสารลงนามไปยังกองกิจการนิสิตเพื่อตรวจสอบแล้ว
          </p>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
            <button onClick={() => router.push("/club/tracking")} className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer">ไปที่หน้าติดตามสถานะส่งกองกิจ →</button>
            <button onClick={() => router.push("/club/competitions")} className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-5 py-2.5 rounded-lg cursor-pointer">กลับสู่หน้ารายการแข่งขัน</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <BackButton />
            <h1 className="text-2xl font-bold text-slate-900 mt-3">จัดบัญชีรายชื่อนักกีฬาชมรม</h1>
            <p className="text-sm text-slate-500 mt-1">{data?.club.name ?? "ชมรม"} · {data?.club.sport ?? "-"} · {isIndividualSport ? "Start List / ผู้ผ่านการคัดเลือก" : "Team Sheet / ตัวจริง-ตัวสำรอง"}</p>
          </div>
          <LogoutButton />
        </div>

        {loadError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{loadError}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">{isIndividualSport ? "ผู้ผ่านการคัดเลือก" : "นักกีฬาตัวจริง"}</span>
            <span className="text-2xl font-bold text-blue-900">{isIndividualSport ? selectedCount : mainCount}</span>
            <span className="text-xs text-slate-400"> / โควตา {isIndividualSport ? (quota?.maxSubstitutes || quota?.maxStarters || "-") : (quota?.maxStarters ?? "-")} คน</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">{isIndividualSport ? "ประเภท/รุ่นใน Start List" : "นักกีฬาตัวสำรอง"}</span>
            <span className="text-2xl font-bold text-emerald-800">{isIndividualSport ? Object.keys(selectedEventGroups).length : reserveCount}</span>
            <span className="text-xs text-slate-400">{isIndividualSport ? "รายการ" : ` / โควตา ${quota?.maxSubstitutes ?? "-"} คน`}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">ยอดรวมที่เสนอชื่อ</span>
            <span className="text-2xl font-bold text-slate-900">{selectedTotal}</span>
            <span className="text-xs text-slate-400"> คน จากผู้สมัคร {candidates.length} คน</span>
          </div>
        </div>

        {isIndividualSport && Object.keys(selectedEventGroups).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Start List แยกตามประเภท/รุ่นแข่งขัน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(selectedEventGroups).map(([key, rows]) => (
                <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-bold text-blue-900">{key}</div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    {rows.map((row, index) => <li key={row.id}>{index + 1}. {row.name} ({row.studentId})</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">รายชื่อนักกีฬาที่ผ่านการคัดเลือกเบื้องต้นจากชมรม</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">ลำดับ</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล / รหัสนิสิต</th>
                  <th className="py-3 px-4">คณะ</th>
                  <th className="py-3 px-4">ประเภท/รุ่นที่สมัคร</th>
                  <th className="py-3 px-4">ผลงาน</th>
                  <th className="py-3 px-4 text-center">สถานะคัดเลือก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((candidate, index) => (
                  <tr key={candidate.id}>
                    <td className="py-3 px-4 text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4"><span className="font-semibold text-slate-900 block">{candidate.name}</span><span className="text-[11px] text-slate-400">รหัสนิสิต {candidate.studentId}</span></td>
                    <td className="py-3 px-4 text-slate-600">{candidate.faculty}</td>
                    <td className="py-3 px-4 text-slate-600">{candidate.entries.map(eventLabel).join(", ")}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {candidate.resultCount > 0 ? <button type="button" onClick={() => setViewingHistory(candidate)} className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer">ดูผลงาน ({candidate.resultCount})</button> : <span className="text-slate-400">ไม่มีผลงาน</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select value={candidate.squadType} disabled={locked || isSaving || isSubmitting} onChange={(e) => handleSquadChange(candidate.id, e.target.value as SquadType)} className="text-xs font-medium rounded-md px-2.5 py-1.5 border border-slate-300 bg-white">
                        {isIndividualSport ? <option value="selected">ผ่านการคัดเลือก</option> : <><option value="main">นักกีฬาตัวจริง</option><option value="reserve">นักกีฬาตัวสำรอง</option></>}
                        <option value="unassigned">ไม่ส่งรายชื่อ</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && !loadError && <tr><td colSpan={6} className="py-6 text-center text-slate-400">ยังไม่มีผู้สมัครที่พร้อมจัดบัญชีรายชื่อ</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
            <div className="space-y-1">
              <label htmlFor="signed-doc" className="block text-xs font-semibold text-slate-700">แนบเอกสารบัญชีรายชื่อที่อาจารย์ที่ปรึกษาลงนามแล้ว (PDF / JPG / PNG ไม่เกิน 5 MB)</label>
              <input id="signed-doc" type="file" accept="application/pdf,image/jpeg,image/png" disabled={locked} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="certify" checked={certifyChecked} disabled={locked} onChange={(e) => setCertifyChecked(e.target.checked)} className="mt-1 cursor-pointer" />
              <label htmlFor="certify" className="text-xs text-slate-700 leading-relaxed cursor-pointer">ข้าพเจ้าขอรับรองว่านักกีฬาตามบัญชีรายชื่อข้างต้นมีคุณสมบัติถูกต้องครบถ้วนตามระเบียบ และอาจารย์ที่ปรึกษาได้ลงนามรับรองแล้ว</label>
            </div>
            {submitError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{submitError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => submitRoster("save")} disabled={locked || !data || isSaving || isSubmitting || !!loadError} className="border border-slate-300 hover:bg-white disabled:bg-slate-200 disabled:cursor-not-allowed text-slate-700 text-xs font-medium px-5 py-2.5 rounded-lg cursor-pointer">{isSaving ? "กำลังบันทึกร่าง..." : "บันทึกร่าง"}</button>
              <button onClick={() => submitRoster("submit")} disabled={locked || !certifyChecked || !file || isSubmitting || isSaving || !!loadError || selectedTotal === 0} className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium px-6 py-2.5 rounded-lg cursor-pointer">{isSubmitting ? "กำลังนำส่งข้อมูล..." : "ลงนามส่งบัญชีรายชื่อให้กองกิจการนิสิต"}</button>
            </div>
          </div>
        </div>
      </div>

      {viewingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-900 text-sm">ประวัติผลงานการแข่งขันกีฬาที่ผ่านมา</h3><button type="button" onClick={() => setViewingHistory(null)} className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer text-base">✕</button></div>
            <div className="p-4 overflow-y-auto space-y-2.5">
              {viewingHistory.results.length === 0 ? <p className="text-center text-slate-400 py-6 text-xs">ไม่มีรายการผลงานที่ระบุ</p> : viewingHistory.results.map((result, index) => <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"><div className="font-semibold text-slate-800">{result.competitionName}</div><div className="flex items-center justify-between text-slate-600 text-[11px]"><span>ปีการศึกษา: {result.year}</span><span className="font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded">ผลงาน: {result.result}</span></div></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClubReviewPage() {
  return <Suspense fallback={null}><ClubReviewContent /></Suspense>;
}