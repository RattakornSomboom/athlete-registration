import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== "CLUB" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const clubId = session.clubId;

    const coaches = await prisma.coach.findMany({ where: { clubId } });
    const programs = await prisma.trainingProgram.findMany({
      where: { clubId },
      include: { reports: { orderBy: { date: "desc" } } },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ coaches, programs });
  } catch (error) {
    console.error("[GET /api/club/training]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== "CLUB" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { action, name, phone, goal, schedule, programId, date, progress, issues, photoUrl } = body;
    const clubId = session.clubId;

    if (!clubId) {
      return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 401 });
    }

    if (action === "ADD_COACH") {
      if (!name) return NextResponse.json({ error: "Coach name required" }, { status: 400 });
      const coach = await prisma.coach.create({ data: { clubId, name, phone } });
      return NextResponse.json({ coach });
    }

    
    if (action === "CREATE_PROGRAM") {
      if (!goal) return NextResponse.json({ error: "Goal required" }, { status: 400 });
      const program = await prisma.trainingProgram.create({ data: { clubId, goal, schedule } });
      return NextResponse.json({ program });
    }

    if (action === "ADD_REPORT") {
      if (!programId || !progress || !date) return NextResponse.json({ error: "Missing report data" }, { status: 400 });
      
      // Verify program belongs to this club
      const program = await prisma.trainingProgram.findUnique({ where: { id: programId } });
      if (!program || program.clubId !== clubId) return NextResponse.json({ error: "Invalid program" }, { status: 403 });

      const report = await prisma.trainingReport.create({ 
        data: { 
          programId, 
          date: new Date(date), 
          progress, 
          issues, 
          photoUrl 
        } 
      });
      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/club/training]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
