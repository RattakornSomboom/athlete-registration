import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJsonObject, ValidationError } from "@/lib/validation";
import { documentId, documentReference } from "@/lib/athlete-document-policy";
import { ApiError, atomic, ensure, ownedDocument } from "@/lib/phase4-server";

/**
 * GET /api/activities
 * ดูกิจกรรมทั้งหมด
 * Query: ?clubId=... &status=...
 */
export async function GET(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session || !["CLUB", "STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    let clubId = searchParams.get("clubId");

    if (session.role === "CLUB") {
      if (!session.clubId) return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 403 });
      clubId = session.clubId;
    }

    const where: Record<string, unknown> = {};

    if (clubId) where.clubId = clubId;
    if (status) where.status = status;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        club: {
          select: { id: true, name: true, sport: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("[GET /api/activities]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activities
 * สร้างกิจกรรมใหม่
 *
 * Body: { clubId, title, description?, date, location?, status? }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session || session.role !== "CLUB" || !session.clubId) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะชมรม)" },
        { status: 403 }
      );
    }

    const body = await parseJsonObject(request);
    const { title, description, date, location, status, documentUrl, imageUrls } = body;
    const attachmentId = documentId(documentUrl);
    ensure(attachmentId, "กรุณาอัปโหลดเอกสารประกอบกิจกรรมผ่านระบบเอกสารส่วนตัว");

    const imageIds: string[] = [];
    if (Array.isArray(imageUrls)) {
      for (const item of imageUrls) {
        if (typeof item === "string") {
          const id = documentId(item);
          if (id) imageIds.push(id);
        }
      }
    }
    ensure(imageIds.length <= 5, "ภาพถ่ายประกอบกิจกรรมต้องไม่เกิน 5 รูป");

    if (typeof title !== "string" || !title.trim() || typeof date !== "string" || !date.trim() || Number.isNaN(Date.parse(date)) ||
      (description != null && typeof description !== "string") || (location != null && typeof location !== "string") ||
      (status !== undefined && status !== "planned")) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน (title, date)" },
        { status: 400 }
      );
    }

    const club = await prisma.club.findUnique({
      where: { id: session.clubId },
      select: { id: true }
    });

    if (!club) {
      return NextResponse.json(
        { error: "ไม่พบชมรม" },
        { status: 404 }
      );
    }

    const clubId = club.id;

    const activity = await atomic(async (tx) => {
      const document = await ownedDocument(tx, attachmentId, clubId, "ROSTER");
      ensure(document.ownerRole === "CLUB", "เอกสารไม่ใช่ของชมรม", 403);
      await tx.privateDocument.update({ where: { id: attachmentId }, data: { retained: true } });

      for (const imgId of imageIds) {
        const imgDoc = await ownedDocument(tx, imgId, clubId, "ROSTER");
        ensure(imgDoc.ownerRole === "CLUB", "ภาพถ่ายไม่ใช่ของชมรม", 403);
        await tx.privateDocument.update({ where: { id: imgId }, data: { retained: true } });
      }

      let fullDescription = description || null;
      if (imageIds.length > 0) {
        const imgList = imageIds.map((id, idx) => `ภาพถ่ายที่ ${idx + 1}: ${documentReference(id)}`).join("\n");
        fullDescription = fullDescription
          ? `${fullDescription}\n\n[ภาพถ่ายประกอบกิจกรรม]\n${imgList}`
          : `[ภาพถ่ายประกอบกิจกรรม]\n${imgList}`;
      }

      return tx.activity.create({
        data: {
          clubId,
          title: title.trim(),
          description: fullDescription,
          date: new Date(date),
          location: location || null,
          documentUrl: documentReference(attachmentId),
          status: status || "planned",
        },
        include: {
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
      });
    });

    return NextResponse.json(
      { message: "สร้างกิจกรรมสำเร็จ", activity },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/activities]", error);
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: "ข้อมูลกิจกรรมไม่ถูกต้อง" }, { status: 400 });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
