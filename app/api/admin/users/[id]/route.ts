import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/users/[id]
 * อัปเดตข้อมูลผู้ใช้งาน เช่น สิทธิ์การใช้งาน (Role)
 * Body: { role: 'ATHLETE' | 'STAFF' | 'ADMIN' }
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession(request as NextRequest);
    
    // ตรวจสอบสิทธิ์ว่าต้องเป็น ADMIN เท่านั้น
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (สำหรับผู้ดูแลระบบเท่านั้น)" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !["ATHLETE", "STAFF", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Role ไม่ถูกต้อง (ต้องเป็น ATHLETE, STAFF หรือ ADMIN เท่านั้น)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        studentId: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({
      message: "อัปเดตสิทธิ์การใช้งานสำเร็จ",
      user,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้งาน" },
      { status: 500 }
    );
  }
}
