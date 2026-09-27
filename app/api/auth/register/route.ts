import { publicUser } from "@/lib/public-account";
import { reserveEmail } from "@/lib/account-service";
import { ApiError, atomic, ensure } from "@/lib/phase4-server";
import { parseJsonObject, validateProfile, ValidationError } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const input = await parseJsonObject(request);
    ensure(input.role === undefined || input.role === "ATHLETE", "สมัครได้เฉพาะบัญชีนักกีฬา");
    const { studentId, password } = input;
    ensure(typeof studentId === "string" && /^\d{8}$/.test(studentId), "รหัสนิสิตต้องเป็นตัวเลข 8 หลัก");
    ensure(typeof password === "string" && password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษรและไม่เกิน 72 ไบต์");
    let profile: Prisma.AthleteProfileCreateWithoutUserInput | undefined;
    if (input.profile !== undefined) {
      ensure(input.profile && typeof input.profile === "object" && !Array.isArray(input.profile), "ข้อมูลประวัติไม่ถูกต้อง");
      const { pastCompetitions, ...rest } = validateProfile(input.profile as Record<string, unknown>, true);
      profile = { ...rest, ...(pastCompetitions !== undefined ? { pastCompetitions: pastCompetitions === null ? Prisma.JsonNull : pastCompetitions } : {}) } as Prisma.AthleteProfileCreateWithoutUserInput;
    }
    const hash = await bcrypt.hash(password, 10);
    const email = studentId + "@up.ac.th";
    const user = await atomic(async tx => {
      await reserveEmail(tx, email);
      return tx.user.create({ data: { studentId, email, password: hash, role: "ATHLETE", ...(profile ? { profile: { create: profile } } : {}) }, include: { profile: true } });
    });
    return NextResponse.json({ message: "ลงทะเบียนสำเร็จ", user: publicUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: 400 });
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Register failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "ไม่สามารถลงทะเบียนได้" }, { status: 500 });
  }
}
