import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/lib/auth";
import { atomic, ensure, json } from "@/lib/phase4-server";
import { getFitnessTestGroup } from "@/lib/fitness-test";
import {
  validateFitnessTestItem,
  type FitnessTestStatusType,
  type ValidatedFitnessInput,
} from "@/lib/validation";
import type { Prisma, ApplicationStatus } from "@prisma/client";

export type FitnessCandidateQuery = {
  competitionId?: string;
  sport?: string;
  clubId?: string;
  fitnessStatus?: "ALL" | "PENDING" | "PASSED" | "FAILED";
  squadType?: "all" | "main" | "reserve";
  applicationStatus?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listFitnessCandidates(session: JWTPayload, query: FitnessCandidateQuery) {
  ensure(["STAFF", "ADMIN"].includes(session.role), "ไม่มีสิทธิ์เข้าถึง (เฉพาะเจ้าหน้าที่)", 403);

  const where: Prisma.ApplicationWhereInput = {};

  if (query.competitionId) {
    where.competitionId = query.competitionId;
  }

  if (query.sport) {
    where.sport = query.sport;
  }

  if (query.applicationStatus) {
    where.status = query.applicationStatus as ApplicationStatus;
  } else {
    where.status = { in: ["STAFF_APPROVED", "FINAL_SELECTED"] };
  }

  if (query.squadType && query.squadType !== "all") {
    where.squadType = query.squadType;
  }

  if (query.clubId) {
    where.rosterItem = { roster: { clubId: query.clubId } };
  }

  if (query.fitnessStatus && query.fitnessStatus !== "ALL") {
    if (query.fitnessStatus === "PENDING") {
      where.OR = [
        { fitnessTestResult: null },
        { fitnessTestResult: { status: "PENDING" } },
      ];
    } else {
      where.fitnessTestResult = { status: query.fitnessStatus as FitnessTestStatusType };
    }
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    const searchFilter: Prisma.ApplicationWhereInput[] = [
      { user: { studentId: { contains: term, mode: "insensitive" } } },
      { user: { profile: { firstName: { contains: term, mode: "insensitive" } } } },
      { user: { profile: { lastName: { contains: term, mode: "insensitive" } } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: searchFilter }];
    } else {
      where.OR = searchFilter;
    }
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          studentId: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              faculty: true,
              major: true,
              year: true,
              phone: true,
            },
          },
        },
      },
      competition: {
        select: {
          id: true,
          name: true,
          round: true,
          year: true,
          status: true,
        },
      },
      rosterItem: {
        select: {
          squadType: true,
          roster: {
            select: {
              club: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                },
              },
            },
          },
        },
      },
      fitnessTestResult: true,
    },
    orderBy: [
      { competitionId: "asc" },
      { sport: "asc" },
      { createdAt: "asc" },
    ],
    ...(typeof query.limit === "number" && query.limit > 0 ? { take: Math.min(query.limit, 1000) } : {}),
    ...(typeof query.offset === "number" && query.offset > 0 ? { skip: query.offset } : {}),
  });

  const candidates = applications.map((app) => {
    const result = app.fitnessTestResult;
    const fitnessGroup = getFitnessTestGroup(app.sport, app.category);
    return {
      applicationId: app.id,
      studentId: app.user.studentId ?? "-",
      firstName: app.user.profile?.firstName ?? "-",
      lastName: app.user.profile?.lastName ?? "-",
      fullName: [app.user.profile?.firstName, app.user.profile?.lastName].filter(Boolean).join(" ") || "-",
      faculty: app.user.profile?.faculty ?? "-",
      major: app.user.profile?.major ?? "-",
      year: app.user.profile?.year ?? "-",
      phone: app.user.profile?.phone ?? "-",
      competitionId: app.competitionId,
      competitionName: app.competition.name,
      competitionYear: app.competition.year,
      sport: app.sport,
      category: app.category,
      division: app.division,
      squadType: app.squadType ?? app.rosterItem?.squadType ?? null,
      clubName: app.rosterItem?.roster.club.name ?? null,
      applicationStatus: app.status,
      fitnessResult: result
        ? {
            id: result.id,
            status: result.status,
            totalScore: result.totalScore,
            scores: result.scores,
            notes: result.notes,
            testedAt: result.testedAt?.toISOString() ?? null,
            recordedBy: result.recordedBy,
            updatedAt: result.updatedAt.toISOString(),
          }
        : {
            id: null,
            status: "PENDING" as const,
            totalScore: null,
            scores: null,
            notes: null,
            testedAt: null,
            recordedBy: null,
            updatedAt: null,
          },
      fitnessGroup: fitnessGroup
        ? {
            id: fitnessGroup.id,
            tests: fitnessGroup.tests,
          }
        : null,
    };
  });

  const stats = {
    total: candidates.length,
    passed: candidates.filter((c) => c.fitnessResult.status === "PASSED").length,
    failed: candidates.filter((c) => c.fitnessResult.status === "FAILED").length,
    pending: candidates.filter((c) => c.fitnessResult.status === "PENDING").length,
    mainSquad: candidates.filter((c) => c.squadType === "main").length,
    reserveSquad: candidates.filter((c) => c.squadType === "reserve").length,
  };

  return { candidates, stats };
}

export async function recordFitnessResults(session: JWTPayload, rawData: Record<string, unknown>) {
  ensure(["STAFF", "ADMIN"].includes(session.role), "ไม่มีสิทธิ์ดำเนินการ (เฉพาะเจ้าหน้าที่)", 403);

  let itemsToProcess: ValidatedFitnessInput[];

  if (Array.isArray(rawData.items)) {
    ensure(rawData.items.length > 0, "กรุณาส่งรายการข้อมูลอย่างน้อย 1 รายการ");
    ensure(rawData.items.length <= 1000, "ไม่สามารถประมวลผลเกิน 1,000 รายการต่อครั้ง");
    itemsToProcess = rawData.items.map((item, index) => validateFitnessTestItem(item, index));
  } else {
    itemsToProcess = [validateFitnessTestItem(rawData)];
  }

  const appIds = itemsToProcess.map((i) => i.applicationId);
  ensure(new Set(appIds).size === appIds.length, "มีรหัสใบสมัครซ้ำในชุดข้อมูล");

  return atomic(async (tx) => {
    const applications = await tx.application.findMany({
      where: { id: { in: appIds } },
      select: { id: true, status: true, sport: true, competitionId: true },
    });

    const appMap = new Map(applications.map((a) => [a.id, a]));
    for (const id of appIds) {
      ensure(appMap.has(id), "ไม่พบใบสมัครรหัส " + id, 404);
    }

    const recordedBy = session.id;
    const results = [];

    for (const item of itemsToProcess) {
      const app = appMap.get(item.applicationId)!;
      const testedAt = item.testedAt ?? new Date();

      const upserted = await tx.fitnessTestResult.upsert({
        where: { applicationId: item.applicationId },
        create: {
          applicationId: item.applicationId,
          status: item.status,
          totalScore: item.totalScore,
          scores: item.scores ? json(item.scores) : undefined,
          notes: item.notes,
          testedAt,
          recordedBy,
        },
        update: {
          status: item.status,
          totalScore: item.totalScore,
          scores: item.scores ? json(item.scores) : undefined,
          notes: item.notes,
          testedAt,
          recordedBy,
        },
      });

      const statusThai = item.status === "PASSED" ? "ผ่านเกณฑ์" : item.status === "FAILED" ? "ไม่ผ่านเกณฑ์" : "รอทดสอบ";
      const scoreNote = typeof item.totalScore === "number" ? " (คะแนน: " + item.totalScore + ")" : "";

      await tx.statusHistory.create({
        data: {
          applicationId: item.applicationId,
          status: app.status,
          label: "บันทึกผลการทดสอบสมรรถภาพ: " + statusThai + scoreNote,
          by: session.id,
        },
      });

      results.push(upserted);
    }

    return {
      message: "บันทึกผลการทดสอบสมรรถภาพเรียบร้อย (" + results.length + " รายการ)",
      count: results.length,
      results,
    };
  });
}

export async function getFitnessCandidateDetail(session: JWTPayload, applicationId: string) {
  ensure(applicationId && typeof applicationId === "string", "รหัสใบสมัครไม่ถูกต้อง");

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      user: {
        select: {
          id: true,
          studentId: true,
          email: true,
          profile: true,
        },
      },
      competition: {
        select: {
          id: true,
          name: true,
          round: true,
          year: true,
        },
      },
      rosterItem: {
        include: {
          roster: {
            include: {
              club: true,
            },
          },
        },
      },
      fitnessTestResult: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  ensure(app, "ไม่พบข้อมูลใบสมัคร", 404);

  if (session.role === "ATHLETE") {
    ensure(app.userId === session.id, "ไม่มีสิทธิ์เข้าถึงข้อมูลของนักกีฬาอื่น", 403);
  } else if (session.role === "CLUB") {
    const clubId = session.clubId;
    ensure(clubId && app.rosterItem?.roster.clubId === clubId, "ไม่มีสิทธิ์เข้าถึงข้อมูลของชมรมอื่น", 403);
  } else if (!["STAFF", "ADMIN"].includes(session.role)) {
    ensure(false, "ไม่มีสิทธิ์เข้าถึง", 403);
  }

  const fitnessGroup = getFitnessTestGroup(app.sport, app.category);

  return {
    application: {
      id: app.id,
      studentId: app.user.studentId,
      athleteName: [app.user.profile?.firstName, app.user.profile?.lastName].filter(Boolean).join(" ") || "-",
      profile: app.user.profile,
      competition: app.competition,
      sport: app.sport,
      category: app.category,
      division: app.division,
      squadType: app.squadType ?? app.rosterItem?.squadType ?? null,
      status: app.status,
      club: app.rosterItem?.roster.club ? { id: app.rosterItem.roster.club.id, name: app.rosterItem.roster.club.name } : null,
      fitnessResult: app.fitnessTestResult,
      fitnessGroup,
      statusHistory: app.statusHistory,
    },
  };
}
