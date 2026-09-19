import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/stats/dashboard
 * ดึงสถิติภาพรวมสำหรับ Dashboard (STAFF / ADMIN)
 */
export async function GET(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session || !["STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      );
    }

    // จำนวนผู้ใช้งาน (แยกตามนักกีฬาและสตาฟฟ์)
    const totalUsers = await prisma.user.count();
    const totalAthletes = await prisma.user.count({ where: { role: "ATHLETE" } });
    
    // จำนวนชมรม
    const totalClubs = await prisma.club.count({ where: { isActive: true } });
    
    // จำนวนการแข่งขันที่เปิดอยู่
    const totalCompetitions = await prisma.competition.count({ where: { status: "OPEN" } });

    // สถิติใบสมัครแยกตามสถานะ
    const applicationStatsList = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const totalApplications = await prisma.application.count();

    // จัดรูปแบบให้เรียกใช้ง่ายๆ เช่น { SUBMITTED: 10, STAFF_APPROVED: 5 }
    const applicationStats = applicationStatsList.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      overview: {
        totalUsers,
        totalAthletes,
        totalClubs,
        totalCompetitions,
        totalApplications,
      },
      applicationStats,
    });
  } catch (error) {
    console.error("[GET /api/stats/dashboard]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงสถิติ Dashboard" },
      { status: 500 }
    );
  }
}
