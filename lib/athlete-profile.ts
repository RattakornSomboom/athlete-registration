// athlete-profile.ts
// TODO: เชื่อม Firestore/Backend API จริงเมื่อ Backend พร้อม
// ตอนนี้ใช้ localStorage เป็น mock storage

const STORAGE_KEY_PREFIX = "athlete_profile_";

export type AthleteProfile = {
  studentId: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "other" | "";
  faculty: string;
  major: string;
  studentLevel: "bachelor" | "graduate";
  year: string;
  nationalId: string;
  nationality: string;
  birthDate: string; // yyyy-mm-dd
  gpaSemester: string;
  gpaCumulative: string;
  addressNo: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  photoName?: string;
  photoUrl?: string;
  // สำหรับคำนวณสิทธิ์
  birthYearCE: number;
  previousEntriesCount: number;
};

// ภาพถ่ายตัวอย่างนิสิตทางการ (ขนาด 1 นิ้ว พื้นหลังสีฟ้าชุดนิสิต) สำหรับโหมดทดสอบ / Mock Data
export const DEFAULT_MOCK_PHOTO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200" width="150" height="200"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%25" stop-color="%23bfdbfe"/><stop offset="100%25" stop-color="%2393c5fd"/></linearGradient></defs><rect width="150" height="200" fill="url(%23bg)"/><path d="M 15 200 L 22 155 Q 35 138 75 138 Q 115 138 128 155 L 135 200 Z" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><polygon points="70,150 80,150 83,185 75,195 67,185" fill="%231e3a8a"/><polygon points="48,140 75,160 67,140" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="1"/><polygon points="102,140 75,160 83,140" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="1"/><rect x="65" y="122" width="20" height="22" rx="4" fill="%23fcd34d"/><ellipse cx="75" cy="92" rx="30" ry="36" fill="%23fcd34d"/><path d="M 45 88 Q 45 56 75 56 Q 105 56 105 88 Q 94 68 75 69 Q 56 68 45 88 Z" fill="%231e293b"/><ellipse cx="44" cy="94" rx="4" ry="7" fill="%23fbbf24"/><ellipse cx="106" cy="94" rx="4" ry="7" fill="%23fbbf24"/><ellipse cx="64" cy="92" rx="2.5" ry="3" fill="%231e293b"/><ellipse cx="86" cy="92" rx="2.5" ry="3" fill="%231e293b"/><path d="M 58 85 Q 64 82 70 85" stroke="%231e293b" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M 80 85 Q 86 82 92 85" stroke="%231e293b" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M 75 92 L 73 100 L 77 100" stroke="%23d97706" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M 68 110 Q 75 116 82 110" stroke="%23b45309" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

/**
 * บันทึกข้อมูลส่วนตัวนักกีฬาลง localStorage
 * TODO: เปลี่ยนเป็น POST /api/athletes/profile เมื่อ Backend พร้อม
 */
export function saveAthleteProfile(profile: AthleteProfile): void {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_KEY_PREFIX}${profile.studentId}`;
  localStorage.setItem(key, JSON.stringify(profile));
  // บันทึก studentId ที่ login อยู่เพื่อ restore ตอนโหลด
  localStorage.setItem("current_student_id", profile.studentId);
}

/**
 * โหลดข้อมูลส่วนตัวนักกีฬาจาก localStorage
 * TODO: เปลี่ยนเป็น GET /api/athletes/profile?studentId=... เมื่อ Backend พร้อม
 */
export function getAthleteProfile(studentId?: string): AthleteProfile | null {
  if (typeof window === "undefined") return null;
  const id = studentId ?? localStorage.getItem("current_student_id") ?? "";
  if (!id) return null;
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AthleteProfile;
  } catch {
    return null;
  }
}

/**
 * ตรวจว่าผู้ใช้นี้ลงทะเบียนครั้งแรกแล้วหรือยัง
 * (มีข้อมูลส่วนตัวใน localStorage หรือไม่)
 */
export function hasAthleteProfile(studentId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `${STORAGE_KEY_PREFIX}${studentId}`;
  return !!localStorage.getItem(key);
}

/**
 * คำนวณอายุ (ปี ค.ศ.) จาก birthDate (yyyy-mm-dd)
 */
export function calcBirthYearCE(birthDate: string): number {
  if (!birthDate) return 0;
  return parseInt(birthDate.split("-")[0], 10);
}
