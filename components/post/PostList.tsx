// src/components/post/PostList.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Share2, 
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
  Instagram,
  Heart,
  AlertTriangle,
  Shield,
  Star,
  HandHeart // Add this for Request Help
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

function RequestHelpModal({ isOpen, onClose, post, currentUser, onSubmit }: RequestHelpModalProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Generate default message for requesting help
      const defaultMessage = `Hi! I'd like to request your help with "${post.title}". I'm interested in the ${post.categories.join(', ')} assistance you're offering. Could we discuss the details?`
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
              <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {post.author?.name?.split(' ').map(n => n[0]).join('') || 'H'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">
                    {post.author?.name || 'Helper'}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.9</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Verified Helper
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{post.location}, {post.region}</span>
                  <span>•</span>
                  <span>Response time: ~2 hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Helper Stats */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Helper Profile</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-blue-600">28</div>
                <div className="text-xs text-gray-600">People Helped</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-green-600">98%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-orange-600">2h</div>
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
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {currentUser.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('') || 
                     currentUser.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {currentUser.user_metadata?.name || currentUser.email?.split('@')[0]}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">4.8</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <span>Community Helper</span>
                  <span>•</span>
                  <span>12 helps given</span>
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
    const response = await fetch(`/api/posts/${post.id}/offer-help`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send help offer')
    }

    return await response.json()
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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
        {post.is_urgent && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 text-sm font-medium text-center flex items-center justify-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Urgent Request - Help Needed Now</span>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 relative">
                {authorInfo.avatar_url ? (
                  <img
                    src={authorInfo.avatar_url}
                    alt={authorInfo.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    post.type === 'HELP_REQUEST' 
                      ? 'bg-gradient-to-br from-red-500 to-red-600' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    <span className="text-sm font-medium text-white">
                      {authorInfo.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CM'}
                    </span>
                  </div>
                )}
                {/* Trust Badge */}
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <Shield className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900">{authorInfo.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.8</span>
                  </div>
                  {isOwnPost && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Your Post
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[post.location, post.region].filter(Boolean).join(', ') || 'Location not specified'}
                  </span>
                  <Clock className="h-4 w-4" />
                  <span>{formatDateTime(post.created_at)}</span>
                </div>
              </div>
            </div>
            
            {isPopular && (
              <span className="flex items-center space-x-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>Popular</span>
              </span>
            )}
          </div>

          {/* Content */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
            <p className="text-gray-600 line-clamp-3">{post.description}</p>
            
            {/* Categories */}
            <div className="mt-3 flex flex-wrap gap-2">
              {post.categories?.map((category, index) => (
                <span 
                  key={index} 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    post.type === 'HELP_REQUEST' 
                      ? 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-500">
                <Users className="h-5 w-5" />
                <span className="text-sm">{post.participant_count || 0} interested</span>
              </div>
              
              <button
                onClick={handleBookmark}
                disabled={isBookmarkLoading || !currentUser}
                className={`flex items-center space-x-2 ${
                  isBookmarked ? 'text-yellow-500' : 'text-gray-500'
                } hover:text-yellow-500 transition-colors ${
                  isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                <span className="text-sm">{post.bookmarks || 0}</span>
              </button>
              
              <button 
                onClick={() => handleShare()}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm">{localShares}</span>
              </button>
            </div>

            {/* Action Button - Now handles both types */}
            {(post.type === 'HELP_REQUEST' || post.type === 'HELP_OFFER') && (
              <div className="relative">
                <button 
                  onClick={handleActionButton}
                  disabled={isOwnPost || !currentUser}
                  className={`px-6 py-2.5 text-white rounded-lg font-medium transition-all ${
                    isOwnPost 
                      ? 'bg-gray-400 cursor-not-allowed'
                      : !currentUser
                      ? 'bg-gray-400 cursor-pointer hover:bg-gray-500'
                      : post.type === 'HELP_REQUEST'
                      ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg transform hover:scale-105'
                      : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:scale-105'
                  }`}
                  title={
                    isOwnPost 
                      ? `You cannot ${post.type === 'HELP_REQUEST' ? 'offer help on' : 'request help from'} your own post`
                      : !currentUser
                      ? "Sign in to interact"
                      : post.type === 'HELP_REQUEST'
                      ? "Offer help to this person"
                      : "Request help from this person"
                  }
                >
                  <span className="flex items-center space-x-2">
                    {post.type === 'HELP_REQUEST' ? (
                      <Heart className="h-4 w-4" />
                    ) : (
                      <HandHeart className="h-4 w-4" />
                    )}
                    <span>
                      {isOwnPost 
                        ? 'Your Post' 
                        : !currentUser 
                        ? 'Sign In' 
                        : post.type === 'HELP_REQUEST'
                        ? 'Offer Help'
                        : 'Request Help'
                      }
                    </span>
                  </span>
                </button>
              </div>
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
          onClick={refreshPosts}
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
        {sortedPosts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={currentUser}
          />
        ))}

        {sortedPosts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
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