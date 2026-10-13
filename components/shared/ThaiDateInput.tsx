"use client";

import React, { useState, useMemo } from "react";
import {
  THAI_MONTHS,
  toBuddhistYear,
  toChristianYear,
  getDaysInMonth,
  parseIsoDate,
  formatIsoDate,
} from "@/lib/thai-date";

export interface ThaiDateInputProps {
  value: string; // ISO date string "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  minYearBE?: number;
  maxYearBE?: number;
  className?: string;
  label?: string;
  helperText?: string;
  compact?: boolean;
  ariaLabel?: string;
}

export default function ThaiDateInput({
  value,
  onChange,
  id,
  name,
  required = false,
  disabled = false,
  minYearBE,
  maxYearBE,
  className = "",
  label,
  helperText,
  compact = false,
  ariaLabel,
}: ThaiDateInputProps) {
  const parsed = useMemo(() => parseIsoDate(value), [value]);

  const currentYearCE = new Date().getFullYear();
  const defaultMaxYearBE = toBuddhistYear(currentYearCE) + 5;
  const defaultMinYearBE = toBuddhistYear(currentYearCE) - 80;

  const minBE = minYearBE ?? defaultMinYearBE;
  const maxBE = maxYearBE ?? defaultMaxYearBE;

  // Local draft state for partial selections when value is empty
  const [draft, setDraft] = useState<{
    day: number | "";
    month: number | "";
    yearBE: number | "";
  }>({
    day: "",
    month: "",
    yearBE: "",
  });

  const currentDay = parsed ? parsed.day : draft.day;
  const currentMonth = parsed ? parsed.month : draft.month;
  const currentYearBE = parsed ? parsed.yearBE : draft.yearBE;

  // Compute available days in month
  const daysInMonth = useMemo(() => {
    const month = currentMonth ? currentMonth : 1;
    if (month === 2 && !currentYearBE) return 29;
    const yearCE = currentYearBE ? toChristianYear(currentYearBE) : currentYearCE;
    return getDaysInMonth(yearCE, month);
  }, [currentYearBE, currentMonth, currentYearCE]);

  // List of days 1..daysInMonth
  const daysList = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // List of years (descending)
  const yearsList = useMemo(() => {
    const list: number[] = [];
    for (let y = maxBE; y >= minBE; y--) {
      list.push(y);
    }
    return list;
  }, [minBE, maxBE]);

  const updateDate = (day: number | "", month: number | "", yearBE: number | "") => {
    if (day && month && yearBE) {
      const yearCE = toChristianYear(yearBE);
      const safeDay = Math.min(day, getDaysInMonth(yearCE, month));
      const iso = formatIsoDate(yearCE, month, safeDay);
      onChange(iso);
    } else {
      setDraft({ day, month, yearBE });
      onChange("");
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : "";
    updateDate(val, currentMonth, currentYearBE);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : "";
    let nextDay = currentDay;
    if (currentDay && currentYearBE && val) {
      const maxDays = getDaysInMonth(toChristianYear(currentYearBE), val);
      if (currentDay > maxDays) {
        nextDay = maxDays;
      }
    }
    updateDate(nextDay, val, currentYearBE);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : "";
    let nextDay = currentDay;
    if (currentDay && currentMonth && val) {
      const maxDays = getDaysInMonth(toChristianYear(val), currentMonth);
      if (currentDay > maxDays) {
        nextDay = maxDays;
      }
    }
    updateDate(nextDay, currentMonth, val);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      {/* 3 Select Dropdowns: วัน / เดือน / ปี พ.ศ. */}
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label={`${ariaLabel || label || "เลือก"}วัน`}
          disabled={disabled}
          value={currentDay}
          onChange={handleDayChange}
          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
        >
          <option value="">วัน</option>
          {daysList.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          aria-label={`${ariaLabel || label || "เลือก"}เดือน`}
          disabled={disabled}
          value={currentMonth}
          onChange={handleMonthChange}
          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
        >
          <option value="">เดือน</option>
          {THAI_MONTHS.map((m, idx) => (
            <option key={m.value} value={idx + 1}>
              {compact ? m.short : m.name}
            </option>
          ))}
        </select>

        <select
          aria-label={`${ariaLabel || label || "เลือก"}ปี พ.ศ.`}
          disabled={disabled}
          value={currentYearBE}
          onChange={handleYearChange}
          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
        >
          <option value="">ปี พ.ศ.</option>
          {yearsList.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {(id || name) && (
        <input
          type="hidden"
          id={id}
          name={name}
          value={value || ""}
          disabled={disabled}
        />
      )}

      {helperText && (
        <p className="text-[11px] text-slate-500 pt-0.5">{helperText}</p>
      )}
    </div>
  );
}
