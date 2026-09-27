import { prisma } from "@/lib/prisma";
import { api, atomic, body, ensure } from "@/lib/phase4-server";
import { competitionInput } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const status = new URL(request.url).searchParams.get("status");
  if (status && !["OPEN", "CLOSED", "COMPLETED"].includes(status)) return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  const competitions = await prisma.competition.findMany({
    where: status ? { status: status as "OPEN" | "CLOSED" | "COMPLETED" } : {},
    include: { quotas: true, _count: { select: { applications: true } } }, orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ competitions });
}
export async function POST(request: Request) {
  const response = await api(request, ["ADMIN"], async () => {
    const { quotas, ...data } = competitionInput(await body(request));
    ensure(data.name && data.round && data.year, "ข้อมูลการแข่งขันไม่ครบ");
    ensure(data.status !== "OPEN" || quotas?.length, "กำหนดกีฬาอย่างน้อยหนึ่งชนิดก่อนเปิดรับสมัคร");
    const required = { ...data, name: data.name, round: data.round, year: data.year };
    return atomic(async tx => ({ competition: await tx.competition.create({
      data: { ...required, quotas: { create: quotas } }, include: { quotas: true },
    }) }));
  });
  return response.status === 200 ? new Response(response.body, { status: 201, headers: response.headers }) : response;
}
