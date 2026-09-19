import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { api, atomic, body, ensure, STAFF, string } from "@/lib/phase4-server";
import { validateProfile } from "@/lib/validation";

export async function GET(request: Request) {
  return api(request, ["ATHLETE", "CLUB", ...STAFF], async session => {
    const studentId = string(new URL(request.url).searchParams.get("studentId"), "studentId");
    const user = await prisma.user.findUnique({ where: { studentId }, include: { profile: true } });
    if (session.role === "ATHLETE") ensure(user?.id === session.id, "ไม่มีสิทธิ์เข้าถึงข้อมูลของผู้อื่น", 403);
    if (session.role === "CLUB") {
      const club = session.clubId ? await prisma.club.findUnique({ where: { id: session.clubId } }) : null;
      const application = club && user ? await prisma.application.findFirst({ where: { userId: user.id, sport: club.sport }, select: { id: true } }) : null;
      ensure(application, "ไม่มีสิทธิ์เข้าถึงข้อมูลนักกีฬานี้", 403);
    }
    ensure(user?.profile, "ไม่พบข้อมูลนักกีฬา", 404);
    return { profile: user.profile };
  });
}

export async function PUT(request: Request) {
  return api(request, ["ATHLETE"], async session => {
    const input = await body(request);
    const studentId = string(input.studentId, "studentId");
    ensure(studentId === session.studentId, "ไม่มีสิทธิ์แก้ไขข้อมูลของผู้อื่น", 403);
    const { studentId: ignored, ...fields } = input;
    void ignored;
    return atomic(async tx => {
      const user = await tx.user.findUnique({ where: { id: session.id }, include: { profile: true } });
      ensure(user && user.studentId === studentId, "ไม่พบบัญชีผู้ใช้", 404);
      const validated = validateProfile(fields, !user.profile);
      const { pastCompetitions, ...rest } = validated;
      const data = { ...rest, ...(pastCompetitions !== undefined ? { pastCompetitions: pastCompetitions === null ? Prisma.DbNull : pastCompetitions } : {}) };
      // Required create fields have been checked; updates intentionally remain partial.
      const profile = user.profile
        ? await tx.athleteProfile.update({ where: { userId: user.id }, data })
        : await tx.athleteProfile.create({ data: { ...data, userId: user.id } as Prisma.AthleteProfileUncheckedCreateInput });
      return { message: "อัปเดตข้อมูลสำเร็จ", profile };
    });
  });
}
