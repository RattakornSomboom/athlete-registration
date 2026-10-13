export const UNIVERSITY_CLUBS = [
  "ชมรมแบดมินตัน มหาวิทยาลัยพะเยา",
  "ชมรมวอลเลย์บอล",
  "ชมรมฟิตเนสและแอโรบิค",
  "ชมรมผู้ตัดสิน มหาวิทยาลัยพะเยา",
  "ชมรมฟุตซอล มหาวิทยาลัยพะเยา",
  "ชมรมผู้นำเชียร์มหาวิทยาลัยพะเยา",
  "ชมรมวู้ดบอล มหาวิทยาลัยพะเยา",
  "ชมรมวิ่ง ว่าย พาย ปั่น",
  "ชมรมเปตอง มหาวิทยาลัยพะเยา",
  "ชมรมมวยมหาวิทยาลัยพะเยา",
  "ชมรมปิงปองมหาวิทยาลัยพะเยา",
  "ชมรมฟุตบอล มหาวิทยาลัยพะเยา",
  "ชมรมชมรมเทควันโดมหาวิทยาลัยพะเยา TKD UP",
  "ชมรมบาสเกตบอล"
] as const;

export type UniversityClub = typeof UNIVERSITY_CLUBS[number];

const CLUB_TAG_PREFIX = "[สังกัดชมรม: ";
const CLUB_TAG_SUFFIX = "]";

export function encodeClubNote(userNote: string | null | undefined, clubName: string | null | undefined): string | null {
  const cleanNote = userNote?.trim() ? userNote.trim().replace(/\[สังกัดชมรม:\s*[^\]]+\]\s*/g, "").trim() : "";
  const cleanClub = clubName?.trim() ?? "";
  if (!cleanClub) return cleanNote || null;
  const tag = `${CLUB_TAG_PREFIX}${cleanClub}${CLUB_TAG_SUFFIX}`;
  return cleanNote ? `${tag} ${cleanNote}` : tag;
}

export function extractClubFromNote(rawNote: string | null | undefined): { clubName: string | null; note: string | null } {
  if (!rawNote) return { clubName: null, note: null };
  const match = rawNote.match(/\[สังกัดชมรม:\s*([^\]]+)\]/);
  const clubName = match ? match[1].trim() : null;
  const note = rawNote.replace(/\[สังกัดชมรม:\s*[^\]]+\]\s*/g, "").trim() || null;
  return { clubName, note };
}

export function suggestClubForSport(sportName: string | null | undefined): string | null {
  if (!sportName) return null;
  const s = sportName.trim().toLowerCase();
  if (s.includes("แบดมินตัน")) return "ชมรมแบดมินตัน มหาวิทยาลัยพะเยา";
  if (s.includes("วอลเลย์บอล")) return "ชมรมวอลเลย์บอล";
  if (s.includes("ฟิตเนส") || s.includes("แอโรบิค")) return "ชมรมฟิตเนสและแอโรบิค";
  if (s.includes("ผู้ตัดสิน")) return "ชมรมผู้ตัดสิน มหาวิทยาลัยพะเยา";
  if (s.includes("ฟุตซอล")) return "ชมรมฟุตซอล มหาวิทยาลัยพะเยา";
  if (s.includes("เชียร์")) return "ชมรมผู้นำเชียร์มหาวิทยาลัยพะเยา";
  if (s.includes("วู้ดบอล") || s.includes("วูดบอล")) return "ชมรมวู้ดบอล มหาวิทยาลัยพะเยา";
  if (s.includes("วิ่ง") || s.includes("ว่าย") || s.includes("พาย") || s.includes("ปั่น") || s.includes("กรีฑา") || s.includes("ไตรกีฬา")) return "ชมรมวิ่ง ว่าย พาย ปั่น";
  if (s.includes("เปตอง")) return "ชมรมเปตอง มหาวิทยาลัยพะเยา";
  if (s.includes("มวย")) return "ชมรมมวยมหาวิทยาลัยพะเยา";
  if (s.includes("ปิงปอง") || s.includes("เทเบิลเทนนิส")) return "ชมรมปิงปองมหาวิทยาลัยพะเยา";
  if (s.includes("ฟุตบอล")) return "ชมรมฟุตบอล มหาวิทยาลัยพะเยา";
  if (s.includes("เทควันโด")) return "ชมรมชมรมเทควันโดมหาวิทยาลัยพะเยา TKD UP";
  if (s.includes("บาสเกตบอล")) return "ชมรมบาสเกตบอล";
  return null;
}
