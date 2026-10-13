import { api, body, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { returnRoster } from "@/lib/roster-service";

export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const now = new Date();
    const [rosters, clubs, competitions] = await Promise.all([
      prisma.clubRoster.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          club: { select: { name: true, sport: true } },
          competition: { select: { name: true } },
          items: {
            include: {
              application: {
                select: {
                  id: true,
                  status: true,
                  user: {
                    select: {
                      studentId: true,
                      profile: { select: { firstName: true, lastName: true } },
                    },
                  },
                },
              },
            },
          },
          events: { orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.club.findMany({
        select: { id: true, name: true, sport: true, status: true, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.competition.findMany({
        where: {
          status: "OPEN",
          OR: [{ deadline: null }, { deadline: { gte: now } }],
        },
        select: {
          id: true,
          name: true,
          quotas: { select: { sport: true } },
        },
        orderBy: { year: "desc" },
      }),
    ]);

    const existingRosters = new Set(rosters.map(roster => `${roster.clubId}:${roster.competitionId}`));
    const pending = clubs.flatMap(club =>
      competitions
        .filter(competition =>
          competition.quotas.some(quota => quota.sport === club.sport)
          && !existingRosters.has(`${club.id}:${competition.id}`)
        )
        .map(competition => ({
          clubId: club.id,
          clubName: club.name,
          sport: club.sport,
          clubStatus: club.status,
          isActive: club.isActive,
          competitionId: competition.id,
          competitionName: competition.name,
        }))
    );

    return { rosters, pending };
  });
}

export async function POST(request: Request) {
  return api(request, STAFF, async s => returnRoster(s, await body(request)));
}
