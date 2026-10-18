import { api, ApiError, body, STAFF } from "@/lib/phase4-server";
import { getPerformanceInsights, saveIndividualMatchResult } from "@/lib/performance-service";
import { PerformanceValidationError } from "@/lib/performance-validation";

export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId") || undefined;
    const sport = searchParams.get("sport") || undefined;
    const search = searchParams.get("search") || undefined;
    const includeDemo = searchParams.get("includeDemo") === "true";

    const insights = await getPerformanceInsights({
      competitionId,
      sport,
      search,
      includeDemo,
    });

    const results = insights.athletes.map(a => ({
      applicationId: a.applicationId,
      studentId: a.studentId,
      athleteName: a.athleteName,
      sport: a.sport,
      competitionName: a.competitionName,
      matchResult: a.matchResult,
    }));

    return {
      results,
      count: results.length,
      isDemoData: insights.isDemoData,
    };
  });
}

export async function POST(request: Request) {
  return api(request, STAFF, async (session) => {
    try {
      const payload = await body(request);
      return await saveIndividualMatchResult(payload, session.id);
    } catch (error) {
      if (error instanceof PerformanceValidationError) {
        throw new ApiError(error.status, error.message, error.details);
      }
      throw error;
    }
  });
}
