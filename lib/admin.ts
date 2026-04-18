export function isPlatformAdmin(email?: string | null) {
  if (!email) return false

  const allowed = [
    'baijuamal97@gmail.com', // <-- change this
  ]

  return allowed.includes(email.toLowerCase())
}