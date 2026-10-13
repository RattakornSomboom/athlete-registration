import { api, body } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { reviewOfficial } from "@/lib/official-service";
export async function GET(request: Request) {
  return api(request, ["CLUB"], async s => {
    const applications = await prisma.officialApplication.findMany({
      where: { clubId: s.clubId ?? "__no_club__", status: { not: "DRAFT" } },
      orderBy: { updatedAt: "desc" },
      include: {
        club: { select: { id: true, name: true, sport: true } },
        competition: { select: { name: true } },
        events: { orderBy: { createdAt: "desc" } },
      },
    });
    const documentIds = applications.flatMap(application => {
      const documents = application.documents;
      if (!documents || typeof documents !== "object" || Array.isArray(documents)) return [];
      return Object.values(documents).filter((id): id is string => typeof id === "string");
    });
    const privateDocuments = documentIds.length
      ? await prisma.privateDocument.findMany({
        where: {
          id: { in: documentIds },
          ownerRole: "TEAM_OFFICIAL",
          purpose: "OFFICIAL",
          state: "READY",
        },
        select: { id: true, name: true },
      })
      : [];
    const documentNames = new Map(privateDocuments.map(document => [document.id, document.name]));
    return {
      applications: applications.map(application => ({
        ...application,
        documentNames: Object.fromEntries(
          documentIds.flatMap(id => {
            const name = documentNames.get(id);
            return name ? [[id, name]] : [];
          }),
        ),
      })),
    };
  });
}
export async function POST(request: Request) {
  return api(request, ["CLUB"], async s => reviewOfficial(s, await body(request)));
}
