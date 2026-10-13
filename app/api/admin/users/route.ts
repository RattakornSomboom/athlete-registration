import { prisma } from "@/lib/prisma";
import { api, atomic, body, ensure } from "@/lib/phase4-server";
import { reserveEmail } from "@/lib/account-service";
import { recordAudit } from "@/lib/audit-service";
import { ALLOWED_ALL_ROLES, type AllRole, validateCreateUserInput } from "@/lib/validation";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = ["ADMIN"] as const;

/**
 * GET /api/admin/users
 * ดึงรายชื่อผู้ใช้งานทั้งหมด (สำหรับ Admin เท่านั้น)
 * Query params: ?search=...&role=...&status=...&page=...&limit=...
 */
export async function GET(request: Request) {
  return api(request, ADMIN_ROLES, async () => {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role")?.trim().toUpperCase();
    const status = searchParams.get("status")?.trim().toUpperCase();
    const startDateStr = searchParams.get("startDate")?.trim();
    const endDateStr = searchParams.get("endDate")?.trim();
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "50");
    ensure(Number.isSafeInteger(page) && page >= 1 && page <= 1000000, "เลขหน้าไม่ถูกต้อง");
    ensure(Number.isSafeInteger(limit) && limit >= 1 && limit <= 100, "จำนวนรายการไม่ถูกต้อง");
    ensure(!role || role === "ALL" || ALLOWED_ALL_ROLES.includes(role as AllRole), "สิทธิ์ไม่ถูกต้อง");
    ensure(!status || ["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"].includes(status), "สถานะไม่ถูกต้อง");
    ensure(!search || search.length <= 200, "ข้อความค้นหายาวเกินกำหนด");

    const where: Prisma.UserWhereInput = {};

    if (startDateStr || endDateStr) {
      where.createdAt = {};
      if (startDateStr) {
        where.createdAt.gte = new Date(`${startDateStr}T00:00:00+07:00`);
      }
      if (endDateStr) {
        where.createdAt.lte = new Date(`${endDateStr}T23:59:59.999+07:00`);
      }
    }

    if (role && role !== "ALL") {
      where.role = role as AllRole;
    }

    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        where.isActive = true;
      } else if (status === "INACTIVE" || status === "SUSPENDED") {
        where.isActive = false;
      }
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        {
          profile: {
            AND: search.split(/\s+/).map((word) => ({
              OR: [
                { firstName: { contains: word, mode: "insensitive" } },
                { lastName: { contains: word, mode: "insensitive" } },
              ],
            })),
          },
        },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          studentId: true,
          email: true,
          role: true,
          clubId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              faculty: true,
              major: true,
              phone: true,
            },
          },
          officialApplications: {
            select: { profile: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const formattedUsers = users.map((u) => {
      const officialProfile = u.officialApplications[0]?.profile;
      const officialName = officialProfile && typeof officialProfile === "object" && !Array.isArray(officialProfile)
        ? [officialProfile.firstName, officialProfile.lastName]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join(" ")
        : "";
      const name = u.role === "TEAM_OFFICIAL"
        ? officialName || (u.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : "")
        : u.profile
          ? `${u.profile.firstName} ${u.profile.lastName}`.trim()
          : u.studentId || u.email.split("@")[0];
      const phone = u.role === "TEAM_OFFICIAL" && officialProfile && typeof officialProfile === "object" && !Array.isArray(officialProfile)
        && typeof officialProfile.phone === "string"
        ? officialProfile.phone
        : u.profile?.phone || "-";
      return {
        id: u.id,
        studentId: u.studentId,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        name,
        clubId: u.clubId,
        phone,
        profile: u.profile,
      };
    });

    return {
      users: formattedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
}

/**
 * POST /api/admin/users
 * สร้างบัญชีผู้ใช้งานภายใน (Staff, Admin, Team Official, Club)
 */
export async function POST(request: Request) {
  return api(request, ADMIN_ROLES, async (session) => {
    const rawData = await body(request);
    const { name, email, password, role, clubId, phone, isActive } = validateCreateUserInput(rawData);

    const hashedPassword = await bcrypt.hash(password, 10);

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "-";

    return atomic(async (tx) => {
      await reserveEmail(tx, email);
      if (role === "CLUB" && clubId) {
        const club = await tx.club.findUnique({ where: { id: clubId } });
        ensure(club, "ไม่พบชมรมกีฬาที่เลือก", 404);
        ensure(club.isActive, "เลือกชมรมที่ใช้งานได้", 409);
      }

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          clubId: role === "CLUB" ? clubId : null,
          isActive,
          profile: {
            create: {
              firstName,
              lastName,
              phone: phone || "-",
              faculty: "-",
              major: "-",
              year: "-",
              nationalId: "-",
              birthDate: new Date("2000-01-01"),
              addressNo: "-",
              subDistrict: "-",
              district: "-",
              province: "-",
              postalCode: "-",
            },
          },
        },
        select: {
          id: true,
          studentId: true,
          email: true,
          role: true,
          clubId: true,
          isActive: true,
          createdAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      await recordAudit(tx, {
        actorId: session.id,
        action: "CREATE_USER",
        entityType: "USER",
        entityId: user.id,
        details: { email, role, clubId: role === "CLUB" ? clubId : null, isActive },
      });

      return {
        message: "สร้างบัญชีผู้ใช้งานสำเร็จ",
        user: {
          ...user,
          name: `${user.profile?.firstName} ${user.profile?.lastName}`.trim(),
        },
      };
    });
  });
}
