// src/app/feed/page.tsx
'use client'

import { useState } from 'react'
import { ASSISTANCE_CATEGORIES } from '@/types'
import PostList from '@/components/post/PostList'
import Logo from '@/components/logo'
import { 
  PlusIcon, 
  FunnelIcon, 
  BellIcon, 
  UserCircleIcon, 
  MapPinIcon,
  ChatBubbleLeftRightIcon // Added chat icon
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'help' | 'offer'>('help')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  const commonCategories = ['All', 'Housing', 'Food']
  const otherCategories = ASSISTANCE_CATEGORIES.filter(cat => !commonCategories.includes(cat))

  const toggleCategory = (category: string) => {
    if (category === 'All') {
      setSelectedCategories([])
      return
    }
    
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-48">
                <Logo />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cameroon Care Community
              </h1>
            </div>
            
            {/* Navigation Icons - Updated with Chat Icon */}
            <div className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-gray-900">
                <MapPinIcon className="h-6 w-6" />
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                <BellIcon className="h-6 w-6" />
              </button>
              <Link 
                href="/chat" 
                className="text-gray-600 hover:text-gray-900"
                title="Messages"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </Link>
              <button className="text-gray-600 hover:text-gray-900">
                <UserCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1">
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

          <div className="flex items-center space-x-4">
            {/* Common Categories */}
            <div className="flex space-x-2">
              {commonCategories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategories.includes(category) || (category === 'All' && selectedCategories.length === 0)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Categories Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="px-4 py-2 rounded-full text-sm font-medium bg-white hover:bg-gray-100 flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4" />
                <span>More Filters</span>
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
                <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg p-2 z-50">
                  {otherCategories.map(category => (
                    <Menu.Item key={category}>
                      {({ active }) => (
                        <button
                          onClick={() => toggleCategory(category)}
                          className={`w-full text-left px-4 py-2 rounded-md text-sm ${
                            selectedCategories.includes(category)
                              ? 'bg-blue-100 text-blue-700'
                              : active ? 'bg-gray-100' : ''
                          }`}
                        >
                          {category}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Posts */}
        <div className="bg-white rounded-xl shadow-lg">
          <PostList 
            type={activeTab} 
            categories={selectedCategories.length > 0 ? selectedCategories : null} 
          />
        </div>
      </main>

      {/* Floating Create Button */}
      <Link
        href={activeTab === 'help' ? '/seeker/create' : '/helper/create'}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white 
                 rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
      >
        <PlusIcon className="h-6 w-6" />
      </Link>
    </div>
  )
}