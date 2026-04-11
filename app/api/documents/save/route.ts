import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { documents, users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const { title, type, department, frameworks, content,
    scope, purpose, tools, tone, language, confidentiality } = body

  try {
    // Get or create tenant
    let tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, 'default'),
    })

    if (!tenant) {
      const [newTenant] = await db.insert(tenants).values({
        name: 'My Organisation',
        slug: 'default',
        plan: 'free',
      }).returning()
      tenant = newTenant
    }

    // Get or create user
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      const [newUser] = await db.insert(users).values({
        clerkId: userId,
        tenantId: tenant.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        role: 'admin',
      }).returning()
      user = newUser
    }

    // Save document
    const [doc] = await db.insert(documents).values({
      tenantId: tenant.id,
      createdBy: user.id,
      title,
      type,
      department,
      frameworks,
      content,
      scope,
      purpose,
      language,
      confidentiality,
      status: 'draft',
      version: '1.0',
    }).returning()

    return new Response(JSON.stringify({ success: true, id: doc.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Save error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}