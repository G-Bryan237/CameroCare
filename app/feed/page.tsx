// src/app/feed/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ASSISTANCE_CATEGORIES } from '@/types'
import PostList from '@/components/post/PostList'
import Logo from '@/components/logo'
import { 
  PlusIcon, 
  BellIcon, 
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

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'help' | 'offer'>('help')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    
    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleCreatePost = () => {
    setShowCreateForm(true)
  }

  const handlePostSuccess = () => {
    setShowCreateForm(false)
    setRefreshKey(prev => prev + 1)
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
    if (!user) return 'Guest User'
    return user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none lg:border-l lg:border-gray-200
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* Post Management Section */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Post Management
            </h3>
            
            <div className="space-y-2">
              <Link
                href="/seeker"
                className="flex items-center p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
              >
                <UserGroupIcon className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <div className="font-medium text-red-900">Request Help</div>
                  <div className="text-sm text-red-700">Create a help request</div>
                </div>
              </Link>

              <Link
                href="/helper"
                className="flex items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <HeartIcon className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-blue-900">Offer Help</div>
                  <div className="text-sm text-blue-700">Create a help offer</div>
                </div>
              </Link>

              <Link
                href="/manage-posts"
                className="w-full flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">My Posts</div>
                  <div className="text-sm text-gray-700">Manage your posts</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Profile Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-semibold text-gray-900 flex items-center mb-4">
              <UserCircleIcon className="h-5 w-5 mr-2" />
              Profile
            </h3>
            
            <div className="space-y-3">
              {/* Profile Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-white">{getUserInitials()}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{getUserDisplayName()}</div>
                    <div className="text-sm text-gray-600">Community Helper</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-lg font-semibold text-blue-600">12</div>
                    <div className="text-xs text-gray-600">Helps Given</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-lg font-semibold text-green-600">4.8</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
              </div>

              {/* Profile Actions */}
              <Link
                href="/profile"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserCircleIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">View Profile</span>
              </Link>

              <button className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Cog6ToothIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Settings</span>
              </button>

              {/* Sign Out Button */}
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center p-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-32">
                  <Logo />
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                  Cameroon Care Community
                </h1>
              </div>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-4">
                <button className="text-gray-600 hover:text-gray-900">
                  <MapPinIcon className="h-5 w-5" />
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  <BellIcon className="h-5 w-5" />
                </button>
                <Link 
                  href="/chat" 
                  className="text-gray-600 hover:text-gray-900"
                  title="Messages"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Tabs and Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('help')}
                className={`py-2.5 px-6 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'help'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                Help Requests
              </button>
              <button
                onClick={() => setActiveTab('offer')}
                className={`py-2.5 px-6 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'offer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                Help Offers
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center justify-between w-48 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span>Filter: {selectedCategory}</span>
                <ChevronDownIcon className="w-4 h-4 ml-2" />
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none z-50 max-h-64 overflow-y-auto">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleCategoryChange('All')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } ${
                            selectedCategory === 'All' ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                          } group flex w-full items-center px-4 py-2 text-sm`}
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
                              active ? 'bg-gray-100' : ''
                            } ${
                              selectedCategory === category ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                            } group flex w-full items-center px-4 py-2 text-sm`}
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

          {/* Posts */}
          <PostList 
            key={refreshKey}
            type={activeTab} 
            categories={selectedCategory === 'All' ? null : [selectedCategory]} 
          />
        </main>
      </div>

      {/* Create Post Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create {activeTab === 'help' ? 'Help Request' : 'Help Offer'}
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <CreatePostForm
                type={activeTab === 'help' ? 'HELP_REQUEST' : 'HELP_OFFER'}
                onClose={() => setShowCreateForm(false)}
                onSuccess={handlePostSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Button */}
      <button
        onClick={handleCreatePost}
        className="fixed bottom-8 left-8 bg-blue-600 hover:bg-blue-700 text-white 
                 rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-30"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  )
}