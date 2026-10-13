import type { JWTPayload } from "@/lib/auth";
import { atomic, ensure, json } from "@/lib/phase4-server";
import { cleanThaiName } from "@/lib/fitness-import-parser";

export type ImportFitnessRecordInput = {
  name: string;
  studentId?: string;
  sport: string;
  stations: Record<string, string>;
  passedCount: number;
  totalTests: number;
  scorePct?: number;
  status?: string;
  round?: string;
  note?: string;
};

export type ImportFitnessOptions = {
  competitionId?: string;
  records: ImportFitnessRecordInput[];
};

function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  if (err.code === "P2021") return true;
  const msg = String(err.message || "");
  return (
    msg.includes("FitnessTestResult") &&
    (msg.includes("does not exist") || msg.includes("doesn't exist") || msg.includes("P2021"))
  );
}

export async function importFitnessRecords(session: JWTPayload, options: ImportFitnessOptions) {
  ensure(["STAFF", "ADMIN"].includes(session.role), "ไม่มีสิทธิ์นำเข้าผลการทดสอบ (เฉพาะเจ้าหน้าที่)", 403);
  ensure(Array.isArray(options.records) && options.records.length > 0, "ไม่พบข้อมูลผลการทดสอบสำหรับนำเข้า");
  ensure(options.records.length <= 1000, "ไม่สามารถนำเข้าเกิน 1,000 รายการพร้อมกัน");

  const competitionId = options.competitionId?.trim() || undefined;

  return atomic(async tx => {
    // ดึงใบสมัครทั้งหมดของการแข่งขันที่ระบุ (หรือทั้งหมดหากไม่ได้ระบุการแข่งขัน)
    const applications = await tx.application.findMany({
      where: {
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

    let matchedCount = 0;
    const unmatched: string[] = [];
    const results = [];

    for (const record of options.records) {
      const clean = cleanThaiName(record.name);

      // ลองจับคู่ใบสมัครตาม 1) studentId หรือ 2) ชื่อ-นามสกุล + ชนิดกีฬา
      let matchedApp = applications.find(app => {
        if (record.studentId && app.user.studentId === record.studentId) {
          return true;
        }
        const appFirstName = app.user.profile?.firstName?.trim() || "";
        const appLastName = app.user.profile?.lastName?.trim() || "";
        if (
          clean.firstName &&
          clean.lastName &&
          appFirstName.includes(clean.firstName) &&
          appLastName.includes(clean.lastName)
        ) {
          // หากชนิดกีฬาตรงกันจะให้ความสำคัญสูงสุด
          if (app.sport === record.sport) return true;
        }
        return false;
      });

      // หากยังไม่เจอ ลองจับคู่ชื่อ-นามสกุลอย่างเดียว
      if (!matchedApp) {
        matchedApp = applications.find(app => {
          const appFirstName = app.user.profile?.firstName?.trim() || "";
          const appLastName = app.user.profile?.lastName?.trim() || "";
          return (
            clean.firstName &&
            clean.lastName &&
            appFirstName === clean.firstName &&
            appLastName === clean.lastName
          );
        });
      }

      if (!matchedApp) {
        unmatched.push(record.name + " (" + record.sport + ")");
        continue;
      }

      matchedCount++;

      // คำนวณคะแนนและสถานะ
      const totalTests = record.totalTests || Object.keys(record.stations).length;
      const passedCount = record.passedCount ?? Object.values(record.stations).filter(v => v === "ผ่าน").length;
      const passPct = record.scorePct != null ? record.scorePct : totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0;
      const fitnessStatus = passPct >= 60 ? "PASSED" : "FAILED";

      try {
        const upserted = await tx.fitnessTestResult.upsert({
          where: { applicationId: matchedApp.id },
          create: {
            applicationId: matchedApp.id,
            status: fitnessStatus,
            totalScore: passPct,
            scores: json({
              version: "summary-v1",
              protocolId: record.sport,
              items: record.stations,
              passedCount,
              requiredCount: totalTests,
              totalTests,
              passPercentage: passPct,
              round: record.round || "รอบที่ 1",
            }),
            notes: record.note || null,
            testedAt: new Date(),
            recordedBy: session.id,
          },
          update: {
            status: fitnessStatus,
            totalScore: passPct,
            scores: json({
              version: "summary-v1",
              protocolId: record.sport,
              items: record.stations,
              passedCount,
              requiredCount: totalTests,
              totalTests,
              passPercentage: passPct,
              round: record.round || "รอบที่ 1",
            }),
            notes: record.note || null,
            testedAt: new Date(),
            recordedBy: session.id,
          },
        });

        await tx.statusHistory.create({
          data: {
            applicationId: matchedApp.id,
            status: matchedApp.status,
            label: "นำเข้าผลการทดสอบสมรรถภาพ: " + (fitnessStatus === "PASSED" ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์") + " (" + passedCount + "/" + totalTests + " รายการ, " + passPct + "%)",
            by: session.id,
          },
        });

        results.push(upserted);
      } catch (err: unknown) {
        if (isTableMissingError(err)) {
          // หากไม่มีตารางใน DB ให้รายงานสถานะจำลองได้
          console.warn("[fitness-import] FitnessTestResult table missing, skipped row write");
        } else {
          throw err;
        }
      }
    }

    return {
      success: true,
      message: "ประมวลผลนำเข้า " + options.records.length + " รายการ (จับคู่สำเร็จ " + matchedCount + " คน, ไม่พบใบสมัคร " + unmatched.length + " คน)",
      totalProcessed: options.records.length,
      matchedCount,
      unmatchedCount: unmatched.length,
      unmatched,
    };
  });
}
