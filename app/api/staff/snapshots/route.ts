import { api, body, json, STAFF, string } from "@/lib/phase4-server";
import { analyticsData, analyticsFilters } from "@/lib/analytics-server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  return api(request, STAFF, async s => ({ snapshots: (await prisma.analyticsSnapshot.findMany({
    orderBy: { createdAt: "desc" }, select: { id: true, title: true, notes: true, createdAt: true, authorId: true, schemaVersion: true },
  })).map(row => ({ ...row, canDelete: row.authorId === s.id || s.role === "ADMIN" || s.role === "SUPERADMIN" })) }));
}
export async function POST(request: Request) {
  return api(request, STAFF, async s => {
    const input = await body(request);
    const title = string(input.title, "ชื่อรายงาน");
    const notes = typeof input.notes === "string" ? input.notes.slice(0, 4000) : "";
    const result = await analyticsData(analyticsFilters(input));
    const snapshot = await prisma.analyticsSnapshot.create({ data: {
      title, notes, authorId: s.id, filters: json(result.filters), data: json(result.summary),
    } });
    return { snapshot };
  });
}

