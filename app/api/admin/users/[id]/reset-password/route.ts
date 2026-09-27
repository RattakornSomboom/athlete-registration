import { api, atomic, ensure, ApiError } from "@/lib/phase4-server";
import { checkResetRateLimit, createPasswordResetToken } from "@/lib/password-reset";
import { assertPasswordResetDeliveryConfigured, sendPasswordResetEmail } from "@/lib/password-reset-delivery";
import { recordAudit } from "@/lib/audit-service";

const ADMIN_ROLES = ["ADMIN"] as const;
type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/users/[id]/reset-password
 * Admin ส่งคำขอตั้งรหัสผ่านใหม่ให้กับผู้ใช้ (โดยไม่เปิดเผยรหัสผ่านเดิม)
 */
export async function POST(request: Request, context: Context) {
  return api(request, ADMIN_ROLES, async (session) => {
    const { id } = await context.params;

    try {
      assertPasswordResetDeliveryConfigured();
    } catch {
      throw new ApiError(503, "บริการส่งอีเมลยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง");
    }
    const delivery = await atomic(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
      });

      ensure(user, "ไม่พบผู้ใช้งาน", 404);
      ensure(checkResetRateLimit(user.email), "กรุณารอ 60 วินาทีก่อนส่งคำขอใหม่", 429);
      const resetToken = createPasswordResetToken({
        userId: user.id,
        email: user.email,
        userType: "USER",
        passwordHash: user.password,
        updatedAt: user.updatedAt,
      });

      return { id: user.id, email: user.email, token: resetToken };
    });
    try {
      await sendPasswordResetEmail(delivery.email, delivery.token);
    } catch {
      throw new ApiError(503, "บริการส่งอีเมลยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง");
    }
    await atomic(async (tx) => {
      await recordAudit(tx, {
        actorId: session.id,
        action: "ADMIN_SENT_PASSWORD_RESET",
        entityType: "USER",
        entityId: delivery.id,
        details: { email: delivery.email },
      });
    });
    return { message: "ส่งขั้นตอนการตั้งรหัสผ่านใหม่ไปยังอีเมลเรียบร้อยแล้ว" };
  });
}
