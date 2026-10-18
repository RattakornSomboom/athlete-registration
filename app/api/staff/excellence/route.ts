import { api, ApiError, body, STAFF } from "@/lib/phase4-server";
import { saveAthleteActionPlan, saveAthleteFollowUpRetest, saveSportBenchmark } from "@/lib/performance-service";
import { PerformanceValidationError } from "@/lib/performance-validation";

export async function POST(request: Request) {
  return api(request, STAFF, async session => {
    try {
      const payload = await body(request);
      if (payload.action === "savePlan") return await saveAthleteActionPlan(payload, session.id);
      if (payload.action === "saveRetest") return await saveAthleteFollowUpRetest(payload, session.id);
      if (payload.action === "saveBenchmark") return await saveSportBenchmark(payload);
      throw new ApiError(400, "ไม่พบประเภทข้อมูลที่ต้องการบันทึก");
    } catch (error) {
      if (error instanceof PerformanceValidationError) throw new ApiError(error.status, error.message, error.details);
      throw error;
    }
  });
}
