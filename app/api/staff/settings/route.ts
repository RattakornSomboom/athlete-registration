import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request as NextRequest, "STAFF", "ADMIN");
    if ("error" in auth) return auth.error;

    const sports = await prisma.sportConfig.findMany({
      orderBy: { createdAt: "asc" }
    });
    
    const scheduleSetting = await prisma.systemSetting.findUnique({
      where: { key: "QUALIFIER_SCHEDULE" }
    });
    
    return NextResponse.json({
      sports,
      schedule: scheduleSetting?.value ?? {}
    });
  } catch (error) {
    console.error("[GET /api/staff/settings]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request as NextRequest, "ADMIN");
  if ("error" in auth) return auth.error;
  return NextResponse.json({ error: "ตั้งค่ากีฬาและกำหนดการผ่านหน้าการแข่งขัน" }, { status: 409 });
}
