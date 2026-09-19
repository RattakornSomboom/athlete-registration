import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession, type JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseConflict } from "@/lib/db-errors";
import { ValidationError, parseJsonObject } from "@/lib/validation";
export const STAFF = ["STAFF", "ADMIN", "SUPERADMIN"] as const;
export type Tx = Prisma.TransactionClient;
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function ensure(value: unknown, message: string, status = 400): asserts value {
  if (!value) throw new ApiError(status, message);
}
export function string(value: unknown, name: string, max = 200) {
  ensure(typeof value === "string" && value.trim().length > 0 && value.length <= max, `ข้อมูล ${name} ไม่ถูกต้อง`);
  return value.trim();
}
export function version(value: unknown) {
  ensure(Number.isInteger(value) && Number(value) >= 0, "กรุณาระบุ version");
  return Number(value);
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  return parseJsonObject(request);
}
export async function api(request: Request, roles: readonly string[], action: (session: JWTPayload) => Promise<unknown>) {
  try {
    const session = await getSession(request as NextRequest);
    ensure(session, "กรุณาเข้าสู่ระบบ", 401);
    ensure(roles.includes(session.role), "ไม่มีสิทธิ์เข้าถึง", 403);
    return NextResponse.json(await action(session), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: 400 });
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (["P2002", "P2034"].includes(error.code)) return NextResponse.json({ error: "ข้อมูลซ้ำหรือถูกแก้ไข กรุณาโหลดใหม่" }, { status: 409 });
      if (error.code === "P2025") return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    console.error("Phase 4 request failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "ไม่สามารถดำเนินการได้ กรุณาลองใหม่" }, { status: 500 });
  }
}
export async function atomic<T>(fn: (tx: Tx) => Promise<T>) {
  try {
    return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 20000 });
  } catch (error) {
    if (isDatabaseConflict(error)) throw new ApiError(409, "ข้อมูลถูกแก้ไขพร้อมกันหรือซ้ำ กรุณาโหลดใหม่");
    throw error;
  }
}
export function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
export async function ownedDocument(tx: Tx, id: string, ownerId: string, purpose: string) {
  const doc = await tx.privateDocument.findUnique({ where: { id } });
  ensure(doc && doc.ownerId === ownerId && doc.purpose === purpose && doc.state === "READY", "เอกสารไม่ถูกต้องหรือไม่มีสิทธิ์ใช้", 403);
  return doc;
}
export async function openCompetition(tx: Tx, id: string) {
  const c = await tx.competition.findUnique({ where: { id }, include: { quotas: true } });
  ensure(c, "ไม่พบการแข่งขัน", 404);
  ensure(c.status === "OPEN" && (!c.deadline || c.deadline >= new Date()), "การแข่งขันไม่เปิดรับสมัคร", 409);
  return c;
}
