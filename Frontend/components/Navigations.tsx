// components/Navigation.tsx
import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              href="/seeker"
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
            >
              Need Help
            </Link>
            <Link
              href="/helper"
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-green-600"
            >
              Offer Help
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}