// ทะเบียนกีฬาของโมดูลสู่ความเป็นเลิศ — โครงหน้า (ชื่อหน้า เมนู ตัวเลือกกีฬา) อ่านจากที่นี่ ไม่ผูกกับกีฬาใดกีฬาหนึ่ง
// ตอนนี้มีเฉพาะกรีฑา; เมื่อเพิ่มกีฬาใหม่ให้ลงทะเบียนที่นี่ และเพิ่มชั้นข้อมูล/หน้าเฉพาะกีฬานั้น
// (รายการแข่ง หน่วยผล PB ฯลฯ ของกรีฑาอยู่ใน lib/excellence-athletics.ts)
// ไม่มี import ใด ๆ เพื่อให้ unit test รันด้วย node ได้โดยตรง

export type ExcellenceSport = {
  key: string; // ตรงกับ Application.sport
  label: string;
  // คำเรียกผลการแข่งขันของกีฬานี้ ใช้ในหัวคอลัมน์/คำอธิบายที่ไม่เจาะจงรายการ
  resultLabel: string;
};

export const EXCELLENCE_SPORTS: readonly ExcellenceSport[] = [
  { key: "กรีฑา", label: "กรีฑา", resultLabel: "ผลแข่งขัน" },
];

export const DEFAULT_EXCELLENCE_SPORT: string = EXCELLENCE_SPORTS[0].key;

export function findExcellenceSport(key: unknown): ExcellenceSport | null {
  return typeof key === "string" ? EXCELLENCE_SPORTS.find(sport => sport.key === key) ?? null : null;
}
