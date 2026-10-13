// lib/thai-name-title.ts
// คำนำหน้าชื่อและเพศของบุคลากรกีฬา
//
// ระบบไม่เก็บคำนำหน้าเป็นคอลัมน์แยกในฐานข้อมูล แต่จะ "ต่อคำนำหน้าเข้ากับชื่อจริง"
// เช่น นาย + สมชาย => "นายสมชาย" แล้วบันทึกลงฟิลด์ firstName โดยตรง
// ทำให้ข้อมูลแสดงคำนำหน้าได้ถูกต้องทุกจุด และตรวจเพศย้อนกลับได้จากคำนำหน้า

export type NameTitle = "Mr" | "Miss" | "Mrs";
export type NameGender = "male" | "female";

export const NAME_TITLE_OPTIONS: ReadonlyArray<{ value: NameTitle; label: string }> = [
  { value: "Mr", label: "นาย (Mr)" },
  { value: "Miss", label: "นางสาว (Miss)" },
  { value: "Mrs", label: "นาง (Mrs)" },
];

export const NAME_GENDER_OPTIONS: ReadonlyArray<{ value: NameGender; label: string }> = [
  { value: "male", label: "ชาย (male)" },
  { value: "female", label: "หญิง (female)" },
];

const TITLE_PREFIX: Record<NameTitle, string> = {
  Mr: "นาย",
  Miss: "นางสาว",
  Mrs: "นาง",
};

// เรียงจากคำนำหน้าที่ยาวที่สุดก่อน เพื่อให้ "นางสาว" ถูกตัดก่อน "นาง"
const PREFIX_TITLE: ReadonlyArray<{ prefix: string; title: NameTitle; gender: NameGender }> = [
  { prefix: "นางสาว", title: "Miss", gender: "female" },
  { prefix: "นาง", title: "Mrs", gender: "female" },
  { prefix: "นาย", title: "Mr", gender: "male" },
];

export function isNameTitle(value: unknown): value is NameTitle {
  return value === "Mr" || value === "Miss" || value === "Mrs";
}

export function isNameGender(value: unknown): value is NameGender {
  return value === "male" || value === "female";
}

/** เพศที่ระบบเลือกให้อัตโนมัติเมื่อเลือกคำนำหน้า (คืน "" ถ้ายังไม่เลือก) */
export function genderFromTitle(title: string): NameGender | "" {
  if (title === "Mr") return "male";
  if (title === "Miss" || title === "Mrs") return "female";
  return "";
}

/** ต่อคำนำหน้าเข้ากับชื่อจริง (ทำงานซ้ำได้ กันคำนำหน้าซ้อนกัน) */
export function combineTitleWithFirstName(title: string, firstName: string): string {
  const name = firstName.trim();
  if (!isNameTitle(title)) return name;
  const prefix = TITLE_PREFIX[title];
  return name.startsWith(prefix) ? name : `${prefix}${name}`;
}

/** แยกคำนำหน้าเดิมออกจากชื่อจริง เพื่อนำไปแสดงในช่อง Dropdown */
export function splitTitleFromName(fullName: string): {
  title: NameTitle | "";
  firstName: string;
  gender: NameGender | "";
} {
  const name = (fullName ?? "").trim();
  for (const { prefix, title, gender } of PREFIX_TITLE) {
    if (name.startsWith(prefix)) {
      return { title, firstName: name.slice(prefix.length).trim(), gender };
    }
  }
  return { title: "", firstName: name, gender: "" };
}

/** ตรวจจับเพศจากชื่อจริงหรือชื่อเต็ม */
export function detectAthleteGender(fullNameOrFirstName: string): NameGender | "" {
  const parsed = splitTitleFromName(fullNameOrFirstName);
  if (parsed.gender) return parsed.gender;
  const trimmed = (fullNameOrFirstName ?? "").trim();
  if (
    trimmed.startsWith("นางสาว") ||
    trimmed.startsWith("น.ส.") ||
    trimmed.startsWith("นาง") ||
    trimmed.startsWith("เด็กหญิง") ||
    trimmed.startsWith("ด.ญ.")
  ) {
    return "female";
  }
  if (
    trimmed.startsWith("นาย") ||
    trimmed.startsWith("เด็กชาย") ||
    trimmed.startsWith("ด.ช.")
  ) {
    return "male";
  }
  return "";
}

/** แปลงรหัสเพศเป็นข้อความภาษาไทย "ชาย" หรือ "หญิง" */
export function getGenderLabel(gender: string | null | undefined): "ชาย" | "หญิง" | "" {
  if (gender === "male" || gender === "ชาย") return "ชาย";
  if (gender === "female" || gender === "หญิง") return "หญิง";
  return "";
}

