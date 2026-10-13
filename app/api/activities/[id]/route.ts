import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/activities/[id]
 * ดูรายละเอียดกิจกรรม
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session || !["CLUB", "STAFF", "ADMIN"].includes(session.role) || (session.role === "CLUB" && !session.clubId)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }
    const { id } = await params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true, sport: true } },
      },
    });

    if (!activity || (session.role === "CLUB" && activity.clubId !== session.clubId)) {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("[GET /api/activities/[id]]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

/**
 * PATCH /api/activities/[id]
 * Staff อนุมัติ/ปฏิเสธกิจกรรม
 *
 * Body: { status: "approved" | "rejected", rejectionReason?: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);

    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "เฉพาะเจ้าหน้าที่เท่านั้นที่สามารถอนุมัติกิจกรรมได้" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status ต้องเป็น 'approved' หรือ 'rejected'" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({ where: { id } });

    if (!activity) {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }

    if (activity.status !== "planned") {
      return NextResponse.json({ error: "กิจกรรมนี้ถูกพิจารณาไปแล้ว" }, { status: 409 });
    }

    const reason = typeof rejectionReason === "string" ? rejectionReason.trim().slice(0, 5000) : "";
    if (status === "rejected" && !reason) {
      return NextResponse.json({ error: "กรุณาระบุเหตุผลที่ไม่อนุมัติ" }, { status: 400 });
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "rejected" ? reason : null,
      },
      include: {
        club: { select: { id: true, name: true, sport: true } },
      },
    });

    return NextResponse.json({
      message: status === "approved" ? "อนุมัติกิจกรรมสำเร็จ" : "ปฏิเสธกิจกรรมสำเร็จ",
      activity: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/activities/[id]]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
