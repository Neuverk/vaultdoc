import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/lib/audit'

function getPlanFromPriceId(priceId?: string | null) {
  const planMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
  }

  return priceId ? planMap[priceId] ?? 'free' : 'free'
}

async function updateTenantSubscription(
  tenantId: string,
  subscription: Stripe.Subscription,
) {
  const priceId = subscription.items.data[0]?.price.id ?? null
  const plan = getPlanFromPriceId(priceId)

  await db
    .update(tenants)
    .set({
      plan,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
      stripeSubscriptionStatus: subscription.status,
    })
    .where(eq(tenants.id, tenantId))

  await createAuditLog({
    tenantId,
    userId: null,
    action: 'plan_upgraded',
    resourceType: 'billing',
    resourceId: tenantId,
    metadata: {
      stripeEvent: 'customer.subscription.created_or_updated',
      subscriptionId: subscription.id,
      priceId,
      plan,
      status: subscription.status,
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id,
    },
  })
}

async function cancelTenantSubscription(
  tenantId: string,
  subscription: Stripe.Subscription,
) {
  await db
    .update(tenants)
    .set({
      plan: 'free',
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      stripeSubscriptionStatus: 'canceled',
    })
    .where(eq(tenants.id, tenantId))

  await createAuditLog({
    tenantId,
    userId: null,
    action: 'subscription_canceled',
    resourceType: 'billing',
    resourceId: tenantId,
    metadata: {
      stripeEvent: 'customer.subscription.deleted',
      subscriptionId: subscription.id,
      previousPriceId: subscription.items.data[0]?.price.id ?? null,
      resultingPlan: 'free',
      status: subscription.status,
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id,
    },
  })
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 },
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const tenantId = subscription.metadata?.tenantId

      if (tenantId) {
        await updateTenantSubscription(tenantId, subscription)
      } else {
        console.error(
          `Stripe webhook ${event.type} missing tenantId in metadata for subscription ${subscription.id}`,
        )
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const tenantId = subscription.metadata?.tenantId

      if (tenantId) {
        await cancelTenantSubscription(tenantId, subscription)
      } else {
        console.error(
          `Stripe webhook ${event.type} missing tenantId in metadata for subscription ${subscription.id}`,
        )
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}