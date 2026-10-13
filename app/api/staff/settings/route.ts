import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { DEFAULT_SPORTS } from "@/lib/sports";
import { SPORT_CATEGORIES } from "@/lib/sports-categories";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request as NextRequest, "STAFF", "ADMIN");
    if ("error" in auth) return auth.error;

    const [sports, customCategoriesSetting, scheduleSetting, editionsSetting] = await Promise.all([
      prisma.sportConfig.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "custom_sport_categories" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "QUALIFIER_SCHEDULE" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "COMPETITION_EDITIONS_CONFIG" },
      }),
    ]);

    const customObj = (customCategoriesSetting?.value && typeof customCategoriesSetting.value === "object"
      ? customCategoriesSetting.value
      : {}) as Record<string, unknown>;

    const allSportNames = Array.from(new Set([
      ...DEFAULT_SPORTS,
      ...sports.map((s) => s.name),
      ...Object.keys(SPORT_CATEGORIES),
      ...Object.keys(customObj),
    ])).sort((a, b) => a.localeCompare(b, "th"));

    return NextResponse.json({
      sports,
      allSports: allSportNames,
      schedule: scheduleSetting?.value ?? {},
      editionsConfig: editionsSetting?.value ?? { activeYear: "", editions: {} },
    });
  } catch (error) {
    console.error("[GET /api/staff/settings]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request as NextRequest, "ADMIN");
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const { action, editionsConfig, schedule } = body;

    if (action === "updateEditions") {
      if (!editionsConfig || typeof editionsConfig !== "object") {
        return NextResponse.json({ error: "ข้อมูลการตั้งค่าไม่ถูกต้อง" }, { status: 400 });
      }

      await prisma.systemSetting.upsert({
        where: { key: "COMPETITION_EDITIONS_CONFIG" },
        update: { value: editionsConfig },
        create: { key: "COMPETITION_EDITIONS_CONFIG", value: editionsConfig },
      });

      return NextResponse.json({ success: true, editionsConfig });
    }

    if (action === "updateSchedule") {
      if (!schedule || typeof schedule !== "object") {
        return NextResponse.json({ error: "ข้อมูลกำหนดการไม่ถูกต้อง" }, { status: 400 });
      }
      await prisma.systemSetting.upsert({
        where: { key: "QUALIFIER_SCHEDULE" },
        update: { value: schedule },
        create: { key: "QUALIFIER_SCHEDULE", value: schedule },
      });
      return NextResponse.json({ success: true, schedule });
    }

    return NextResponse.json({ error: "การกระทำไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/staff/settings]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}