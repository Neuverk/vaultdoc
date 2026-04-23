'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem =
  | { type: 'link'; label: string; href: string; icon: React.ReactNode; badge?: number }
  | { type: 'section'; label: string }

function IconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}
function IconInbox() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
function IconDoc() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function IconCard() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}
function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { type: 'link', label: 'Overview', href: '/dashboard/admin', icon: <IconGrid /> },
  { type: 'section', label: 'Management' },
  { type: 'link', label: 'Beta Requests', href: '/dashboard/admin/beta-requests', icon: <IconInbox /> },
  { type: 'link', label: 'Users', href: '/dashboard/admin/users', icon: <IconUsers /> },
  { type: 'link', label: 'Documents', href: '/dashboard/admin/documents', icon: <IconDoc /> },
  { type: 'link', label: 'Plans & Billing', href: '/dashboard/admin/billing', icon: <IconCard /> },
  { type: 'link', label: 'Organizations', href: '/dashboard/admin/organizations', icon: <IconBuilding /> },
  { type: 'section', label: 'System' },
  { type: 'link', label: 'Activity', href: '/dashboard/admin/activity', icon: <IconClock /> },
  { type: 'link', label: 'Settings', href: '/dashboard/admin/settings', icon: <IconSettings /> },
]

export function AdminNav({ pendingBetaCount }: { pendingBetaCount: number }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard/admin') return pathname === '/dashboard/admin'
    return pathname.startsWith(href)
  }

  // Inject badge into Beta Requests
  const items: NavItem[] = NAV_ITEMS.map((item) => {
    if (item.type === 'link' && item.href === '/dashboard/admin/beta-requests') {
      return { ...item, badge: pendingBetaCount }
    }
    return item
  })

  return (
    <nav className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex items-center gap-2.5 px-4 py-3.25 border-b border-gray-100">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-900">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="leading-none">
          <div className="text-[13px] font-semibold text-gray-900">Admin Center</div>
          <div className="text-[10px] text-gray-400 mt-0.5">VaultDoc</div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-px">
        {items.map((item, i) => {
          if (item.type === 'section') {
            return (
              <div key={i} className="px-2 pt-4 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {item.label}
                </span>
              </div>
            )
          }

          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2 rounded-md px-2.5 py-1.75 text-[13px] transition-colors ${
                active
                  ? 'bg-gray-900 text-white font-medium'
                  : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={`shrink-0 ${active ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className={`ml-auto inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Back to app */}
      <div className="border-t border-gray-100 px-2 py-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.75 text-[13px] font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to app
        </Link>
      </div>
    </nav>
  )
}
