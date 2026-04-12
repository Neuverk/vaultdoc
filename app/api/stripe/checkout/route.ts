import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { PLANS, PlanType } from '@/lib/plans'
import { db } from '@/lib/db'
import { tenants, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await req.json() as { plan: PlanType }
    if (!plan || plan === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress

    // Look up user → tenant (same pattern as billing page)
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId!),
    })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const priceId = PLANS[plan].priceId
    if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 500 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // Create or reuse Stripe customer
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { tenantId: tenant.id, userId },
      })
      customerId = customer.id

      await db.update(tenants).set({ stripeCustomerId: customerId }).where(eq(tenants.id, tenant.id))
    }

    // If already subscribed → billing portal
    if (tenant.stripeSubscriptionId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/dashboard/billing`,
      })
      return NextResponse.json({ url: portalSession.url })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
      metadata: { tenantId: tenant.id, userId, plan },
      subscription_data: {
        metadata: { tenantId: tenant.id, userId, plan },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}