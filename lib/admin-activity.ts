import { db } from '@/lib/db'
import { adminActivityLogs } from '@/lib/db/schema'

type LogAdminActivityInput = {
  action: string
  targetType: 'beta_request' | 'user' | 'tenant' | 'document'
  targetId?: string
  targetEmail?: string
  adminEmail?: string | null
  note?: string | null
  metadata?: Record<string, unknown>
}

export async function logAdminActivity(input: LogAdminActivityInput): Promise<void> {
  try {
    await db.insert(adminActivityLogs).values({
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      targetEmail: input.targetEmail ?? null,
      adminEmail: input.adminEmail ?? null,
      note: input.note ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    })
  } catch (err) {
    // Non-fatal — never let activity logging break the main flow
    console.error('[admin-activity] Failed to log:', err)
  }
}
