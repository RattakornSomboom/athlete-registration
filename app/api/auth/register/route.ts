import { publicUser } from "@/lib/public-account";
import { reserveEmail } from "@/lib/account-service";
import { ApiError, atomic } from "@/lib/phase4-server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/register
 * สมัครบัญชีนักกีฬา + สร้าง profile
 *
 * Body: {
 *   studentId: string,
 *   password: string,
 *   profile: {
 *     firstName, lastName, faculty, major, studentLevel,
 *     year, nationalId, nationality, birthDate,
 *     gpaSemester?, gpaCumulative?,
 *     addressNo, subDistrict, district, province, postalCode, phone,
 *     photoUrl?
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, password, profile } = body;

    // --- Validation ---
    if (!studentId || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสนิสิตและรหัสผ่าน" },
        { status: 400 }
      );
    }

    if (!/^\d{8}$/.test(studentId)) {
      return NextResponse.json(
        { error: "รหัสนิสิตต้องเป็นตัวเลข 8 หลัก" },
        { status: 400 }
      );
    }

    // --- Check duplicate ---
    const existing = await prisma.user.findUnique({
      where: { studentId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "รหัสนิสิตนี้ลงทะเบียนแล้ว" },
        { status: 409 }
      );
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Create user + profile ---
    const email = `${studentId}@up.ac.th`;

    const user = await atomic(async tx => {
      await reserveEmail(tx, email);
      return tx.user.create({
      data: {
        studentId,
        email,
        password: hashedPassword,
        role: "ATHLETE",
        ...(profile
          ? {
              profile: {
                create: {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  faculty: profile.faculty,
                  major: profile.major,
                  studentLevel: profile.studentLevel === "graduate" ? "GRADUATE" : "BACHELOR",
                  year: profile.year,
                  nationalId: profile.nationalId,
                  nationality: profile.nationality || "ไทย",
                  birthDate: new Date(profile.birthDate),
                  gpaSemester: profile.gpaSemester || null,
                  gpaCumulative: profile.gpaCumulative || null,
                  addressNo: profile.addressNo,
                  subDistrict: profile.subDistrict,
                  district: profile.district,
                  province: profile.province,
                  postalCode: profile.postalCode,
                  phone: profile.phone,
                  photoUrl: profile.photoUrl || null,
                },
              },
            }
          : {}),
      },
      include: { profile: true },
    });
    });

    // Remove password from response
    const safeUser = publicUser(user);

    return NextResponse.json(
      { message: "ลงทะเบียนสำเร็จ", user: safeUser },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return NextResponse.json({ error: "บัญชีซ้ำ กรุณาใช้บัญชีเดิม" }, { status: 409 });
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
