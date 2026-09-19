import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/clubs/[id]/athletes
 * ดูนักกีฬาที่สมัครเข้าชมรม (เฉพาะ CLUB เจ้าของ, STAFF, ADMIN)
 * Query: ?status=... (optional filter)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request as NextRequest, "CLUB", "STAFF", "ADMIN", "SUPERADMIN");
    if ("error" in auth) return auth.error;
    const { session } = auth;

    const { id } = await params;

    const club = await prisma.club.findUnique({
      where: { id },
    });

    if (!club) {
      return NextResponse.json(
        { error: "ไม่พบชมรม" },
        { status: 404 }
      );
    }

    // CLUB can only view athletes of their own club
    if (session.role === "CLUB" && session.clubId !== id) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึงข้อมูลชมรมอื่น" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      sport: club.sport,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const applications = await prisma.application.findMany({
      where,
      select: {
        id: true,
        sport: true,
        category: true,
        division: true,
        squadType: true,
        status: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            studentId: true,
            email: true,
            role: true,
            profile: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            round: true,
            year: true,
            deadline: true,
            status: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        sportEntries: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ athletes: applications, club: { id: club.id, name: club.name, sport: club.sport } });
  } catch (error) {
    console.error("[GET /api/clubs/[id]/athletes]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}