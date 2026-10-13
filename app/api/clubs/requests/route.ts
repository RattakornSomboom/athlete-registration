import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { documentId } from "@/lib/athlete-document-policy";
import { ApiError, atomic, body, ensure, ownedDocument, string } from "@/lib/phase4-server";
import { ValidationError } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session || session.role !== "CLUB" || !session.clubId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: session.clubId },
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
    const session = await getSession(request as NextRequest);
    if (!session || session.role !== "CLUB" || !session.clubId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: session.clubId },
      select: { id: true }
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const data = await body(request);
    const title = string(data.title, "หัวข้อ", 200);
    const reason = string(data.reason, "เหตุผล", 5000);
    const privateDocumentId = documentId(data.documentUrl);
    ensure(privateDocumentId, "กรุณาอัปโหลดเอกสารผ่านระบบเอกสารส่วนตัว");

    const clubRequest = await atomic(async (tx) => {
      const document = await ownedDocument(tx, privateDocumentId, club.id, "ROSTER");
      ensure(document.ownerRole === "CLUB", "เอกสารไม่ใช่ของชมรม", 403);
      await tx.privateDocument.update({ where: { id: privateDocumentId }, data: { retained: true } });
      return tx.clubRequest.create({
        data: {
          clubId: club.id,
          title,
          reason,
          documentUrl: "/api/documents/" + privateDocumentId + "/download",
          status: "PENDING"
        }
      });
    });

    return NextResponse.json({ request: clubRequest }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clubs/requests]", error);
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: "ข้อมูลคำร้องไม่ถูกต้อง" }, { status: 400 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
