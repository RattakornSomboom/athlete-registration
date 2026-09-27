import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";
import {
  getPasswordTokenVersion,
  validateNewPassword,
  verifyPasswordResetToken,
  PasswordResetError,
} from "@/lib/password-reset";
import { recordAudit } from "@/lib/audit-service";
import bcrypt from "bcryptjs";

const INVALID_LINK_MESSAGE = "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่";

/**
 * GET /api/auth/reset-password?token=...
 * ตรวจสอบความถูกต้องของ Reset Token
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: INVALID_LINK_MESSAGE }, { status: 400 });
    }

    const payload = verifyPasswordResetToken(token);

    if (payload.userType === "USER") {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, password: true, updatedAt: true, isActive: true },
      });

      if (!user) {
        return NextResponse.json({ valid: false, error: INVALID_LINK_MESSAGE }, { status: 400 });
      }

      // Check if token was already used (password changed)
      const currentVersion = getPasswordTokenVersion(user.password, user.updatedAt);
      if (payload.tokenVersion !== currentVersion || payload.email !== user.email.trim().toLowerCase()) {
        return NextResponse.json(
          { valid: false, error: "ลิงก์นี้ถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่" },
          { status: 400 }
        );
      }

      return NextResponse.json({ valid: true, email: user.email });
    } else {
      const club = await prisma.club.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, password: true, createdAt: true },
      });

      if (!club) {
        return NextResponse.json({ valid: false, error: INVALID_LINK_MESSAGE }, { status: 400 });
      }

      const currentVersion = getPasswordTokenVersion(club.password, club.createdAt);
      if (payload.tokenVersion !== currentVersion || payload.email !== club.email.trim().toLowerCase()) {
        return NextResponse.json(
          { valid: false, error: "ลิงก์นี้ถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่" },
          { status: 400 }
        );
      }

      return NextResponse.json({ valid: true, email: club.email });
    }
  } catch (error) {
    if (error instanceof PasswordResetError || error instanceof ValidationError) {
      return NextResponse.json({ valid: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ valid: false, error: INVALID_LINK_MESSAGE }, { status: 400 });
  }
}

/**
 * POST /api/auth/reset-password
 * ตั้งรหัสผ่านใหม่ด้วย Reset Token
 * Body: { token, password, confirmPassword }
 */
export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "ข้อมูล JSON ไม่ถูกต้อง" }, { status: 400 });
    }

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: INVALID_LINK_MESSAGE }, { status: 400 });
    }

    // Verify token validity and purpose
    const payload = verifyPasswordResetToken(token);

    // Validate new password rules and match
    const validPassword = validateNewPassword(body.password, body.confirmPassword);
    const hashedPassword = await bcrypt.hash(validPassword, 10);

    return await prisma.$transaction(async (tx) => {
      if (payload.userType === "USER") {
        const user = await tx.user.findUnique({
          where: { id: payload.userId },
        });

        if (!user) {
          return NextResponse.json({ error: INVALID_LINK_MESSAGE }, { status: 400 });
        }

        // Check if token was already used
        const currentVersion = getPasswordTokenVersion(user.password, user.updatedAt);
        if (payload.tokenVersion !== currentVersion || payload.email !== user.email.trim().toLowerCase()) {
          return NextResponse.json(
            { error: "ลิงก์นี้ถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่" },
            { status: 400 }
          );
        }

        // Account status consideration:
        // Resetting password does NOT alter isActive status (SUSPENDED remains SUSPENDED)
        const changed = await tx.user.updateMany({
          where: { id: user.id, password: user.password, updatedAt: user.updatedAt },
          data: {
            password: hashedPassword,
          },
        });
        if (changed.count !== 1) {
          throw new PasswordResetError({ token: INVALID_LINK_MESSAGE }, INVALID_LINK_MESSAGE);
        }

        // Record audit event
        await recordAudit(tx, {
          actorId: user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "USER",
          entityId: user.id,
          details: { email: user.email },
        });

        return NextResponse.json({
          message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
        });
      } else {
        const club = await tx.club.findUnique({
          where: { id: payload.userId },
        });

        if (!club) {
          return NextResponse.json({ error: INVALID_LINK_MESSAGE }, { status: 400 });
        }

        const currentVersion = getPasswordTokenVersion(club.password, club.createdAt);
        if (payload.tokenVersion !== currentVersion || payload.email !== club.email.trim().toLowerCase()) {
          return NextResponse.json(
            { error: "ลิงก์นี้ถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่" },
            { status: 400 }
          );
        }

        const changed = await tx.club.updateMany({
          where: { id: club.id, password: club.password, email: club.email },
          data: {
            password: hashedPassword,
          },
        });
        if (changed.count !== 1) {
          throw new PasswordResetError({ token: INVALID_LINK_MESSAGE }, INVALID_LINK_MESSAGE);
        }

        await recordAudit(tx, {
          actorId: club.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "CLUB",
          entityId: club.id,
          details: { email: club.email },
        });

        return NextResponse.json({
          message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
        });
      }
    });
  } catch (error) {
    if (error instanceof PasswordResetError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: 400 });
    }
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" }, { status: 500 });
  }
}
