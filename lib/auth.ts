import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const PRODUCTION_ROLES = ["ATHLETE", "CLUB", "STAFF", "ADMIN", "TEAM_OFFICIAL"] as const;

export type JWTPayload = {
  id: string;
  role: "ATHLETE" | "CLUB" | "STAFF" | "ADMIN" | "TEAM_OFFICIAL";
  studentId?: string;
  clubId?: string;
};

/**
 * Sign a JWT token with 24h expiry
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Verify and decode JWT token
 * Throws if invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  const payload = jwt.verify(token, JWT_SECRET);
  if (typeof payload === "string" || typeof payload.id !== "string" || !payload.id || payload.id === "dev-user-id"
    || !PRODUCTION_ROLES.includes(payload.role)) throw new Error("Invalid session");
  return payload as JWTPayload;
}

/**
 * Get session from Next.js request (reads from cookie "token")
 * Returns null if not authenticated
 */
export async function getSession(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    const session = verifyToken(token);
    const { prisma } = await import("@/lib/prisma");
    if (session.role === "CLUB") {
      if (!session.clubId) return null;
      const club = await prisma.club.findUnique({ where: { id: session.clubId } });
      if (!club?.isActive) return null;
      if (session.id === club.id) return session;
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      return user?.isActive && user.role === "CLUB" && user.clubId === club.id ? session : null;
    }
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    return user?.isActive && user.role === session.role
      ? { ...session, studentId: user.studentId ?? undefined }
      : null;
  } catch {
    return null;
  }
}

/**
 * Get session or throw 401 response
 * Use in API routes that require authentication
 */
export async function requireSession(request: NextRequest): Promise<JWTPayload> {
  const session = await getSession(request);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Require authentication and optionally restrict to specific roles.
 * Returns { session } on success, or { error: NextResponse } on failure.
 *
 * Usage:
 *   const auth = requireAuth(request, "STAFF", "ADMIN");
 *   if ("error" in auth) return auth.error;
 *   const { session } = auth;
 */
export async function requireAuth(
  request: NextRequest,
  ...roles: JWTPayload["role"][]
): Promise<{ session: JWTPayload } | { error: NextResponse }> {
  const session = await getSession(request);
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      ),
    };
  }
  if (roles.length > 0 && !roles.includes(session.role)) {
    return {
      error: NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      ),
    };
  }
  return { session };
}
