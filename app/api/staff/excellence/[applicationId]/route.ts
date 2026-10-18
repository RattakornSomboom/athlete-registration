import { api, STAFF } from "@/lib/phase4-server";
import { getAthleteDetail, isDemoRequest } from "@/lib/excellence-service";

type RouteParams = { params: Promise<{ applicationId: string }> };

// GET /api/staff/excellence/{applicationId}?demo=true — รายละเอียดรายคน
export async function GET(request: Request, { params }: RouteParams) {
  return api(request, STAFF, async () => {
    const { applicationId } = await params;
    return getAthleteDetail(applicationId, isDemoRequest(new URL(request.url).searchParams));
  });
}
