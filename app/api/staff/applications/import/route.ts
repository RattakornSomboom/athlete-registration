import { api, body, STAFF } from "@/lib/phase4-server";
import { importAthleteApplications, type ImportAthleteApplicationsOptions } from "@/lib/application-import-service";

/**
 * POST /api/staff/applications/import
 * นำเข้ารายชื่อนักกีฬาจากการแข่งขัน / ไฟล์ Excel / CSV เข้าสู่ระบบโดยตรง
 * (สำหรับบทบาท STAFF / ADMIN โดยข้ามข้อจำกัดวันหมดเขตรับสมัคร)
 */
export async function POST(request: Request) {
  return api(request, STAFF, async (session) => {
    const data = await body(request);
    const options: ImportAthleteApplicationsOptions = {
      competitionId: String(data.competitionId || ""),
      items: Array.isArray(data.items) ? data.items : undefined,
      rawRows: Array.isArray(data.rawRows) ? data.rawRows : undefined,
    };
    return importAthleteApplications(session, options);
  });
}
