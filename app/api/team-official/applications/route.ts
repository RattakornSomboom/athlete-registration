import { api, body } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { saveOfficial } from "@/lib/official-service";
export async function GET(request: Request) {
  return api(request, ["TEAM_OFFICIAL"], async s => ({ applications: await prisma.officialApplication.findMany({
    where: { userId: s.id }, orderBy: { updatedAt: "desc" },
    include: { club: { select: { id: true, name: true } }, competition: { select: { id: true, name: true } }, events: { orderBy: { createdAt: "desc" } } },
  }) }));
}
export async function POST(request: Request) {
  return api(request, ["TEAM_OFFICIAL"], async s => saveOfficial(s, await body(request)));
}

