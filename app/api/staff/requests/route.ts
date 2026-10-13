import { prisma } from "@/lib/prisma";
import { api } from "@/lib/phase4-server";
import { STAFF_REQUEST_REVIEW_ROLES } from "@/lib/staff-request-validation";

export async function GET(request: Request) {
  return api(request, STAFF_REQUEST_REVIEW_ROLES, async () => ({
    requests: await prisma.clubRequest.findMany({
      include: {
        club: { select: { id: true, name: true, sport: true, presidentName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  }));
}
