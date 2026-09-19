import { api, body, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { returnRoster } from "@/lib/roster-service";
export async function GET(request: Request) {
  return api(request, STAFF, async () => ({ rosters: await prisma.clubRoster.findMany({
    orderBy: { updatedAt: "desc" }, include: {
      club: { select: { name: true, sport: true } }, competition: { select: { name: true } },
      items: { include: { application: { select: { status: true, user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true } } } } } } } },
      events: { orderBy: { createdAt: "desc" } },
    },
  }) }));
}
export async function POST(request: Request) {
  return api(request, STAFF, async s => returnRoster(s, await body(request)));
}

