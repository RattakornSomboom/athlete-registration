import { api, body } from "@/lib/phase4-server";
import { getEvidenceReview, recordEvidenceCheck } from "@/lib/evidence-verification-service";

type RouteParams = { params: Promise<{ id: string }> };
const REVIEWERS = ["STAFF", "ADMIN", "CLUB"] as const;

/** GET /api/staff/applications/[id]/evidence — สถานะการตรวจหลักฐานรายรายการ */
export async function GET(request: Request, { params }: RouteParams) {
  return api(request, REVIEWERS, async (session) => getEvidenceReview(session, (await params).id));
}

/** POST /api/staff/applications/[id]/evidence — บันทึกผลตรวจหลักฐานรายรายการ (STAFF/ADMIN หรือชมรมเจ้าของกีฬา) */
export async function POST(request: Request, { params }: RouteParams) {
  return api(request, REVIEWERS, async (session) => recordEvidenceCheck(session, (await params).id, await body(request)));
}
