import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbOk = false
  try {
    await db.execute(sql`SELECT 1`)
    dbOk = true
  } catch {
    // db unreachable
  }

  const status = dbOk ? 'ok' : 'degraded'
  return NextResponse.json(
    { status, db: dbOk ? 'ok' : 'unreachable' },
    { status: dbOk ? 200 : 503 },
  )
}
