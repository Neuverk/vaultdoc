import { pgTable, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core'

// ─── TENANTS (companies using Vaultdoc) ───────────────────
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').notNull().default('free'), // free | starter | enterprise
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#0071e3'),
  customDomain: text('custom_domain'),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end'),
  stripeSubscriptionStatus: text('stripe_subscription_status'),

  // Lifetime quota counter — never decremented on delete
  documentQuotaUsed: integer('document_quota_used').notNull().default(0),
})

// ─── USERS ────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull().default('author'), // superadmin | admin | manager | author | viewer
  department: text('department'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── DOCUMENTS ────────────────────────────────────────────
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  title: text('title').notNull(),
  docId: text('doc_id'), // e.g. IT-SOP-001
  type: text('type').notNull(), // SOP | Policy | Runbook | IR Plan etc.
  department: text('department').notNull(),
  frameworks: text('frameworks').array(), // ['ISO 27001', 'TISAX']
  status: text('status').notNull().default('draft'), // draft | review | approved | effective
  confidentiality: text('confidentiality').notNull().default('internal'),
  content: text('content'), // AI generated content
  version: text('version').default('1.0'),
  language: text('language').default('English'),
  scope: text('scope'),
  purpose: text('purpose'),
  owner: text('owner'),
  reviewer: text('reviewer'),
  reviewDate: timestamp('review_date'),
  sourceDocumentId: uuid('source_document_id'), // set when this is a revision of another document
  publishedToKb: boolean('published_to_kb').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── APPROVALS ────────────────────────────────────────────
export const approvals = pgTable('approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  requestedBy: uuid('requested_by').references(() => users.id).notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  status: text('status').notNull().default('pending'), // pending | approved | rejected
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── BETA REQUESTS ────────────────────────────────────────
export const betaRequests = pgTable('beta_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  company: text('company').notNull(),
  useCase: text('use_case'),
  status: text('status').notNull().default('pending'), // pending | approved | rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewNote: text('review_note'),
})

// ─── STRIPE EVENTS (idempotency dedup) ───────────────────
export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(), // Stripe event ID e.g. evt_...
  processedAt: timestamp('processed_at').defaultNow().notNull(),
})

// ─── AUDIT LOG ────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(), // created | updated | approved | published
  resourceType: text('resource_type').notNull(), // document | user | tenant
  resourceId: uuid('resource_id'),
  metadata: text('metadata'), // JSON string
  createdAt: timestamp('created_at').defaultNow().notNull(),
})