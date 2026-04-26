import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { tenants, stripeEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/lib/audit'
import { resend, FROM_EMAIL } from '@/lib/resend'

// NEW: structured logger — every log line is parseable JSON
function log(fields: {
  eventType: string
  tenantId?: string | null
  status: 'ok' | 'skip' | 'warn' | 'error'
  error?: unknown
  [key: string]: unknown
}) {
  const entry = {
    ts: new Date().toISOString(),
    action: 'stripe_webhook',
    ...fields,
    ...(fields.error != null ? { error: String(fields.error) } : {}),
  }
  if (fields.status === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

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
  // NEW: guard required env vars — fail fast with a clear message
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error(JSON.stringify({ action: 'stripe_webhook', status: 'error', error: 'STRIPE_WEBHOOK_SECRET is not configured' }))
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  // NEW: return 400 safely on any parse/signature failure
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    log({ eventType: 'unknown', status: 'error', error: err, note: 'signature verification failed' })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency: skip events already processed
  const alreadyProcessed = await db.query.stripeEvents.findFirst({
    where: eq(stripeEvents.id, event.id),
  })
  if (alreadyProcessed) {
    log({ eventType: event.type, status: 'skip', eventId: event.id })
    return NextResponse.json({ received: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenantId
      const customerId =
        typeof session.customer === 'string' ? session.customer : null

      if (tenantId && customerId) {
        // Existing: persist stripeCustomerId so it's always in sync
        await db
          .update(tenants)
          .set({ stripeCustomerId: customerId })
          .where(eq(tenants.id, tenantId))

        // NEW: immediately apply subscription plan — do not wait for
        // customer.subscription.created which may arrive later or be missed
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : null

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await updateTenantSubscription(tenantId, subscription)
          log({ eventType: event.type, tenantId, status: 'ok', subscriptionId })
        } else {
          // One-time payment or setup session — no subscription to apply
          log({ eventType: event.type, tenantId, status: 'warn', sessionId: session.id, note: 'no subscription on session' })
        }
      } else {
        log({ eventType: event.type, tenantId: tenantId ?? null, status: 'error', sessionId: session.id, note: 'missing tenantId or customerId in metadata' })
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const tenantId = subscription.metadata?.tenantId

      if (tenantId) {
        await updateTenantSubscription(tenantId, subscription)
        log({ eventType: event.type, tenantId, status: 'ok', subscriptionId: subscription.id })
      } else {
        log({ eventType: event.type, tenantId: null, status: 'error', subscriptionId: subscription.id, note: 'missing tenantId in subscription metadata' })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const tenantId = subscription.metadata?.tenantId

      if (tenantId) {
        await cancelTenantSubscription(tenantId, subscription)
        log({ eventType: event.type, tenantId, status: 'ok', subscriptionId: subscription.id })
      } else {
        log({ eventType: event.type, tenantId: null, status: 'error', subscriptionId: subscription.id, note: 'missing tenantId in subscription metadata' })
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

          // NEW: notify the customer — fire-and-forget, DB is already updated
          const customerEmail = invoice.customer_email
          if (customerEmail) {
            const hostedUrl = invoice.hosted_invoice_url
            resend.emails
              .send({
                from: FROM_EMAIL,
                to: customerEmail,
                subject: 'Action required: VaultDoc payment failed',
                html: `
                  <p>Hi,</p>
                  <p>
                    We were unable to process your VaultDoc subscription payment.
                    Your account remains active while we retry, but please update
                    your payment method to avoid any interruption.
                  </p>
                  ${hostedUrl ? `
                  <p style="margin:24px 0">
                    <a href="${hostedUrl}" style="background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
                      Update payment method →
                    </a>
                  </p>` : ''}
                  <p>If you have any questions, reply to this email and we'll help you out.</p>
                  <p>— The VaultDoc team</p>
                `,
              })
              .catch((err) =>
                log({ eventType: event.type, tenantId: tenant.id, status: 'error', error: err, note: 'payment_failed email delivery failed' }),
              )
          }

          log({ eventType: event.type, tenantId: tenant.id, status: 'ok', invoiceId: invoice.id, emailSent: Boolean(customerEmail) })
        } else {
          log({ eventType: event.type, tenantId: null, status: 'warn', customerId, note: 'tenant not found for this Stripe customer' })
        }
      }
      break
    }

    // NEW: EU SCA / 3DS — customer must authenticate, not a payment failure.
    // Log and return 200 so Stripe does not retry unnecessarily.
    case 'payment_intent.requires_action': {
      const pi = event.data.object as Stripe.PaymentIntent
      log({ eventType: event.type, tenantId: null, status: 'warn', paymentIntentId: pi.id, note: 'EU SCA: customer action required' })
      break
    }

    case 'invoice.payment_action_required': {
      const invoice = event.data.object as Stripe.Invoice
      log({ eventType: event.type, tenantId: null, status: 'warn', invoiceId: invoice.id, note: 'EU SCA: 3DS authentication required' })
      break
    }

    default:
      break
  }

  // Mark event processed — onConflictDoNothing handles rare concurrent-delivery races
  await db.insert(stripeEvents).values({ id: event.id }).onConflictDoNothing()

  return NextResponse.json({ received: true })
}
