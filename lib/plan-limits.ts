import { db } from '@/lib/db';
import { documents, tenants } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { PLANS, PlanType } from '@/lib/plans';

export async function getTenantPlan(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return tenant;
}

export async function canCreateDocument(tenantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  limit: number;
  plan: PlanType;
}> {
  const tenant = await getTenantPlan(tenantId);
  const plan = (tenant?.plan ?? 'free') as PlanType;
  const limits = PLANS[plan];

  const [{ value: currentCount }] = await db
    .select({ value: count() })
    .from(documents)
    .where(eq(documents.tenantId, tenantId));

  const limit = limits.maxDocuments === Infinity ? 999999 : limits.maxDocuments;
  const allowed = limits.maxDocuments === Infinity || currentCount < limits.maxDocuments;

  return {
    allowed,
    reason: allowed ? undefined : `Free plan limit reached (${limit} documents max)`,
    currentCount,
    limit,
    plan,
  };
}