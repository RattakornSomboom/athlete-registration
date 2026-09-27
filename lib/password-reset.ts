import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";

function resetSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required for password reset");
  return secret;
}

export class PasswordResetError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>, message = "กรุณาตรวจสอบข้อมูลที่ส่งมา") {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export type PasswordResetTokenPayload = {
  userId: string;
  email: string;
  userType: "USER" | "CLUB";
  tokenVersion: string;
  purpose: "password_reset";
};

/**
 * Generate a fingerprint string from user's current password and updatedAt.
 * If the user's password changes, this version changes, immediately invalidating old tokens.
 */
export function getPasswordTokenVersion(passwordHash: string, updatedAt: Date): string {
  return createHash("sha256").update(`${passwordHash}:${updatedAt.getTime()}`).digest("hex");
}

/**
 * Sign a secure password reset JWT token with 15 minute expiration.
 */
export function createPasswordResetToken(data: {
  userId: string;
  email: string;
  userType: "USER" | "CLUB";
  passwordHash: string;
  updatedAt: Date;
}): string {
  const tokenVersion = getPasswordTokenVersion(data.passwordHash, data.updatedAt);
  const payload: PasswordResetTokenPayload = {
    userId: data.userId,
    email: data.email.toLowerCase().trim(),
    userType: data.userType,
    tokenVersion,
    purpose: "password_reset",
  };

  return jwt.sign(payload, resetSecret(), { expiresIn: "15m", algorithm: "HS256" });
}

/**
 * Verify and decode a password reset JWT token.
 * Throws if signature is invalid, expired, or purpose is not password_reset.
 */
export function verifyPasswordResetToken(token: string): PasswordResetTokenPayload {
  try {
    const decoded = jwt.verify(token, resetSecret(), { algorithms: ["HS256"] });
    if (typeof decoded === "string" || decoded.purpose !== "password_reset"
      || typeof decoded.userId !== "string" || !decoded.userId
      || typeof decoded.email !== "string" || !decoded.email
      || typeof decoded.tokenVersion !== "string" || !decoded.tokenVersion
      || !["USER", "CLUB"].includes(decoded.userType)
      || typeof decoded.exp !== "number" || typeof decoded.iat !== "number"
      || decoded.exp - decoded.iat > 900) {
      throw new Error("INVALID_TOKEN_PURPOSE");
    }
    return decoded as PasswordResetTokenPayload;
  } catch {
    throw new PasswordResetError({ token: "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่" });
  }
}

/**
 * Server-side password policy validation:
 * - Minimum 8 characters
 * - Maximum 72 bytes (bcrypt restriction)
 * - Password and confirmation match
 */
export function validateNewPassword(password: unknown, confirmPassword: unknown): string {
  const errors: Record<string, string> = {};

  if (typeof password !== "string" || !password) {
    errors.password = "กรุณาระบุรหัสผ่านใหม่";
  } else if (password.length < 8) {
    errors.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
  } else if (Buffer.byteLength(password, "utf8") > 72) {
    errors.password = "รหัสผ่านยาวเกิน 72 ไบต์";
  }

  if (typeof confirmPassword !== "string" || !confirmPassword) {
    errors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
  }

  if (Object.keys(errors).length > 0) {
    throw new PasswordResetError(errors);
  }

  return password as string;
}

// In-memory rate limiting map for password reset requests (prevents rapid spam per email)
const recentResetRequests = new Map<string, number>();

/**
 * Returns false if rate limit is exceeded (within cooldown period), true otherwise.
 */
export function checkResetRateLimit(key: string, cooldownMs = 60000): boolean {
  const now = Date.now();
  const normalizedKey = key.trim().toLowerCase();
  const lastTime = recentResetRequests.get(normalizedKey);

  if (lastTime && now - lastTime < cooldownMs) {
    return false;
  }

  recentResetRequests.set(normalizedKey, now);

  // Periodically clean up entries older than 10 minutes
  if (recentResetRequests.size > 5000) {
    for (const [k, timestamp] of recentResetRequests.entries()) {
      if (now - timestamp > 600000) {
        recentResetRequests.delete(k);
      }
    }
  }

  return true;
}
