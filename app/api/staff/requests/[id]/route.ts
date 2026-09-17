import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || session.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejectedReason } = body;

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRequest = await prisma.clubRequest.update({
      where: { id },
      data: {
        status,
        rejectedReason: status === "REJECTED" ? rejectedReason : null
      }
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("[PUT /api/staff/requests/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
