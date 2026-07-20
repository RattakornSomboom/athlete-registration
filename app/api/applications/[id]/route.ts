import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/applications/[id]
 * ดูรายละเอียดใบสมัคร
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: {
          include: { profile: true },
        },
        competition: {
          include: { club: true },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        sportEntries: true,
        competitionResults: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "ไม่พบใบสมัคร" },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("[GET /api/applications/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/applications/[id]
 * อัปเดตสถานะใบสมัคร (ชมรมอนุมัติ/ปฏิเสธ, เจ้าหน้าที่อนุมัติ/ปฏิเสธ)
 *
 * Body: { status: string, label: string, by: string }
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, label, by } = body;

    if (!status || !label || !by) {
      return NextResponse.json(
        { error: "กรุณาระบุ status, label, และ by" },
        { status: 400 }
      );
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        statusHistory: {
          create: {
            status: status.toUpperCase(),
            label,
            by,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      message: "อัปเดตสถานะสำเร็จ",
      application,
    });
  } catch (error) {
    console.error("[PATCH /api/applications/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
