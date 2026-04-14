# VaultDoc

AI-powered compliance documentation platform built for enterprise teams.

VaultDoc helps IT, security, compliance, HR, finance, and operations teams generate professional SOPs, policies, runbooks, risk assessments, and audit-ready documentation aligned to major frameworks.

Live: https://vaultdoc.neuverk.com

---

## Core Features

- AI-powered document generation
- Guided follow-up interview workflow
- Multi-framework support
- Document library
- Live markdown editor + preview
- PDF and Word export
- Multi-tenant document isolation
- Stripe subscription plans
- GDPR legal pages
- Audit logging
- Security hardening
- Rate limiting
- Input sanitization

---

## Supported Frameworks

- ISO 27001:2022
- TISAX
- ITIL v4
- SOC 2
- GDPR
- NIST CSF 2.0
- NIS2
- DORA
- ISO 9001
- ISO 22301
- PCI-DSS
- HIPAA

---

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Neon PostgreSQL (Frankfurt EU)
- Drizzle ORM
- Anthropic Claude API
- Stripe
- Vercel

---

## Environment Variables

Create `.env.local`

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

ANTHROPIC_API_KEY=

NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

STRIPE_PRICE_FREE=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_ENTERPRISE=