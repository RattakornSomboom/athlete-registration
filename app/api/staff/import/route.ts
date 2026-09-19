import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request as NextRequest, "STAFF", "ADMIN", "SUPERADMIN");
    if ("error" in auth) return auth.error;

    const data = await request.json();

    if (!Array.isArray(data.students) || data.students.length === 0) {
      return NextResponse.json({ error: "Invalid data format or empty list" }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const student of data.students) {
      const studentId = String(student.studentId || "").trim();
      if (!studentId) {
        errorCount++;
        errors.push("Missing studentId");
        continue;
      }

      const firstName = student.firstName?.trim() || "-";
      const lastName = student.lastName?.trim() || "-";
      const faculty = student.faculty?.trim() || "-";
      const major = student.major?.trim() || "-";
      const email = `${studentId}@up.ac.th`;
      
      const year = String(student.year || "1");
      const nationalId = String(student.nationalId || "-");
      const nationality = String(student.nationality || "ไทย");
      const birthDate = student.birthDate ? new Date(student.birthDate) : new Date("2000-01-01");
      const studentLevel = student.studentLevel === "GRADUATE" ? "GRADUATE" : "BACHELOR";
      const gpaSemester = student.gpaSemester ? String(student.gpaSemester) : null;
      const gpaCumulative = student.gpaCumulative ? String(student.gpaCumulative) : null;

      // History fields
      const hasParticipated = Boolean(student.hasParticipated);
      const firstSport = student.firstSport ? String(student.firstSport) : null;
      const participateCountBachelor = student.participateCountBachelor ? Number(student.participateCountBachelor) : null;
      const participateCountMaster = student.participateCountMaster ? Number(student.participateCountMaster) : null;
      const participateCountPhd = student.participateCountPhd ? Number(student.participateCountPhd) : null;
      const lastParticipateYear = student.lastParticipateYear ? String(student.lastParticipateYear) : null;
      const isNationalTeam = Boolean(student.isNationalTeam);
      const pastCompetitions = student.pastCompetitions || null;

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { studentId },
        });

        if (existingUser) {
          // Update profile if exists
          await prisma.athleteProfile.upsert({
            where: { userId: existingUser.id },
            update: {
              firstName,
              lastName,
              faculty,
              major,
              year,
              nationalId,
              nationality,
              birthDate,
              studentLevel,
              gpaSemester,
              gpaCumulative,
              hasParticipated,
              firstSport,
              participateCountBachelor,
              participateCountMaster,
              participateCountPhd,
              lastParticipateYear,
              isNationalTeam,
              pastCompetitions,
            },
            create: {
              userId: existingUser.id,
              firstName,
              lastName,
              faculty,
              major,
              year,
              nationalId,
              nationality,
              birthDate,
              studentLevel,
              gpaSemester,
              gpaCumulative,
              hasParticipated,
              firstSport,
              participateCountBachelor,
              participateCountMaster,
              participateCountPhd,
              lastParticipateYear,
              isNationalTeam,
              pastCompetitions,
              addressNo: "-",
              subDistrict: "-",
              district: "-",
              province: "-",
              postalCode: "-",
              phone: "-",
            },
          });
          successCount++;
        } else {
          // Create new user & profile
          const hashedPassword = await bcrypt.hash(studentId, 10);
          
          await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                studentId,
                email,
                password: hashedPassword,
                role: "ATHLETE",
              },
            });

            await tx.athleteProfile.create({
              data: {
                userId: newUser.id,
                firstName,
                lastName,
                faculty,
                major,
                year,
                nationalId,
                nationality,
                birthDate,
                studentLevel,
                gpaSemester,
                gpaCumulative,
                hasParticipated,
                firstSport,
                participateCountBachelor,
                participateCountMaster,
                participateCountPhd,
                lastParticipateYear,
                isNationalTeam,
                pastCompetitions,
                addressNo: "-",
                subDistrict: "-",
                district: "-",
                province: "-",
                postalCode: "-",
                phone: "-",
              },
            });
          });
          successCount++;
        }
      } catch (err: any) {
        console.error(`Error importing student ${studentId}:`, err);
        errorCount++;
        errors.push(`Failed for ${studentId}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors,
    });
  } catch (error: any) {
    console.error("Import Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
