// app/(posts)/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cameroon Community Care',
  description: 'Connect with people who need help or want to help',
}

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  )
}