import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SENSITIVE_KEY_PATTERN = /password|secret|token|hash|authorization|cookie/i;

function sanitizeAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = sanitizeAuditValue(v);
      }
    }
    return out;
  }
  return value;
}

export async function recordAuditLog(
  input: {
    actorId?: string | null;
    actorRole?: Role | null;
    action: string;
    entityType: string;
    entityId: string;
    beforeJson?: unknown;
    afterJson?: unknown;
    ipAddress?: string | null;
  },
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;
  await db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson:
        input.beforeJson !== undefined
          ? (sanitizeAuditValue(input.beforeJson) as Prisma.InputJsonValue)
          : undefined,
      afterJson:
        input.afterJson !== undefined
          ? (sanitizeAuditValue(input.afterJson) as Prisma.InputJsonValue)
          : undefined,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
