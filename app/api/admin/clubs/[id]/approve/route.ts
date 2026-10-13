import { api, atomic, ensure } from "@/lib/phase4-server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return api(request, ["ADMIN"], async () => {
    const { id } = await params;
    return atomic(async tx => {
      ensure(await tx.club.findUnique({ where: { id }, select: { id: true } }), "ไม่พบชมรม", 404);
      const club = await tx.club.update({ where: { id }, data: { status: "ACTIVE" }, select: { id: true, name: true, sport: true, email: true, status: true, isActive: true } });
      return { club };
    });
  });
}
