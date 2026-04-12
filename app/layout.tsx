import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vaultdoc — AI Compliance Documentation',
  description: 'AI-powered compliance documentation platform by Neuverk',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      <html lang="en" className="h-full bg-white">
        <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}