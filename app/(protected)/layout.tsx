import Sidebar from '@/components/ui/Sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-[280px] flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
