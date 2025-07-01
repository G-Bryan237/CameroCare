// app/page.tsx
import Logo from '@/components/logo';
import { HeartIcon as HandHeart, UserGroupIcon as Users, NewspaperIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from './api/auth/[...nextauth]/route';
import LogoutButton from '@/components/LogoutButton'; // Directly import the LogoutButton component

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo and Title only */}
      <header className="bg-white shadow-sm flex justify-between items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center space-x-4">
          <div className="w-48 sm:w-56">
            <Logo />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Cameroon Care Community
          </h1>
        </div>
        {/* Logout Button */}
        <LogoutButton />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          <Link 
            href="/helper"
            className="block h-full bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl 
                     transition-all transform hover:-translate-y-1 p-6 sm:p-8 text-center group"
          >
            <div className="h-20 sm:h-28 w-20 sm:w-28 bg-blue-100 rounded-full flex items-center 
                          justify-center mb-4 sm:mb-6 mx-auto group-hover:bg-blue-200 transition-colors"
            >
              <HandHeart className="h-10 w-10 sm:h-14 sm:w-14 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 sm:mb-4">
              I Want to Help
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Offer your support and make a difference in someone's life
            </p>
          </Link>

          <Link 
            href="/feed"
            className="block h-full bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl 
                     transition-all transform hover:-translate-y-1 p-6 sm:p-8 text-center group"
          >
            <div className="h-20 sm:h-28 w-20 sm:w-28 bg-green-100 rounded-full flex items-center 
                          justify-center mb-4 sm:mb-6 mx-auto group-hover:bg-green-200 transition-colors"
            >
              <NewspaperIcon className="h-10 w-10 sm:h-14 sm:w-14 text-green-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Browse Feed
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Explore community needs and opportunities to help
            </p>
          </Link>

          <Link 
            href="/seeker"
            className="block h-full bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl 
                     transition-all transform hover:-translate-y-1 p-6 sm:p-8 text-center group"
          >
            <div className="h-20 sm:h-28 w-20 sm:w-28 bg-red-100 rounded-full flex items-center 
                          justify-center mb-4 sm:mb-6 mx-auto group-hover:bg-red-200 transition-colors"
            >
              <Users className="h-10 w-10 sm:h-14 sm:w-14 text-red-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 sm:mb-4">
              I Need Help
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Connect with volunteers ready to support you
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}