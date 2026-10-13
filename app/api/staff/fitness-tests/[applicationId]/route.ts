import { api, body, STAFF } from "@/lib/phase4-server";
import { getFitnessCandidateDetail, recordFitnessResults } from "@/lib/fitness-service";

type RouteParams = { params: Promise<{ applicationId: string }> };

/**
 * GET /api/staff/fitness-tests/[applicationId]
 * ดูรายละเอียดผลการทดสอบสมรรถภาพของใบสมัครเฉพาะราย
 */
export async function GET(request: Request, { params }: RouteParams) {
  return api(request, STAFF, async (session) => {
    const { applicationId } = await params;
    return getFitnessCandidateDetail(session, applicationId);
  });
}

/**
 * PATCH /api/staff/fitness-tests/[applicationId]
 * อัปเดตผลการทดสอบสมรรถภาพของใบสมัครเฉพาะราย
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  return api(request, STAFF, async (session) => {
    const { applicationId } = await params;
    const data = await body(request);
    return recordFitnessResults(session, { ...data, applicationId });
  });
}
