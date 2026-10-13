import { api, body, STAFF } from "@/lib/phase4-server";
import { listFitnessCandidates, recordFitnessResults, type FitnessCandidateQuery } from "@/lib/fitness-service";

/**
 * GET /api/staff/fitness-tests
 * เจ้าหน้าที่/แอดมินดึงรายชื่อนักกีฬาที่ต้องรับการทดสอบสมรรถภาพ
 */
export async function GET(request: Request) {
  return api(request, STAFF, async (session) => {
    const { searchParams } = new URL(request.url);
    const query: FitnessCandidateQuery = {
      competitionId: searchParams.get("competitionId") || undefined,
      sport: searchParams.get("sport") || undefined,
      clubId: searchParams.get("clubId") || undefined,
      fitnessStatus: (searchParams.get("fitnessStatus") as FitnessCandidateQuery["fitnessStatus"]) || "ALL",
      squadType: (searchParams.get("squadType") as FitnessCandidateQuery["squadType"]) || undefined,
      applicationStatus: searchParams.get("applicationStatus") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    };
    return listFitnessCandidates(session, query);
  });
}

/**
 * POST /api/staff/fitness-tests
 * บันทึกผลการทดสอบสมรรถภาพ (รองรับทั้งรายคนและแบบชุด items: [...])
 */
export async function POST(request: Request) {
  return api(request, STAFF, async (session) => {
    const data = await body(request);
    return recordFitnessResults(session, data);
  });
}
