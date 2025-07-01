// src/app/layout.tsx
import { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/provider'


export const metadata: Metadata = {
  title: 'Community Support Network',
  description: 'Connect helpers with those in need',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}