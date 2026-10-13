"use client";

import React from "react";
import { formatThaiDate, getQuickDateRange } from "@/lib/thai-date";

export interface DateFilterBarProps {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
  totalCount?: number;
  filteredCount?: number;
  title?: string;
  className?: string;
}

export default function DateFilterBar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  totalCount,
  filteredCount,
  title = "ตัวกรองช่วงวันที่",
  className = "",
}: DateFilterBarProps) {
  const isFiltered = Boolean(startDate || endDate);

  const applyQuick = (range: "today" | "last7days" | "thisMonth" | "thisYear") => {
    const { startDate: s, endDate: e } = getQuickDateRange(range);
    onStartDateChange(s);
    onEndDateChange(e);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">📅</span>
          <span className="text-xs font-semibold text-slate-800">{title}</span>
          {isFiltered && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
              กำลังกรองข้อมูล
            </span>
          )}
        </div>

        {/* Quick filter pills */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 mr-1">ทางลัด:</span>
          <button
            type="button"
            onClick={onClear}
            className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
              !isFiltered
                ? "bg-slate-800 text-white font-medium"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => applyQuick("today")}
            className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => applyQuick("last7days")}
            className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            7 วันล่าสุด
          </button>
          <button
            type="button"
            onClick={() => applyQuick("thisMonth")}
            className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            เดือนนี้
          </button>
          <button
            type="button"
            onClick={() => applyQuick("thisYear")}
            className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            ปีนี้
          </button>
        </div>
      </div>

      {/* Date Pickers & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">ตั้งแต่วันที่:</span>
            <input
              type="date"
              aria-label="ตั้งแต่วันที่"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-900 outline-none cursor-pointer"
            />
          </div>

          <span className="text-slate-400">–</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">ถึงวันที่:</span>
            <input
              type="date"
              aria-label="ถึงวันที่"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-900 outline-none cursor-pointer"
            />
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onClear}
              className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs transition cursor-pointer ml-1"
            >
              ✕ ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Count indicator & Active range text */}
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          {isFiltered && (
            <span>
              (ช่วง: {startDate ? formatThaiDate(startDate) : "เริ่มแรก"} –{" "}
              {endDate ? formatThaiDate(endDate) : "ปัจจุบัน"})
            </span>
          )}
          {totalCount !== undefined && filteredCount !== undefined && (
            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              แสดง {filteredCount} / {totalCount} รายการ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
