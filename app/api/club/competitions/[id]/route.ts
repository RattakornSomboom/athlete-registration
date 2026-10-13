import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { documentId, protectedApplication } from "@/lib/athlete-document-policy";
import { hasVerifiedResults } from "@/lib/evidence-verification-service";
import { evaluateTeamReadiness, isTeamSport, MIN_APPROVED_ACTIVITIES } from "@/lib/team-readiness";

type RouteParams = { params: Promise<{ id: string }> };

const DOCUMENT_FIELDS = [
  { field: "photoFileUrl", title: "รูปถ่ายชุดนิสิต", category: "รูปประจำตัว" },
  { field: "idCardFileUrl", title: "สำเนาบัตรประจำตัวประชาชน", category: "เอกสารยืนยันตัวตน" },
  { field: "studentCardFileUrl", title: "สำเนาบัตรนิสิต", category: "เอกสารยืนยันสถานะนิสิต" },
  { field: "studentCertFileUrl", title: "ใบรับรองการเป็นนิสิต", category: "เอกสารรับรองสถานะนิสิต" },
] as const;
type DocumentField = (typeof DOCUMENT_FIELDS)[number]["field"];

function fileNameFromReference(reference: string, storedName?: string): string {
  if (storedName) return storedName;
  try {
    const name = decodeURIComponent(new URL(reference).pathname.split("/").pop() || "");
    return name || "เอกสารแนบ";
  } catch {
    return "เอกสารแนบ";
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request, "CLUB", "STAFF", "ADMIN");
    if ("error" in auth) return auth.error;
    const { session } = auth;

    if (!session.clubId) {
      return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
    }

    const { id: competitionId } = await params;

    const [club, competition, roster, approvedActivities] = await Promise.all([
      prisma.club.findUnique({
        where: { id: session.clubId },
        select: {
          id: true,
          name: true,
          sport: true,
          presidentName: true,
          isActive: true,
          status: true,
        },
      }),
      prisma.competition.findUnique({
        where: { id: competitionId },
        include: { quotas: true },
      }),
      prisma.clubRoster.findUnique({
        where: { clubId_competitionId: { clubId: session.clubId, competitionId } },
        select: { id: true, status: true, version: true },
      }),
      prisma.activity.count({
        where: { clubId: session.clubId, status: "approved" },
      }),
    ]);

    if (!club) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    if (!competition) {
      return NextResponse.json({ error: "ไม่พบการแข่งขัน" }, { status: 404 });
    }

    const quota = competition.quotas.find((q) => q.sport === club.sport) || null;

    const applications = await prisma.application.findMany({
      where: {
        competitionId,
        sport: club.sport,
        OR: [{ noClubFileUrl: null }, { noClubFileUrl: "" }],
        clubId: club.id,
      },
      select: {
        id: true,
        category: true,
        division: true,
        squadType: true,
        status: true,
        note: true,
        sport: true,
        photoFileUrl: true,
        idCardFileUrl: true,
        studentCardFileUrl: true,
        studentCertFileUrl: true,
        upAcademyFileUrl: true,
        fitnessTestFileUrl: true,
        noClubFileUrl: true,
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
                studentLevel: true,
                nationalId: true,
                nationality: true,
                birthDate: true,
                gpaSemester: true,
                gpaCumulative: true,
                addressNo: true,
                subDistrict: true,
                district: true,
                province: true,
                postalCode: true,
                phone: true,
                hasParticipated: true,
                participateCountBachelor: true,
                participateCountMaster: true,
                participateCountPhd: true,
                lastParticipateYear: true,
              },
            },
          },
        },
        competitionResults: {
          select: {
            competitionName: true,
            year: true,
            result: true,
            evidenceFileUrl: true,
          },
        },
        rosterItem: {
          select: {
            id: true,
            squadType: true,
          },
        },
        statusHistory: {
          select: {
            id: true,
            status: true,
            label: true,
            by: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const documentIds = Array.from(new Set(
      applications.flatMap((application) =>
        DOCUMENT_FIELDS.flatMap(({ field }) => {
          const id = documentId(application[field]);
          return id ? [id] : [];
        })
      )
    ));
    const storedDocuments = documentIds.length
      ? await prisma.privateDocument.findMany({
          where: { id: { in: documentIds }, state: "READY" },
          select: { id: true, name: true, mimeType: true },
        })
      : [];
    const storedDocumentsById = new Map(storedDocuments.map((document) => [document.id, document]));

    const applicants = applications.map((app) => {
      const p = app.user.profile;
      const safeApplication = protectedApplication(app);
      const canPreviewDocuments = app.sport === club.sport;
      const squadType = app.rosterItem?.squadType || app.squadType || "";
      const isRejected = app.status === "CLUB_REJECTED";
      const isApproved = ["CLUB_APPROVED", "STAFF_APPROVED", "FINAL_SELECTED"].includes(app.status);
      const status: "pending" | "approved" | "rejected" = isRejected
        ? "rejected"
        : isApproved
        ? "approved"
        : "pending";

      const rejectReason = app.statusHistory.find((h) => h.status === "CLUB_REJECTED")?.label || "";
      const documentReviews = new Map<DocumentField, { status: "approved" | "rejected" | "pending"; comment: string; updatedAt: string }>();
      for (const history of app.statusHistory) {
        const match = /^DOCUMENT:([^:]+):(APPROVED|REJECTED|PENDING)$/.exec(history.status);
        if (!match) continue;
        const field = DOCUMENT_FIELDS.find((document) => document.field === match[1])?.field;
        if (!field || documentReviews.has(field)) continue;
        documentReviews.set(field, {
          status: match[2] === "APPROVED" ? "approved" : match[2] === "REJECTED" ? "rejected" : "pending",
          comment: match[2] === "REJECTED" ? history.label : "",
          updatedAt: history.createdAt.toISOString(),
        });
      }

      return {
        id: app.id,
        firstName: p?.firstName || "-",
        lastName: p?.lastName || "-",
        studentId: app.user.studentId || "-",
        faculty: p?.faculty || "-",
        major: p?.major || "-",
        year: p?.year || "-",
        studentLevel: p?.studentLevel === "GRADUATE" ? "graduate" : "bachelor",
        nationalId: p?.nationalId || "-",
        nationality: p?.nationality || "ไทย",
        birthDate: p?.birthDate ? p.birthDate.toISOString().split("T")[0] : "-",
        gpaSemester: p?.gpaSemester || "-",
        gpaCumulative: p?.gpaCumulative || "-",
        addressNo: p?.addressNo || "-",
        subDistrict: p?.subDistrict || "-",
        district: p?.district || "-",
        province: p?.province || "-",
        postalCode: p?.postalCode || "-",
        phone: p?.phone || "-",
        category: app.category || "-",
        division: app.division || "-",
        hasPreviousEntry: p?.hasParticipated ? "has" : "none",
        previousBachelorCount: p?.participateCountBachelor ? String(p.participateCountBachelor) : "",
        previousGraduateCount:
          (p?.participateCountMaster || 0) + (p?.participateCountPhd || 0) > 0
            ? String((p?.participateCountMaster || 0) + (p?.participateCountPhd || 0))
            : "",
        previousLastYear: p?.lastParticipateYear || "",
        competitions: (app.competitionResults || []).map((cr) => ({
          competitionName: cr.competitionName,
          year: cr.year,
          result: cr.result,
          evidenceFileUrl: cr.evidenceFileUrl,
        })),
        documents: DOCUMENT_FIELDS.map(({ field, title, category }) => {
          const reference = app[field];
          const referenceId = documentId(reference);
          const storedDocument = referenceId ? storedDocumentsById.get(referenceId) : undefined;
          const hasReference = typeof reference === "string" && reference.trim() !== "" && reference !== "-";
          const documentAvailable = hasReference && (!referenceId || !!storedDocument);
          return {
            id: field,
            title,
            category,
            filename: !canPreviewDocuments
              ? "รอสิทธิ์ดูเอกสาร"
              : !hasReference
                ? "ยังไม่ได้แนบไฟล์"
                : documentAvailable
                  ? fileNameFromReference(reference, storedDocument?.name)
                  : "ไม่พบไฟล์ในระบบ",
            documentUrl: canPreviewDocuments && documentAvailable ? safeApplication[field] : null,
            mimeType: canPreviewDocuments && documentAvailable ? storedDocument?.mimeType || null : null,
            status: documentReviews.get(field)?.status ?? "pending",
            comment: documentReviews.get(field)?.comment || undefined,
            updatedAt: documentReviews.get(field)?.updatedAt,
          };
        }),
        note: app.note || "",
        status,
        squadType: squadType as "main" | "reserve" | "",
        rejectReason,
      };
    });

    const rosterApplicants = applications.filter((a) => (a.rosterItem?.squadType || a.squadType) && a.status !== "CLUB_REJECTED");
    const teamReadiness = evaluateTeamReadiness(
      rosterApplicants.length,
      rosterApplicants.filter((a) => hasVerifiedResults({ ...a, competition })).length,
      isTeamSport(quota?.maxStarters),
    );

    return NextResponse.json({
      teamReadiness,
      clubReadiness: {
        isActive: club.isActive && club.status === "ACTIVE",
        approvedActivities,
        requiredActivities: MIN_APPROVED_ACTIVITIES,
      },
      competition: {
        id: competition.id,
        name: competition.name,
        round: competition.round,
        year: competition.year,
        deadline: competition.deadline,
        status: competition.status,
        isOpen: competition.status === "OPEN",
      },
      club: {
        id: club.id,
        name: club.name,
        sport: club.sport,
        presidentName: club.presidentName,
      },
      quota,
      roster: roster ? { id: roster.id, status: roster.status, version: roster.version } : null,
      applicants,
    });
  } catch (error) {
    console.error("[GET /api/club/competitions/[id]]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request, "CLUB");
    if ("error" in auth) return auth.error;
    const { session } = auth;

    if (!session.clubId) {
      return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
    }

    const { id: competitionId } = await params;
    const body = await request.json();
    const { applicationId, action, squadType, reason, documentField } = body;

    if (!applicationId || !action) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const club = await prisma.club.findUnique({
      where: { id: session.clubId },
    });
    if (!club) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { rosterItem: true },
    });

    if (!application || application.competitionId !== competitionId || application.sport !== club.sport || application.noClubFileUrl || application.clubId !== club.id) {
      return NextResponse.json({ error: "ไม่พบใบสมัครหรือไม่มีสิทธิ์" }, { status: 404 });
    }

    if (action === "approve_document" || action === "reject_document") {
      const document = DOCUMENT_FIELDS.find((candidate) => candidate.field === documentField);
      if (!document) {
        return NextResponse.json({ error: "ไม่พบเอกสารที่ต้องการตรวจ" }, { status: 400 });
      }
      const field = document.field;
      const reference = application[field];
      if (typeof reference !== "string" || !reference.trim() || reference === "-") {
        return NextResponse.json({ error: "ผู้สมัครยังไม่ได้แนบเอกสารนี้" }, { status: 409 });
      }

      const existingRoster = await prisma.clubRoster.findUnique({
        where: { clubId_competitionId: { clubId: club.id, competitionId } },
        select: { status: true },
      });
      if (existingRoster?.status === "SUBMITTED") {
        return NextResponse.json({ error: "บัญชีถูกส่งแล้ว ไม่สามารถแก้ไขเอกสารได้" }, { status: 409 });
      }

      const comment = typeof reason === "string" ? reason.trim() : "";
      if (action === "reject_document" && !comment) {
        return NextResponse.json({ error: "กรุณาระบุเหตุผลที่ต้องแก้ไขเอกสาร" }, { status: 400 });
      }
      if (comment.length > 500) {
        return NextResponse.json({ error: "หมายเหตุต้องไม่เกิน 500 ตัวอักษร" }, { status: 400 });
      }
      const approved = action === "approve_document";
      await prisma.statusHistory.create({
        data: {
          applicationId,
          status: `DOCUMENT:${field}:${approved ? "APPROVED" : "REJECTED"}`,
          label: approved
            ? `ชมรมอนุมัติเอกสาร: ${document.title}`
            : `แจ้งแก้ไขเอกสาร: ${document.title} — เหตุผล: ${comment}`,
          by: session.id,
        },
      });
      return NextResponse.json({ message: approved ? "อนุมัติเอกสารเรียบร้อยแล้ว" : "แจ้งแก้ไขเอกสารเรียบร้อยแล้ว" });
    }

    let roster = await prisma.clubRoster.findUnique({
      where: { clubId_competitionId: { clubId: club.id, competitionId } },
    });

    if (roster && roster.status === "SUBMITTED") {
      return NextResponse.json({ error: "บัญชีถูกส่งแล้ว ไม่สามารถแก้ไขได้" }, { status: 409 });
    }

    if (!roster) {
      roster = await prisma.clubRoster.create({
        data: {
          clubId: club.id,
          competitionId,
          status: "DRAFT",
          version: 0,
        },
      });
    }

    if (action === "assign_squad") {
      if (squadType === "main" || squadType === "reserve") {
        if (application.rosterItem) {
          await prisma.rosterItem.update({
            where: { id: application.rosterItem.id },
            data: { squadType },
          });
        } else {
          await prisma.rosterItem.create({
            data: {
              rosterId: roster.id,
              applicationId: application.id,
              squadType,
            },
          });
        }

        const alreadyPassed = application.status === "CLUB_APPROVED" && application.squadType === squadType;
        await prisma.application.update({
          where: { id: application.id },
          data: {
            squadType,
            status: ["STAFF_APPROVED", "STAFF_REJECTED", "FINAL_SELECTED"].includes(application.status)
              ? application.status
              : "CLUB_APPROVED",
            ...(alreadyPassed || ["STAFF_APPROVED", "STAFF_REJECTED", "FINAL_SELECTED"].includes(application.status)
              ? {}
              : {
                  statusHistory: {
                    create: {
                      status: "CLUB_APPROVED",
                      label: `ชมรมผ่านพิจารณา — คัดเลือกเป็น${squadType === "main" ? "ตัวจริง" : "ตัวสำรอง"}`,
                      by: session.id,
                    },
                  },
                }),
          },
        });
      } else {
        // remove squad assignment
        if (application.rosterItem) {
          await prisma.rosterItem.delete({
            where: { id: application.rosterItem.id },
          });
        }
        await prisma.application.update({
          where: { id: application.id },
          data: {
            squadType: null,
            ...(application.status === "CLUB_APPROVED"
              ? {
                  status: "SUBMITTED",
                  statusHistory: { create: { status: "SUBMITTED", label: "ชมรมยกเลิกการคัดเลือก", by: session.id } },
                }
              : {}),
          },
        });
      }


      return NextResponse.json({ message: "บันทึกผลการคัดเลือกเรียบร้อยแล้ว" });
    }

    if (action === "reject") {
      const rejectReason = (reason || "ไม่ผ่านเกณฑ์การคัดเลือกของชมรม").trim();

      if (application.rosterItem) {
        await prisma.rosterItem.delete({
          where: { id: application.rosterItem.id },
        });
      }

      await prisma.application.update({
        where: { id: application.id },
        data: {
          status: "CLUB_REJECTED",
          squadType: null,
          statusHistory: {
            create: {
              status: "CLUB_REJECTED",
              label: rejectReason,
              by: session.id,
            },
          },
        },
      });

      return NextResponse.json({ message: "ปฏิเสธใบสมัครเรียบร้อยแล้ว" });
    }

    return NextResponse.json({ error: "การกระทำไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/club/competitions/[id]]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
