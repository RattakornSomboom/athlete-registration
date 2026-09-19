import { normalizeEmail } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { api, atomic, body, ensure, string } from "@/lib/phase4-server";
import { reserveEmail } from "@/lib/account-service";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  return api(request, ["CLUB","ADMIN"], async session => {
    const { id } = await context.params;
    ensure(session.role === "ADMIN" || session.clubId === id, "ไม่มีสิทธิ์", 403);
    const input = await body(request);
    const data: Prisma.ClubUpdateInput = {};
    if (input.name !== undefined) data.name = string(input.name,"name");
    if (input.email !== undefined) data.email = normalizeEmail(input.email);
    if (input.sport !== undefined) data.sport = string(input.sport,"sport");
    if (input.isActive !== undefined) {
      ensure(session.role === "ADMIN" && typeof input.isActive === "boolean","ไม่มีสิทธิ์เปลี่ยนสถานะบัญชี",403);
      data.isActive = input.isActive;
    }
    if (input.password) data.password = await bcrypt.hash(string(input.password,"password",72),10);
    return atomic(async tx => {
      const club = await tx.club.findUnique({ where:{id} });
      ensure(club,"ไม่พบชมรม",404);
      if (data.sport && data.sport !== club.sport) {
        ensure(session.role === "ADMIN","เฉพาะผู้ดูแลเปลี่ยนกีฬาของชมรมได้",403);
        const roster = await tx.clubRoster.count({where:{clubId:id}});
        const officials = await tx.officialApplication.count({where:{clubId:id}});
        ensure(!roster && !officials,"ชมรมมีบัญชีหรือใบสมัครแล้ว เปลี่ยนกีฬาไม่ได้",409);
      }
      if (typeof data.email === "string") await reserveEmail(tx,data.email,id);
      return { club: await tx.club.update({ where:{id},data,select:{id:true,name:true,sport:true,email:true,isActive:true} }),message:"อัปเดตข้อมูลชมรมสำเร็จ" };
    });
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(request, ["ADMIN"], async () => {
    const { id } = await context.params;
    return atomic(async tx => ({ club: await tx.club.update({where:{id},data:{isActive:false},select:{id:true,name:true,isActive:true}}),message:"ปิดการใช้งานชมรมสำเร็จ" }));
  });
}
