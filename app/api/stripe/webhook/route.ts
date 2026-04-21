import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { tenants, stripeEvents } from '@/lib/db/schema'
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
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
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

  // Idempotency: skip events already processed
  const alreadyProcessed = await db.query.stripeEvents.findFirst({
    where: eq(stripeEvents.id, event.id),
  })
  if (alreadyProcessed) {
    return NextResponse.json({ received: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenantId
      const customerId =
        typeof session.customer === 'string' ? session.customer : null

      if (tenantId && customerId) {
        // Safety net: persist stripeCustomerId if the checkout route's DB write failed
        await db
          .update(tenants)
          .set({ stripeCustomerId: customerId })
          .where(eq(tenants.id, tenantId))
      } else {
        console.error(
          `[webhook] checkout.session.completed missing tenantId or customerId — session ${session.id}`,
        )
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const tenantId = subscription.metadata?.tenantId

      if (tenantId) {
        await updateTenantSubscription(tenantId, subscription)
      } else {
        console.error(
          `[webhook] ${event.type} missing tenantId in metadata — subscription ${subscription.id}`,
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
          `[webhook] ${event.type} missing tenantId in metadata — subscription ${subscription.id}`,
        )
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : null

      if (customerId) {
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.stripeCustomerId, customerId),
        })

        if (tenant) {
          await db
            .update(tenants)
            .set({ stripeSubscriptionStatus: 'past_due' })
            .where(eq(tenants.id, tenant.id))

          await createAuditLog({
            tenantId: tenant.id,
            userId: null,
            action: 'payment_failed',
            resourceType: 'billing',
            resourceId: tenant.id,
            metadata: {
              stripeEvent: 'invoice.payment_failed',
              invoiceId: invoice.id,
              customerId,
            },
          })
        }
      }
      break
    }

    default:
      break
  }

  // Mark event processed — ON CONFLICT DO NOTHING handles rare duplicate-request races
  await db.insert(stripeEvents).values({ id: event.id }).onConflictDoNothing()

  return NextResponse.json({ received: true })
}
