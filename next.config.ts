import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@neondatabase/serverless'],
}

export default withSentryConfig(nextConfig, {
  silent: true,
  // Source map upload is skipped when SENTRY_AUTH_TOKEN is unset.
  // Set SENTRY_ORG and SENTRY_PROJECT to enable it.
})
