import * as XLSX from "xlsx";

export type ParsedFitnessAthlete = {
  order: number;
  rawName: string;
  cleanName: string;
  studentId?: string;
  gender: "ชาย" | "หญิง";
  testMap: Record<string, string>;
  passedCount: number;
  totalStations: number;
  scorePct: number;
  isPassed: boolean;
  statusText: string;
  testLevel: string;
  overallGrade: string;
};

export type ParsedFitnessSheetResult = {
  sportName: string;
  stations: string[];
  athletes: ParsedFitnessAthlete[];
  error?: string;
};

export function cleanAthleteName(name: string): string {
  return name.replace(/^(นาย|นางสาว|นาง|น\.ส\.|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*/, "").trim();
}

export function detectGenderFromName(name: string): "ชาย" | "หญิง" {
  const trimmed = name.trim();
  if (
    trimmed.startsWith("นางสาว") ||
    trimmed.startsWith("น.ส.") ||
    trimmed.startsWith("นาง") ||
    trimmed.startsWith("เด็กหญิง") ||
    trimmed.startsWith("ด.ญ.")
  ) {
    return "หญิง";
  }
  return "ชาย";
}

export function calculateTestLevelAndGrade(scorePct: number, isPassed: boolean): { testLevel: string; overallGrade: string } {
  if (scorePct >= 85) return { testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม" };
  if (scorePct >= 75) return { testLevel: "ดี", overallGrade: "ดีมาก" };
  if (scorePct >= 60) return { testLevel: "ปานกลาง", overallGrade: "ดี" };
  if (scorePct >= 45) return { testLevel: "ต่ำ", overallGrade: "ปานกลาง" };
  return { testLevel: "ต่ำมาก", overallGrade: isPassed ? "ปานกลาง" : "ไม่ผ่าน" };
}

/**
 * Parses a single worksheet into structured fitness athlete records
 */
export function parseFitnessWorksheet(sheet: XLSX.WorkSheet, sportName: string): ParsedFitnessSheetResult {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (!rawRows || rawRows.length === 0) {
    return { sportName, stations: [], athletes: [], error: "ชีตนี้ไม่มีข้อมูล" };
  }

  // 1. Locate header row containing station names (e.g. looking for "ปริมาณไขมัน" or "นั่งงอตัว" or "แรงบีบมือ")
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(40, rawRows.length); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const hasStationKeyword = row.some(cell => {
      const s = String(cell || "");
      return s.includes("ปริมาณไขมัน") || s.includes("นั่งงอตัว") || s.includes("แรงบีบมือ") || s.includes("แรงเหยียดขา");
    });
    if (hasStationKeyword) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: check if row 0 has headers
    const row0 = rawRows[0];
    if (Array.isArray(row0) && row0.some(c => String(c).includes("ชื่อ") || String(c).includes("name"))) {
      headerRowIndex = 0;
    } else {
      return { sportName, stations: [], athletes: [], error: "ไม่พบแถวรายการสถานีทดสอบสมรรถภาพในชีตนี้" };
    }
  }

  const headerRow = rawRows[headerRowIndex] as unknown[];
  const stations: { colIndex: number; title: string }[] = [];
  let nameColIndex = 1;
  let studentIdColIndex = -1;

  for (let c = 0; c < headerRow.length; c++) {
    const title = String(headerRow[c] || "").trim();
    if (!title) continue;

    if (title.includes("รหัส") || title.toLowerCase().includes("studentid")) {
      studentIdColIndex = c;
    } else if (title.includes("ชื่อ") || title.toLowerCase().includes("name")) {
      nameColIndex = c;
    } else if (
      !["ที่", "ลำดับ", "ผลการทดสอบ", "การทดสอบสมรรถภาพ", "การทดสอบ สมรรถภาพ", "ผ่าน", "ไม่ผ่าน", "หมายเหตุ", "เพศ", "คณะ"].includes(title) &&
      !title.includes("ครั้งที่")
    ) {
      stations.push({ colIndex: c, title });
    }
  }

  const athletes: ParsedFitnessAthlete[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r] as unknown[];
    if (!Array.isArray(row)) continue;

    const rawName = String(row[nameColIndex] || "").trim();
    // Skip empty names, secondary headers, or overview titles
    if (!rawName || rawName === "ชื่อ - สกุล" || rawName.includes("ผลการทดสอบ") || rawName.includes("ชนิดกีฬา")) {
      continue;
    }

    const orderVal = row[0];
    // If order column is present and is neither a number nor contains digit, it might be sub-heading
    if (typeof orderVal === "string" && orderVal.length > 5 && !/\d/.test(orderVal)) {
      continue;
    }

    let studentId: string | undefined = undefined;
    if (studentIdColIndex >= 0 && row[studentIdColIndex]) {
      const idVal = String(row[studentIdColIndex]).trim();
      if (/^\d{8,10}$/.test(idVal)) {
        studentId = idVal;
      }
    }

    const testMap: Record<string, string> = {};
    let passedCount = 0;

    for (const station of stations) {
      const cellVal = String(row[station.colIndex] || "").trim();
      testMap[station.title] = cellVal;
      if (cellVal === "ผ่าน") {
        passedCount++;
      }
    }

    const totalStations = stations.length;
    const scorePct = totalStations > 0 ? Math.round((passedCount / totalStations) * 100) : 0;
    const isPassed = totalStations > 0 && (passedCount / totalStations) >= 0.6;
    const gender = detectGenderFromName(rawName);
    const { testLevel, overallGrade } = calculateTestLevelAndGrade(scorePct, isPassed);

    athletes.push({
      order: athletes.length + 1,
      rawName,
      cleanName: cleanAthleteName(rawName),
      studentId,
      gender,
      testMap,
      passedCount,
      totalStations,
      scorePct,
      isPassed,
      statusText: isPassed ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์",
      testLevel,
      overallGrade,
    });
  }

  return {
    sportName,
    stations: stations.map(s => s.title),
    athletes,
  };
}

/**
 * Inspects all sheets of an Excel workbook and parses supported sports sheets
 */
export function parseFitnessWorkbook(workbook: XLSX.WorkBook): {
  sheets: string[];
  resultsBySheet: Record<string, ParsedFitnessSheetResult>;
} {
  const resultsBySheet: Record<string, ParsedFitnessSheetResult> = {};
  for (const sheetName of workbook.SheetNames) {
    if (sheetName.includes("รอบคัดเลือก") || sheetName.includes("สรุป")) continue;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const result = parseFitnessWorksheet(sheet, sheetName);
    if (result.athletes.length > 0) {
      resultsBySheet[sheetName] = result;
    }
  }
  return {
    sheets: Object.keys(resultsBySheet),
    resultsBySheet,
  };
}
