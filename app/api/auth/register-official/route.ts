import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { ApiError, atomic, body, ensure, string } from "@/lib/phase4-server";
export async function POST(request: Request) {
  try {
    const data = await body(request);
    const email = string(data.email, "email", 254).toLowerCase();
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "อีเมลไม่ถูกต้อง");
    const password = string(data.password, "password", 72);
    ensure(password.length >= 8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร");
    const hash = await bcrypt.hash(password, 10);
    await atomic(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
      const [user, club] = await Promise.all([
        tx.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
        tx.club.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
      ]);
      ensure(!user && !club, "อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยบัญชีเดิม", 409);
      await tx.user.create({ data: { email, password: hash, role: "TEAM_OFFICIAL" } });
    });
    return NextResponse.json({ message: "สร้างบัญชีแล้ว กรุณาเข้าสู่ระบบ" }, { status: 201 });
  } catch (e) {
    const status = e instanceof ApiError ? e.status : e instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(e.code) ? 409 : e instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: e instanceof ApiError ? e.message : "สร้างบัญชีไม่ได้ กรุณาลองใหม่" }, { status });
  }
}

