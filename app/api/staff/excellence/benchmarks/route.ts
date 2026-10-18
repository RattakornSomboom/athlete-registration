import { api, body, STAFF } from "@/lib/phase4-server";
import { getBenchmarks, isDemoRequest, saveBenchmark, withValidation } from "@/lib/excellence-service";
import { validateBenchmarkInput } from "@/lib/excellence-validation";

// GET /api/staff/excellence/benchmarks?demo=true — เป้าเวลาแยกตามรายการและเพศ
export async function GET(request: Request) {
  return api(request, STAFF, async () => getBenchmarks(isDemoRequest(new URL(request.url).searchParams)));
}

// PUT /api/staff/excellence/benchmarks — ตั้งหรือยกเลิกเป้าเวลา 1 ช่อง (targetSeconds: null = ยกเลิก)
export async function PUT(request: Request) {
  return api(request, STAFF, async session => withValidation(async () => saveBenchmark(validateBenchmarkInput(await body(request)), session.id)));
}
