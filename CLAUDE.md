# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Push Drizzle schema changes to Neon (uses .env.local)
npm run db:studio    # Open Drizzle Studio visual DB browser
```

No test suite is configured. Type-check with `npx tsc --noEmit`.

## Architecture

**VaultDoc** is an AI-powered compliance documentation SaaS. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.

### Auth & Tenancy
- Clerk handles all auth (email, Google, Microsoft Entra). `middleware.ts` protects all routes except `/`, `/sign-in`, `/sign-up`.
- Every user belongs to a **tenant** (company). All data is tenant-scoped. Resolve the current user's tenant via `users.clerkId` → `users.tenantId` → `tenants`.
- Role hierarchy: `superadmin` > `admin` > `manager` > `author` > `viewer`.

### Database
- Neon Postgres (EU Frankfurt), managed with Drizzle ORM.
- Schema in `lib/db/schema.ts`: `tenants`, `users`, `documents`, `approvals`, `audit_logs`.
- DB client: `lib/db/index.ts` — import as `import { db } from '@/lib/db'`.
- After schema changes run `npm run db:push` (not migrations — push-based workflow).

### AI Document Generation
- Two-step flow: **chat** (`POST /api/documents/chat`) gathers metadata via Claude, then **generate** (`POST /api/documents/generate`) produces the full document.
- Both routes use `@anthropic-ai/sdk` directly (not the Vercel AI SDK).
- Input is sanitized against prompt injection in `sanitizeField()` before being sent to Claude.
- Current model: `claude-sonnet-4-20250514`.

### Rate Limiting
- `lib/rate-limit.ts` wraps Upstash Redis (`@upstash/ratelimit`).
- In development without Upstash env vars, rate limiting is disabled (fail-open). In production without them, it fails closed (blocks all requests).
- Per-plan limits are defined in `lib/plans.ts`; per-feature limits are set inline in each route.

### Plan Enforcement
- `lib/plans.ts` defines plan tiers (`free`, `starter`, `enterprise`) and their limits.
- `lib/plan-limits.ts` exposes `canCreateDocument()` — always call this before creating a document.

### Audit Logging
- `lib/audit.ts` exports `createAuditLog()`. Call it for every write operation (document create/update/approve/publish, billing events, auth events).
- Logs are immutable rows in `audit_logs`; never update or delete them.

### Stripe
- Subscription data (customer ID, subscription ID, price ID, status) is stored on the `tenants` row.
- Webhook handler: `POST /api/stripe/webhook` — keep this route unprotected by Clerk.
- Checkout: `POST /api/stripe/checkout`.

### Key environment variables
```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY / STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_FREE / STRIPE_PRICE_STARTER / STRIPE_PRICE_ENTERPRISE
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
```
