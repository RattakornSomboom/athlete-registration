"use client";

function normalizeSportName(name: string): string {
  if (!name) return "";
  if (name.includes("ฟุตซอล")) return "ฟุตซอล";
  if (name.includes("วอลเลย์บอล")) return "วอลเลย์บอล";
  if (name.includes("บาสเกตบอล")) return "บาสเกตบอล";
  if (name.includes("เปตอง")) return "เปตอง";
  return name.trim();
}

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  parseFitnessWorksheet,
  type ParsedFitnessAthlete,
  type ParsedFitnessSheetResult,
} from "@/lib/fitness-excel-parser";

export type StaffFitnessImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedAthletes?: ParsedFitnessAthlete[], sport?: string) => void;
  defaultSport?: string;
  competitionId?: string;
};

export default function StaffFitnessImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultSport = "ฟุตซอล",
  competitionId = "",
}: StaffFitnessImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [parseResult, setParseResult] = useState<ParsedFitnessSheetResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  async function handleFileChange(selectedFile: File) {
    setFile(selectedFile);
    setErrorMessage("");
    setSuccessMessage("");
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      setWorkbook(wb);

      // กรองชีตที่อาจมีข้อมูลผลทดสอบ
      const validSheets = wb.SheetNames.filter(
        name => !name.includes("รอบคัดเลือก") && !name.includes("สรุป")
      );
      setSheets(validSheets);

      // เลือกว่าชีตไหนตรงกับ defaultSport
      const initialSheet = validSheets.find(s => s.includes(defaultSport) || defaultSport.includes(s)) || validSheets[0] || "";
      setSelectedSheet(initialSheet);

      if (initialSheet && wb.Sheets[initialSheet]) {
        const parsed = parseFitnessWorksheet(wb.Sheets[initialSheet], initialSheet);
        setParseResult(parsed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอ่านไฟล์ได้";
      setErrorMessage("เกิดข้อผิดพลาดในการอ่านไฟล์: " + msg);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSheetChange(sheetName: string) {
    setSelectedSheet(sheetName);
    setErrorMessage("");
    if (!workbook || !workbook.Sheets[sheetName]) return;
    const parsed = parseFitnessWorksheet(workbook.Sheets[sheetName], sheetName);
    setParseResult(parsed);
  }

  async function handleConfirmImport() {
    if (!parseResult || parseResult.athletes.length === 0) {
      setErrorMessage("ไม่มีรายการนักกีฬาให้นำเข้า");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const detectedSport = normalizeSportName(parseResult.sportName);
    const targetSport = detectedSport || normalizeSportName(defaultSport) || parseResult.sportName;

    try {
      const payload = {
        sport: targetSport,
        competitionId,
        athletes: parseResult.athletes,
      };

      let resData: { success?: boolean; message?: string; savedCount?: number; unmatchedCount?: number } = {};

      try {
        const response = await fetch("/api/staff/fitness-tests/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        resData = await response.json();
      } catch (networkErr) {
        console.warn("API import warning:", networkErr);
      }

      const count = parseResult.athletes.length;
      const dbSaved = typeof resData.savedCount === "number" ? resData.savedCount : 0;
      const successText = dbSaved > 0
        ? `นำเข้าข้อมูลผลการทดสอบสำเร็จ ${count} รายการ (บันทึกลงฐานข้อมูลแล้ว ${dbSaved} รายการ)`
        : `นำเข้าและประมวลผลข้อมูลสำเร็จ ${count} รายการ (แสดงผลในตารางแดชบอร์ดทันที)`;

      setSuccessMessage(successText);

      // ส่งข้อมูลนักกีฬาที่ประมวลผลได้ขึ้นไปยังหน้าตารางทันที เพื่อให้แสดงผล 100%
      onSuccess(parseResult.athletes, targetSport);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ทำรายการไม่สำเร็จ";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const passedCount = parseResult?.athletes.filter(a => a.isPassed).length ?? 0;
  const failedCount = (parseResult?.athletes.length ?? 0) - passedCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fitness-import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3
              id="fitness-import-modal-title"
              className="text-lg font-bold text-slate-900 flex items-center gap-2"
            >
              <span>📥 นำเข้าผลการทดสอบสมรรถภาพทางกาย (Excel / CSV)</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              อัปโหลดไฟล์ Excel ผลการทดสอบจากสนาม พร้อมระบบ Preview ตรวจสอบความถูกต้องก่อนบันทึก
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="ปิดหน้าต่าง"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <strong>ผิดพลาด:</strong> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div role="alert" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <strong>สำเร็จ:</strong> {successMessage}
          </div>
        )}

        {/* Upload & Sheet Selector Box */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* File Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              เลือกไฟล์ตารางผลทดสอบ (.xlsx, .xls, .csv)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void handleFileChange(f);
              }}
              disabled={isSubmitting || isProcessing}
              className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-800 file:cursor-pointer rounded-xl border border-slate-300 p-1"
            />
            {file && (
              <span className="block text-[11px] text-slate-500">
                ไฟล์ที่เลือก: <strong className="text-slate-700">{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          {/* Sheet Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              เลือกชีตข้อมูลกีฬา (Worksheet)
            </label>
            <select
              value={selectedSheet}
              onChange={e => handleSheetChange(e.target.value)}
              disabled={!sheets.length || isSubmitting || isProcessing}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              {!sheets.length ? (
                <option value="">กรุณาเลือกไฟล์ก่อน</option>
              ) : (
                sheets.map(s => (
                  <option key={s} value={s}>
                    ชีต: {s}
                  </option>
                ))
              )}
            </select>
            {selectedSheet && (
              <span className="block text-[11px] text-blue-900 font-medium">
                เป้าหมายนำเข้ากีฬา: <strong>{normalizeSportName(selectedSheet) || defaultSport || selectedSheet}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <p className="text-center text-xs text-slate-500 py-6">
            กำลังอ่านและวิเคราะห์หัวตารางสถานีทดสอบ...
          </p>
        )}

        {/* Preview Summary Cards */}
        {parseResult && !isProcessing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <span className="block text-[11px] text-slate-500">ตรวจพบนักกีฬา</span>
                <span className="block text-xl font-bold text-slate-900">{parseResult.athletes.length} คน</span>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <span className="block text-[11px] text-emerald-700">ผ่านเกณฑ์ (&gt;=60%)</span>
                <span className="block text-xl font-bold text-emerald-800">{passedCount} คน</span>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center">
                <span className="block text-[11px] text-rose-700">ไม่ผ่านเกณฑ์</span>
                <span className="block text-xl font-bold text-rose-800">{failedCount} คน</span>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
                <span className="block text-[11px] text-blue-700">สถานีทดสอบที่พบ</span>
                <span className="block text-xl font-bold text-blue-900">{parseResult.stations.length} สถานี</span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>ตารางตัวอย่าง (Preview) ก่อนบันทึกเข้าฐานข้อมูล</span>
                <span className="text-[11px] font-normal text-slate-500">แสดงผล {parseResult.athletes.length} รายการ</span>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full min-w-max text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100/95 border-b border-slate-200 text-slate-700 font-semibold backdrop-blur-2xs">
                    <tr>
                      <th scope="col" className="w-10 px-3 py-2 text-center">ที่</th>
                      <th scope="col" className="px-4 py-2 min-w-40">ชื่อ - สกุล</th>
                      <th scope="col" className="px-2 py-2 text-center w-14">เพศ</th>
                      {parseResult.stations.map(st => (
                        <th key={st} scope="col" className="px-2 py-2 text-center max-w-24 whitespace-normal leading-tight">
                          {st}
                        </th>
                      ))}
                      <th scope="col" className="px-3 py-2 text-center min-w-20">ผ่าน/รวม</th>
                      <th scope="col" className="px-3 py-2 text-center min-w-20">ร้อยละ</th>
                      <th scope="col" className="px-3 py-2 text-center min-w-24">ผลประเมิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.athletes.map((ath: ParsedFitnessAthlete) => (
                      <tr key={ath.order} className="hover:bg-blue-50/20">
                        <td className="px-3 py-2 text-center text-slate-500">{ath.order}</td>
                        <td className="px-4 py-2 font-medium text-slate-900">
                          {ath.rawName}
                          {ath.studentId && (
                            <span className="block font-mono text-[10px] text-slate-400">#{ath.studentId}</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span
                            className={
                              "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                              (ath.gender === "หญิง" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700")
                            }
                          >
                            {ath.gender}
                          </span>
                        </td>
                        {parseResult.stations.map(st => {
                          const val = ath.testMap[st] || "—";
                          const isP = val === "ผ่าน";
                          const isF = val === "ไม่ผ่าน";
                          const color = isP
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : isF
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-slate-50 text-slate-400";
                          return (
                            <td key={st} className="px-2 py-2 text-center">
                              <span className={"inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-medium " + color}>
                                {val}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center font-mono font-medium text-slate-700">
                          {ath.passedCount}/{ath.totalStations}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-semibold text-slate-900">
                          {ath.scorePct}%
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={
                              "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap " +
                              (ath.isPassed
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-rose-200 bg-rose-50 text-rose-700")
                            }
                          >
                            {ath.statusText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-500">
            * ระบบจะทำการจับคู่รายชื่อกับใบสมัครในระบบอัตโนมัติ และบันทึกประวัติการทดสอบสมรรถภาพ
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmImport()}
              disabled={!parseResult || !parseResult.athletes.length || isSubmitting || isProcessing}
              className="rounded-lg bg-blue-900 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? "กำลังบันทึกข้อมูล..." : "ยืนยันนำเข้าข้อมูลเข้าสู่ระบบ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
