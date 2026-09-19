import { getSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/validation";
import { reserveEmail } from "@/lib/account-service";
import { api, atomic, body, string } from "@/lib/phase4-server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/clubs
 * ดูรายชื่อชมรมทั้งหมด
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    const management = !!session && ["ADMIN", "SUPERADMIN"].includes(session.role);
    const clubs = await prisma.club.findMany({
      where: management ? {} : { isActive: true },
      select: {
        ...(management ? { presidentName: true, presidentPhone: true, advisors: true, status: true } : {}),
        id: true,
        name: true,
        sport: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ clubs });
  } catch (error) {
    console.error("[GET /api/clubs]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubs
 * สร้างชมรมใหม่ (Admin)
 *
 * Body: { name: string, sport: string, email: string, password: string }
 */
export async function POST(request: Request) {
  return api(request, ["ADMIN", "SUPERADMIN"], async () => {
    const input = await body(request);
    const name = string(input.name, "ชื่อชมรม");
    const sport = string(input.sport, "กีฬา");
    const email = normalizeEmail(input.email);
    const password = string(input.password, "รหัสผ่าน", 72);
    const presidentName = input.presidentName === undefined ? undefined : string(input.presidentName, "ชื่อประธาน");
    const presidentPhone = input.presidentPhone === undefined || input.presidentPhone === "" ? undefined : string(input.presidentPhone, "เบอร์โทรศัพท์");
    const hash = await bcrypt.hash(password, 10);
    return atomic(async tx => {
      await reserveEmail(tx, email);
      const club = await tx.club.create({ data: { name, sport, email, password: hash, presidentName, presidentPhone }, select: { id:true,name:true,sport:true,email:true,isActive:true } });
      return { club, message: "สร้างชมรมสำเร็จ" };
    });
  });
}
