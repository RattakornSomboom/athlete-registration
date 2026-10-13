export type SportConfig = {
  categories: string[];
  divisions: string[];
};

export const defaultCategories = ["บุคคลชาย", "บุคคลหญิง", "ทีมชาย", "ทีมหญิง", "คู่ชาย", "คู่หญิง", "คู่ผสม"];
export const combatDivisionsMale = ["รุ่นน้ำหนักไม่เกิน 54 กก.", "รุ่นน้ำหนักไม่เกิน 58 กก.", "รุ่นน้ำหนักไม่เกิน 63 กก.", "รุ่นน้ำหนักไม่เกิน 68 กก.", "รุ่นน้ำหนักไม่เกิน 74 กก.", "รุ่นน้ำหนักไม่เกิน 80 กก.", "รุ่นน้ำหนักไม่เกิน 87 กก.", "รุ่นน้ำหนักเกิน 87 กก.ขึ้นไป"];
export const combatDivisionsFemale = ["รุ่นน้ำหนักไม่เกิน 46 กก.", "รุ่นน้ำหนักไม่เกิน 49 กก.", "รุ่นน้ำหนักไม่เกิน 53 กก.", "รุ่นน้ำหนักไม่เกิน 57 กก.", "รุ่นน้ำหนักไม่เกิน 62 กก.", "รุ่นน้ำหนักไม่เกิน 67 กก.", "รุ่นน้ำหนักไม่เกิน 73 กก.", "รุ่นน้ำหนักเกิน 73 กก.ขึ้นไป"];
export const combatDivisions = [...combatDivisionsMale, ...combatDivisionsFemale];

export const SPORT_CATEGORIES: Record<string, SportConfig> = {
  "กรีฑา": {
    categories: ["ลู่ (ชาย)", "ลู่ (หญิง)", "ลาน (ชาย)", "ลาน (หญิง)"],
    divisions: ["ทั่วไป"]
  },
  "กีฬาทางน้ำ": {
    categories: ["บุคคลชาย", "บุคคลหญิง", "ผลัดชาย", "ผลัดหญิง", "ผลัดผสม"],
    divisions: ["ฟรีสไตล์ 50ม.", "ฟรีสไตล์ 100ม.", "กบ 50ม.", "กบ 100ม.", "ผีเสื้อ 50ม.", "ผีเสื้อ 100ม.", "กรรเชียง 50ม.", "กรรเชียง 100ม.", "เดี่ยวผสม 200ม."]
  },
  "วอลเลย์บอล": {
    categories: ["ทีมชาย", "ทีมหญิง"],
    divisions: ["ทั่วไป"]
  },
  "เทควันโด": {
    categories: ["ต่อสู้ (ชาย)", "ต่อสู้ (หญิง)", "พุ่มเซ่ (เดี่ยว)", "พุ่มเซ่ (คู่)", "พุ่มเซ่ (ทีม)"],
    divisions: combatDivisions
  },
  "มวยไทยสมัครเล่น": {
    categories: ["บุคคลชาย", "บุคคลหญิง"],
    divisions: combatDivisions
  },
  "ฟุตบอล": {
    categories: ["ทีมชาย", "ทีมหญิง"],
    divisions: ["ทั่วไป"]
  },
  "บาสเกตบอล": {
    categories: ["ทีมชาย (5x5)", "ทีมหญิง (5x5)", "ทีมชาย (3x3)", "ทีมหญิง (3x3)"],
    divisions: ["ทั่วไป"]
  },
  "เปตอง": {
    categories: ["ชายเดี่ยว", "หญิงเดี่ยว", "ชายคู่", "หญิงคู่", "คู่ผสม", "ทีมชาย (3 คน)", "ทีมหญิง (3 คน)"],
    divisions: ["ทั่วไป"]
  },
  "แบดมินตัน": {
    categories: ["ชายเดี่ยว", "หญิงเดี่ยว", "ชายคู่", "หญิงคู่", "คู่ผสม", "ทีมชาย", "ทีมหญิง"],
    divisions: ["ทั่วไป"]
  },
  "เทเบิลเทนนิส": {
    categories: ["ชายเดี่ยว", "หญิงเดี่ยว", "ชายคู่", "หญิงคู่", "คู่ผสม", "ทีมชาย", "ทีมหญิง"],
    divisions: ["ทั่วไป"]
  },
  "เทนนิส": {
    categories: ["ชายเดี่ยว", "หญิงเดี่ยว", "ชายคู่", "หญิงคู่", "คู่ผสม", "ทีมชาย", "ทีมหญิง"],
    divisions: ["ทั่วไป"]
  },
  "ฟุตซอล": {
    categories: ["ทีมชาย", "ทีมหญิง"],
    divisions: ["ทั่วไป"]
  },
  "ยูโด": {
    categories: ["ต่อสู้ (ชาย)", "ต่อสู้ (หญิง)", "ท่าทุ่มมาตรฐาน"],
    divisions: combatDivisions
  },
  "คาราเต้": {
    categories: ["ต่อสู้ (ชาย)", "ต่อสู้ (หญิง)", "ท่ารำ (ชาย)", "ท่ารำ (หญิง)"],
    divisions: combatDivisions
  },
  "ยูยิตสู": {
    categories: ["ต่อสู้ (ชาย)", "ต่อสู้ (หญิง)", "จับล็อก", "ดูโอ้"],
    divisions: combatDivisions
  },
  "อีสปอร์ต": {
    categories: ["บุคคล", "ทีม"],
    divisions: ["ROV", "PUBG Mobile", "Valorant", "EAFC"]
  },
  "หมากกระดาน": {
    categories: ["บุคคลชาย", "บุคคลหญิง", "ทีมชาย", "ทีมหญิง", "คู่ผสม"],
    divisions: ["ทั่วไป"]
  },
  "หมากรุก": {
    categories: ["บุคคลชาย", "บุคคลหญิง", "ทีมชาย", "ทีมหญิง", "คู่ผสม"],
    divisions: ["ทั่วไป"]
  },
  "เซปักตะกร้อ": {
    categories: ["ทีมชุด (ชาย)", "ทีมชุด (หญิง)", "ทีมเดี่ยว (ชาย)", "ทีมเดี่ยว (หญิง)", "ตะกร้อคู่ (ชาย)", "ตะกร้อคู่ (หญิง)"],
    divisions: ["ทั่วไป"]
  }
};

/**
 * กรองประเภทกีฬา (Categories) ตามเพศของนักศึกษา
 * - ชาย: แสดงประเภทเฉพาะชาย, ประเภทผสม, และประเภทที่ไม่ระบุเพศ (ซ่อนประเภทเฉพาะหญิง)
 * - หญิง: แสดงประเภทเฉพาะหญิง, ประเภทผสม, และประเภทที่ไม่ระบุเพศ (ซ่อนประเภทเฉพาะชาย)
 * - หากไม่ระบุเพศ: แสดงทุกประเภท
 */
export function filterCategoriesByGender(
  categories: string[],
  gender?: string | null
): string[] {
  if (!gender) return [...categories];
  const isMale = gender === "male" || gender === "ชาย";
  const isFemale = gender === "female" || gender === "หญิง";
  if (!isMale && !isFemale) return [...categories];

  return categories.filter((cat) => {
    // ลบคำว่า "ชายหาด" ออกชั่วคราวเพื่อไม่ให้คำว่า "ชาย" ใน "ชายหาด" ถูกเข้าใจผิดว่าเป็นเพศชาย
    const normalized = cat.replace(/ชายหาด/g, "");
    const hasFemale = normalized.includes("หญิง");
    const hasMale = normalized.includes("ชาย");

    // กรณีเป็นประเภทผสมที่ระบุทั้งชายและหญิง เช่น "คู่ผสม (ชาย-หญิง)"
    if (hasMale && hasFemale) return true;

    if (isMale) {
      // สำหรับนักศึกษาชาย: ซ่อนประเภทเฉพาะหญิง
      return !hasFemale;
    }
    if (isFemale) {
      // สำหรับนักศึกษาหญิง: ซ่อนประเภทเฉพาะชาย
      return !hasMale;
    }
    return true;
  });
}

/**
 * กรองรุ่นการแข่งขัน (Divisions) ตามเพศของนักศึกษา
 * - ชาย: แสดงรุ่นน้ำหนักเฉพาะชาย และรุ่นทั่วไป/รุ่นที่ไม่ระบุเพศ (ซ่อนรุ่นน้ำหนักหญิง)
 * - หญิง: แสดงรุ่นน้ำหนักเฉพาะหญิง และรุ่นทั่วไป/รุ่นที่ไม่ระบุเพศ (ซ่อนรุ่นน้ำหนักชาย)
 * - หากไม่ระบุเพศ: แสดงทุกรุ่น
 */
export function filterDivisionsByGender(
  divisions: string[],
  gender?: string | null
): string[] {
  if (!gender) return [...divisions];
  const isMale = gender === "male" || gender === "ชาย";
  const isFemale = gender === "female" || gender === "หญิง";
  if (!isMale && !isFemale) return [...divisions];

  return divisions.filter((div) => {
    // ตรวจสอบรุ่นน้ำหนักกีฬาต่อสู้
    if (isMale && combatDivisionsFemale.includes(div)) return false;
    if (isFemale && combatDivisionsMale.includes(div)) return false;

    // ตรวจสอบข้อความเพศในชื่อรุ่น (ถ้ามี)
    const normalized = div.replace(/ชายหาด/g, "");
    const hasFemale = normalized.includes("หญิง");
    const hasMale = normalized.includes("ชาย");

    if (hasMale && hasFemale) return true;
    if (isMale && hasFemale) return false;
    if (isFemale && hasMale) return false;

    return true;
  });
}

export const getSportConfig = (
  sportName: string,
  gender?: string | null
): SportConfig => {
  const base = SPORT_CATEGORIES[sportName] || {
    categories: defaultCategories,
    divisions: ["ทั่วไป"],
  };

  return {
    categories: filterCategoriesByGender(base.categories, gender),
    divisions: filterDivisionsByGender(base.divisions, gender),
  };
};
