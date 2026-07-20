import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/applications?userId=...&status=...
 * ดูรายการใบสมัคร (filter ด้วย userId หรือ status ได้)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    } else if (studentId) {
      const user = await prisma.user.findUnique({
        where: { studentId },
      });
      if (user) {
        where.userId = user.id;
      } else {
        return NextResponse.json({ applications: [] });
      }
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const applications = await prisma.application.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[GET /api/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/applications
 * ส่งใบสมัครลงแข่ง
 *
 * Body: {
 *   studentId: string,
 *   competitionId: string,
 *   sport: string,
 *   category: string,
 *   division?: string,
 *   note?: string,
 *   sportEntries?: Array<{ sport, category, division? }>,
 *   competitionResults?: Array<{ competitionName, year, result }>
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      competitionId,
      sport,
      category,
      division,
      note,
      sportEntries,
      competitionResults,
    } = body;

    if (!studentId || !competitionId || !sport || !category) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้" },
        { status: 404 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        competitionId,
        sport,
        category,
        division: division || null,
        note: note || null,
        status: "SUBMITTED",
        statusHistory: {
          create: {
            status: "SUBMITTED",
            label: "ส่งใบสมัคร",
            by: `${studentId}@up.ac.th`,
          },
        },
        ...(sportEntries?.length
          ? {
              sportEntries: {
                create: sportEntries.map(
                  (entry: { sport: string; category: string; division?: string }) => ({
                    sport: entry.sport,
                    category: entry.category,
                    division: entry.division || null,
                  })
                ),
              },
            }
          : {}),
        ...(competitionResults?.length
          ? {
              competitionResults: {
                create: competitionResults.map(
                  (result: { competitionName: string; year: string; result: string }) => ({
                    competitionName: result.competitionName,
                    year: result.year,
                    result: result.result,
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        statusHistory: true,
        sportEntries: true,
        competitionResults: true,
      },
    });

    return NextResponse.json(
      { message: "ส่งใบสมัครสำเร็จ", application },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
