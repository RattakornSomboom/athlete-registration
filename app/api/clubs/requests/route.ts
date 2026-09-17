import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || session.role !== "CLUB") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: session.id },
      select: { id: true }
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const requests = await prisma.clubRequest.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[GET /api/clubs/requests]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || session.role !== "CLUB") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: session.id },
      select: { id: true }
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, reason, documentUrl } = body;

    if (!title || !reason || !documentUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const clubRequest = await prisma.clubRequest.create({
      data: {
        clubId: club.id,
        title,
        reason,
        documentUrl,
        status: "PENDING"
      }
    });

    return NextResponse.json({ request: clubRequest }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clubs/requests]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
