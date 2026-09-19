import { api, ensure, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return api(request, STAFF, async () => {
    const { id } = await context.params;
    const snapshot = await prisma.analyticsSnapshot.findUnique({ where: { id }, include: { author: { select: { email: true } } } });
    ensure(snapshot, "ไม่พบรายงาน", 404);
    return { snapshot };
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(request, STAFF, async s => {
    const { id } = await context.params;
    const snapshot = await prisma.analyticsSnapshot.findUnique({ where: { id } });
    ensure(snapshot, "ไม่พบรายงาน", 404);
    ensure(snapshot.authorId === s.id || s.role === "ADMIN" || s.role === "SUPERADMIN", "ลบได้เฉพาะรายงานของตัวเอง", 403);
    await prisma.analyticsSnapshot.delete({ where: { id } });
    return { success: true };
  });
}

