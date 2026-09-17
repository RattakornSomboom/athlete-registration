import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/competitions/[id]
 * ดูรายละเอียดรายการแข่งขัน
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        club: {
          select: { id: true, name: true, sport: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "ไม่พบรายการแข่งขัน" },
        { status: 404 }
      );
    }

    return NextResponse.json({ competition });
  } catch (error) {
    console.error("[GET /api/competitions/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/competitions/[id]
 * อัปเดตรายการแข่งขัน เช่น ปิดรับสมัคร (เฉพาะชมรมเจ้าของ)
 *
 * Body: { name?, sport?, round?, year?, status? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSession(request);

    if (!session || !["CLUB", "STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการแก้ไขรายการแข่งขัน" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // ตรวจสอบว่าชมรมเป็นเจ้าของรายการแข่งขันนี้
    const competition = await prisma.competition.findUnique({
      where: { id },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "ไม่พบรายการแข่งขัน" },
        { status: 404 }
      );
    }

    if (session.role === "CLUB" && competition.clubId !== session.clubId) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์แก้ไขรายการแข่งขันของชมรมอื่น" },
        { status: 403 }
      );
    }

    // ผู้ดูแลระบบเข้าถึงได้ทุกรายการ เจ้าหน้าที่เข้าถึงได้ทุกรายการ ชมรมเข้าถึงได้เฉพาะของตนเอง
    const { name, sport, round, year, status } = body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (sport !== undefined) updateData.sport = sport;
    if (round !== undefined) updateData.round = round;
    if (year !== undefined) updateData.year = parseInt(year);
    if (status !== undefined) updateData.status = status.toUpperCase();

    const updated = await prisma.competition.update({
      where: { id },
      data: updateData,
      include: {
        club: {
          select: { id: true, name: true, sport: true },
        },
      },
    });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", competition: updated });
  } catch (error) {
    console.error("[PATCH /api/competitions/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/competitions/[id]
 * ลบรายการแข่งขัน (เฉพาะชมรมเจ้าของหรือ Admin)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSession(request);

    if (!session || !["CLUB", "STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบรายการแข่งขัน" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "ไม่พบรายการแข่งขัน" },
        { status: 404 }
      );
    }

    if (session.role === "CLUB" && competition.clubId !== session.clubId) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบรายการแข่งขันของชมรมอื่น" },
        { status: 403 }
      );
    }

    // เจ้าหน้าที่และ Admin ลบได้ทุกรายการ ชมรมลบได้เฉพาะของตนเอง
    if (competition._count.applications > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบได้ เนื่องจากมีใบสมัครแล้ว ให้ปิดรับสมัครแทน" },
        { status: 400 }
      );
    }

    await prisma.competition.delete({ where: { id } });

    return NextResponse.json({ message: "ลบรายการแข่งขันสำเร็จ" });
  } catch (error) {
    console.error("[DELETE /api/competitions/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
