import { prisma } from "../../config/database";
import type { AuditLogInput, AuditLogQuery } from "../../types/auditLog";

export async function record(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      actorApiKeyId: input.actorApiKeyId ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      data: (input.data ?? null) as never,
    },
  });
}

export async function list(input: AuditLogQuery) {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.pageSize ?? 50, 100);

  const where: Record<string, unknown> = {};
  if (input.actorUserId) where.actorUserId = input.actorUserId;
  if (input.action) where.action = input.action;
  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.createdAfter || input.createdBefore) {
    where.createdAt = {};
    if (input.createdAfter) (where.createdAt as Record<string, unknown>).gte = new Date(input.createdAfter);
    if (input.createdBefore) (where.createdAt as Record<string, unknown>).lte = new Date(input.createdBefore);
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, pageSize };
}