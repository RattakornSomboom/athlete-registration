import { api, STAFF } from "@/lib/phase4-server";
import { getOverview, isDemoRequest, overviewFilter, parseSport } from "@/lib/excellence-service";

// GET /api/staff/excellence?sport=&event=&gender=&search=&demo=true — ภาพรวมนักกีฬา + รายงานผู้บริหาร (sport ว่าง = กีฬาแรกในทะเบียน)
export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const params = new URL(request.url).searchParams;
    return getOverview(overviewFilter(params), isDemoRequest(params), parseSport(params));
  });
}
