import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateTenantSubscription(
  tenantId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id;

  // Map Stripe price ID → plan name
  const planMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
  };

  const plan = planMap[priceId] ?? 'free';

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
    .where(eq(tenants.id, tenantId));
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const subscription = event.data.object as Stripe.Subscription;
  const tenantId = subscription.metadata?.tenantId;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      if (tenantId) await updateTenantSubscription(tenantId, subscription);
      break;

    case 'customer.subscription.deleted':
      if (tenantId) {
        await db
          .update(tenants)
          .set({
            plan: 'free',
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            stripeSubscriptionStatus: 'canceled',
          })
          .where(eq(tenants.id, tenantId));
      }
      break;
  }

  return NextResponse.json({ received: true });
}