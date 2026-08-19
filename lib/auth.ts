import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

export type JWTPayload = {
  id: string;
  role: "ATHLETE" | "CLUB" | "STAFF" | "ADMIN";
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
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Get session from Next.js request (reads from cookie "token")
 * Returns null if not authenticated
 */
export function getSession(request: NextRequest): JWTPayload | null {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Get session or throw 401 response
 * Use in API routes that require authentication
 */
export function requireSession(request: NextRequest): JWTPayload {
  const session = getSession(request);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
