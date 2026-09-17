import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/admin/users
 * ดึงรายชื่อผู้ใช้งานทั้งหมด (สำหรับ Admin)
 * Query params: ?search=...&role=...
 */
export async function GET(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    
    // ตรวจสอบสิทธิ์ว่าต้องเป็น ADMIN เท่านั้น
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (สำหรับผู้ดูแลระบบเท่านั้น)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const where: any = {};

    if (role) {
      where.role = role.toUpperCase();
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        studentId: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            faculty: true,
            major: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน" },
      { status: 500 }
    );
  }
}
