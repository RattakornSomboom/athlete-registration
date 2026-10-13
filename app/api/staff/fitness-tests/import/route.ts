import { api, body, ensure, json, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  return api(request, STAFF, async session => {
    const data = await body(request);
    const sport = typeof data.sport === "string" ? data.sport.trim() : "";
    ensure(sport, "กรุณาระบุชนิดกีฬาสำหรับการนำเข้า", 400);

    const competitionId = typeof data.competitionId === "string" ? data.competitionId.trim() : "";
    const rawAthletes = Array.isArray(data.athletes) ? data.athletes : [];
    ensure(rawAthletes.length > 0, "ไม่พบข้อมูลนักกีฬาในรายการนำเข้า", 400);
    ensure(rawAthletes.length <= 500, "ไม่สามารถนำเข้าเกิน 500 รายการพร้อมกัน", 400);

    // ดึงใบสมัครในระบบที่มีชนิดกีฬาตรงกัน
    const applications = await prisma.application.findMany({
      where: {
        sport: { equals: sport, mode: "insensitive" },
        ...(competitionId ? { competitionId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            studentId: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Helper map เพื่อค้นหา application อย่างรวดเร็ว
    const byStudentId = new Map<string, typeof applications[0]>();
    const byCleanName = new Map<string, typeof applications[0]>();

    for (const app of applications) {
      if (app.user.studentId) {
        byStudentId.set(app.user.studentId.trim(), app);
      }
      if (app.user.profile?.firstName && app.user.profile?.lastName) {
        const full = (app.user.profile.firstName + " " + app.user.profile.lastName).trim();
        byCleanName.set(full, app);
        byCleanName.set(full.replace(/\s+/g, ""), app);
      }
    }

    let savedCount = 0;
    const unmatchedNames: string[] = [];

    await prisma.$transaction(async tx => {
      for (const athlete of rawAthletes) {
        if (!athlete || typeof athlete !== "object") continue;
        const rawName = String(athlete.rawName || athlete.name || "").trim();
        const cleanName = String(athlete.cleanName || rawName.replace(/^(นาย|นางสาว|นาง|น\.ส\.)\s*/, "")).trim();
        const studentId = athlete.studentId ? String(athlete.studentId).trim() : "";

        let matchedApp = studentId ? byStudentId.get(studentId) : undefined;
        if (!matchedApp) {
          matchedApp = byCleanName.get(cleanName) || byCleanName.get(cleanName.replace(/\s+/g, ""));
        }

        if (!matchedApp) {
          unmatchedNames.push(rawName || "ไม่ระบุชื่อ");
          continue;
        }

        const isPassed = athlete.isPassed === true || athlete.statusText === "ผ่านเกณฑ์";
        const scorePct = typeof athlete.scorePct === "number" ? athlete.scorePct : null;
        const totalStations = typeof athlete.totalStations === "number" ? athlete.totalStations : 9;
        const passedCount = typeof athlete.passedCount === "number" ? athlete.passedCount : 0;
        const testMap = athlete.testMap && typeof athlete.testMap === "object" ? athlete.testMap : {};

        const scoresPayload = {
          version: "summary-v1",
          sport,
          protocolId: sport,
          summary: {
            passed: passedCount,
            total: totalStations,
            percentage: scorePct,
          },
          items: testMap,
        };

        await tx.fitnessTestResult.upsert({
          where: { applicationId: matchedApp.id },
          create: {
            applicationId: matchedApp.id,
            status: isPassed ? "PASSED" : "FAILED",
            totalScore: scorePct,
            scores: json(scoresPayload),
            notes: typeof athlete.notes === "string" ? athlete.notes : "นำเข้าจากไฟล์ผลการทดสอบสมรรถภาพทางกาย",
            testedAt: new Date(),
            recordedBy: session.id,
          },
          update: {
            status: isPassed ? "PASSED" : "FAILED",
            totalScore: scorePct,
            scores: json(scoresPayload),
            notes: typeof athlete.notes === "string" ? athlete.notes : "นำเข้าจากไฟล์ผลการทดสอบสมรรถภาพทางกาย",
            testedAt: new Date(),
            recordedBy: session.id,
          },
        });

        await tx.statusHistory.create({
          data: {
            applicationId: matchedApp.id,
            status: matchedApp.status,
            label: "นำเข้าผลการทดสอบสมรรถภาพ: " + (isPassed ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์") + (scorePct != null ? " (" + scorePct + "%)" : ""),
            by: session.id,
          },
        });

        savedCount++;
      }
    });

    return {
      success: true,
      message: `บันทึกผลการทดสอบเข้าฐานข้อมูลเรียบร้อย ${savedCount} รายการ` + (unmatchedNames.length > 0 ? ` (ยังไม่พบใบสมัครในระบบ ${unmatchedNames.length} รายการ)` : ""),
      savedCount,
      totalInFile: rawAthletes.length,
      unmatchedCount: unmatchedNames.length,
      unmatched: unmatchedNames,
    };
  });
}
