import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * PUT /api/auth/password
 * เปลี่ยนรหัสผ่านของผู้ใช้งาน (Athlete, Staff, Admin)
 * Body: { oldPassword, newPassword }
 */
export async function PUT(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำการเปลี่ยนรหัสผ่าน" },
        { status: 401 }
      );
    }

    // เฉพาะ User (Athlete, Staff, Admin) ใช้ API นี้
    // Club จะมี API เปลี่ยนรหัสผ่านของตัวเองที่ PUT /api/clubs/[id]
    if (session.role === "CLUB") {
        return NextResponse.json(
            { error: "ชมรมกรุณาเปลี่ยนรหัสผ่านที่เมนูจัดการโปรไฟล์ชมรม" },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสผ่านเดิมและรหัสผ่านใหม่" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
        return NextResponse.json(
            { error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ใช้งาน" },
        { status: 404 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
        return NextResponse.json(
            { error: "รหัสผ่านเดิมไม่ถูกต้อง" },
            { status: 400 }
        );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: session.id },
        data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error("[PUT /api/auth/password]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" },
      { status: 500 }
    );
  }
}
