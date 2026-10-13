import { reserveEmail } from "@/lib/account-service";
import { api, atomic, body, ensure, string } from "@/lib/phase4-server";
import { ensureSportConfig } from "@/lib/sport-service";
import { normalizeSportName } from "@/lib/sports";
import { prisma } from "@/lib/prisma";
import { clubProfileInput, normalizeEmail } from "@/lib/validation";
import { Prisma } from "@prisma/client";

type Context = { params: Promise<{ id: string }> };

const CLUB_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const CLUB_PROFILE_SELECT = {
  id: true,
  name: true,
  sport: true,
  email: true,
  isActive: true,
  status: true,
  presidentName: true,
  presidentPhone: true,
  advisors: true,
  createdAt: true,
} as const;

async function clubIdFrom(context: Context): Promise<string> {
  const { id } = await context.params;
  ensure(CLUB_ID_PATTERN.test(id), "Invalid club id", 400);
  return id;
}

export async function GET(request: Request, context: Context) {
  return api(request, ["CLUB", "ADMIN"], async session => {
    const id = await clubIdFrom(context);
    ensure(session.role === "ADMIN" || session.clubId === id, "Forbidden", 403);

    const club = await prisma.club.findUnique({
      where: { id },
      select: CLUB_PROFILE_SELECT,
    });
    ensure(club, "Club not found", 404);

    return { club };
  });
}

export async function PUT(request: Request, context: Context) {
  return api(request, ["CLUB", "ADMIN"], async session => {
    const id = await clubIdFrom(context);
    ensure(session.role === "ADMIN" || session.clubId === id, "Forbidden", 403);
    const input = clubProfileInput(await body(request));
    const data: Prisma.ClubUpdateInput = {};

    if (input.name !== undefined) data.name = string(input.name, "name", 200);
    if (input.email !== undefined) data.email = normalizeEmail(input.email);
    if (input.sport !== undefined) data.sport = normalizeSportName(string(input.sport, "sport", 100));
    if (input.isActive !== undefined) {
      ensure(session.role === "ADMIN", "Only ADMIN can change account status", 403);
      data.isActive = input.isActive;
    }

    return atomic(async tx => {
      const club = await tx.club.findUnique({ where: { id } });
      ensure(club, "Club not found", 404);
      if (data.sport && data.sport !== club.sport) {
        ensure(session.role === "ADMIN", "Only ADMIN can change sport", 403);
        const roster = await tx.clubRoster.count({ where: { clubId: id } });
        const officials = await tx.officialApplication.count({ where: { clubId: id } });
        ensure(!roster && !officials, "Club has existing roster or applications", 409);
      }
      if (data.sport) await ensureSportConfig(tx, data.sport as string);
      if (typeof data.email === "string") await reserveEmail(tx, data.email, id);
      return {
        club: await tx.club.update({ where: { id }, data, select: CLUB_PROFILE_SELECT }),
        message: "Club profile updated",
      };
    });
  });
}

export async function DELETE(request: Request, context: Context) {
  return api(request, ["ADMIN"], async () => {
    const id = await clubIdFrom(context);
    return atomic(async tx => ({
      club: await tx.club.update({ where: { id }, data: { isActive: false }, select: { id: true, name: true, isActive: true } }),
      message: "Club disabled",
    }));
  });
}


