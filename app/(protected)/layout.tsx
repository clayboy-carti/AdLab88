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
      {/* h-screen + overflow-y-auto makes main the real scroll container so sticky positioning works */}
      <main className="ml-16 lg:ml-[240px] flex-1 h-screen overflow-y-auto min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
