import type { Prisma } from "@prisma/client";
import type { JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensure } from "@/lib/phase4-server";
import { applicationStatus } from "@/lib/validation";

export async function applicationWhere(session: JWTPayload, params: URLSearchParams): Promise<Prisma.ApplicationWhereInput> {
  const status = applicationStatus(params.get("status"));
  const competitionId = params.get("competitionId") || undefined;
  const sport = params.get("sport") || undefined;
  const search = params.get("search")?.trim();
  ensure(!search || search.length <= 200, "คำค้นหายาวเกินกำหนด");
  const where: Prisma.ApplicationWhereInput = { status, competitionId, sport };
  const clubId = session.role === "CLUB" ? session.clubId : params.get("clubId");
  ensure(session.role !== "CLUB" || clubId, "ไม่มีข้อมูลชมรม", 403);
  if (session.role === "CLUB") ensure(!params.get("clubId") || params.get("clubId") === clubId, "ไม่มีสิทธิ์เข้าถึงชมรมนี้", 403);
  if (clubId) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    ensure(club, "ไม่พบชมรม", session.role === "CLUB" ? 403 : 404);
    ensure(club.isActive, "ไม่พบชมรมที่ใช้งานได้", 403);
    // CLUB: only applications rostered by this club.
    // STAFF/ADMIN: club filter shows rostered + unaffiliated applications in the sport.
    if (session.role === "CLUB") {
      where.AND = [{ sport: club.sport }, { rosterItem: { roster: { clubId } } }];
    } else {
      where.AND = [{ sport: club.sport }, { OR: [{ rosterItem: null }, { rosterItem: { roster: { clubId } } }] }];
    }
  }
  if (search) where.OR = [
    { user: { studentId: { contains: search, mode: "insensitive" } } },
    { user: { profile: { firstName: { contains: search, mode: "insensitive" } } } },
    { user: { profile: { lastName: { contains: search, mode: "insensitive" } } } },
  ];
  return where;
}
