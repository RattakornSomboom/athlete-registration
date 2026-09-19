import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/competitions
 * ดูรายการแข่งขันทั้งหมด
 * Query: ?status=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (status) where.status = status.toUpperCase();

    const competitions = await prisma.competition.findMany({
      where,
      include: {
        quotas: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("[GET /api/competitions]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitions
 * เจ้าหน้าที่/Admin สร้างโปรแกรมการแข่งขันประจำปี
 *
 * Body: { name, round, year, deadline, quotas: [{ sport, maxStarters, maxSubstitutes, ageLimit }] }
 * Returns: competition object
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "เฉพาะเจ้าหน้าที่หรือผู้ดูแลระบบเท่านั้นที่สามารถสร้างโปรแกรมการแข่งขันได้" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, round, year, deadline, quotas } = body;

    if (!name || !round || !year) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน (name, round, year)" },
        { status: 400 }
      );
    }

    const competition = await prisma.competition.create({
      data: {
        name,
        round,
        year: parseInt(year),
        deadline: deadline ? new Date(deadline) : null,
        status: "OPEN",
        quotas: quotas && quotas.length > 0 ? {
          create: quotas.map((q: any) => ({
            sport: q.sport,
            maxStarters: parseInt(q.maxStarters || "0"),
            maxSubstitutes: parseInt(q.maxSubstitutes || "0"),
            ageLimit: q.ageLimit ? parseInt(q.ageLimit) : null
          }))
        } : undefined
      },
      include: {
        quotas: true,
      },
    });

    return NextResponse.json(
      { message: "สร้างรายการแข่งขันสำเร็จ", competition },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/competitions]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
