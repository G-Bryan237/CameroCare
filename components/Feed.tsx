// src/components/Feed.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Session } from '@supabase/auth-helpers-nextjs'
import EnhancedPostCard from '@/components/post/EnhancedPostCard'
import { ASSISTANCE_CATEGORIES } from '@/types'
import formatDateTime from '@/lib/utils/formatDateTime';

interface Post {
  _id: string
  id: string
  title: string
  description: string
  categories: string[]
  location: string
  region: string
  type: 'HELP_REQUEST' | 'HELP_OFFER'
  author: {
    _id: string
    name: string
    image?: string
  }
  createdAt: string
  created_at: string
  interaction_count: number
  participant_count: number // Count of people who messaged about this post
  bookmarks: number | string[]
  shares: number
  volunteers: Array<{
    user: {
      _id: string
      name: string
    }
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  }>
  likes: string[]
}

export default function Feed() {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<'HELP_REQUEST' | 'HELP_OFFER'>('HELP_REQUEST')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    fetchPosts()
  }, [activeTab, selectedCategory])

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        type: activeTab,
        ...(selectedCategory && { category: selectedCategory })
      })
      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1">
          <button
            onClick={() => setActiveTab('HELP_REQUEST')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'HELP_REQUEST' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Help Requests
          </button>
          <button
            onClick={() => setActiveTab('HELP_OFFER')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'HELP_OFFER' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Help Offers
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {session?.user ? (
            <>
              <span>
                Logged in as {
                  session.user.user_metadata?.full_name || 
                  (session.user.user_metadata?.first_name && session.user.user_metadata?.last_name ? 
                    `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name}` : null) ||
                  session.user.user_metadata?.name || 
                  session.user.email?.split('@')[0] || 
                  'User'
                }
              </span>
              <span className="mx-2">•</span>
            </>
          ) : ''}
          {formatDateTime(new Date())}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main content */}
        <div className="col-span-12 lg:col-span-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <EnhancedPostCard
                  key={post._id} 
                  post={{
                    ...post,
                    id: post._id,
                    author_id: post.author._id,
                    created_at: post.createdAt,
                    interaction_count: post.interaction_count || 0,
                    participant_count: post.participant_count || 0,
                    bookmarks: typeof post.bookmarks === 'number' ? post.bookmarks : (Array.isArray(post.bookmarks) ? post.bookmarks.length : 0),
                    shares: post.shares || 0,
                    author: {
                      id: post.author._id,
                      name: post.author.name,
                      avatar_url: post.author.image,
                    }
                  }}
                  currentUser={session?.user ? {
                    id: session.user.id,
                    email: session.user.email,
                    app_metadata: session.user.app_metadata || {},
                    user_metadata: session.user.user_metadata || {},
                    aud: session.user.aud || '',
                    created_at: session.user.created_at || new Date().toISOString()
                  } : null}
                  onInteraction={() => fetchPosts()}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar with categories */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Filter by Category
            </h3>
            <div className="space-y-2">
              {ASSISTANCE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(
                    category === selectedCategory ? null : category
                  )}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    category === selectedCategory
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}