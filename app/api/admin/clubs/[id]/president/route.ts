import { api, atomic, body, ensure, string } from "@/lib/phase4-server";
import { normalizeEmail } from "@/lib/validation";
import { reserveEmail } from "@/lib/account-service";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Context) {
  return api(request, ["ADMIN"], async () => {
    const { id } = await params;
    const input = await body(request);
    const presidentName = string(input.presidentName, "ชื่อประธาน");
    const email = normalizeEmail(input.email);
    ensure(input.presidentPhone === undefined || input.presidentPhone === null || typeof input.presidentPhone === "string", "เบอร์โทรไม่ถูกต้อง");
    const presidentPhone = typeof input.presidentPhone === "string" ? input.presidentPhone.trim() : null;
    return atomic(async tx => {
      ensure(await tx.club.findUnique({ where: { id }, select: { id: true } }), "ไม่พบชมรม", 404);
      await reserveEmail(tx, email, id);
      const club = await tx.club.update({
        where: { id }, data: { presidentName, presidentPhone, email, status: "PENDING" },
        select: { id: true, name: true, sport: true, presidentName: true, presidentPhone: true, email: true, status: true, isActive: true },
      });
      return { message: "บันทึกประธานชมรมแล้ว", club };
    });
  });
}
