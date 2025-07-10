// src/app/feed/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ASSISTANCE_CATEGORIES } from '@/types'
import PostList from '@/components/post/PostList'
import Logo from '@/components/logo'
import Notifications from '@/components/Notifications'
import { 
  PlusIcon, 
  UserCircleIcon, 
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HeartIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import CreatePostForm from '@/components/post/CreatePostForm'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface UserStats {
  helpsGiven: number        // Number of times user helped others (as helper in conversations with messages)
  helpsReceived: number     // Number of times user received help (as requester in conversations with messages)
  averageRating: number     // Average rating from help_interactions table
  totalPosts: number        // Total unique posts user has participated in (authored or engaged with)
  displayName: string       // User's display name from profiles or auth metadata
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'help' | 'offer'>('help')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      // Fetch user stats if user exists
      if (session?.user) {
        await fetchUserStats(session.user)
      }
      setLoading(false)
    }
    
    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserStats(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user statistics from database with enhanced accuracy
  const fetchUserStats = async (user: User) => {
    try {
      // Get user's display name from profiles or fallback to auth metadata
      let displayName = 'User'
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, full_name, first_name, last_name')
          .eq('id', user.id)
          .single()

        if (profileData) {
          displayName = profileData.name || 
                       profileData.full_name || 
                       (profileData.first_name && profileData.last_name ? 
                         `${profileData.first_name} ${profileData.last_name}` : null) ||
                       user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'User'
        } else {
          displayName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'User'
        }
      } catch {
        displayName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'User'
      }

      // Count actual helps given (conversations where user is helper AND there are messages)
      const { data: helpsGivenData } = await supabase
        .from('conversations')
        .select(`
          id,
          messages!inner(id)
        `)
        .eq('helper_id', user.id)

      // Count actual helps received (conversations where user is requester AND there are messages)
      const { data: helpsReceivedData } = await supabase
        .from('conversations')
        .select(`
          id,
          messages!inner(id)
        `)
        .eq('requester_id', user.id)

      // Count posts user has participated in (either as author or in conversations)
      const { data: authoredPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', user.id)

      const { data: participatedConversations } = await supabase
        .from('conversations')
        .select('post_id')
        .or(`helper_id.eq.${user.id},requester_id.eq.${user.id}`)
        .not('post_id', 'is', null)

      // Get unique posts the user has participated in
      const authoredPostIds = new Set(authoredPosts?.map(p => p.id) || [])
      const participatedPostIds = new Set(participatedConversations?.map(c => c.post_id) || [])
      const allUniquePostIds = new Set([...authoredPostIds, ...participatedPostIds])

      // Get average rating from help_interactions if the table exists
      let averageRating = 0 // Default rating (zero if no ratings)
      try {
        const { data: ratingData } = await supabase
          .from('help_interactions')
          .select('rating')
          .eq('helper_id', user.id)
          .not('rating', 'is', null)

        if (ratingData && ratingData.length > 0) {
          const ratings = ratingData.map(r => r.rating)
          averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        }
      } catch {
        // help_interactions table might not exist, use default
        console.log('help_interactions table not found, using default rating')
      }

      const stats: UserStats = {
        helpsGiven: helpsGivenData?.length || 0,
        helpsReceived: helpsReceivedData?.length || 0,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalPosts: allUniquePostIds.size, // Total unique posts participated in
        displayName
      }

      setUserStats(stats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Set default stats on error
      setUserStats({
        helpsGiven: 0,
        helpsReceived: 0,
        averageRating: 0,
        totalPosts: 0,
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      })
    }
  }
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleCreatePost = () => {
    setShowCreateForm(true)
  }

  const handlePostSuccess = () => {
    setShowCreateForm(false)
    setRefreshKey(prev => prev + 1)
    // Refresh user stats since they created a new post
    if (user) {
      fetchUserStats(user)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }

  // Get user display name
  const getUserDisplayName = () => {
    return userStats?.displayName || 'Guest User'
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Get user role based on statistics
  const getUserRole = () => {
    if (!userStats) return 'Community Member'
    
    const totalHelps = userStats.helpsGiven + userStats.helpsReceived
    
    if (totalHelps >= 50) return 'Community Champion'
    if (totalHelps >= 20) return 'Active Helper'
    if (totalHelps >= 10) return 'Community Helper'
    if (totalHelps >= 5) return 'Helper'
    return 'Community Member'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Enhanced mobile responsiveness */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none lg:border-l lg:border-gray-200 lg:w-80 lg:max-w-none
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* User Profile Section - Enhanced mobile layout */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitials()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{getUserDisplayName()}</h3>
                <p className="text-xs text-gray-600">{getUserRole()}</p>
              </div>
            </div>

            {/* Stats Grid - Mobile optimized */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-white/50 rounded-lg p-3">
                <div className="text-lg font-bold text-blue-600">
                  {loading ? '...' : userStats?.helpsGiven || 0}
                </div>
                <div className="text-xs text-gray-600">Helps Given</div>
              </div>
              <div className="text-center bg-white/50 rounded-lg p-3">
                <div className="text-lg font-bold text-green-600">
                  {loading ? '...' : userStats?.helpsReceived || 0}
                </div>
                <div className="text-xs text-gray-600">Helps Received</div>
              </div>
              <div className="text-center bg-white/50 rounded-lg p-3">
                <div className="text-lg font-bold text-yellow-600">
                  {loading ? '...' : userStats?.averageRating.toFixed(1) || '0.0'}★
                </div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
              <div className="text-center bg-white/50 rounded-lg p-3">
                <div className="text-lg font-bold text-purple-600">
                  {loading ? '...' : userStats?.totalPosts || 0}
                </div>
                <div className="text-xs text-gray-600">Posts Participated</div>
              </div>
            </div>
          </div>

          {/* Post Management Section - Improved mobile layout */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Link
                href="/seeker"
                className="flex items-center p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all duration-200 border border-red-100"
              >
                <UserGroupIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-red-900 text-sm">Request Help</div>
                  <div className="text-xs text-red-700">Create a help request</div>
                </div>
              </Link>

              <Link
                href="/helper"
                className="flex items-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all duration-200 border border-blue-100"
              >
                <HeartIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-blue-900 text-sm">Offer Help</div>
                  <div className="text-xs text-blue-700">Create a help offer</div>
                </div>
              </Link>

              <Link
                href="/manage-posts"
                className="w-full flex items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 border border-gray-200"
              >
                <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-3" />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm">Manage Posts</div>
                  <div className="text-xs text-gray-700">View and edit your posts</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Profile Actions - Enhanced mobile design */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <Link
              href="/profile"
              className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              <UserCircleIcon className="h-5 w-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900 text-sm">View Profile</span>
            </Link>

            <button className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 transition-all duration-200">
              <Cog6ToothIcon className="h-5 w-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900 text-sm">Settings</span>
            </button>

            {/* Sign Out Button */}
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center p-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-red-600 hover:text-red-700"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header - Enhanced mobile responsiveness */}
        <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="w-8 sm:w-10 lg:w-32 flex-shrink-0">
                  <Logo />
                </div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  <span className="hidden sm:inline">Cameroon Care Community</span>
                  <span className="sm:hidden">CameroCare</span>
                </h1>
              </div>
              
              {/* Navigation Icons - Enhanced mobile layout */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <button className="p-2.5 sm:p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
                  <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <Notifications />
                <Link 
                  href="/conversations" 
                  className="p-2.5 sm:p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  title="Messages"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </Link>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2.5 sm:p-3 rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area - Enhanced mobile layout */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-gray-50">
          {/* Tabs and Filter - Enhanced mobile responsiveness */}
          <div className="flex flex-col space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {/* Tabs - Full width on mobile with better design */}
            <div className="flex space-x-1 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 w-full">
              <button
                onClick={() => setActiveTab('help')}
                className={`flex-1 py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
                  activeTab === 'help'
                    ? 'bg-red-500 text-white shadow-lg transform scale-[1.02]'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Help Requests</span>
                <span className="sm:hidden">Requests</span>
              </button>
              <button
                onClick={() => setActiveTab('offer')}
                className={`flex-1 py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
                  activeTab === 'offer'
                    ? 'bg-blue-500 text-white shadow-lg transform scale-[1.02]'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Help Offers</span>
                <span className="sm:hidden">Offers</span>
              </button>
            </div>

            {/* Category Filter Dropdown - Mobile optimized */}
            <Menu as="div" className="relative w-full sm:w-auto">
              <Menu.Button className="flex items-center justify-between w-full sm:w-64 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200">
                <span className="truncate">Filter: {selectedCategory}</span>
                <ChevronDownIcon className="w-5 h-5 ml-2 flex-shrink-0" />
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 sm:right-0 mt-2 w-full sm:w-64 bg-white rounded-xl shadow-xl border border-gray-200 focus:outline-none z-50 max-h-80 overflow-y-auto">
                  <div className="py-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleCategoryChange('All')}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } ${
                            selectedCategory === 'All' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-900'
                          } group flex w-full items-center px-4 py-3 text-sm transition-colors duration-150`}
                        >
                          All Categories
                        </button>
                      )}
                    </Menu.Item>
                    {ASSISTANCE_CATEGORIES.map((category) => (
                      <Menu.Item key={category}>
                        {({ active }) => (
                          <button
                            onClick={() => handleCategoryChange(category)}
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } ${
                              selectedCategory === category ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-900'
                            } group flex w-full items-center px-4 py-3 text-sm transition-colors duration-150`}
                          >
                            {category}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Posts Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
            <PostList 
              key={refreshKey}
              type={activeTab} 
              categories={selectedCategory === 'All' ? null : [selectedCategory]} 
            />
          </div>
        </main>
      </div>

      {/* Create Post Modal - Enhanced mobile responsiveness */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Create {activeTab === 'help' ? 'Help Request' : 'Help Offer'}
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <CreatePostForm
                type={activeTab === 'help' ? 'HELP_REQUEST' : 'HELP_OFFER'}
                onClose={() => setShowCreateForm(false)}
                onSuccess={handlePostSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Button - Fixed desktop position */}
      <button
        onClick={handleCreatePost}
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 lg:bottom-10 lg:right-10 text-white rounded-full p-4 sm:p-5 shadow-2xl hover:shadow-3xl transition-all duration-300 z-40 transform hover:scale-110 active:scale-95 ${
          activeTab === 'help' 
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        }`}
        style={{
          filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))'
        }}
      >
        <PlusIcon className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>
    </div>
  )
}