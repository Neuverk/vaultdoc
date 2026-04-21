import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  if (!dbUser?.tenantId) {
    return NextResponse.json({ error: 'No billing account found.' }, { status: 400 })
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, dbUser.tenantId),
  })

  const stripeCustomerId = tenant?.stripeCustomerId

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found.' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
