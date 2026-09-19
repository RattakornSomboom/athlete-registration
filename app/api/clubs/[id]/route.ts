import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/clubs/[id]
 * อัปเดตข้อมูลชมรม (Admin หรือ Club ตัวเอง)
 * Body: { name, sport, email, password?, isActive? }
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession(request as NextRequest);
    const { id } = await params;
    
    // ตรวจสอบสิทธิ์ว่าต้องเป็น ADMIN หรือเป็น Club ตัวเอง
    if (!session || (session.role !== "ADMIN" && session.clubId !== id)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, sport, email, password, isActive } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (sport) updateData.sport = sport;
    if (email) updateData.email = email;
    if (isActive !== undefined && session.role === "ADMIN") {
        updateData.isActive = isActive;
    }
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const club = await prisma.club.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        sport: true,
        email: true,
        isActive: true,
      }
    });

    return NextResponse.json({
      message: "อัปเดตข้อมูลชมรมสำเร็จ",
      club,
    });
  } catch (error) {
    console.error("[PUT /api/clubs/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลชมรม" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clubs/[id]
 * ปิดการใช้งานชมรม (Soft delete - isActive = false) สำหรับ Admin
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const club = await prisma.club.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
      }
    });

    return NextResponse.json({
      message: "ปิดการใช้งานชมรมสำเร็จ",
      club,
    });
  } catch (error) {
    console.error("[DELETE /api/clubs/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการปิดการใช้งานชมรม" },
      { status: 500 }
    );
  }
}
