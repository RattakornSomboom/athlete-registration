import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { api, atomic, body, ensure, string } from "@/lib/phase4-server";
import { ensureSportConfig } from "@/lib/sport-service";
import { normalizeSportName } from "@/lib/sports";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "CLUB", "STAFF", "ADMIN");
  if ("error" in auth) return auth.error;

  const year = request.nextUrl.searchParams.get("year");
  const round = request.nextUrl.searchParams.get("round");

  const [configured, clubs, quotas, editionsSetting] = await Promise.all([
    prisma.sportConfig.findMany({ where: { isOpen: true }, select: { name: true } }),
    prisma.club.findMany({ select: { sport: true } }),
    prisma.sportQuota.findMany({ select: { sport: true } }),
    year ? prisma.systemSetting.findUnique({ where: { key: "COMPETITION_EDITIONS_CONFIG" } }) : Promise.resolve(null),
  ]);
  const names = new Set([
    ...configured.map((sport) => normalizeSportName(sport.name)),
    ...clubs.map((club) => normalizeSportName(club.sport)),
    ...quotas.map((quota) => normalizeSportName(quota.sport)),
  ]);

  let sportsList = Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b, "th"));

  if (year && editionsSetting?.value && typeof editionsSetting.value === "object") {
    const config = editionsSetting.value as { editions?: Record<string, { enabledSportsQualifier?: string[]; enabledSportsMain?: string[]; enabledSports?: string[] }> };
    const yearConfig = config.editions?.[year];
    
    if (yearConfig) {
      let allowedSports: string[] | null = null;
      
      // Determine which list to use based on round
      if (round === "qualifier" && Array.isArray(yearConfig.enabledSportsQualifier)) {
        allowedSports = yearConfig.enabledSportsQualifier;
      } else if ((round === "main" || round === "รอบมหกรรม") && Array.isArray(yearConfig.enabledSportsMain)) {
        allowedSports = yearConfig.enabledSportsMain;
      } else if (Array.isArray(yearConfig.enabledSports) && !yearConfig.enabledSportsQualifier && !yearConfig.enabledSportsMain) {
        // Fallback for previous single-list structure
        allowedSports = yearConfig.enabledSports;
      }

      if (allowedSports && allowedSports.length > 0) {
        const allowedSet = new Set(allowedSports.map((s) => normalizeSportName(s)));
        sportsList = sportsList.filter((s) => allowedSet.has(s));
      }
    }
  }

  return NextResponse.json({
    sports: sportsList,
  });
}

export async function POST(request: Request) {
  return api(request, ["STAFF", "ADMIN"], async () => {
    const input = await body(request);
    const name = normalizeSportName(string(input.name, "ชนิดกีฬา"));
    ensure(name.length <= 200, "ชื่อชนิดกีฬายาวเกินไป");
    return atomic(async (tx) => ({ sport: await ensureSportConfig(tx, name) }));
  });
}