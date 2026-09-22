import { MOCK_MODE } from '@/lib/mock-mode'
import Link from 'next/link'
export default function DemoBanner() {
  if (!MOCK_MODE) return null
  return <aside className="shrink-0 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">Demo mode: Sample data and changes stay in this browser. <Link href="/auth/signin" className="font-semibold underline">Demo sign-in</Link></aside>
}
