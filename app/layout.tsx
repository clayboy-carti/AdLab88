import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AdLab88',
  description: 'AI-powered advertising creative generation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
