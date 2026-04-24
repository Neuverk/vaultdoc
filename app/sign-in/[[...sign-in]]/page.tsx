import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="mb-6 inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              VaultDoc workspace
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              Welcome back
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">
              Sign in to continue managing your compliance documentation,
              billing, and AI-generated audit-ready documents.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  AI-powered documentation
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  SOPs, policies, runbooks, and risk documents in seconds
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  GDPR-first workspace
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Built for EU compliance and enterprise trust
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/dashboard"
                forceRedirectUrl="/dashboard"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}