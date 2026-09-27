import { prisma } from "@/lib/prisma";
import { api, atomic, body, ensure } from "@/lib/phase4-server";
import { reserveEmail } from "@/lib/account-service";
import { recordAudit } from "@/lib/audit-service";
import { validateAccountAccessChange, validateUpdateUserInput } from "@/lib/validation";

const ADMIN_ROLES = ["ADMIN"] as const;
type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/users/[id]
 * ดูรายละเอียดผู้ใช้งานรายบุคคล
 */
export async function GET(request: Request, context: Context) {
  return api(request, ADMIN_ROLES, async () => {
    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: {
            applications: true,
            officialApplications: true,
          },
        },
      },
    });

    ensure(user, "ไม่พบผู้ใช้งาน", 404);

    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user.studentId || user.email.split("@")[0];

    return {
      user: {
        ...user,
        name,
        phone: user.profile?.phone || "-",
      },
    };
  });
}

/**
 * PATCH /api/admin/users/[id]
 * แก้ไขข้อมูลผู้ใช้, สิทธิ์ หรือสถานะการใช้งาน
 */
export async function PATCH(request: Request, context: Context) {
  return api(request, ADMIN_ROLES, async (session) => {
    const { id } = await context.params;
    const rawData = await body(request);
    const updates = validateUpdateUserInput(rawData);

    return atomic(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        include: { profile: true },
      });

      ensure(target, "ไม่พบผู้ใช้งาน", 404);
      const nextRole = updates.role ?? target.role;
      const clubId = nextRole === "CLUB" ? (updates.clubId ?? target.clubId) : null;
      if (nextRole === "CLUB") {
        ensure(clubId, "เลือกชมรมก่อนกำหนดบทบาท CLUB");
        const club = await tx.club.findUnique({ where: { id: clubId } });
        ensure(club?.isActive, "เลือกชมรมที่ใช้งานได้", 409);
      } else ensure(!updates.clubId, "ผูกชมรมได้เฉพาะบทบาท CLUB");

      // ─── Email Uniqueness Check ───
      if (updates.email && updates.email !== target.email) {
        await reserveEmail(tx, updates.email, { ownUserId: target.id });
      }

      // ─── Role Verification & Protection ───
      if (updates.role && updates.role !== target.role) {

        // Athlete role requirement
        ensure(
          updates.role !== "ATHLETE" || !!target.studentId,
          "บัญชีนักกีฬาต้องมีรหัสนิสิต",
          409
        );

      }
      const activeAdminCount = await tx.user.count({
        where: { role: { in: ["ADMIN"] }, isActive: true },
      });
      validateAccountAccessChange({
        actorId: session.id,
        targetId: target.id,
        currentRole: target.role,
        currentActive: target.isActive,
        nextRole: updates.role,
        nextActive: updates.isActive,
        activeAdminCount,
      });

      // ─── Profile (Name / Phone) Updates ───
      if (updates.name !== undefined || updates.phone !== undefined) {
        let firstName = target.profile?.firstName || target.email.split("@")[0];
        let lastName = target.profile?.lastName || "-";

        if (updates.name !== undefined) {
          const parts = updates.name.trim().split(/\s+/);
          firstName = parts[0] || updates.name.trim();
          lastName = parts.slice(1).join(" ") || "-";
        }

        const phone = updates.phone !== undefined ? updates.phone : (target.profile?.phone || "-");

        if (target.profile) {
          await tx.athleteProfile.update({
            where: { userId: target.id },
            data: {
              firstName,
              lastName,
              phone,
            },
          });
        } else {
          await tx.athleteProfile.create({
            data: {
              userId: target.id,
              firstName,
              lastName,
              phone,
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
          });
        }
      }

      // ─── User Table Updates ───
      const updatedUser = await tx.user.update({
        where: { id: target.id },
        data: {
          ...(updates.email ? { email: updates.email } : {}),
          ...(updates.role ? { role: updates.role } : {}),
          clubId,
          ...(typeof updates.isActive === "boolean" ? { isActive: updates.isActive } : {}),
        },
        select: {
          id: true,
          studentId: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      // ─── Audit Logging ───
      if (updates.role && updates.role !== target.role) {
        await recordAudit(tx, {
          actorId: session.id,
          action: "CHANGE_USER_ROLE",
          entityType: "USER",
          entityId: target.id,
          details: { oldRole: target.role, newRole: updates.role, clubId },
        });
      }

      if (typeof updates.isActive === "boolean" && updates.isActive !== target.isActive) {
        await recordAudit(tx, {
          actorId: session.id,
          action: updates.isActive ? "ACTIVATE_USER" : "SUSPEND_USER",
          entityType: "USER",
          entityId: target.id,
          details: { isActive: updates.isActive },
        });
      }

      if (updates.name !== undefined || updates.email !== undefined || updates.phone !== undefined || updates.clubId !== undefined) {
        await recordAudit(tx, {
          actorId: session.id,
          action: "UPDATE_USER",
          entityType: "USER",
          entityId: target.id,
          details: {
            ...(updates.clubId !== undefined ? { oldClubId: target.clubId, clubId } : {}),
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.email !== undefined ? { email: updates.email } : {}),
            ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
          },
        });
      }

      const displayName = updatedUser.profile
        ? `${updatedUser.profile.firstName} ${updatedUser.profile.lastName}`.trim()
        : updatedUser.studentId || updatedUser.email.split("@")[0];

      return {
        message: "บันทึกการเปลี่ยนแปลงสำเร็จ",
        user: {
          ...updatedUser,
          name: displayName,
          phone: updatedUser.profile?.phone || "-",
        },
      };
    });
  });
}
