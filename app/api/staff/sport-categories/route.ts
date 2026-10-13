import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { SPORT_CATEGORIES, defaultCategories } from "@/lib/sports-categories";
import { getSportType, type SportType } from "@/lib/sport-type";

type CustomSportEntry = {
  categories?: string[];
  divisions?: string[];
  sportType?: SportType;
};

type CustomSportConfig = Record<string, CustomSportEntry>;

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request as NextRequest, "STAFF", "ADMIN");
    if ("error" in auth) return auth.error;

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
    ) as CustomSportConfig;
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

    return NextResponse.json({
      config: combined,
      customOnly: customConfig,
      defaultCategories,
    });
  } catch (error) {
    console.error("[GET /api/staff/sport-categories]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดข้อมูลประเภทกีฬา" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request as NextRequest, "STAFF", "ADMIN");
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as {
      sport?: unknown;
      categories?: unknown;
      divisions?: unknown;
      sportType?: unknown;
    };
    const { sport, categories, divisions, sportType } = body;

    if (!sport || typeof sport !== "string" || !sport.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อชนิดกีฬา" }, { status: 400 });
    }

    if (!Array.isArray(categories) || !Array.isArray(divisions)) {
      return NextResponse.json({ error: "ข้อมูลประเภทหรือรุ่นไม่ถูกต้อง" }, { status: 400 });
    }

    const cleanSport = sport.trim();
    const cleanCategories = categories.map((c) => String(c).trim()).filter(Boolean);
    const cleanDivisions = divisions.map((d) => String(d).trim()).filter(Boolean);
    const resolvedSportType: SportType =
      sportType === "TEAM" || sportType === "INDIVIDUAL" ? sportType : getSportType(cleanSport);

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "custom_sport_categories" },
    });

    const currentCustom = (
      setting?.value && typeof setting.value === "object" ? setting.value : {}
    ) as CustomSportConfig;

    currentCustom[cleanSport] = {
      categories: cleanCategories.length > 0 ? cleanCategories : defaultCategories,
      divisions: cleanDivisions.length > 0 ? cleanDivisions : ["ทั่วไป"],
      sportType: resolvedSportType,
    };

    const existingSport = await prisma.sportConfig.findFirst({
      where: { name: cleanSport },
    });

    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: "custom_sport_categories" },
        create: {
          key: "custom_sport_categories",
          value: currentCustom,
        },
        update: {
          value: currentCustom,
        },
      }),
      existingSport
        ? prisma.sportConfig.update({
            where: { id: existingSport.id },
            data: { sportType: resolvedSportType },
          })
        : prisma.sportConfig.create({
            data: {
              name: cleanSport,
              category: "GENERAL",
              maxAthletes: 0,
              isOpen: true,
              positions: [],
              sportType: resolvedSportType,
            },
          }),
    ]);

    return NextResponse.json({
      success: true,
      message: `บันทึกประเภทและรุ่นของกีฬา ${cleanSport} เรียบร้อยแล้ว`,
      config: currentCustom[cleanSport],
    });
  } catch (error) {
    console.error("[POST /api/staff/sport-categories]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}
