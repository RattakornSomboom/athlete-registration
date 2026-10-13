"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { errorMessage } from "@/lib/phase4-client";
import {
  detectGender,
  fitnessCell,
  fitnessColumns,
  fitnessLabels,
  fitnessNeedsReassessment,
  fitnessRequest,
  storedEvaluation,
  type FitnessCandidate,
  type FitnessListResponse,
} from "@/lib/fitness-client";
import {
  REAL_SPORT_CONFIGS,
  REAL_FITNESS_RECORDS,
  type SportFitnessConfig,
} from "@/lib/real-fitness-data";
import StaffFitnessImportModal from "@/components/shared/StaffFitnessImportModal";
import type { ParsedFitnessAthlete } from "@/lib/fitness-excel-parser";

const fieldClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-100";
const buttonClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors";

export type UnifiedFitnessRow = {
  id: string;
  order: number;
  name: string;
  studentId: string;
  gender: "ชาย" | "หญิง";
  faculty: string;
  sport: string;
  testMap: Record<string, string>;
  testLevel: string;
  scorePct: number | null;
  overallGrade: string;
  status: string;
  note: string;
  applicationId?: string;
  source?: "database" | "excel" | "official";
};

function formatStationHeader(name: string): string {
  return name.replace(/[A-Za-z][A-Za-z0-9\s-]*/g, match => match.toUpperCase());
}

function normalizeStatusLabel(status: string): string {
  if (status.includes("ยื่นขอความอนุเคราะห์")) return "ยื่นขอความอนุเคราะห์";
  if (status.includes("ผ่านรอบที่ 4")) return "ผ่านรอบที่ 4";
  if (status.startsWith("ผ่าน")) return "ผ่านเกณฑ์";
  if (status.includes("รอ")) return "รอทดสอบ";
  return status;
}

export function FitnessResultsTable({ candidates }: { candidates: FitnessCandidate[] }) {
  const columns = fitnessColumns(candidates);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-xs">
        <caption className="sr-only">ผลทดสอบจากฐานข้อมูล ผูกตามใบสมัคร การแข่งขัน และชนิดกีฬา</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            {["ที่", "ชื่อ - สกุล", "คณะต้นสังกัด", "กีฬา / การแข่งขัน", ...columns.map(column => column.label), "ผ่าน / ทั้งหมด", "ร้อยละที่ผ่าน", "ระดับทดสอบ (5 ระดับ)", "สถานะ กกมท.", "วันที่ทดสอบ", "รายละเอียด"].map((label, index) => (
              <th key={index} scope="col" className="max-w-36 whitespace-normal px-4 py-3">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {!candidates.length && <tr><td colSpan={columns.length + 10} className="p-8 text-center text-slate-500">ไม่พบข้อมูลนักกีฬาตรงกับตัวกรองนี้</td></tr>}
          {candidates.map((candidate, index) => {
            const evaluation = fitnessNeedsReassessment(candidate) ? null : storedEvaluation(candidate.fitnessResult?.scores);
            const result = candidate.fitnessResult;
            const statusKey = result?.status ?? "PENDING";
            const statusLabel = fitnessNeedsReassessment(candidate)
              ? "ผลเดิมรอประเมินใหม่"
              : result
              ? fitnessLabels[result.status]
              : "รอผลครบ";
            const badgeColor = fitnessNeedsReassessment(candidate) || statusKey === "PENDING"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : statusKey === "PASSED"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700";

            return (
              <tr key={candidate.applicationId} className="even:bg-slate-50/50 hover:bg-blue-50/30">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <th scope="row" className="px-4 py-3 font-semibold text-slate-900">{candidate.fullName}<span className="block font-mono text-[11px] font-normal text-slate-500">{candidate.studentId || "ไม่ระบุรหัสนิสิต"}</span></th>
                <td className="max-w-48 whitespace-normal px-4 py-3">{candidate.faculty || "ไม่ระบุ"}</td>
                <td className="max-w-52 whitespace-normal px-4 py-3">{candidate.sport}<span className="block text-[11px] text-slate-500">{candidate.competitionName}</span></td>
                {columns.map(column => {
                  const label = fitnessCell(candidate, column.id);
                  const color = label === "ผ่าน" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : label === "ไม่ผ่าน" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-500";
                  return <td key={column.id} className="px-3 py-3 text-center"><span className={"inline-block rounded border px-2 py-1 text-[10px] " + color}>{label}</span></td>;
                })}
                <td className="px-4 py-3 text-center font-mono">{evaluation ? evaluation.passedCount + "/" + evaluation.requiredCount : "—"}</td>
                <td className="px-4 py-3 text-center font-mono">{evaluation?.status !== "PENDING" && evaluation?.passPercentage != null ? evaluation.passPercentage.toFixed(1) + "%" : "—"}</td>
                <td className="px-4 py-3 text-center text-slate-400">ยังไม่มีข้อมูล</td>
                <td className="px-4 py-3"><span className={"inline-block rounded border px-2 py-1 font-semibold " + badgeColor}>{statusLabel}</span>{candidate.fitnessConfiguration?.supported === false && <span className="mt-1 block text-[10px] text-amber-700">ยังไม่มีชุดทดสอบของกีฬานี้</span>}</td>
                <td className="px-4 py-3">{result?.testedAt ? new Date(result.testedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "—"}</td>
                <td className="px-4 py-3"><Link href={"/staff/applicants/" + candidate.applicationId} className="font-semibold text-blue-900 hover:underline">ดูใบสมัคร</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StaffFitnessSection() {
  const [data, setData] = useState<FitnessListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const [activeSport, setActiveSport] = useState("ฟุตซอล");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedRowsBySport, setImportedRowsBySport] = useState<Record<string, UnifiedFitnessRow[]>>({});
  const [importNotification, setImportNotification] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fitnessRequest<FitnessListResponse>("/api/staff/fitness-tests", { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(cause => { if (!controller.signal.aborted) setError(errorMessage(cause)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const candidates = useMemo(() => data?.candidates ?? [], [data]);

  // รวบรวมรายชื่อกีฬาหลัก 5 ชนิดจากเอกสารจริง + กีฬาที่มีในระบบ
  const allSports = useMemo(() => {
    const defaultSports = ["ฟุตซอล", "วอลเลย์บอล", "บาสเกตบอล"];
    const candidateSports = candidates.map(c => c.sport).filter(Boolean);
    const customSports = Object.keys(importedRowsBySport);
    return Array.from(new Set([...defaultSports, ...candidateSports, ...customSports]));
  }, [candidates, importedRowsBySport]);

  // สรุปจำนวนนักกีฬาในแต่ละชนิดกีฬาสำหรับแสดงบน Pills
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allSports) {
      const custom = importedRowsBySport[s];
      if (custom && custom.length > 0) {
        counts[s] = custom.length;
      } else {
        const realRecords = REAL_FITNESS_RECORDS.filter(r => r.sportName === s);
        const dbCandidates = candidates.filter(c => c.sport === s);
        counts[s] = Math.max(realRecords.length, dbCandidates.length);
      }
    }
    return counts;
  }, [allSports, candidates, importedRowsBySport]);

  // คอนฟิกสถานีทดสอบของชนิดกีฬาปัจจุบัน
  const currentSportConfig: SportFitnessConfig = useMemo(() => {
    const custom = importedRowsBySport[activeSport];
    if (custom && custom.length > 0 && custom[0]?.testMap) {
      const detectedTests = Object.keys(custom[0].testMap);
      if (detectedTests.length > 0) {
        return {
          sportName: activeSport,
          tests: detectedTests,
          description: `ชุดสถานีทดสอบจากไฟล์ผลการทดสอบที่นำเข้าล่าสุด (${detectedTests.length} สถานี)`,
        };
      }
    }
    return REAL_SPORT_CONFIGS[activeSport] || {
      sportName: activeSport,
      tests: ["ปริมาณไขมัน", "นั่งงอตัว", "แรงบีบมือด้านถนัด", "แรงเหยียดขา", "วิ่ง Semo test", "วิ่งเร็ว 40 ม.", "วิ่ง Multistage fitness test"],
      description: "เกณฑ์การทดสอบสมรรถภาพทางกายตามมาตรฐาน กกมท.",
    };
  }, [activeSport, importedRowsBySport]);

  // รวมรายการนักกีฬาของกีฬาปัจจุบัน (ผสาน Real Records + ข้อมูลจริงจากฐานข้อมูล)
  const unifiedRows = useMemo<UnifiedFitnessRow[]>(() => {
    const customRows = importedRowsBySport[activeSport];
    const dbCandidates = candidates.filter(c => c.sport === activeSport);

    // หากมีการนำเข้าข้อมูลผ่านไฟล์ Excel ให้แสดงผลข้อมูลชุดที่เพิ่งนำเข้าทันที
    if (customRows && customRows.length > 0) {
      return customRows.map(row => {
        const dbCandidate = dbCandidates.find(
          c => c.studentId === row.studentId || c.fullName.trim() === row.name.trim()
        );
        return {
          ...row,
          source: (row.source || "excel") as "excel",
          applicationId: dbCandidate?.applicationId,
        };
      });
    }

    const realRecords = REAL_FITNESS_RECORDS.filter(r => r.sportName === activeSport);
    const rows: UnifiedFitnessRow[] = [];
    const matchedDbIds = new Set<string>();

    for (const real of realRecords) {
      const dbCandidate = dbCandidates.find(
        c => c.studentId === real.studentId || c.fullName.trim() === real.name.trim()
      );
      if (dbCandidate) {
        matchedDbIds.add(dbCandidate.applicationId);
      }

      rows.push({
        id: real.id,
        order: real.order,
        name: real.name,
        studentId: real.studentId,
        gender: real.gender,
        faculty: real.faculty,
        sport: real.sportName,
        testMap: { ...real.testMap },
        testLevel: real.testLevel,
        scorePct: real.scorePct,
        overallGrade: real.overallGrade,
        status: real.status,
        note: real.note,
        applicationId: dbCandidate?.applicationId,
        source: "official",
      });
    }

    // เพิ่มนักกีฬาจาก DB ที่ไม่ได้อยู่ใน fixture
    let nextOrder = rows.length + 1;
    for (const cand of dbCandidates) {
      if (matchedDbIds.has(cand.applicationId)) continue;
      const evaluation = storedEvaluation(cand.fitnessResult?.scores);
      const gender = detectGender(cand);
      const testMap: Record<string, string> = {};
      for (const t of currentSportConfig.tests) {
        testMap[t] = "—";
      }
      if (evaluation) {
        for (const [key, outcome] of Object.entries(evaluation.items)) {
          testMap[key] = outcome === "PASSED" ? "ผ่าน" : outcome === "FAILED" ? "ไม่ผ่าน" : "รอผล";
        }
      }

      const scorePct = evaluation?.passPercentage != null ? Math.round(evaluation.passPercentage) : null;
      rows.push({
        id: cand.applicationId,
        order: nextOrder++,
        name: cand.fullName,
        studentId: cand.studentId || "—",
        gender: gender === "หญิง" ? "หญิง" : "ชาย",
        faculty: cand.faculty || "ไม่ระบุสังกัด",
        sport: cand.sport,
        testMap,
        testLevel: scorePct != null && scorePct >= 80 ? "ดีมาก" : scorePct != null && scorePct >= 65 ? "ดี" : scorePct != null && scorePct >= 50 ? "ปานกลาง" : "ต่ำ",
        scorePct,
        overallGrade: cand.fitnessResult?.status === "PASSED" ? "ดีเยี่ยม" : "รอผล",
        status: cand.fitnessResult ? fitnessLabels[cand.fitnessResult.status] : "รอทดสอบ",
        note: cand.fitnessResult?.notes || "",
        applicationId: cand.applicationId,
        source: "database",
      });
    }

    return rows;
  }, [activeSport, candidates, currentSportConfig, importedRowsBySport]);

  // ตัวกรอง (ค้นหาชื่อ/รหัส, ตัวกรองเพศ, ตัวกรองสถานะ)
  const filteredRows = useMemo(() => {
    return unifiedRows.filter(row => {
      if (genderFilter !== "all" && row.gender !== genderFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        const norm = normalizeStatusLabel(row.status);
        if (statusFilter === "ผ่านเกณฑ์" && norm !== "ผ่านเกณฑ์") return false;
        if (statusFilter === "ยื่นขอความอนุเคราะห์" && norm !== "ยื่นขอความอนุเคราะห์") return false;
        if (statusFilter === "ผ่านรอบที่ 4" && norm !== "ผ่านรอบที่ 4") return false;
        if (statusFilter === "ไม่ผ่าน / รอผล" && (norm === "ผ่านเกณฑ์" || norm === "ผ่านรอบที่ 4")) return false;
      }
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const text = [row.name, row.studentId, row.faculty].join(" ").toLowerCase();
        if (!text.includes(term)) return false;
      }
      return true;
    });
  }, [unifiedRows, genderFilter, statusFilter, search]);

  const fitnessMetrics = useMemo(() => {
    const passed = filteredRows.filter(row => {
      const normalized = normalizeStatusLabel(row.status);
      return normalized === "ผ่านเกณฑ์" || normalized === "ผ่านรอบที่ 4";
    }).length;
    const strong = filteredRows.filter(row => row.testLevel === "ดีมาก" || row.testLevel === "ดี").length;
    const needsAttention = filteredRows.filter(row => {
      const normalized = normalizeStatusLabel(row.status);
      return normalized !== "ผ่านเกณฑ์" && normalized !== "ผ่านรอบที่ 4";
    }).length;
    return {
      total: filteredRows.length,
      passed,
      passRate: filteredRows.length ? passed / filteredRows.length * 100 : 0,
      strong,
      needsAttention,
    };
  }, [filteredRows]);

  function clearFilters() {
    setSearch("");
    setGenderFilter("all");
    setStatusFilter("all");
  }
  function reload() {
    setData(null);
    setError("");
    setLoading(true);
    setRevision(value => value + 1);
  }

  function handleImportSuccess(importedAthletes?: ParsedFitnessAthlete[], sport?: string) {
    const targetSport = sport || activeSport;
    if (importedAthletes && importedAthletes.length > 0) {
      const newRows: UnifiedFitnessRow[] = importedAthletes.map((ath, idx) => ({
        id: `imported-${targetSport}-${ath.order || idx + 1}-${Date.now()}`,
        order: ath.order || idx + 1,
        name: ath.rawName,
        studentId: ath.studentId || `66${String(idx + 100).padStart(6, "0")}`,
        gender: ath.gender,
        faculty: "มหาวิทยาลัยพะเยา",
        source: "excel",
        sport: targetSport,
        testMap: { ...ath.testMap },
        testLevel: ath.testLevel,
        scorePct: ath.scorePct,
        overallGrade: ath.overallGrade,
        status: ath.statusText,
        note: `นำเข้าจากไฟล์ Excel (${ath.passedCount}/${ath.totalStations} สถานี)`,
      }));

      setImportedRowsBySport(prev => {
        const next = { ...prev, [targetSport]: newRows };
        return next;
      });

      setImportNotification(`✅ นำเข้าผลการทดสอบชนิดกีฬา "${targetSport}" สำเร็จ ${importedAthletes.length} คน ข้อมูลอัปเดตบนตารางทันที`);
      setActiveSport(targetSport);
    }
    reload();
  }

  function handleClearCustomImports() {
    setImportedRowsBySport(prev => {
      const next = { ...prev };
      delete next[activeSport];
      return next;
    });
    setImportNotification(`รีเซ็ตข้อมูลนำเข้าของกีฬา "${activeSport}" เรียบร้อย`);
  }

  function handleClearAllCustomImports() {
    setImportedRowsBySport({});
    setImportNotification("ล้างข้อมูลนำเข้าทั้งหมดเรียบร้อยแล้ว พร้อมสำหรับการทดสอบนำเข้าใหม่");
    setActiveSport("ฟุตซอล");
  }

  function handleDownloadCSV() {
    const headers = [
      "ที่",
      "ชื่อ - สกุล",
      "รหัสนิสิต",
      "เพศ",
      "คณะต้นสังกัด",
      ...currentSportConfig.tests,
      "ระดับทดสอบ",
      "คะแนนรวม (%)",
      "เกรดภาพรวม",
      "รอบ & สถานะ",
    ];

    const csvEscape = (val: unknown) => {
      const str = String(val ?? "").replace(/^\s*[=+@-]/, "'$&");
      return '"' + str.replaceAll('"', '""') + '"';
    };

    const rows = filteredRows.map(r => [
      r.order,
      r.name,
      r.studentId,
      r.gender,
      r.faculty,
      ...currentSportConfig.tests.map(t => r.testMap[t] || "—"),
      r.testLevel,
      r.scorePct != null ? r.scorePct + "%" : "—",
      r.overallGrade,
      r.status,
    ]);

    const content = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fitness_${activeSport}_${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 font-sans text-slate-800" aria-busy={loading}>
      {importNotification && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900 shadow-xs">
          <span>{importNotification}</span>
          <button
            type="button"
            onClick={() => setImportNotification("")}
            className="rounded px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100"
          >
            ✕ ปิด
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <strong>แจ้งเตือน:</strong> ไม่สามารถโหลดผลการทดสอบล่าสุดจากเซิร์ฟเวอร์ได้ ({error}) ระบบกำลังแสดงข้อมูลผลการทดสอบฐานข้อมูลทางการ
        </div>
      )}
      {/* Header bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 md:text-lg">
            บัญชีผลการทดสอบสมรรถภาพทางกายนักกีฬารายบุคคล (แยกตามชนิดกีฬา)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            คอลัมน์สถานีทดสอบจะปรับเปลี่ยนอัตโนมัติตามเกณฑ์เฉพาะของแต่ละชนิดกีฬา/เพศ จากข้อมูลจริงในเอกสาร กกมท.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-200 bg-blue-50/70 px-3.5 py-1 text-xs font-semibold text-blue-900">
            กำลังดู: {activeSport} ({filteredRows.length} คน)
          </span>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className={buttonClass}
          >
            โหลดใหม่
          </button>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">จัดการข้อมูลนำเข้า ▾</summary>
            <div className="absolute right-0 top-10 z-10 w-56 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
              {Object.keys(importedRowsBySport).length > 0 ? (
                <button type="button" onClick={handleClearAllCustomImports} className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs font-semibold text-rose-800 hover:bg-rose-100">ล้างข้อมูลนำเข้าทั้งหมด</button>
              ) : null}
              {importedRowsBySport[activeSport]?.length ? (
                <button type="button" onClick={handleClearCustomImports} className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-amber-800 hover:bg-amber-100">รีเซ็ตเฉพาะ {activeSport}</button>
              ) : null}
              {!Object.keys(importedRowsBySport).length && !importedRowsBySport[activeSport]?.length && <p className="text-[11px] text-slate-500">ยังไม่มีข้อมูลนำเข้าที่จัดการได้</p>}
            </div>
          </details>
          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={loading || !filteredRows.length}
            className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            ดาวน์โหลด CSV
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="rounded-lg bg-blue-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 shadow-2xs flex items-center gap-1.5"
          >
            <span>📥</span> นำเข้าผลทดสอบ (Excel)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading}
            className={buttonClass}
          >
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Sport Selector Pills */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="เลือกชนิดกีฬา">
          {allSports.map(s => {
            const isActive = activeSport === s;
            const count = sportCounts[s] ?? 0;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveSport(s)}
                className={
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all " +
                  (isActive
                    ? "bg-blue-900 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
                }
              >
                <span>{s}</span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                    (isActive ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-600")
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          * {currentSportConfig.description}
        </p>
      </div>

      {/* Sport KPI Summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "นักกีฬาในมุมมองนี้", value: fitnessMetrics.total.toLocaleString("th-TH"), detail: `${activeSport} · ตามตัวกรองปัจจุบัน`, tone: "border-slate-200 text-slate-950" },
          { label: "ผ่านเกณฑ์ กกมท.", value: `${fitnessMetrics.passRate.toFixed(1)}%`, detail: `${fitnessMetrics.passed.toLocaleString("th-TH")} คนผ่าน`, tone: "border-emerald-200 text-emerald-800" },
          { label: "ระดับดี / ดีมาก", value: fitnessMetrics.strong.toLocaleString("th-TH"), detail: "กลุ่มพร้อมพิจารณาต่อ", tone: "border-blue-200 text-blue-900" },
          { label: "รอติดตามผล", value: fitnessMetrics.needsAttention.toLocaleString("th-TH"), detail: "รอผล / ไม่ผ่าน / ขอทดสอบซ้ำ", tone: "border-amber-200 text-amber-800" },
        ].map(card => (
          <section key={card.label} className={`rounded-2xl border bg-white p-4 shadow-sm ${card.tone}`}>
            <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums">{card.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{card.detail}</p>
          </section>
        ))}
      </div>
      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-bold text-slate-800">
          <div><p className="text-xs font-bold text-slate-900">ค้นหาและกรองผลทดสอบ</p><p className="mt-0.5 text-[11px] text-slate-500">{activeSport} · แสดง {filteredRows.length} จาก {unifiedRows.length} คน</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ รหัสนิสิต..."
            className={fieldClass + " w-48 sm:w-60"}
          />
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            className={fieldClass}
            aria-label="กรองตามเพศ"
          >
            <option value="all">เพศทั้งหมด</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={fieldClass}
            aria-label="กรองตามรอบการทดสอบ"
          >
            <option value="all">ทุกรอบการทดสอบ</option>
            <option value="ผ่านเกณฑ์">ผ่านเกณฑ์</option>
            <option value="ยื่นขอความอนุเคราะห์">ยื่นขอความอนุเคราะห์</option>
            <option value="ผ่านรอบที่ 4">ผ่านรอบที่ 4</option>
            <option value="ไม่ผ่าน / รอผล">ยังไม่ผ่าน / รอผล</option>
          </select>
          {(search || genderFilter !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Rule Notice Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-[#fffbeb] px-4 py-3 text-xs text-amber-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-600" />
          <span>
            <strong className="font-semibold text-amber-900">
              ข้อบังคับการทดสอบ 3 รอบ:
            </strong>{" "}
            ผู้ที่ผ่านสถานีใดในรอบก่อนหน้าจะได้รับการบันทึกผ่านถาวร ส่วนผู้ที่ไม่ผ่านทั้ง 3 รอบ
            สามารถยื่นหนังสือขอความอนุเคราะห์ต่อผู้ฝึกสอน (โค้ช) เพื่อขอทดสอบครั้งที่ 4
            เป็นกรณีพิเศษรอบสุดท้าย
          </span>
        </div>
        <span className="whitespace-nowrap font-semibold text-slate-700">
          แสดงผล {filteredRows.length} รายการ
        </span>
      </div>

      {/* Main Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-xs">
            <caption className="sr-only">
              บัญชีผลการทดสอบสมรรถภาพทางกายนักกีฬารายบุคคล {activeSport}
            </caption>
            <thead className="text-slate-700">
              <tr className="border-b border-slate-200 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
                <th scope="col" rowSpan={2} className="sticky left-0 z-20 w-12 bg-slate-100 px-3 py-2 text-center">ที่</th>
                <th scope="col" rowSpan={2} className="sticky left-12 z-20 min-w-52 bg-slate-100 px-4 py-2">ข้อมูลนักกีฬา</th>
                <th scope="col" rowSpan={2} className="w-16 bg-slate-100 px-3 py-2 text-center">เพศ</th>
                <th scope="col" rowSpan={2} className="min-w-44 bg-slate-100 px-4 py-2">คณะต้นสังกัด</th>
                <th scope="col" colSpan={currentSportConfig.tests.length} className="border-x border-blue-200 bg-blue-50 px-3 py-2 text-center text-blue-900">สถานีทดสอบ กกมท.</th>
                <th scope="col" colSpan={3} className="bg-emerald-50 px-3 py-2 text-center text-emerald-900">ผลการประเมิน</th>
              </tr>
              <tr className="border-b border-slate-200 bg-white text-[11px] text-slate-600">
                {currentSportConfig.tests.map(testName => <th key={testName} scope="col" className="max-w-28 whitespace-normal border-x border-slate-100 px-2.5 py-3 text-center leading-tight">{formatStationHeader(testName)}</th>)}
                <th scope="col" className="min-w-28 px-3 py-3 text-center">ระดับทดสอบ</th>
                <th scope="col" className="min-w-24 px-3 py-3 text-center">คะแนนรวม</th>
                <th scope="col" className="min-w-32 px-3 py-3 text-center">รอบ &amp; สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!filteredRows.length && (
                <tr>
                  <td
                    colSpan={currentSportConfig.tests.length + 7}
                    className="p-10 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลนักกีฬาในชนิดกีฬา {activeSport} ตามเงื่อนไขตัวกรอง
                  </td>
                </tr>
              )}
              {filteredRows.map(row => {
                const normStatus = normalizeStatusLabel(row.status);
                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-blue-50/20"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 text-center text-slate-500">
                      {row.order}
                    </td>
                    <td className="sticky left-12 z-10 bg-white px-4 py-3 font-semibold text-slate-900">
                      <div>{row.name}</div>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] font-normal text-slate-400">
                        <span>#{row.studentId}</span>
                        {row.source === "excel" && (
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 border border-purple-200 text-[9px] font-sans font-semibold text-purple-700">
                            ไฟล์นำเข้า
                          </span>
                        )}
                        {row.source === "database" && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 text-[9px] font-sans font-semibold text-emerald-700">
                            ฐานข้อมูล (DB)
                          </span>
                        )}
                        {row.source === "official" && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 border border-blue-200 text-[9px] font-sans font-semibold text-blue-700">
                            ข้อมูลทางการ กกมท.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={
                          "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
                          (row.gender === "หญิง"
                            ? "bg-pink-50 text-pink-700"
                            : "bg-blue-50 text-blue-700")
                        }
                      >
                        {row.gender}
                      </span>
                    </td>
                    <td className="max-w-56 whitespace-normal px-4 py-3 text-slate-700">
                      {row.faculty}
                    </td>

                    {/* สถานีทดสอบแต่ละแห่ง */}
                    {currentSportConfig.tests.map(testName => {
                      const val = row.testMap[testName] || "—";
                      const isPassed = val === "ผ่าน";
                      const isFailed = val === "ไม่ผ่าน";
                      const cellColor = isPassed
                        ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]"
                        : isFailed
                        ? "border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]"
                        : "border-slate-200 bg-slate-50 text-slate-400";

                      return (
                        <td
                          key={testName}
                          className="px-2 py-3 text-center"
                        >
                          <span
                            className={
                              "inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                              cellColor
                            }
                          >
                            {val}
                          </span>
                        </td>
                      );
                    })}

                    {/* ระดับทดสอบ (5 ระดับ) */}
                    <td className="px-3 py-3 text-center">
                      {row.testLevel === "ดีมาก" ? (
                        <span className="inline-block rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                          ดีมาก
                        </span>
                      ) : row.testLevel === "ดี" ? (
                        <span className="inline-block rounded-md border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-800">
                          ดี
                        </span>
                      ) : row.testLevel === "ปานกลาง" ? (
                        <span className="inline-block rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                          ปานกลาง
                        </span>
                      ) : row.testLevel === "ต่ำ" ? (
                        <span className="inline-block rounded-md border border-amber-400 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900">
                          ต่ำ
                        </span>
                      ) : row.testLevel === "ต่ำมาก" ? (
                        <span className="inline-block rounded-md border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-800">
                          ต่ำมาก
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* คะแนนรวม (%) */}
                    <td className="px-3 py-3 text-center">
                      <div className="font-mono font-semibold text-slate-800">
                        {row.scorePct != null ? `${row.scorePct}%` : "—"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {row.overallGrade || "—"}
                      </div>
                    </td>

                    {/* รอบ & สถานะ */}
                    <td className="px-3 py-3 text-center">
                      {normStatus === "ยื่นขอความอนุเคราะห์" ? (
                        <span className="inline-block whitespace-nowrap rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-700">
                          ยื่นขอความอนุเคราะห์
                        </span>
                      ) : normStatus === "ผ่านรอบที่ 4" ? (
                        <span className="inline-block whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                          ผ่านรอบที่ 4
                        </span>
                      ) : normStatus === "ผ่านเกณฑ์" ? (
                        <span className="inline-block whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                          ผ่านเกณฑ์
                        </span>
                      ) : (
                        <span className="inline-block whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                          {row.status || "รอผลครบ"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      <StaffFitnessImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
        defaultSport={activeSport}
      />
    </div>
  );
}
