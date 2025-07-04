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
  CheckCircle,
  Clock,
  X,
  Facebook,
  Twitter,
  MessageCircle,
  Instagram
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
  const [showShareModal, setShowShareModal] = useState(false)
  const [localBookmarks, setLocalBookmarks] = useState(post.bookmarks || 0)
  const [localShares, setLocalShares] = useState(post.shares || 0)
  const router = useRouter()

  const isPopular = (post.participant_count || 0) >= 10
  const isRecent = new Date().getTime() - new Date(post.last_activity_at || post.created_at).getTime() < 3600000

  // Check if user has bookmarked this post
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const response = await fetch(`/api/posts/${post.id}/bookmark`)
        if (response.ok) {
          const result = await response.json()
          setIsBookmarked(result.isBookmarked)
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error)
      }
    }
    
    checkBookmarkStatus()
  }, [post.id])

  // Get author info with better fallbacks
  const getAuthorInfo = () => {
    if (post.author) {
      return {
        name: post.author.name || 'Anonymous User',
        avatar_url: post.author.avatar_url || null
      }
    }
    
    return {
      name: 'Anonymous User',
      avatar_url: null
    }
  }

  const authorInfo = getAuthorInfo()

  const handleActionButton = () => {
    router.push(`/posts/${post.id}`)
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      const diffInHours = Math.floor(diffInMinutes / 60)
      const diffInDays = Math.floor(diffInHours / 24)
      
      // Format time
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      
      // Format date with time
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInHours < 24) return `${diffInHours}h ago • ${timeString}`
      if (diffInDays === 1) return `Yesterday • ${timeString}`
      if (diffInDays < 7) return `${diffInDays} days ago • ${timeString}`
      
      return `${date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })} • ${timeString}`
    } catch (error) {
      return 'Recently'
    }
  }

  const handleBookmark = async () => {
    try {
      const newBookmarkedState = !isBookmarked
      const originalBookmarks = localBookmarks
      const originalBookmarkedState = isBookmarked
      
      // Optimistically update UI
      setIsBookmarked(newBookmarkedState)
      setLocalBookmarks(prev => newBookmarkedState ? prev + 1 : prev - 1)
      
      // Make API call to update the bookmark
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: newBookmarkedState ? 'bookmark' : 'unbookmark'
        })
      })

      if (!response.ok) {
        const errorResponse = await response.json().catch(() => ({}))
        console.error('Bookmark API Error:', errorResponse)
        throw new Error(`Failed to update bookmark: ${errorResponse.error || 'Unknown error'}`)
      }

      const result = await response.json()
      setLocalBookmarks(result.bookmarks)
      setIsBookmarked(result.isBookmarked)
      
    } catch (error) {
      console.error('Error bookmarking post:', error)
      // Revert on error
      setIsBookmarked(isBookmarked)
      setLocalBookmarks(post.bookmarks || 0)
    }
  }

  const handleShare = async (platform?: string) => {
    const postUrl = `${window.location.origin}/posts/${post.id}`
    const text = `Check out this ${post.type === 'HELP_REQUEST' ? 'help request' : 'help offer'}: ${post.title}`
    
    if (platform) {
      let shareUrl = ''
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`
          break
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
          break
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${postUrl}`)}`
          break
        case 'instagram':
          // Instagram doesn't support direct sharing, so copy to clipboard
          navigator.clipboard.writeText(`${text} ${postUrl}`)
          alert('Link copied to clipboard! You can now paste it in Instagram.')
          await updateShareCount('instagram')
          setShowShareModal(false)
          return
        case 'copy':
          // Handle copy link
          navigator.clipboard.writeText(postUrl)
          alert('Link copied to clipboard!')
          await updateShareCount('copy')
          setShowShareModal(false)
          return
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400')
        await updateShareCount(platform)
        setShowShareModal(false)
      }
    } else {
      setShowShareModal(true)
    }
  }

  const updateShareCount = async (platform: string) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform })
      })

      if (response.ok) {
        const result = await response.json()
        setLocalShares(result.shares)
      } else {
        // Fallback to local increment if API fails
        setLocalShares(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error updating share count:', error)
      // Fallback to local increment if API fails
      setLocalShares(prev => prev + 1)
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
                <span>{post.location || 'Location not specified'}</span>
                {post.region && (
                  <>
                    <span>•</span>
                    <span>{post.region}</span>
                  </>
                )}
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>{formatDateTime(post.created_at)}</span>
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
              onClick={handleBookmark}
              className={`flex items-center space-x-2 ${
                isBookmarked ? 'text-yellow-500' : 'text-gray-500'
              } hover:text-yellow-500 transition-colors`}
              title={`${localBookmarks} people saved this post`}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span className="text-sm">{localBookmarks} saved</span>
            </button>

            <button 
              onClick={() => handleShare()}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              title={`Shared ${localShares} times`}
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm">{localShares} shares</span>
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Share this post</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Facebook</span>
                </button>

                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Twitter className="h-5 w-5 text-blue-400" />
                  <span className="font-medium">Twitter</span>
                </button>

                <button
                  onClick={() => handleShare('whatsapp')}
                  className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShare('instagram')}
                  className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <span className="font-medium">Instagram</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    const postUrl = `${window.location.origin}/posts/${post.id}`
                    navigator.clipboard.writeText(postUrl)
                    await updateShareCount('copy')
                    alert('Link copied to clipboard!')
                    setShowShareModal(false)
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
      <div className="flex justify-end space-x-2 mb-2">
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
      <div className="space-y-6">
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