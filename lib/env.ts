function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`[env] Required environment variable "${key}" is not set.`)
  }
  return value
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  CLERK_SECRET_KEY: requireEnv('CLERK_SECRET_KEY'),
  ANTHROPIC_API_KEY: requireEnv('ANTHROPIC_API_KEY'),
  NEXT_PUBLIC_APP_URL: requireEnv('NEXT_PUBLIC_APP_URL'),
} as const
