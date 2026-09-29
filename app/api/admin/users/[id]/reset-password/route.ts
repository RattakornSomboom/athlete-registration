import { api, body } from "@/lib/phase4-server";
import { resetAccountPassword } from "@/lib/admin-password-reset";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return api(request, ["ADMIN"], async session => resetAccountPassword(session.id, (await context.params).id, "USER", await body(request)));
}
