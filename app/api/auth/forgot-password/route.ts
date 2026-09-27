import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, ValidationError } from "@/lib/validation";
import { checkResetRateLimit, createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/password-reset-delivery";
import { recordAudit } from "@/lib/audit-service";

const GENERIC_RESPONSE = {
  message: "หากอีเมลนี้มีบัญชีอยู่ในระบบ เราจะส่งขั้นตอนการตั้งรหัสผ่านใหม่ให้",
};

/**
 * POST /api/auth/forgot-password
 * ขอลิงก์สำหรับตั้งรหัสผ่านใหม่ (ป้องกัน Account Enumeration)
 * Body: { email: string }
 */
export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "ข้อมูล JSON ไม่ถูกต้อง" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "ข้อมูลต้องเป็น JSON object" }, { status: 400 });
    }

    let normalizedEmail: string;
    try {
      normalizedEmail = normalizeEmail(body.email);
    } catch {
      return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
    }

    // Rate limiting abuse protection (1 request per 60s per email)
    const allowed = checkResetRateLimit(normalizedEmail);
    if (!allowed) {
      // Return generic message even when throttled to prevent timing attacks
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    // Look up account in User table first
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    let resetToken: string | null = null;

    if (user) {
      resetToken = createPasswordResetToken({
        userId: user.id,
        email: user.email,
        userType: "USER",
        passwordHash: user.password,
        updatedAt: user.updatedAt,
      });

      // Record audit event
      await prisma.$transaction(async (tx) => {
        await recordAudit(tx, {
          actorId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          entityType: "USER",
          entityId: user.id,
          details: { email: user.email },
        });
      });
    } else {
      // Check Club table
      const club = await prisma.club.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });

      if (club) {
        resetToken = createPasswordResetToken({
          userId: club.id,
          email: club.email,
          userType: "CLUB",
          passwordHash: club.password,
          updatedAt: club.createdAt, // Club table does not have updatedAt
        });

        await prisma.$transaction(async (tx) => {
          await recordAudit(tx, {
            actorId: club.id,
            action: "PASSWORD_RESET_REQUESTED",
            entityType: "CLUB",
            entityId: club.id,
            details: { email: club.email },
          });
        });
      }
    }

    if (resetToken) {
      try {
        await sendPasswordResetEmail(normalizedEmail, resetToken);
      } catch {
        console.error("[PASSWORD_RESET_DELIVERY_FAILED]");
      }
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: 400 });
    }
    console.error("[POST /api/auth/forgot-password] request failed");
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  }
}
