import { PATCH as updateHandler } from "../route";

type Context = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/users/[id]/status
 * Dedicated endpoint for activating/suspending account status.
 */
export async function PATCH(request: Request, context: Context) {
  return updateHandler(request, context);
}
