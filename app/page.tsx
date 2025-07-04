// app/page.tsx
'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { HeartIcon as HandHeart, UserGroupIcon as Users, NewspaperIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import Logo from '@/components/logo';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/feed');
      } else {
        router.push('/auth/signin');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;

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
            {/* Your main content here */}
            {/* Skip to Feed Link */}
            <div className="text-center mb-8">
              <Link 
                href="/feed"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Skip to Feed →
              </Link>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to CameroCare
              </h1>
              <p className="text-lg lg:text-xl text-gray-600">
                Connect with your community - offer help or seek assistance
              </p>
            </div>

            {/* Main Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Link 
                href="/helper"
                className="block h-full bg-white rounded-xl shadow-lg hover:shadow-xl 
                         transition-all transform hover:-translate-y-1 p-6 text-center group"
              >
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center 
                              justify-center mb-6 mx-auto group-hover:bg-blue-200 transition-colors"
                >
                  <HandHeart className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  I Want to Help
                </h2>
                <p className="text-gray-600">
                  Offer your support and make a difference in someone's life
                </p>
              </Link>

              <Link 
                href="/seeker"
                className="block h-full bg-white rounded-xl shadow-lg hover:shadow-xl 
                         transition-all transform hover:-translate-y-1 p-6 text-center group"
              >
                <div className="h-20 w-20 bg-red-100 rounded-full flex items-center 
                              justify-center mb-6 mx-auto group-hover:bg-red-200 transition-colors"
                >
                  <Users className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  I Need Help
                </h2>
                <p className="text-gray-600">
                  Connect with volunteers ready to support you
                </p>
              </Link>

              <Link 
                href="/feed"
                className="block h-full bg-white rounded-xl shadow-lg hover:shadow-xl 
                         transition-all transform hover:-translate-y-1 p-6 text-center group"
              >
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center 
                              justify-center mb-6 mx-auto group-hover:bg-green-200 transition-colors"
                >
                  <NewspaperIcon className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Browse Feed
                </h2>
                <p className="text-gray-600">
                  Explore community needs and opportunities to help
                </p>
              </Link>

              <Link 
                href="/profile"
                className="block h-full bg-white rounded-xl shadow-lg hover:shadow-xl 
                         transition-all transform hover:-translate-y-1 p-6 text-center group"
              >
                <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center 
                              justify-center mb-6 mx-auto group-hover:bg-purple-200 transition-colors"
                >
                  <Users className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  My Profile
                </h2>
                <p className="text-gray-600">
                  View your activity and manage your account
                </p>
              </Link>
            </div>
          </div>
        </main>
      </div>
  );
}