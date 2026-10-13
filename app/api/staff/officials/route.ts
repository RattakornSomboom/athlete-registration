import { api, body, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { reviewOfficial } from "@/lib/official-service";
export async function GET(request: Request) {
  return api(request, STAFF, async () => ({ applications: await prisma.officialApplication.findMany({
    where: { status: { in: ["CLUB_APPROVED", "STAFF_APPROVED", "STAFF_REJECTED"] } }, orderBy: { updatedAt: "desc" },
    include: { club: { select: { name: true } }, competition: { select: { name: true } }, events: { orderBy: { createdAt: "desc" } } },
  }) }));
}
export async function POST(request: Request) {
  return api(request, STAFF, async s => reviewOfficial(s, await body(request)));
}

