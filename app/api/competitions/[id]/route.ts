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
        quotas: true,
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
 * อัปเดตรายการแข่งขัน เช่น ปิดรับสมัคร
 *
 * Body: { name?, sport?, round?, year?, status? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);

    if (!session || !["CLUB", "STAFF", "ADMIN", "SUPERADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการแก้ไขรายการแข่งขัน" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: { quotas: true },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "ไม่พบรายการแข่งขัน" },
        { status: 404 }
      );
    }

    // For CLUB: only allow editing competitions whose sport matches the club's sport
    if (session.role === "CLUB") {
      if (!session.clubId) {
        return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
      }
      const club = await prisma.club.findUnique({ where: { id: session.clubId } });
      if (!club) {
        return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
      }
      const hasMatchingSport = competition.quotas.some((q) => q.sport === club.sport);
      if (!hasMatchingSport) {
        return NextResponse.json(
          { error: "ไม่มีสิทธิ์แก้ไขรายการแข่งขันนี้" },
          { status: 403 }
        );
      }
    }

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
        quotas: true,
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
 * ลบรายการแข่งขัน (เฉพาะชมรมที่เกี่ยวข้องหรือ Admin)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);

    if (!session || !["CLUB", "STAFF", "ADMIN", "SUPERADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบรายการแข่งขัน" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        quotas: true,
        _count: { select: { applications: true } },
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "ไม่พบรายการแข่งขัน" },
        { status: 404 }
      );
    }

    // For CLUB: only allow deleting competitions whose sport matches the club's sport
    if (session.role === "CLUB") {
      if (!session.clubId) {
        return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
      }
      const club = await prisma.club.findUnique({ where: { id: session.clubId } });
      if (!club) {
        return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
      }
      const hasMatchingSport = competition.quotas.some((q) => q.sport === club.sport);
      if (!hasMatchingSport) {
        return NextResponse.json(
          { error: "ไม่มีสิทธิ์ลบรายการแข่งขันนี้" },
          { status: 403 }
        );
      }
    }

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