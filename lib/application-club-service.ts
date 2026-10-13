import type { Tx } from "@/lib/phase4-server";

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function validateApplicationClub(tx: Pick<Tx, "club">, input: {
  clubId: string | null;
  sport: string;
  sportEntries: { sport: string }[];
  noClubFileUrl: unknown;
  supervisorName: string | null;
  supervisorPosition: string | null;
}) {
  const sports = [...new Set([input.sport, ...input.sportEntries.map(entry => entry.sport)])];
  if (input.clubId) {
    ensure(!input.noClubFileUrl, "ใบสมัครที่สังกัดชมรมต้องไม่แนบหนังสือกรณีไม่มีชมรม");
    const club = await tx.club.findUnique({ where: { id: input.clubId }, select: { id: true, name: true, sport: true, isActive: true } });
    ensure(club?.isActive, "ไม่พบชมรมต้นสังกัดที่ใช้งานได้");
    ensure(sports.every(sport => sport === club.sport), "ชนิดกีฬาทุกรายการต้องตรงกับชมรมต้นสังกัด");
    return club;
  }
  ensure(typeof input.noClubFileUrl === "string" && input.noClubFileUrl.trim(), "กรุณาเลือกชมรมต้นสังกัด หรือแนบหนังสือขออนุญาตกรณีไม่มีชมรม");
  ensure(input.supervisorName && input.supervisorPosition, "กรุณาระบุชื่อและตำแหน่งผู้รับรอง");
  const existing = await tx.club.count({ where: { sport: { in: sports } } });
  ensure(existing === 0, "ชนิดกีฬานี้มีชมรมจัดตั้งแล้ว กรุณาระบุชมรมต้นสังกัดหรือติดต่อเจ้าหน้าที่");
  return null;
}
