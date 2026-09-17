import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const updatedClub = await prisma.club.update({
      where: { id },
      data: {
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ club: updatedClub });
  } catch (error) {
    console.error("[PUT /api/admin/clubs/[id]/approve]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
