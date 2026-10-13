export const DEFAULT_SPORTS = [
  "กรีฑา",
  "กีฬาทางน้ำ",
  "วอลเลย์บอล",
  "เทควันโด",
  "มวยไทยสมัครเล่น",
  "ฟุตบอล",
  "บาสเกตบอล",
  "เปตอง",
  "แบดมินตัน",
  "เทเบิลเทนนิส",
  "เทนนิส",
  "ฟุตซอล",
  "ยูโด",
  "คาราเต้",
  "ยูยิตสู",
  "อีสปอร์ต",
  "เซปักตะกร้อ",
  "หมากรุก",
] as const;

export function normalizeSportName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}
