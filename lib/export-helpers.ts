export type AthleteExportRow = {
  index: number;
  fullName: string;
  studentId: string;
  nationalId: string;
  gender: string;
  faculty: string;
  major: string;
  studentLevel: string;
  year: string;
  sportName: string;
  position: string;
  squadType: string;
  status: string;
  gpaCumulative: string;
  phone: string;
};

function sanitizeCell(v: unknown): string {
  let cell = String(v ?? "").replace(/"/g, '""');
  if (/^\s*[=+@-]/.test(cell)) cell = "'" + cell;
  return `"${cell}"`;
}

function triggerDownload(filename: string, content: string) {
  const bom = "\uFEFF"; // BOM for Excel UTF-8
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAthletesToCSV(filename: string, data: AthleteExportRow[]) {
  const headers = [
    "ลำดับ", "ชื่อ-สกุล", "รหัสนิสิต", "เลขประจำตัวประชาชน", "เพศ",
    "คณะ", "สาขา", "ระดับการศึกษา", "ชั้นปี", "ชนิดกีฬา",
    "ตำแหน่ง", "บัญชี", "สถานะ", "เกรดเฉลี่ยสะสม", "โทรศัพท์",
  ];

  const rows = data.map((row) => [
    row.index,
    row.fullName,
    row.studentId,
    row.nationalId,
    row.gender,
    row.faculty,
    row.major,
    row.studentLevel,
    row.year,
    row.sportName,
    row.position,
    row.squadType,
    row.status,
    row.gpaCumulative,
    row.phone,
  ].map(sanitizeCell).join(","));

  const csvContent = [headers.map(sanitizeCell).join(","), ...rows].join("\n");
  triggerDownload(filename, csvContent);
}

export type TeamSheetExportData = {
  competitionName: string;
  clubName: string;
  sportName: string;
  presidentName?: string | null;
  starters: {
    index: number;
    studentId: string;
    fullName: string;
    faculty: string;
    major: string;
    category?: string;
    division?: string | null;
  }[];
  substitutes: {
    index: number;
    studentId: string;
    fullName: string;
    faculty: string;
    major: string;
    category?: string;
    division?: string | null;
  }[];
};

export function exportTeamSheetToCSV(filename: string, data: TeamSheetExportData) {
  const lines: string[] = [
    [sanitizeCell("บัญชีรายชื่อนักกีฬาตัวแทนการแข่งขัน (Team Sheet)")].join(","),
    [sanitizeCell("รายการแข่งขัน"), sanitizeCell(data.competitionName)].join(","),
    [sanitizeCell("ชมรมกีฬา"), sanitizeCell(data.clubName)].join(","),
    [sanitizeCell("ชนิดกีฬา"), sanitizeCell(data.sportName)].join(","),
    [sanitizeCell("ประธานชมรม / ผู้รับผิดชอบ"), sanitizeCell(data.presidentName || "-")].join(","),
    "",
    [sanitizeCell("=== รายชื่อนักกีฬาตัวจริง (Starters) ===")].join(","),
    ["ลำดับ", "รหัสนิสิต", "ชื่อ-สกุล", "คณะ", "สาขา", "ประเภท/รุ่น"].map(sanitizeCell).join(","),
    ...data.starters.map((s) => [
      s.index,
      s.studentId,
      s.fullName,
      s.faculty,
      s.major,
      [s.category, s.division].filter(Boolean).join(" · ") || "-",
    ].map(sanitizeCell).join(",")),
    "",
    [sanitizeCell("=== รายชื่อนักกีฬาตัวสำรอง (Substitutes) ===")].join(","),
    ["ลำดับ", "รหัสนิสิต", "ชื่อ-สกุล", "คณะ", "สาขา", "ประเภท/รุ่น"].map(sanitizeCell).join(","),
    ...data.substitutes.map((s) => [
      s.index,
      s.studentId,
      s.fullName,
      s.faculty,
      s.major,
      [s.category, s.division].filter(Boolean).join(" · ") || "-",
    ].map(sanitizeCell).join(",")),
  ];

  triggerDownload(filename, lines.join("\n"));
}

export type StartListExportData = {
  competitionName: string;
  sportName: string;
  clubName?: string;
  events: {
    category: string;
    division: string;
    entries: {
      index: number;
      studentId: string;
      fullName: string;
      faculty: string;
      major: string;
    }[];
  }[];
};

export function exportStartListToCSV(filename: string, data: StartListExportData) {
  const lines: string[] = [
    [sanitizeCell("ตารางรายชื่อผู้เข้าแข่งขันตามประเภทย่อย (Start List)")].join(","),
    [sanitizeCell("รายการแข่งขัน"), sanitizeCell(data.competitionName)].join(","),
    [sanitizeCell("ชนิดกีฬา"), sanitizeCell(data.sportName)].join(","),
    [sanitizeCell("ชมรม/สังกัด"), sanitizeCell(data.clubName || "-")].join(","),
    "",
  ];

  for (const ev of data.events) {
    lines.push(
      [sanitizeCell(`--- ประเภท: ${ev.category} | รุ่น: ${ev.division || "ทั่วไป"} (${ev.entries.length} คน) ---`)].join(","),
      ["ลำดับ", "รหัสนิสิต", "ชื่อ-สกุล", "คณะ", "สาขา"].map(sanitizeCell).join(","),
      ...ev.entries.map((e) => [
        e.index,
        e.studentId,
        e.fullName,
        e.faculty,
        e.major,
      ].map(sanitizeCell).join(",")),
      ""
    );
  }

  triggerDownload(filename, lines.join("\n"));
}
