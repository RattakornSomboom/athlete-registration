import { api, STAFF } from "@/lib/phase4-server";
import { getHeatmap, isDemoRequest, overviewFilter, parseSport } from "@/lib/excellence-service";

// GET /api/staff/excellence/heatmap?event=&gender=&search=&demo=true — ระดับผลสมรรถภาพรายสถานีของทั้งทีม
export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const params = new URL(request.url).searchParams;
    parseSport(params);
    return getHeatmap(overviewFilter(params), isDemoRequest(params));
  });
}
