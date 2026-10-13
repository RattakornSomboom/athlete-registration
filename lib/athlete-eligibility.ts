import { ensure } from "@/lib/phase4-server";
import { checkAthleteEligibility, countParticipationForLevel } from "@/lib/rule-checker";

export type EligibilityProfile = {
  birthDate: Date;
  year?: string | null;
  semester?: string | null;
  gpaSemester?: string | null;
  gpaCumulative?: string | null;
  studentLevel: string;
  participateCountBachelor?: number | null;
  participateCountMaster?: number | null;
  participateCountPhd?: number | null;
};

export function assertAthleteEligibility(
  profile: EligibilityProfile | null | undefined,
  quota: { ageLimit: number | null; maxStarters: number; maxSubstitutes: number } | null | undefined,
  competitionYear: number,
  declaredCount = 0, // declared previous entries for the applicant's current level only
) {
  ensure(profile, "ไม่พบประวัตินักกีฬา");
  ensure(quota, "กรุณากำหนดโควตากีฬาก่อน", 409);
  ensure([quota.maxStarters, quota.maxSubstitutes].every(value => Number.isSafeInteger(value) && value >= 0), "โควตากีฬาไม่ถูกต้อง", 409);
  ensure(quota.ageLimit === null || (Number.isInteger(quota.ageLimit) && quota.ageLimit > 0 && quota.ageLimit <= 28), "เกณฑ์อายุกีฬาไม่ถูกต้อง", 409);
  ensure(["BACHELOR", "GRADUATE"].includes(profile.studentLevel), "ระดับการศึกษาไม่ถูกต้อง");
  const profileCount = countParticipationForLevel({ bachelor: profile.participateCountBachelor, master: profile.participateCountMaster, phd: profile.participateCountPhd }, profile.studentLevel);
  const counts = [profile.participateCountBachelor ?? 0, profile.participateCountMaster ?? 0, profile.participateCountPhd ?? 0];
  ensure([...counts, declaredCount].every(value => Number.isSafeInteger(value) && value >= 0), "จำนวนครั้งที่เข้าร่วมไม่ถูกต้อง");
  const previousParticipationCount = Math.max(profileCount, declaredCount);
  const result = checkAthleteEligibility({
    birthDate: profile.birthDate,
    competitionYear,
    year: profile.year,
    semester: profile.semester,
    gpaSemester: profile.gpaSemester,
    gpaCumulative: profile.gpaCumulative,
    studentLevel: profile.studentLevel,
    participationCount: previousParticipationCount,
    ageLimit: quota.ageLimit ?? 28,
  });
  ensure(result.isEligible, result.message);
  return result;
}
