import { ensureSportConfig } from "@/lib/sport-service";
import { prisma } from "@/lib/prisma";
import { api, atomic, body, ensure, STAFF } from "@/lib/phase4-server";
import { competitionInput } from "@/lib/validation";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const status = new URL(request.url).searchParams.get("status");
  if (status && !["OPEN", "CLOSED", "COMPLETED"].includes(status)) return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  const competitions = await prisma.competition.findMany({
    where: status ? { status: status as "OPEN" | "CLOSED" | "COMPLETED" } : {},
    include: { quotas: true, _count: { select: { applications: true } } }, orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ competitions }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const response = await api(request, STAFF, async () => {
    const { quotas, ...data } = competitionInput(await body(request));
    ensure(data.name && data.round && data.year, "ข้อมูลการแข่งขันไม่ครบ");
    ensure(data.status !== "OPEN" || quotas?.length, "กำหนดกีฬาอย่างน้อยหนึ่งชนิดก่อนเปิดรับสมัคร");
    const required = { ...data, name: data.name, round: data.round, year: data.year, ...(data.createdAt && { createdAt: data.createdAt }) };
    return atomic(async tx => {
      for (const quota of quotas ?? []) await ensureSportConfig(tx, quota.sport);
      return { competition: await tx.competition.create({
        data: { ...required, quotas: { create: quotas } }, include: { quotas: true },
      }) };
    });
  });
  return response.status === 200 ? new Response(response.body, { status: 201, headers: response.headers }) : response;
}


