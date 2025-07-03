// src/components/post/PostList.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Share2, 
  EyeOff,
  Bookmark,
  Flag,
  TrendingUp,
  Users,
  CheckCircle
} from 'lucide-react'

// Update Post interface to match what we're actually getting
interface Post {
  id: string
  type: 'HELP_REQUEST' | 'HELP_OFFER'
  title: string
  description: string
  categories: string[]
  location?: string
  region?: string
  is_urgent?: boolean
  status?: 'open' | 'in-progress' | 'completed'
  participant_count?: number
  bookmarks?: number
  shares?: number
  created_at: string
  updated_at?: string
  last_activity_at?: string
  author_id: string
  author?: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface PostCardProps {
  post: Post
}

function PostCard({ post }: PostCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const router = useRouter()

  const isPopular = (post.participant_count || 0) >= 10
  const isRecent = new Date().getTime() - new Date(post.last_activity_at || post.created_at).getTime() < 3600000

  // Get author info with better fallbacks
  const getAuthorInfo = () => {
    if (post.author) {
      return {
        name: post.author.name || 'Community Member',
        avatar_url: post.author.avatar_url || null
      }
    }
    
    return {
      name: 'Community Member',
      avatar_url: null
    }
  }

  const authorInfo = getAuthorInfo()

  const handleActionButton = () => {
    router.push(`/posts/${post.id}`)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Just now'
      if (diffInHours < 24) return `${diffInHours}h ago`
      if (diffInHours < 48) return '1 day ago'
      return date.toLocaleDateString()
    } catch (error) {
      return 'Recently'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {post.is_urgent && (
        <div className="bg-red-500 text-white px-4 py-2 text-sm font-medium text-center">
          Urgent Request
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {authorInfo.avatar_url ? (
                <img
                  src={authorInfo.avatar_url}
                  alt={authorInfo.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {authorInfo.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CM'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">{authorInfo.name}</h4>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{post.location || 'Cameroon'}, {post.region || 'Various Regions'}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isPopular && (
              <span className="flex items-center space-x-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>Popular</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
          <p className="text-gray-600">{post.description}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {(post.categories || []).map((category, index) => (
              <span key={`${category}-${index}`} className="px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                {category}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            {/* Participants count */}
            <div className="flex items-center space-x-2 text-gray-500">
              <Users className="h-5 w-5" />
              <span className="text-sm">{post.participant_count || 0} Participants</span>
            </div>

            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`flex items-center space-x-2 ${
                isBookmarked ? 'text-yellow-500' : 'text-gray-500'
              } hover:text-yellow-500 transition-colors`}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span className="text-sm">{(post.bookmarks || 0) + (isBookmarked ? 1 : 0)}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Share</span>
            </button>
          </div>

          <button 
            onClick={handleActionButton}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {post.type === 'HELP_REQUEST' ? 'Offer Help' : 'Learn More'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PostList({ type, categories }: { type: 'help' | 'offer', categories: string[] | null }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'urgent' | 'popular'>('recent')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [type, categories, sortBy])

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      // Map type to API format
      if (type === 'help') {
        params.append('type', 'help')
      } else if (type === 'offer') {
        params.append('type', 'offer')
      }
      
      // Add category filter if specified
      if (categories && categories.length > 0 && categories[0] !== 'All') {
        params.append('category', categories[0])
      }

      console.log('Fetching posts with params:', params.toString())

      const response = await fetch(`/api/posts?${params.toString()}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fetched posts data:', data)
      
      // Ensure data is an array
      const postsArray = Array.isArray(data) ? data : []
      
      // Sort posts based on sortBy preference
      const sortedPosts = [...postsArray].sort((a, b) => {
        switch (sortBy) {
          case 'urgent':
            return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)
          case 'popular':
            return (b.participant_count || 0) - (a.participant_count || 0)
          default: // recent
            const aTime = new Date(a.last_activity_at || a.created_at).getTime()
            const bTime = new Date(b.last_activity_at || b.created_at).getTime()
            return bTime - aTime
        }
      })
      
      setPosts(sortedPosts)
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchPosts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex justify-end space-x-2 px-4">
        {(['recent', 'urgent', 'popular'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
              sortBy === option
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-6 px-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {posts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No posts found for the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}