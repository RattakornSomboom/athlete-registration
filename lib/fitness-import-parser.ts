import * as XLSX from "xlsx";

export type ParsedFitnessAthlete = {
  order: number;
  name: string;
  studentId?: string;
  gender: "ชาย" | "หญิง";
  sport: string;
  stations: Record<string, string>;
  passedCount: number;
  totalTests: number;
  scorePct: number;
  testLevel: string;
  overallGrade: string;
  status: "ผ่านเกณฑ์" | "ไม่ผ่านเกณฑ์";
  round?: string;
  note?: string;
};

export type ParsedFitnessSportSheet = {
  sport: string;
  stations: string[];
  athletes: ParsedFitnessAthlete[];
};

export type ParsedFitnessWorkbookResult = {
  sheets: ParsedFitnessSportSheet[];
  totalAthletes: number;
};

function calculateFitnessLevel(scorePct: number): { testLevel: string; overallGrade: string } {
  if (scorePct >= 80) return { testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม" };
  if (scorePct >= 70) return { testLevel: "ดี", overallGrade: "ดีมาก" };
  if (scorePct >= 60) return { testLevel: "ปานกลาง", overallGrade: "ดี" };
  if (scorePct >= 50) return { testLevel: "ต่ำ", overallGrade: "ปานกลาง" };
  return { testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน" };
}

export function detectGenderFromName(name: string): "ชาย" | "หญิง" {
  const clean = name.trim();
  if (clean.startsWith("นางสาว") || clean.startsWith("น.ส.") || clean.startsWith("นาง")) {
    return "หญิง";
  }
  return "ชาย";
}

export function cleanThaiName(raw: string): { prefix: string; firstName: string; lastName: string; fullName: string } {
  let text = raw.trim();
  let prefix = "";
  if (text.startsWith("นางสาว")) {
    prefix = "นางสาว";
    text = text.slice(6).trim();
  } else if (text.startsWith("น.ส.")) {
    prefix = "น.ส.";
    text = text.slice(4).trim();
  } else if (text.startsWith("นาย")) {
    prefix = "นาย";
    text = text.slice(3).trim();
  } else if (text.startsWith("นาง")) {
    prefix = "นาง";
    text = text.slice(3).trim();
  }

  const parts = text.split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";
  return {
    prefix,
    firstName,
    lastName,
    fullName: raw.trim(),
  };
}

/**
 * วิเคราะห์ Sheet ตามโครงสร้างตารางสมรรถภาพของ ม.พะเยา
 */
export function parseFitnessSheet(sheetName: string, sheet: XLSX.WorkSheet): ParsedFitnessSportSheet | null {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (!rows || rows.length < 5) return null;

  // ค้นหาแถวที่เป็นหัวตารางสถานีทดสอบ (หาแถวที่มีคำว่า "ปริมาณไขมัน" หรือสถานีทดสอบหลัก)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(35, rows.length); i++) {
    const row = rows[i];
    if (Array.isArray(row) && row.some(cell => typeof cell === "string" && cell.includes("ปริมาณไขมัน"))) {
      headerRowIndex = i;
      break;
    }
  }

  // หากไม่พบแถว "ปริมาณไขมัน" ให้ลองหาคำว่า "ชื่อ - สกุล"
  if (headerRowIndex === -1) {
    for (let i = 0; i < Math.min(35, rows.length); i++) {
      const row = rows[i];
      if (Array.isArray(row) && row.some(cell => typeof cell === "string" && (cell.includes("ชื่อ - สกุล") || cell.includes("ชื่อ-สกุล")))) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) return null;

  const headerRow = rows[headerRowIndex] as unknown[];
  const stations: Array<{ col: number; name: string }> = [];

  for (let col = 0; col < headerRow.length; col++) {
    const text = String(headerRow[col] || "").trim();
    if (
      text &&
      !["ที่", "ชื่อ - สกุล", "ชื่อ-สกุล", "ชื่อ", "สกุล", "รหัสนิสิต", "ผลการทดสอบ", "การทดสอบสมรรถภาพ", "ผ่าน", "ไม่ผ่าน", "หมายเหตุ", "ลำดับ"].includes(text)
    ) {
      stations.push({ col, name: text });
    }
  }

  if (!stations.length) return null;

  const athletes: ParsedFitnessAthlete[] = [];
  const cleanSportName = sheetName.replace("ชายหญิง", "").replace(/\s*,\s*/g, "และ").trim();

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!Array.isArray(row) || !row.length) continue;

    const col0 = row[0];
    const name = String(row[1] || "").trim();

    // ข้ามแถวหัวเรื่องที่ซ้ำ
    if (name.includes("ชื่อ - สกุล") || name.includes("ผลการทดสอบ") || name.includes("ชนิดกีฬา")) continue;

    const isOrderNumber = typeof col0 === "number" && !Number.isNaN(col0);
    const hasThaiName = name.startsWith("นาย") || name.startsWith("นางสาว") || name.startsWith("น.ส.") || name.length >= 4;

    if (isOrderNumber || hasThaiName) {
      if (!name) continue;

      const testMap: Record<string, string> = {};
      let passedCount = 0;

      for (const st of stations) {
        const val = String(row[st.col] || "").trim();
        if (val === "ผ่าน" || val === "1" || val.toLowerCase() === "passed" || val.toLowerCase() === "pass") {
          testMap[st.name] = "ผ่าน";
          passedCount++;
        } else if (val === "ไม่ผ่าน" || val === "0" || val.toLowerCase() === "failed" || val.toLowerCase() === "fail") {
          testMap[st.name] = "ไม่ผ่าน";
        } else {
          testMap[st.name] = val || "—";
        }
      }

      const totalTests = stations.length;
      const scorePct = totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0;
      const { testLevel, overallGrade } = calculateFitnessLevel(scorePct);
      const gender = detectGenderFromName(name);

      // ตรวจสอบหมายเหตุ (มักอยู่คอลัมน์ท้ายสุด)
      let note = "";
      for (let c = row.length - 1; c >= stations[stations.length - 1].col + 1; c--) {
        const cellVal = String(row[c] || "").trim();
        if (cellVal && cellVal !== "ผ่าน" && cellVal !== "ไม่ผ่าน") {
          note = cellVal;
          break;
        }
      }

      athletes.push({
        order: isOrderNumber ? col0 : athletes.length + 1,
        name,
        gender,
        sport: cleanSportName,
        stations: testMap,
        passedCount,
        totalTests,
        scorePct,
        testLevel,
        overallGrade,
        status: scorePct >= 60 ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์",
        note,
      });
    }
  }

  return {
    sport: cleanSportName,
    stations: stations.map(s => s.name),
    athletes,
  };
}

/**
 * ฟังก์ชันหลักในการแกะ Workbook จาก ArrayBuffer
 */
export function parseFitnessWorkbook(buffer: ArrayBuffer): ParsedFitnessWorkbookResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets: ParsedFitnessSportSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (sheetName.includes("จำนวนนักกีฬา") || sheetName.includes("สรุป")) continue;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const parsed = parseFitnessSheet(sheetName, sheet);
    if (parsed && parsed.athletes.length > 0) {
      sheets.push(parsed);
    }
  }

  const totalAthletes = sheets.reduce((sum, s) => sum + s.athletes.length, 0);
  return {
    sheets,
    totalAthletes,
  };
}
