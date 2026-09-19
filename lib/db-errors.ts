// Prisma can surface PostgreSQL commit conflicts directly through its driver adapter.
export function isDatabaseConflict(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 4) return false;
  const e = error as Record<string, unknown>;
  if (["P2002", "P2034", "40001", "40P01", "23505"].includes(String(e.code ?? e.originalCode))) return true;
  if (e.kind === "TransactionWriteConflict") return true;
  const meta = e.meta && typeof e.meta === "object" ? e.meta as Record<string, unknown> : null;
  return isDatabaseConflict(e.cause, depth + 1) || isDatabaseConflict(meta?.driverAdapterError, depth + 1);
}

