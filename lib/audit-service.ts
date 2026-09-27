import { json, type Tx } from "@/lib/phase4-server";
import { randomUUID } from "node:crypto";

export type AuditAction =
  | "CREATE_USER"
  | "UPDATE_USER"
  | "CHANGE_USER_ROLE"
  | "ACTIVATE_USER"
  | "SUSPEND_USER"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "ADMIN_SENT_PASSWORD_RESET";

export type AuditEvent = {
  id: string;
  actorId: string;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

/**
 * Record an audit log event atomically within a Prisma transaction.
 * Stores each event independently so concurrent transactions cannot overwrite history.
 */
export async function recordAudit(
  tx: Tx,
  data: {
    actorId: string;
    action: AuditAction | string;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
  }
): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: `audit_${randomUUID()}`,
    actorId: data.actorId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    details: data.details,
    createdAt: new Date().toISOString(),
  };

  await tx.systemSetting.create({
    data: { key: `audit_logs:${event.id}`, value: json(event) },
  });

  return event;
}
