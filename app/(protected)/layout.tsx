import Sidebar from '@/components/ui/Sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <Sidebar />
      {/* ml matches sidebar width at each breakpoint; min-w-0 prevents flex overflow */}
      <main className="ml-16 lg:ml-[280px] flex-1 min-h-screen min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
