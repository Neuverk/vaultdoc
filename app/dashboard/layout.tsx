import Navbar from '@/components/navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        {children}
      </main>
    </div>
  )
}