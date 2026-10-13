import { PATCH as updateHandler } from "../route";

type Context = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/users/[id]/role
 * Dedicated endpoint for changing user role.
 */
export async function PATCH(request: Request, context: Context) {
  return updateHandler(request, context);
}
