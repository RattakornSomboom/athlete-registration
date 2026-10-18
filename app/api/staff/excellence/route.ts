import { api, STAFF } from "@/lib/phase4-server";
import { getOverview, isDemoRequest, overviewFilter } from "@/lib/excellence-service";

// GET /api/staff/excellence?event=&gender=&search=&demo=true — ภาพรวมนักกีฬากรีฑาประเภทลู่
export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const params = new URL(request.url).searchParams;
    return getOverview(overviewFilter(params), isDemoRequest(params));
  });
}
