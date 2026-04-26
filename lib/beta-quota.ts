import { and, eq, isNull, lt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { sql } from 'drizzle-orm'

export const BETA_DEFAULT_LIMIT = 25

export async function getBetaUsageStatus(tenantId: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      documentQuotaUsed: true,
      betaDocumentLimit: true,
      betaLimitReachedAt: true,
      betaLimitEmailSentAt: true,
    },
  })
  if (!tenant) return null

  const used = tenant.documentQuotaUsed
  const limit = tenant.betaDocumentLimit
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    isAtLimit: used >= limit,
    limitReachedAt: tenant.betaLimitReachedAt,
    emailSentAt: tenant.betaLimitEmailSentAt,
  }
}

// Read-only pre-check — call before expensive AI operations. Does not increment.
export async function canCreateBetaDocument(tenantId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  remaining: number
}> {
  const status = await getBetaUsageStatus(tenantId)
  if (!status) {
    return { allowed: false, used: 0, limit: BETA_DEFAULT_LIMIT, remaining: 0 }
  }
  return {
    allowed: !status.isAtLimit,
    used: status.used,
    limit: status.limit,
    remaining: status.remaining,
  }
}

// Atomic check-and-increment. Returns success:false when quota is already full.
// Triggers the one-time limit-reached email when the tenant first hits their cap.
export async function claimBetaDocumentSlot(
  tenantId: string,
  tenantEmail?: string | null,
): Promise<{ success: boolean; used: number; limit: number }> {
  const [result] = await db
    .update(tenants)
    .set({ documentQuotaUsed: sql`${tenants.documentQuotaUsed} + 1` })
    .where(
      and(
        eq(tenants.id, tenantId),
        lt(tenants.documentQuotaUsed, tenants.betaDocumentLimit),
      ),
    )
    .returning({
      used: tenants.documentQuotaUsed,
      limit: tenants.betaDocumentLimit,
      limitReachedAt: tenants.betaLimitReachedAt,
      emailSentAt: tenants.betaLimitEmailSentAt,
    })

  if (!result) {
    const status = await getBetaUsageStatus(tenantId)
    return {
      success: false,
      used: status?.used ?? 0,
      limit: status?.limit ?? BETA_DEFAULT_LIMIT,
    }
  }

  // If the slot we just claimed is the last one, record when the limit was reached
  // and send the one-time notification email.
  if (result.used >= result.limit) {
    if (!result.limitReachedAt) {
      await db
        .update(tenants)
        .set({ betaLimitReachedAt: new Date() })
        .where(and(eq(tenants.id, tenantId), isNull(tenants.betaLimitReachedAt)))
        .catch((err) => console.error('[beta-quota] betaLimitReachedAt update failed:', err))
    }

    if (!result.emailSentAt && tenantEmail) {
      // Mark email sent before dispatching to prevent duplicates on retry
      db.update(tenants)
        .set({ betaLimitEmailSentAt: new Date() })
        .where(and(eq(tenants.id, tenantId), isNull(tenants.betaLimitEmailSentAt)))
        .then(() =>
          resend.emails
            .send({
              from: FROM_EMAIL,
              to: tenantEmail,
              subject: 'VaultDoc beta document limit reached',
              html: `
                <p>Hi,</p>
                <p>
                  You have reached your current beta document limit for VaultDoc.
                  You can still view and export all existing documents.
                </p>
                <p>
                  If you need more access, please reply to this email or contact
                  VaultDoc support and we can review your account.
                </p>
                <p>— The VaultDoc team</p>
              `,
            })
            .catch((err) => console.error('[beta-quota] limit email send failed:', err)),
        )
        .catch((err) => console.error('[beta-quota] betaLimitEmailSentAt update failed:', err))
    }
  }

  return { success: true, used: result.used, limit: result.limit }
}
