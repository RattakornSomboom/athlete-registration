import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { summarize, type AnalyticsRow } from "@/lib/analytics";
export type AnalyticsFilters = { competitionId: string | null; sport: string | null };
export function analyticsFilters(data: Record<string, unknown>): AnalyticsFilters {
  return { competitionId: typeof data.competitionId === "string" && data.competitionId ? data.competitionId : null, sport: typeof data.sport === "string" && data.sport ? data.sport : null };
}
export async function analyticsData(filters: AnalyticsFilters) {
  return prisma.$transaction(async tx => {
    const applications = await tx.application.findMany({
      where: { ...(filters.competitionId ? { competitionId: filters.competitionId } : {}), ...(filters.sport ? { sport: filters.sport } : {}) },
      select: { id: true, userId: true, sport: true, status: true, squadType: true, user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true, faculty: true } } } } },
    });
    const quotas = await tx.sportQuota.findMany({ where: { ...(filters.competitionId ? { competitionId: filters.competitionId } : {}), ...(filters.sport ? { sport: filters.sport } : {}) } });
    const rows: AnalyticsRow[] = applications.map(a => ({
      id: a.id, userId: a.userId, sport: a.sport, status: a.status, squadType: a.squadType,
      studentId: a.user.studentId, firstName: a.user.profile?.firstName ?? "", lastName: a.user.profile?.lastName ?? "", faculty: a.user.profile?.faculty ?? "",
    }));
    return { filters, summary: summarize(rows, quotas), rows };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

