import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sports = await prisma.sportConfig.findMany({
      orderBy: { createdAt: "asc" }
    });
    
    let scheduleSetting = await prisma.systemSetting.findUnique({
      where: { key: "QUALIFIER_SCHEDULE" }
    });
    
    // Default schedule if not exists
    if (!scheduleSetting) {
      const defaultSchedule = {
        region: "ภาคเหนือ",
        hostUniversity: "มหาวิทยาลัยราชภัฏนครสวรรค์",
        startDate: "2026-10-24",
        endDate: "2026-10-29",
        location: "มหาวิทยาลัยราชภัฏนครสวรรค์",
        note: "กีฬามหาวิทยาลัยแห่งประเทศไทย ครั้งที่ 52 รอบคัดเลือกเขตภาคเหนือ"
      };
      scheduleSetting = await prisma.systemSetting.create({
        data: {
          key: "QUALIFIER_SCHEDULE",
          value: defaultSchedule as any
        }
      });
    }

    return NextResponse.json({
      sports,
      schedule: scheduleSetting.value
    });
  } catch (error) {
    console.error("[GET /api/staff/settings]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sports, schedule } = body;

    // Save sports
    if (sports && Array.isArray(sports)) {
      // Very naive approach: Delete all and recreate to sync 
      // (in a real prod app, you might want to upsert or sync individually)
      await prisma.sportConfig.deleteMany({});
      await prisma.sportConfig.createMany({
        data: sports.map((s: any) => ({
          name: s.name,
          category: s.category,
          maxAthletes: s.maxAthletes,
          isOpen: s.isOpen,
          positions: s.positions || [],
          requirements: s.requirements || "",
          competitionType: s.competitionType || "",
          qualifierNote: s.qualifierNote || "",
          reachedTop16LastYear: s.reachedTop16LastYear,
          top16Note: s.top16Note || ""
        }))
      });
    }

    // Save schedule
    if (schedule) {
      await prisma.systemSetting.upsert({
        where: { key: "QUALIFIER_SCHEDULE" },
        update: { value: schedule },
        create: { key: "QUALIFIER_SCHEDULE", value: schedule }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/staff/settings]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
