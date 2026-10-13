import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SPORT_CATEGORIES, defaultCategories, combatDivisions } from "@/lib/sports-categories";
import { getSportType, type SportType } from "@/lib/sport-type";

type CustomSportEntry = {
  categories?: string[];
  divisions?: string[];
  sportType?: SportType;
};

export async function GET() {
  try {
    const [setting, configs] = await Promise.all([
      prisma.systemSetting.findUnique({
        where: { key: "custom_sport_categories" },
      }),
      prisma.sportConfig.findMany({
        select: { name: true, sportType: true },
      }),
    ]);

    const customConfig = (
      setting?.value && typeof setting.value === "object" ? setting.value : {}
    ) as Record<string, CustomSportEntry>;
    const sportTypeByName = new Map(configs.map((c) => [c.name, c.sportType]));

    const combined: Record<
      string,
      { categories: string[]; divisions: string[]; sportType: SportType }
    > = {};

    for (const [sport, config] of Object.entries(SPORT_CATEGORIES)) {
      combined[sport] = {
        ...config,
        sportType: (sportTypeByName.get(sport) as SportType) || getSportType(sport),
      };
    }

    for (const [sport, config] of Object.entries(customConfig)) {
      combined[sport] = {
        categories: Array.isArray(config.categories) ? config.categories : defaultCategories,
        divisions: Array.isArray(config.divisions) ? config.divisions : ["ทั่วไป"],
        sportType: (sportTypeByName.get(sport) as SportType) || config.sportType || getSportType(sport),
      };
    }

    return NextResponse.json({ config: combined, defaultCategories, combatDivisions });
  } catch (error) {
    console.error("[GET /api/sport-categories]", error);
    return NextResponse.json({ error: "Failed to load sport categories" }, { status: 500 });
  }
}
