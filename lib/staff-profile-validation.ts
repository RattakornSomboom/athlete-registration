import { z } from "zod";

export class ValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>, message = "กรุณาตรวจสอบข้อมูลที่ส่งมา") {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

const staffProfileSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "กรุณาระบุอีเมล")
      .max(254, "อีเมลต้องมีความยาวไม่เกิน 254 ตัวอักษร")
      .email("รูปแบบอีเมลไม่ถูกต้อง")
      .transform((value) => value.toLowerCase()),
  })
  .strict();

export function staffProfileInput(data: unknown): { email: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError({ email: "ข้อมูลที่ส่งมาไม่ถูกต้อง" });
  }

  const result = staffProfileSchema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      if (issue.code === "unrecognized_keys" && "keys" in issue && Array.isArray(issue.keys)) {
        for (const key of issue.keys) {
          if (!fieldErrors[String(key)]) {
            fieldErrors[String(key)] = "ไม่อนุญาตให้แก้ไขข้อมูลอื่นนอกจากอีเมล";
          }
        }
        continue;
      }

      const pathKey = issue.path[0] ? String(issue.path[0]) : "email";
      if (!fieldErrors[pathKey]) {
        fieldErrors[pathKey] = issue.message;
      }
    }
    throw new ValidationError(fieldErrors);
  }

  return result.data;
}

const clubProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Club name is required").max(200, "Club name is too long").optional(),
    email: z.string().trim().min(1, "Email is required").max(254, "Email is too long").email("Invalid email").transform((value) => value.toLowerCase()).optional(),
    sport: z.string().trim().min(1, "Sport is required").max(100, "Sport is too long").optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type ClubProfileInput = {
  name?: string;
  email?: string;
  sport?: string;
  isActive?: boolean;
};

export function clubProfileInput(data: unknown): ClubProfileInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError({ body: "Request body must be an object" });
  }

  const result = clubProfileSchema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      if (issue.code === "unrecognized_keys" && "keys" in issue && Array.isArray(issue.keys)) {
        for (const key of issue.keys) fieldErrors[String(key)] = "Field is not allowed";
        continue;
      }
      fieldErrors[issue.path[0] ? String(issue.path[0]) : "body"] ??= issue.message;
    }
    throw new ValidationError(fieldErrors);
  }

  if (Object.keys(result.data).length === 0) {
    throw new ValidationError({ body: "At least one field is required" });
  }

  return result.data;
}
