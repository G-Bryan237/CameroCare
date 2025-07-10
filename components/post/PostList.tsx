// src/components/post/PostList.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Share2, 
  Bookmark,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  X,
  Facebook,
  Twitter,
  MessageCircle,
  Heart,
  AlertTriangle,
  Star,
  HandHeart
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/auth-helpers-nextjs'
import { usePosts } from '@/hooks/usePosts'

const supabase = createClientComponentClient()

// Post interface
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
  currentUser?: User | null
}

interface PostListProps {
  type: 'help' | 'offer'
  categories: string[] | null
  excludeOwnPosts?: boolean
}

// Request Help Modal Component
interface RequestHelpModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post
  currentUser: User
  onSubmit: (message: string) => Promise<{ conversationId: string }>
}

function RequestHelpModal({ isOpen, onClose, post, onSubmit }: RequestHelpModalProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [helperStats, setHelperStats] = useState<{
    rating: number
    helpsGiven: number
    successRate: number
    avgResponseTime: string
    isVerified: boolean
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Generate default message for requesting help
      const defaultMessage = `Hi! I'd like to request your help with "${post.title}". I'm interested in the ${post.categories.join(', ')} assistance you're offering. Could we discuss the details?`
      setMessage(defaultMessage)
      setError('')
      fetchHelperStats()
    }
  }, [isOpen, post])

  const fetchHelperStats = async () => {
    if (!post.author_id) return
    
    setLoadingStats(true)
    try {
      // Fetch helper's actual statistics
      const response = await fetch(`/api/users/${post.author_id}/stats`)
      if (response.ok) {
        const stats = await response.json()
        setHelperStats(stats)
      } else {
        // Fallback to default stats if API fails
        setHelperStats({
          rating: 0,
          helpsGiven: 0,
          successRate: 0,
          avgResponseTime: 'N/A',
          isVerified: false
        })
      }
    } catch (error) {
      console.error('Error fetching helper stats:', error)
      // Fallback stats
      setHelperStats({
        rating: 0,
        helpsGiven: 0,
        successRate: 0,
        avgResponseTime: 'N/A',
        isVerified: false
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const result = await onSubmit(message.trim())
      onClose()
      
      // Redirect to conversation
      window.location.href = `/conversations/${result.conversationId}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send help request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={onClose} />

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HandHeart className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Request Help</h2>
                <p className="text-sm text-gray-600">Connect with this helper</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Helper Preview */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center relative">
                <span className="text-white font-medium">
                  {post.author?.name?.split(' ').map(n => n[0]).join('') || 'H'}
                </span>
                {helperStats?.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">
                    {post.author?.name || 'Helper'}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (helperStats?.rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {loadingStats ? '...' : (helperStats?.rating?.toFixed(1) || '0.0')}
                    </span>
                  </div>
                  {helperStats?.isVerified && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Verified Helper
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{post.location}, {post.region}</span>
                  <span>•</span>
                  <span>Response time: {loadingStats ? '...' : (helperStats?.avgResponseTime || 'N/A')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Helper Stats */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Helper Profile</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-blue-600">
                  {loadingStats ? '...' : (helperStats?.helpsGiven || 0)}
                </div>
                <div className="text-xs text-gray-600">People Helped</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-green-600">
                  {loadingStats ? '...' : `${helperStats?.successRate || 0}%`}
                </div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-orange-600">
                  {loadingStats ? '...' : (helperStats?.avgResponseTime || 'N/A')}
                </div>
                <div className="text-xs text-gray-600">Avg Response</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                placeholder="Explain what help you need..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will start a private conversation with the helper.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <HandHeart className="h-4 w-4" />
                    <span>Request Help</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Enhanced Offer Help Modal Component
interface OfferHelpModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post
  currentUser: User
  onSubmit: (message: string) => Promise<{ conversationId: string }>
}

function OfferHelpModal({ isOpen, onClose, post, currentUser, onSubmit }: OfferHelpModalProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Generate default message
      const defaultMessage = `Hi! I'd like to help you with "${post.title}". I have experience in ${post.categories.join(', ')} and would be happy to assist. Let me know how we can connect!`
      setMessage(defaultMessage)
      setError('')
    }
  }, [isOpen, post])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const result = await onSubmit(message.trim())
      onClose()
      
      // Redirect to conversation
      window.location.href = `/conversations/${result.conversationId}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send help offer')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a function to get proper display name
  const getUserDisplayName = () => {
    if (currentUser.user_metadata?.full_name) return currentUser.user_metadata.full_name;
    if (currentUser.user_metadata?.name) return currentUser.user_metadata.name;
    if (currentUser.user_metadata?.first_name && currentUser.user_metadata?.last_name) {
      return `${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}`;
    }
    return currentUser.email?.split('@')[0] || 'Helper';
  }

  // Add a function to get user initials
  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={onClose} />

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Offer Help</h2>
                <p className="text-sm text-gray-600">Send a message to the requester</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Post Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-red-600">
                  {post.author?.name?.split(' ').map(n => n[0]).join('') || 'A'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{post.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{post.location}, {post.region}</span>
                  {post.is_urgent && (
                    <>
                      <span>•</span>
                      <span className="text-red-600 font-medium">Urgent</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Helper Profile */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Your Helper Profile</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                {currentUser.user_metadata?.avatar_url ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <img 
                      src={currentUser.user_metadata.avatar_url} 
                      alt={getUserDisplayName()} 
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {getUserInitials()}
                    </span>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 truncate">
                    {getUserDisplayName()}
                  </span>
                  {/* Show real rating if available, otherwise a placeholder */}
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">
                      {currentUser.user_metadata?.rating || '4.8'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <span>{currentUser.user_metadata?.role || 'Community Helper'}</span>
                  <span>•</span>
                  <span>{currentUser.user_metadata?.helps_given || '0'} helps given</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Explain how you can help..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will start a private conversation between you and the requester.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    <span>Send Help Offer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Enhanced Post Card Component
function PostCard({ post, currentUser }: PostCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false)
  const [localShares, setLocalShares] = useState(post.shares || 0)
  const [hasShared, setHasShared] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showOfferHelpModal, setShowOfferHelpModal] = useState(false)
  const [showRequestHelpModal, setShowRequestHelpModal] = useState(false)
  const router = useRouter()

  const isOwnPost = currentUser && post.author_id === currentUser.id
  const canOfferHelp = currentUser && !isOwnPost && post.type === 'HELP_REQUEST'
  const canRequestHelp = currentUser && !isOwnPost && post.type === 'HELP_OFFER'
  const isPopular = (post.participant_count || 0) >= 10

  // Check if user has bookmarked this post
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!currentUser) return
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
  }, [post.id, currentUser])

  const getAuthorInfo = () => {
    if (post.author) {
      return {
        name: post.author.name || 'Anonymous User',
        avatar_url: post.author.avatar_url || null
      }
    }
    return {
      name: 'Community Member',
      avatar_url: null
    }
  }

  const authorInfo = getAuthorInfo()

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      const diffInHours = Math.floor(diffInMinutes / 60)
      
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInHours < 24) return `${diffInHours}h ago`
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      })
    } catch {
      return 'Recently'
    }
  }

  const handleOfferHelp = async (message: string) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/offer-help`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Special handling for 409 Conflict (already offered help)
        if (response.status === 409) {
          alert(`You have already offered help for this post. ${result.status === 'pending' ? 'Your offer is pending.' : `Status: ${result.status}`}`);
          
          // If there's a conversation ID available, redirect to it
          if (result.conversationId) {
            window.location.href = `/conversations/${result.conversationId}`;
            return { conversationId: result.conversationId };
          }
          throw new Error(result.message);
        }
        throw new Error(result.message || 'Failed to send help offer');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  const handleRequestHelp = async (message: string) => {
    const response = await fetch(`/api/posts/${post.id}/request-help`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send help request')
    }

    return result
  }

  const handleActionButton = () => {
    if (canOfferHelp) {
      setShowOfferHelpModal(true)
    } else if (canRequestHelp) {
      setShowRequestHelpModal(true)
    } else if (!currentUser) {
      router.push('/auth/signin')
    }
  }

  const handleBookmark = async () => {
    if (isBookmarkLoading || !currentUser) return
    
    setIsBookmarkLoading(true)
    const originalBookmarkedState = isBookmarked
    
    try {
      const newBookmarkedState = !isBookmarked
      setIsBookmarked(newBookmarkedState)
      
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
        throw new Error('Failed to update bookmark')
      }

      const result = await response.json()
      setIsBookmarked(result.isBookmarked)
      
    } catch (error) {
      console.error('Error bookmarking post:', error)
      setIsBookmarked(originalBookmarkedState)
      alert('Failed to update bookmark. Please try again.')
    } finally {
      setIsBookmarkLoading(false)
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
        case 'copy':
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
        
        if (result.isFirstShare) {
          setHasShared(true)
        }
      } else {
        if (!hasShared) {
          setLocalShares(prev => prev + 1)
          setHasShared(true)
        }
      }
    } catch (error) {
      console.error('Error updating share count:', error)
      if (!hasShared) {
        setLocalShares(prev => prev + 1)
        setHasShared(true)
      }
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden post-card-hover">
        {/* Urgent Badge */}
        {post.is_urgent && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 text-sm font-medium text-center flex items-center justify-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Urgent Request - Help Needed Now</span>
          </div>
        )}

        <div className="p-3 sm:p-4 md:p-6">
          {/* Header with enhanced mobile layout */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0 relative">
                {authorInfo.avatar_url ? (
                  <img
                    src={authorInfo.avatar_url}
                    alt={authorInfo.name}
                    className="h-8 w-8 sm:h-10 md:h-12 sm:w-10 md:w-12 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-8 w-8 sm:h-10 md:h-12 sm:w-10 md:w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-xs sm:text-sm md:text-base">
                      {authorInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
                {/* Online status indicator - smaller on mobile */}
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 h-2 w-2 sm:h-3 sm:w-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate flex-1">
                    {authorInfo.name}
                  </h3>
                  <div className={`px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-medium flex-shrink-0 ${
                    post.type === 'HELP_REQUEST' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    <span className="hidden sm:inline">
                      {post.type === 'HELP_REQUEST' ? 'Needs Help' : 'Offers Help'}
                    </span>
                    <span className="sm:hidden">
                      {post.type === 'HELP_REQUEST' ? 'Need' : 'Offer'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-gray-500">
                  <span className="flex items-center space-x-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(post.created_at)}</span>
                  </span>
                  {(post.location || post.region) && (
                    <span className="flex items-center space-x-1 truncate min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {[post.location, post.region].filter(Boolean).join(', ')}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Status badges - improved mobile layout */}
            <div className="flex flex-col items-end space-y-1 ml-1.5 sm:ml-2 flex-shrink-0">
              {isPopular && (
                <span className="flex items-center space-x-1 text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border border-orange-200">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden md:inline">Popular</span>
                </span>
              )}
              {post.status && (
                <span className={`text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
                  post.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                  post.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                  'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  <span className="hidden sm:inline">
                    {post.status === 'completed' ? 'Completed' : 
                     post.status === 'in-progress' ? 'In Progress' : 'Open'}
                  </span>
                  <span className="sm:hidden">
                    {post.status === 'completed' ? '✓' : 
                     post.status === 'in-progress' ? '⏳' : '○'}
                  </span>
                </span>
              )}
              {isOwnPost && (
                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
                  <span className="hidden sm:inline">Your Post</span>
                  <span className="sm:hidden">Mine</span>
                </span>
              )}
            </div>
          </div>

          {/* Content with enhanced spacing and mobile optimization */}
          <div className="mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-tight line-clamp-2">
              {post.title}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3">
              {post.description}
            </p>
            
            {/* Categories with optimized mobile layout */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {/* Show only first 2 categories on mobile, 3 on desktop */}
                {post.categories.slice(0, 2).map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {category}
                  </span>
                ))}
                {/* Third category only visible on sm and up */}
                {post.categories.length > 2 && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    {post.categories[2]}
                  </span>
                )}
                {/* More indicator */}
                {post.categories.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    <span className="sm:hidden">+{post.categories.length - 2}</span>
                    <span className="hidden sm:inline">+{post.categories.length - 3} more</span>
                  </span>
                )}
                {post.categories.length === 3 && (
                  <span className="sm:hidden inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    +1
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats and Actions with enhanced mobile layout */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
            {/* Left side - Stats with compact mobile design */}
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
              <div className="flex items-center space-x-1 sm:space-x-1.5 text-gray-500">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">{post.participant_count || 0}</span>
                <span className="text-xs hidden md:inline">participants</span>
              </div>
              
              <button
                onClick={handleBookmark}
                disabled={isBookmarkLoading || !currentUser}
                className={`flex items-center space-x-1 sm:space-x-1.5 transition-colors ${
                  isBookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
                } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Bookmark className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                  {isBookmarked ? 'Saved' : 'Save'}
                </span>
              </button>
              
              <button 
                onClick={() => handleShare()}
                className="flex items-center space-x-1 sm:space-x-1.5 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">{localShares}</span>
                <span className="text-xs hidden md:inline">shares</span>
              </button>
            </div>

            {/* Right side - Action Button with improved responsive design */}
            {(canOfferHelp || canRequestHelp) && (
              <button
                onClick={handleActionButton}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm touch-feedback ${
                  canOfferHelp
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'
                }`}
              >
                <span className="flex items-center space-x-1 sm:space-x-1.5">
                  {canOfferHelp ? (
                    <>
                      <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Offer Help</span>
                      <span className="sm:hidden">Help</span>
                    </>
                  ) : (
                    <>
                      <HandHeart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Request Help</span>
                      <span className="sm:hidden">Request</span>
                    </>
                  )}
                </span>
              </button>
            )}

            {/* Sign in prompt for non-authenticated users */}
            {!currentUser && !isOwnPost && (
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 touch-feedback"
              >
                <span className="hidden sm:inline">Sign in to help</span>
                <span className="sm:hidden">Sign in</span>
              </button>
            )}
          </div>
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
                  onClick={() => handleShare('copy')}
                  className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Help Modal */}
      {showOfferHelpModal && currentUser && (
        <OfferHelpModal
          isOpen={showOfferHelpModal}
          onClose={() => setShowOfferHelpModal(false)}
          post={post}
          currentUser={currentUser}
          onSubmit={handleOfferHelp}
        />
      )}

      {/* Request Help Modal */}
      {showRequestHelpModal && currentUser && (
        <RequestHelpModal
          isOpen={showRequestHelpModal}
          onClose={() => setShowRequestHelpModal(false)}
          post={post}
          currentUser={currentUser}
          onSubmit={handleRequestHelp}
        />
      )}
    </>
  )
}

// Main PostList Component
export default function PostList({ type, categories, excludeOwnPosts = false }: PostListProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'urgent' | 'popular'>('recent')

  const { posts, loading, error, refreshPosts } = usePosts({
    type,
    categories,
    excludeOwnPosts,
    currentUser
  })

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user ?? null)
    }
    
    getCurrentUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'urgent':
        return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)
      case 'popular':
        return (b.participant_count || 0) - (a.participant_count || 0)
      default: // recent
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (loading) {
    return (
      <div className="flex justify-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
        <button 
          onClick={refreshPosts}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base touch-feedback transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sort Options with improved mobile spacing */}
      <div className="flex justify-end space-x-1.5 sm:space-x-2 mb-2">
        {(['recent', 'urgent', 'popular'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`px-2.5 py-1.5 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              sortBy === option
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts with responsive spacing */}
      <div className="space-y-4 sm:space-y-6">
        {sortedPosts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={currentUser}
          />
        ))}

        {sortedPosts.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
            {excludeOwnPosts && currentUser ? 
              "No posts from other users found for the selected filters." :
              "No posts found for the selected filters."
            }
          </div>
        )}
      </div>
    </div>
  )
}