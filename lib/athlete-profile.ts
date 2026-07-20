// athlete-profile.ts
// TODO: เชื่อม Firestore/Backend API จริงเมื่อ Backend พร้อม
// ตอนนี้ใช้ localStorage เป็น mock storage

const STORAGE_KEY_PREFIX = "athlete_profile_";

export type AthleteProfile = {
  studentId: string;
  firstName: string;
  lastName: string;
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
  // สำหรับคำนวณสิทธิ์
  birthYearCE: number;
  previousEntriesCount: number;
};

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
