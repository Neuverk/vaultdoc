import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

type AuditResourceType = 'document' | 'user' | 'tenant' | 'billing' | 'auth'

type AuditInput = {
  tenantId: string
  userId?: string | null
  action: string
  resourceType: AuditResourceType
  resourceId?: string | null
  metadata?: Record<string, unknown> | null
}

export async function createAuditLog({
  tenantId,
  userId,
  action,
  resourceType,
  resourceId,
  metadata,
}: AuditInput) {
  try {
    await db.insert(auditLogs).values({
      tenantId,
      userId: userId ?? null,
      action,
      resourceType,
      resourceId: resourceId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (error) {
    console.error('Failed to create audit log:', String(error))
  }
}