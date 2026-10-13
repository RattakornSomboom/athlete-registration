export const THAI_MONTHS = [
  { value: "01", name: "มกราคม", short: "ม.ค." },
  { value: "02", name: "กุมภาพันธ์", short: "ก.พ." },
  { value: "03", name: "มีนาคม", short: "มี.ค." },
  { value: "04", name: "เมษายน", short: "เม.ย." },
  { value: "05", name: "พฤษภาคม", short: "พ.ค." },
  { value: "06", name: "มิถุนายน", short: "มิ.ย." },
  { value: "07", name: "กรกฎาคม", short: "ก.ค." },
  { value: "08", name: "สิงหาคม", short: "ส.ค." },
  { value: "09", name: "กันยายน", short: "ก.ย." },
  { value: "10", name: "ตุลาคม", short: "ต.ค." },
  { value: "11", name: "พฤศจิกายน", short: "พ.ย." },
  { value: "12", name: "ธันวาคม", short: "ธ.ค." },
] as const;

export const THAI_DAYS = [
  { name: "อาทิตย์", short: "อา." },
  { name: "จันทร์", short: "จ." },
  { name: "อังคาร", short: "อ." },
  { name: "พุธ", short: "พ." },
  { name: "พฤหัสบดี", short: "พฤ." },
  { name: "ศุกร์", short: "ศ." },
  { name: "เสาร์", short: "ส." },
] as const;

export function toBuddhistYear(yearCE: number): number {
  return yearCE + 543;
}

export function toChristianYear(yearBE: number): number {
  return yearBE - 543;
}

export function getDaysInMonth(yearCE: number, month1Based: number): number {
  if (month1Based < 1 || month1Based > 12) return 31;
  return new Date(yearCE, month1Based, 0).getDate();
}

export function parseIsoDate(isoString: string | null | undefined): {
  yearCE: number;
  yearBE: number;
  month: number;
  day: number;
  monthStr: string;
  dayStr: string;
} | null {
  if (!isoString || typeof isoString !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoString.trim());
  if (!match) return null;
  const yearCE = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return {
    yearCE,
    yearBE: toBuddhistYear(yearCE),
    month,
    day,
    monthStr: match[2],
    dayStr: match[3],
  };
}

export function formatIsoDate(yearCE: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yearCE}-${mm}-${dd}`;
}

export function formatThaiDate(
  dateValue: string | Date | null | undefined,
  options?: { format?: "short" | "medium" | "long" }
): string {
  if (!dateValue) return "";
  let d: Date;
  if (dateValue instanceof Date) {
    d = dateValue;
  } else {
    const parsed = parseIsoDate(dateValue);
    if (parsed) {
      d = new Date(parsed.yearCE, parsed.month - 1, parsed.day);
    } else {
      d = new Date(dateValue);
    }
  }
  if (isNaN(d.getTime())) return String(dateValue);

  const day = d.getDate();
  const monthIndex = d.getMonth();
  const yearBE = toBuddhistYear(d.getFullYear());
  const month = THAI_MONTHS[monthIndex];

  const style = options?.format || "short";
  if (style === "short") {
    return `${day} ${month.short} ${yearBE}`;
  }
  if (style === "medium") {
    return `${day} ${month.name} พ.ศ. ${yearBE}`;
  }
  const dayOfWeek = THAI_DAYS[d.getDay()];
  return `วัน${dayOfWeek.name}ที่ ${day} ${month.name} พ.ศ. ${yearBE}`;
}

export function isDateInRange(
  dateVal: string | Date | null | undefined,
  startDate?: string,
  endDate?: string
): boolean {
  if (!dateVal) return false;
  let iso = "";
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return false;
    iso = dateVal.toISOString().slice(0, 10);
  } else if (typeof dateVal === "string") {
    iso = dateVal.slice(0, 10);
  }
  if (!iso || iso.length < 10) return false;

  if (startDate && startDate.length === 10 && iso < startDate) return false;
  if (endDate && endDate.length === 10 && iso > endDate) return false;
  return true;
}

export function getQuickDateRange(range: "today" | "last7days" | "thisMonth" | "thisYear"): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const todayIso = formatIsoDate(y, m, d);

  if (range === "today") {
    return { startDate: todayIso, endDate: todayIso };
  }
  if (range === "last7days") {
    const past = new Date(now);
    past.setDate(past.getDate() - 6);
    return {
      startDate: formatIsoDate(past.getFullYear(), past.getMonth() + 1, past.getDate()),
      endDate: todayIso,
    };
  }
  if (range === "thisMonth") {
    const daysInMonth = getDaysInMonth(y, m);
    return {
      startDate: formatIsoDate(y, m, 1),
      endDate: formatIsoDate(y, m, daysInMonth),
    };
  }
  if (range === "thisYear") {
    return {
      startDate: formatIsoDate(y, 1, 1),
      endDate: formatIsoDate(y, 12, 31),
    };
  }
  return { startDate: "", endDate: "" };
}
