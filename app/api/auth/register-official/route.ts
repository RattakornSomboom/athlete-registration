import { reserveEmail } from "@/lib/account-service";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { ApiError, atomic, body, ensure, string } from "@/lib/phase4-server";
export async function POST(request: Request) {
  try {
    const data = await body(request);
    const email = string(data.email, "email", 254).toLowerCase();
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "อีเมลไม่ถูกต้อง");
    const password = data.password;
    ensure(typeof password === "string" && password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72, "รหัสผ่านอย่างน้อย 8 ตัวอักษรและไม่เกิน 72 bytes");
    const hash = await bcrypt.hash(password, 10);
    await atomic(async tx => {
      await reserveEmail(tx, email);
      await tx.user.create({ data: { email, password: hash, role: "TEAM_OFFICIAL" } });
    });
    return NextResponse.json({ message: "สร้างบัญชีแล้ว กรุณาเข้าสู่ระบบ" }, { status: 201 });
  } catch (e) {
    const status = e instanceof ApiError ? e.status : e instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(e.code) ? 409 : e instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: e instanceof ApiError ? e.message : "สร้างบัญชีไม่ได้ กรุณาลองใหม่" }, { status });
  }
}
