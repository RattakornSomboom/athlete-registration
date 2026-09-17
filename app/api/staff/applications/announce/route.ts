import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * POST /api/staff/applications/announce
 * ประกาศผลการคัดเลือกนักกีฬา — เปลี่ยน STAFF_APPROVED → FINAL_SELECTED
 *
 * Body: { applicationIds?: string[] }
 * ถ้าไม่ส่ง applicationIds จะประกาศผลทุกใบที่ STAFF_APPROVED
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);

    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "เฉพาะเจ้าหน้าที่เท่านั้นที่สามารถประกาศผลได้" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { applicationIds } = body;

    // ถ้าส่ง applicationIds มา ใช้เฉพาะ id เหล่านั้น
    // ถ้าไม่ส่ง → เลือกทุกใบที่ STAFF_APPROVED
    const where: any = applicationIds?.length
      ? { id: { in: applicationIds as string[] }, status: "STAFF_APPROVED" }
      : { status: "STAFF_APPROVED" };

    const applications = await prisma.application.findMany({ where, select: { id: true } });

    if (applications.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีใบสมัครที่รอประกาศผล" },
        { status: 400 }
      );
    }

    const ids = applications.map((a) => a.id);

    // อัปเดตสถานะเป็น FINAL_SELECTED
    await prisma.application.updateMany({
      where: { id: { in: ids } },
      data: { status: "FINAL_SELECTED" },
    });

    // บันทึก StatusHistory ให้ทุกใบ
    await prisma.statusHistory.createMany({
      data: ids.map((id) => ({
        applicationId: id,
        status: "FINAL_SELECTED",
        label: "ประกาศผลการคัดเลือก",
        by: `staff:${session.id}`,
      })),
    });

    return NextResponse.json({
      message: `ประกาศผลสำเร็จ — ${ids.length} คน`,
      count: ids.length,
    });
  } catch (error) {
    console.error("[POST /api/staff/applications/announce]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
