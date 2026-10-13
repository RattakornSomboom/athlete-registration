import { Prisma } from "@prisma/client";
import { normalizeSportName } from "@/lib/sports";
import { getSportType } from "@/lib/sport-type";

export async function ensureSportConfig(tx: Prisma.TransactionClient, rawName: string) {
  const name = normalizeSportName(rawName);
  const existing = await tx.sportConfig.findFirst({ where: { name } });
  if (existing) return existing;
  return tx.sportConfig.create({
    data: {
      name,
      sportType: getSportType(name),
      category: "GENERAL",
      maxAthletes: 0,
      isOpen: true,
      positions: [],
    },
  });
}
