import { api, body, STAFF } from "@/lib/phase4-server";
import { savePlan, withValidation } from "@/lib/excellence-service";
import { validatePlanInput } from "@/lib/excellence-validation";

// POST /api/staff/excellence/plans — สร้างหรือแก้แผนพัฒนา (ต้องส่ง revision ล่าสุด)
export async function POST(request: Request) {
  return api(request, STAFF, async session => withValidation(async () => savePlan(validatePlanInput(await body(request)), session.id)));
}
