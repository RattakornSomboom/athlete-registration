import { ensure, type Tx } from "@/lib/phase4-server";

export async function reserveEmail(
  tx: Tx,
  email: string,
  optionsOrClubId?: string | { ownClubId?: string; ownUserId?: string }
) {
  const ownClubId =
    typeof optionsOrClubId === "string"
      ? optionsOrClubId
      : optionsOrClubId?.ownClubId;
  const ownUserId =
    typeof optionsOrClubId === "object"
      ? optionsOrClubId?.ownUserId
      : undefined;

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
  const [user, club] = await Promise.all([
    tx.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        ...(ownUserId ? { id: { not: ownUserId } } : {}),
      },
      select: { id: true },
    }),
    tx.club.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        ...(ownClubId ? { id: { not: ownClubId } } : {}),
      },
      select: { id: true },
    }),
  ]);
  ensure(!user && !club, "อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยบัญชีเดิม", 409);
}
