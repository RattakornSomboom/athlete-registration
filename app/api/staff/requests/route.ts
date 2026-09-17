import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/staff/requests
 * ดูคำร้องทั้งหมดของชมรม
 */
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);

    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const requests = await prisma.clubRequest.findMany({
      include: {
        club: { select: { id: true, name: true, sport: true, presidentName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[GET /api/staff/requests]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
