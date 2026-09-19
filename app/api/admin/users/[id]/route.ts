import { api, atomic, body, ensure } from "@/lib/phase4-server";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(request, ["ADMIN"], async session => {
    const { id } = await context.params;
    const data = await body(request);
    const role = data.role;
    ensure(role === undefined || ["ATHLETE","STAFF","ADMIN","TEAM_OFFICIAL"].includes(String(role)), "Role ไม่ถูกต้อง");
    ensure(data.isActive === undefined || typeof data.isActive === "boolean", "isActive ไม่ถูกต้อง");
    ensure(role !== undefined || data.isActive !== undefined, "ไม่พบข้อมูลที่จะเปลี่ยน");
    ensure(id !== session.id || data.isActive !== false, "ปิดบัญชีตนเองไม่ได้");
    return atomic(async tx => {
      const user = await tx.user.findUnique({ where: { id } });
      ensure(user, "ไม่พบบัญชี", 404);
      ensure(role !== "ATHLETE" || !!user.studentId, "บัญชีนักกีฬาต้องมีรหัสนิสิต", 409);
      return { user: await tx.user.update({ where: { id }, data: {
        ...(role ? { role: role as "ATHLETE" | "STAFF" | "ADMIN" | "TEAM_OFFICIAL" } : {}),
        ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
      }, select: { id:true, studentId:true, email:true, role:true, isActive:true } }) };
    });
  });
}
