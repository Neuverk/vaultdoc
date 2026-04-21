const PLATFORM_ADMIN_EMAILS: ReadonlySet<string> = new Set(
  [
    ...(process.env.PLATFORM_ADMIN_EMAILS ?? '').split(','),
    ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
  ]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
)

export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) return false
  return PLATFORM_ADMIN_EMAILS.has(email.toLowerCase())
}
