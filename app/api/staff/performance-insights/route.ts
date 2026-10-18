import { api, STAFF } from "@/lib/phase4-server";
import { getPerformanceInsights } from "@/lib/performance-service";

export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId") || undefined;
    const sport = searchParams.get("sport") || undefined;
    const search = searchParams.get("search") || undefined;
    const includeDemo = searchParams.get("includeDemo") === "true";

    return getPerformanceInsights({
      competitionId,
      sport,
      search,
      includeDemo,
    });
  });
}
