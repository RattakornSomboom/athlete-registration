import type { JWTPayload } from "@/lib/auth";
import { atomic, ensure, json } from "@/lib/phase4-server";
import { assertAthleteEligibility } from "@/lib/athlete-eligibility";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type AthleteImportItem = {
  sport: string;
  category: string;
  division?: string;
  title?: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  nationality?: string;
  birthDate: Date;
  studentLevel: "BACHELOR" | "GRADUATE";
  year: string;
  semester?: string | null;
  gpaSemester?: string | null;
  gpaCumulative?: string | null;
  major: string;
  faculty: string;
  studentId: string;
  addressNo?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  hasParticipated?: boolean;
  firstSport?: string | null;
  participateCountBachelor?: number | null;
  participateCountMaster?: number | null;
  participateCountPhd?: number | null;
  lastParticipateYear?: string | null;
  isNationalTeam?: boolean;
  pastCompetitions?: string[] | null;
  photoFileUrl?: string;
  idCardFileUrl?: string;
  studentCardFileUrl?: string;
  studentCertFileUrl?: string;
  upAcademyFileUrl?: string;
  fitnessTestFileUrl?: string;
};

/**
 * Extract athlete data from generic object (e.g., from sheet_to_json or JSON payload)
 */
export function extractAthleteFromObject(obj: Record<string, unknown>): AthleteImportItem | null {
  if (!obj || typeof obj !== "object") return null;

  const findVal = (keywords: string[]): unknown => {
    for (const key of Object.keys(obj)) {
      for (const kw of keywords) {
        if (key.toLowerCase().includes(kw.toLowerCase())) {
          return obj[key];
        }
      }
    }
    return undefined;
  };

  const studentId = String(findVal(["รหัสนิสิต", "studentId", "Student ID"]) || "").trim();
  if (!studentId || studentId.toLowerCase().includes("รหัส")) return null;

  const rawSport = String(findVal(["ชนิดกีฬา", "กีฬา", "sport"]) || "").trim();
  const sport = rawSport || "ทั่วไป";

  const category = String(findVal(["ประเภท", "category"]) || "-").trim();
  const division = String(findVal(["รุ่น", "division"]) || "-").trim();

  const rawFullName = String(findVal(["ชื่อ-นามสกุล", "ชื่อ", "fullname", "name", "firstName"]) || "").trim();
  const nameParts = rawFullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "-";
  const lastName = nameParts.slice(1).join(" ") || "-";

  let nationalId = String(findVal(["เลขประจำตัวประชาชน", "nationalId", "idCard"]) || "-").trim();
  if (nationalId.includes("E+") || nationalId.includes("e+")) {
    nationalId = Number(nationalId).toFixed(0);
  }

  const nationality = String(findVal(["สัญชาติ", "nationality"]) || "ไทย").trim();

  let birthDate: Date | null = null;
  const rawBirth = findVal(["วันเดือนปีเกิด", "birthDate", "birthday"]);
  if (typeof rawBirth === "number") {
    birthDate = new Date((rawBirth - 25569) * 86400 * 1000);
  } else if (typeof rawBirth === "string" && rawBirth.trim()) {
    const parts = rawBirth.trim().split(/[\/\-]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y > 2500) y -= 543;
      birthDate = new Date(y, m, d);
    } else {
      birthDate = new Date(rawBirth);
    }
  }
  if (!birthDate || isNaN(birthDate.getTime())) {
    birthDate = new Date(NaN);
  }

  const rawLevel = String(findVal(["ระดับการศึกษา", "studentLevel", "level"]) || "").toLowerCase();
  const studentLevel: "BACHELOR" | "GRADUATE" =
    rawLevel.includes("โท") || rawLevel.includes("เอก") || rawLevel.includes("grad")
      ? "GRADUATE"
      : "BACHELOR";

  const year = String(findVal(["ชั้นปี", "year"]) || "1").trim();
  const semester = String(findVal(["ภาคเรียน", "semester"]) || "").trim() || null;
  const gpaSemester = findVal(["gpa ภาคการศึกษา", "gpasemester", "gpa"]) ? String(findVal(["gpa ภาคการศึกษา", "gpasemester", "gpa"])).trim() : null;
  const gpaCumulative = findVal(["gpax", "gpacumulative"]) ? String(findVal(["gpax", "gpacumulative"])).trim() : null;
  const major = String(findVal(["ภาควิชา", "สาขาวิชา", "สาขา", "major"]) || "-").trim();
  const faculty = String(findVal(["คณะ", "faculty"]) || "-").trim();

  const addressNo = String(findVal(["ที่อยู่", "address"]) || "-").trim();
  const province = String(findVal(["จังหวัด", "province"]) || "-").trim();
  const postalCode = String(findVal(["รหัสไปรษณีย์", "postalCode", "zipcode"]) || "-").trim();
  const phone = String(findVal(["เบอร์โทรศัพท์", "เบอร์โทร", "phone"]) || "-").trim();

  let email = String(findVal(["อีเมล", "email"]) || "").trim();
  if (!email || !email.includes("@")) {
    email = `${studentId}@up.ac.th`;
  }

  const hasParticipated = String(findVal(["เคยเข้าร่วม", "hasParticipated"]) || "").includes("เคย");
  const firstSport = findVal(["ครั้งแรก", "firstSport"]) ? String(findVal(["ครั้งแรก", "firstSport"])).trim() : null;
  const participateCountBachelor = Number(findVal(["ปริญญาตรี", "participateCountBachelor"])) || null;
  const participateCountMaster = Number(findVal(["ปริญญาโท", "participateCountMaster"])) || null;
  const participateCountPhd = Number(findVal(["ปริญญาเอก", "participateCountPhd"])) || null;
  const lastParticipateYear = findVal(["ปี พ.ศ. ที่เข้าร่วมล่าสุด", "lastParticipateYear"]) ? String(findVal(["ปี พ.ศ. ที่เข้าร่วมล่าสุด", "lastParticipateYear"])).trim() : null;
  const isNationalTeam = String(findVal(["ผู้แทนประเทศไทย", "isNationalTeam"]) || "").includes("เคย");

  const past1 = findVal(["ผลงานรายการที่ 1"]);
  const past2 = findVal(["ผลงานรายการที่ 2"]);
  const past3 = findVal(["ผลงานรายการที่ 3"]);
  const past4 = findVal(["ผลงานเพิ่มเติม"]);
  const pastCompetitions = [past1, past2, past3, past4]
    .filter((v) => v && String(v).trim().length > 0 && String(v).trim() !== "-")
    .map(String);

  const photoFileUrl = String(findVal(["รูปถ่าย", "photoFileUrl", "photo"]) || "-").trim();
  const idCardFileUrl = String(findVal(["สำเนาบัตรประชาชน", "idCardFileUrl", "idCard"]) || "-").trim();
  const studentCardFileUrl = String(findVal(["สำเนาบัตรนิสิต", "studentCardFileUrl", "studentCard"]) || "-").trim();
  const studentCertFileUrl = String(findVal(["ใบรับรองการเป็นนิสิต", "studentCertFileUrl"]) || "-").trim();
  const fitnessTestFileUrl = String(findVal(["หลักฐานผลงาน", "fitnessTestFileUrl"]) || "-").trim();

  return {
    sport,
    category,
    division,
    title: "",
    firstName,
    lastName,
    nationalId,
    nationality,
    birthDate,
    studentLevel,
    year,
    semester,
    gpaSemester,
    gpaCumulative,
    major,
    faculty,
    studentId,
    addressNo,
    subDistrict: "-",
    district: "-",
    province,
    postalCode,
    phone,
    email,
    hasParticipated,
    firstSport,
    participateCountBachelor,
    participateCountMaster,
    participateCountPhd,
    lastParticipateYear,
    isNationalTeam,
    pastCompetitions: pastCompetitions.length > 0 ? pastCompetitions : null,
    photoFileUrl,
    idCardFileUrl,
    studentCardFileUrl,
    studentCertFileUrl,
    upAcademyFileUrl: "-",
    fitnessTestFileUrl,
  };
}

/**
 * Smart detection and extraction from raw table/sheet row
 * Automatically normalizes shifted Google Form responses (where timestamp may precede or be missing)
 */
export function extractAthleteRow(rawRow: unknown): AthleteImportItem | null {
  if (!rawRow) return null;

  if (!Array.isArray(rawRow) && typeof rawRow === "object") {
    return extractAthleteFromObject(rawRow as Record<string, unknown>);
  }

  if (!Array.isArray(rawRow) || rawRow.length === 0) return null;

  // Detect whether row starts with a Timestamp (serial number > 30000 or date string)
  const firstVal = rawRow[0];
  const isFirstTimestamp =
    (typeof firstVal === "number" && firstVal > 30000 && firstVal < 60000) ||
    (typeof firstVal === "string" && /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(firstVal.trim()));

  const row = isFirstTimestamp ? rawRow.slice(1) : rawRow;

  const sport = String(row[0] || "").trim();
  if (!sport || sport.toLowerCase().includes("ชนิดกีฬา")) return null;

  const category = String(row[1] || "-").trim();
  const division = String(row[2] || "-").trim();
  const title = String(row[4] || "").trim();
  const rawFullName = String(row[5] || "").trim();
  const nameParts = rawFullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "-";
  const lastName = nameParts.slice(1).join(" ") || "-";

  let nationalId = String(row[6] ?? "").trim();
  if (nationalId.includes("E+") || nationalId.includes("e+")) {
    nationalId = Number(nationalId).toFixed(0);
  }

  const nationality = String(row[7] || "ไทย").trim();

  let birthDate: Date | null = null;
  const rawBirth = row[8];
  if (typeof rawBirth === "number") {
    birthDate = new Date((rawBirth - 25569) * 86400 * 1000);
  } else if (typeof rawBirth === "string" && rawBirth.trim()) {
    const parts = rawBirth.trim().split(/[\/\-]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y > 2500) y -= 543;
      birthDate = new Date(y, m, d);
    } else {
      birthDate = new Date(rawBirth);
    }
  }
  if (!birthDate || isNaN(birthDate.getTime())) {
    birthDate = new Date(NaN);
  }

  const rawLevel = String(row[10] || "").toLowerCase();
  const studentLevel: "BACHELOR" | "GRADUATE" =
    rawLevel.includes("โท") || rawLevel.includes("เอก") || rawLevel.includes("grad")
      ? "GRADUATE"
      : "BACHELOR";

  const year = String(row[11] || "1").trim();
  const gpaSemester = row[12] ? String(row[12]).trim() : null;
  const gpaCumulative = row[13] ? String(row[13]).trim() : null;
  const major = String(row[14] || "-").trim();
  const faculty = String(row[15] || "-").trim();
  const studentId = String(row[16] || "").trim();

  if (!studentId || studentId.toLowerCase().includes("รหัส")) return null;

  const addressNo = String(row[17] || "-").trim();
  const province = String(row[18] || "-").trim();
  const postalCode = String(row[19] || "-").trim();
  const phone = String(row[20] || "-").trim();

  let email = String(row[21] || "").trim();
  if (!email || !email.includes("@")) {
    email = String(row[42] || "").trim();
  }
  if (!email || !email.includes("@")) {
    email = `${studentId}@up.ac.th`;
  }

  const hasParticipated = String(row[22] || "").includes("เคย");
  const firstSport = row[23] ? String(row[23]).trim() : null;
  const participateCountBachelor = row[24] && !isNaN(Number(row[24])) ? Number(row[24]) : null;
  const participateCountMaster = row[25] && !isNaN(Number(row[25])) ? Number(row[25]) : null;
  const participateCountPhd = row[26] && !isNaN(Number(row[26])) ? Number(row[26]) : null;
  const lastParticipateYear = row[27] ? String(row[27]).trim() : null;
  const isNationalTeam = String(row[28] || "").includes("เคย");

  const pastCompetitions = [row[30], row[31], row[32], row[33]]
    .filter((v) => v && String(v).trim().length > 0 && String(v).trim() !== "-")
    .map(String);

  const photoFileUrl = String(row[34] || "-").trim();
  const idCardFileUrl = String(row[35] || "-").trim();
  const studentCardFileUrl = String(row[37] || "-").trim();
  const studentCertFileUrl = String(row[38] || "-").trim();
  const fitnessTestFileUrl = String(row[39] || "-").trim();
  const upAcademyFileUrl = "-";

  return {
    sport,
    category,
    division,
    title,
    firstName,
    lastName,
    nationalId,
    nationality,
    birthDate,
    studentLevel,
    year,
    gpaSemester,
    gpaCumulative,
    major,
    faculty,
    studentId,
    addressNo,
    subDistrict: "-",
    district: "-",
    province,
    postalCode,
    phone,
    email,
    hasParticipated,
    firstSport,
    participateCountBachelor,
    participateCountMaster,
    participateCountPhd,
    lastParticipateYear,
    isNationalTeam,
    pastCompetitions: pastCompetitions.length > 0 ? pastCompetitions : null,
    photoFileUrl,
    idCardFileUrl,
    studentCardFileUrl,
    studentCertFileUrl,
    upAcademyFileUrl,
    fitnessTestFileUrl,
  };
}

export type ImportAthleteApplicationsOptions = {
  competitionId: string;
  items?: AthleteImportItem[];
  rawRows?: unknown[][];
};

/**
 * Execute Athlete Applications Import (Bypasses registration deadline for Staff/Admin)
 * Executes per-athlete transactions with pre-computed hashes to avoid transaction timeout
 */
export async function importAthleteApplications(
  session: JWTPayload,
  options: ImportAthleteApplicationsOptions
) {
  ensure(["STAFF", "ADMIN"].includes(session.role), "ไม่มีสิทธิ์เข้าถึง (เฉพาะเจ้าหน้าที่)", 403);
  ensure(options.competitionId && typeof options.competitionId === "string", "กรุณาระบุการแข่งขัน");

  let itemsToProcess: AthleteImportItem[] = [];

  if (Array.isArray(options.items) && options.items.length > 0) {
    itemsToProcess = options.items
      .map((item) => {
        if (item && typeof item === "object" && "studentId" in item && item.studentId) {
          return item as AthleteImportItem;
        }
        return extractAthleteRow(item);
      })
      .filter((item): item is AthleteImportItem => item !== null && Boolean(item.studentId) && Boolean(item.sport));
  } else if (Array.isArray(options.rawRows) && options.rawRows.length > 0) {
    for (const raw of options.rawRows) {
      const extracted = extractAthleteRow(raw);
      if (extracted && extracted.studentId && extracted.sport) {
        itemsToProcess.push(extracted);
      }
    }
  }

  ensure(itemsToProcess.length > 0, "ไม่พบข้อมูลนักกีฬาที่ถูกต้องในไฟล์นำเข้า");

  const competition = await prisma.competition.findUnique({
    where: { id: options.competitionId },
    include: { quotas: true },
  });
  ensure(competition, "ไม่พบข้อมูลการแข่งขันที่ระบุ", 404);

  // Precompute password hashes concurrently to avoid CPU blocking during DB transactions
  const passwordHashes = await Promise.all(
    itemsToProcess.map(async (item) => {
      const tempPass = item.nationalId && item.nationalId.length >= 8
        ? item.nationalId.slice(-8)
        : item.studentId;
      return bcrypt.hash(tempPass, 10);
    })
  );

  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];
  const processedIds: string[] = [];

  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    const hashedPassword = passwordHashes[i];

    try {
      ensure(item.semester == null || ["1", "2", "3"].includes(item.semester), "ภาคเรียนไม่ถูกต้อง");
      const result = await atomic(async (tx) => {
        const currentCompetition = await tx.competition.findUnique({
          where: { id: options.competitionId }, include: { quotas: true },
        });
        ensure(currentCompetition, "ไม่พบการแข่งขัน", 404);
        const quota = currentCompetition.quotas.find(entry => entry.sport === item.sport);
        const birthDate = item.birthDate instanceof Date ? item.birthDate : new Date(String(item.birthDate));
        assertAthleteEligibility({ ...item, birthDate }, quota, currentCompetition.year);
        // 1. Find or create User
        let user = await tx.user.findUnique({
          where: { studentId: item.studentId },
        });

        if (!user) {
          const targetEmail =
            item.email && item.email.includes("@")
              ? item.email.toLowerCase().trim()
              : `${item.studentId}@up.ac.th`;

          const existingEmailUser = await tx.user.findUnique({ where: { email: targetEmail } });
          const safeEmail = existingEmailUser
            ? `${item.studentId}.${Date.now().toString().slice(-4)}@up.ac.th`
            : targetEmail;

          user = await tx.user.create({
            data: {
              studentId: item.studentId,
              email: safeEmail,
              password: hashedPassword,
              role: "ATHLETE",
              mustChangePassword: true,
            },
          });
        }

        // 2. Upsert AthleteProfile
        await tx.athleteProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            firstName: item.firstName,
            lastName: item.lastName,
            faculty: item.faculty,
            major: item.major,
            studentLevel: item.studentLevel,
            year: item.year,
            semester: item.semester,
            nationalId: item.nationalId,
            nationality: item.nationality || "ไทย",
            birthDate,
            gpaSemester: item.gpaSemester,
            gpaCumulative: item.gpaCumulative,
            addressNo: item.addressNo || "-",
            subDistrict: item.subDistrict || "-",
            district: item.district || "-",
            province: item.province || "-",
            postalCode: item.postalCode || "-",
            phone: item.phone || "-",
            photoUrl: item.photoFileUrl && item.photoFileUrl !== "-" ? item.photoFileUrl : null,
            hasParticipated: Boolean(item.hasParticipated),
            firstSport: item.firstSport,
            participateCountBachelor: item.participateCountBachelor,
            participateCountMaster: item.participateCountMaster,
            participateCountPhd: item.participateCountPhd,
            lastParticipateYear: item.lastParticipateYear,
            isNationalTeam: Boolean(item.isNationalTeam),
            pastCompetitions: item.pastCompetitions ? json(item.pastCompetitions) : undefined,
          },
          update: {
            firstName: item.firstName,
            lastName: item.lastName,
            faculty: item.faculty,
            major: item.major,
            studentLevel: item.studentLevel,
            year: item.year,
            semester: item.semester,
            nationalId: item.nationalId,
            birthDate,
            gpaSemester: item.gpaSemester,
            gpaCumulative: item.gpaCumulative,
            addressNo: item.addressNo && item.addressNo !== "-" ? item.addressNo : undefined,
            province: item.province && item.province !== "-" ? item.province : undefined,
            postalCode: item.postalCode && item.postalCode !== "-" ? item.postalCode : undefined,
            phone: item.phone && item.phone !== "-" ? item.phone : undefined,
            photoUrl: item.photoFileUrl && item.photoFileUrl !== "-" ? item.photoFileUrl : undefined,
            hasParticipated: Boolean(item.hasParticipated),
            firstSport: item.firstSport,
            participateCountBachelor: item.participateCountBachelor,
            participateCountMaster: item.participateCountMaster,
            participateCountPhd: item.participateCountPhd,
            lastParticipateYear: item.lastParticipateYear,
            isNationalTeam: Boolean(item.isNationalTeam),
            pastCompetitions: item.pastCompetitions ? json(item.pastCompetitions) : undefined,
          },
        });


        const existingApp = await tx.application.findUnique({
          where: {
            userId_competitionId_sport: {
              userId: user.id,
              competitionId: options.competitionId,
              sport: item.sport,
            },
          },
        });

        let appRecordId: string;
        let isUpdated = false;

        if (existingApp) {
          ensure(existingApp.status === "SUBMITTED", "ไม่สามารถนำเข้าทับใบสมัครที่พิจารณาแล้ว", 409);
          appRecordId = existingApp.id;
          isUpdated = true;
          await tx.application.update({
            where: { id: existingApp.id },
            data: {
              category: item.category,
              division: item.division,
              status: "SUBMITTED",
              photoFileUrl: item.photoFileUrl && item.photoFileUrl !== "-" ? item.photoFileUrl : existingApp.photoFileUrl,
              idCardFileUrl: item.idCardFileUrl && item.idCardFileUrl !== "-" ? item.idCardFileUrl : existingApp.idCardFileUrl,
              studentCardFileUrl: item.studentCardFileUrl && item.studentCardFileUrl !== "-" ? item.studentCardFileUrl : existingApp.studentCardFileUrl,
              studentCertFileUrl: item.studentCertFileUrl && item.studentCertFileUrl !== "-" ? item.studentCertFileUrl : existingApp.studentCertFileUrl,
              fitnessTestFileUrl: item.fitnessTestFileUrl && item.fitnessTestFileUrl !== "-" ? item.fitnessTestFileUrl : existingApp.fitnessTestFileUrl,
            },
          });

          await tx.statusHistory.create({
            data: {
              applicationId: existingApp.id,
              status: "SUBMITTED",
              label: "อัปเดตรายชื่อโดยเจ้าหน้าที่ รอพิจารณา",
              by: session.id,
            },
          });
        } else {
          const createdApp = await tx.application.create({
            data: {
              userId: user.id,
              competitionId: options.competitionId,
              sport: item.sport,
              category: item.category,
              division: item.division,
              status: "SUBMITTED",
              photoFileUrl: item.photoFileUrl || "-",
              idCardFileUrl: item.idCardFileUrl || "-",
              studentCardFileUrl: item.studentCardFileUrl || "-",
              studentCertFileUrl: item.studentCertFileUrl || "-",
              upAcademyFileUrl: item.upAcademyFileUrl || "-",
              fitnessTestFileUrl: item.fitnessTestFileUrl || "-",
              statusHistory: {
                create: {
                  status: "SUBMITTED",
                  label: "นำเข้ารายชื่อโดยเจ้าหน้าที่ รอพิจารณา",
                  by: session.id,
                },
              },
            },
          });
          appRecordId = createdApp.id;
        }



        return { appRecordId, isUpdated };
      });

      if (result.isUpdated) {
        updatedCount++;
      } else {
        createdCount++;
      }
      processedIds.push(result.appRecordId);
    } catch (err: unknown) {
      console.error(`Error importing row #${i + 1} (${item.studentId}):`, err);
      errors.push(`แถวที่ ${i + 1} (${item.studentId}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    message: `นำเข้ารายชื่อนักกีฬาเรียบร้อย (${createdCount} รายการใหม่, ${updatedCount} อัปเดต, ${errors.length} ล้มเหลว)`,
    competitionName: competition.name,
    totalProcessed: itemsToProcess.length,
    createdCount,
    updatedCount,
    errorCount: errors.length,
    errors,
    applicationIds: processedIds,
  };
}
