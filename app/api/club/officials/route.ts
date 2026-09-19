import { api, body } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { reviewOfficial } from "@/lib/official-service";
export async function GET(request: Request) {
  return api(request, ["CLUB"], async s => ({ applications: await prisma.officialApplication.findMany({
    where: { clubId: s.clubId ?? "__no_club__", status: { not: "DRAFT" } }, orderBy: { updatedAt: "desc" },
    include: { competition: { select: { name: true } }, events: { orderBy: { createdAt: "desc" } } },
  }) }));
}
export async function POST(request: Request) {
  return api(request, ["CLUB"], async s => reviewOfficial(s, await body(request)));
}

