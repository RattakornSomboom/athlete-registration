import { api, STAFF } from "@/lib/phase4-server";
import { analyticsData, analyticsFilters } from "@/lib/analytics-server";
export async function GET(request: Request) {
  return api(request, STAFF, async () => analyticsData(analyticsFilters(Object.fromEntries(new URL(request.url).searchParams))));
}

