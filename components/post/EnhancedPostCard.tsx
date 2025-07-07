'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Share2, 
  Bookmark,
  Users,
  CheckCircle,
  Clock,
  X,
  Heart,
  AlertTriangle,
  Shield,
  Star
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

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
  interaction_count?: number
  participant_count?: number
  bookmarks?: number
  shares?: number
  created_at: string
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
  onInteraction?: () => void
}

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
                  <span>{post.location}</span>
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

export default function EnhancedPostCard({ post, currentUser }: PostCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [localShares, setLocalShares] = useState(post.shares || 0)
  const [showOfferHelpModal, setShowOfferHelpModal] = useState(false)
  const router = useRouter()

  const isOwnPost = currentUser && post.author_id === currentUser.id
  const canOfferHelp = currentUser && !isOwnPost && post.type === 'HELP_REQUEST'

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

  const handleActionButton = () => {
    if (canOfferHelp) {
      setShowOfferHelpModal(true)
    } else if (post.type === 'HELP_REQUEST') {
      // Handle other cases (sign in, own post, etc.)
      if (!currentUser) {
        router.push('/auth/signin')
      }
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow post-card-hover">
        {post.is_urgent && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-center flex items-center justify-center space-x-2">
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Urgent Request - Help Needed Now</span>
            <span className="sm:hidden">Urgent</span>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {/* Header with enhanced mobile layout */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0 relative">
                {authorInfo.avatar_url ? (
                  <img
                    src={authorInfo.avatar_url}
                    alt={authorInfo.name}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${
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
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{authorInfo.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                    <span className="text-xs sm:text-sm text-gray-600">4.8</span>
                  </div>
                  {isOwnPost && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      <span className="hidden sm:inline">Your Post</span>
                      <span className="sm:hidden">Mine</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{post.location}</span>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{formatDateTime(post.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content with improved mobile spacing */}
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h2>
            <p className="text-gray-600 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 mb-3">{post.description}</p>
            
            {/* Categories with responsive layout */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {post.categories?.slice(0, 3).map((category, index) => (
                <span 
                  key={index} 
                  className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium ${
                    post.type === 'HELP_REQUEST' 
                      ? 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {category}
                </span>
              ))}
              {post.categories && post.categories.length > 3 && (
                <span className="px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-500">
                  +{post.categories.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Actions with enhanced mobile layout */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">{post.participant_count || 0}</span>
                <span className="text-xs hidden sm:inline">interested</span>
              </div>
              <button className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500 hover:text-yellow-500 transition-colors">
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">{post.bookmarks || 0}</span>
              </button>
              <button className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">{localShares}</span>
              </button>
            </div>

            {/* Action Button with improved responsive design */}
            {post.type === 'HELP_REQUEST' && (
              <div className="relative">
                <button 
                  onClick={handleActionButton}
                  disabled={isOwnPost || !currentUser}
                  className={`px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm text-white rounded-lg font-medium transition-all touch-feedback ${
                    isOwnPost 
                      ? 'bg-gray-400 cursor-not-allowed'
                      : !currentUser
                      ? 'bg-gray-400 cursor-pointer hover:bg-gray-500'
                      : 'bg-red-600 hover:bg-red-700 hover:shadow-lg transform hover:scale-105'
                  }`}
                  title={
                    isOwnPost 
                      ? "You cannot offer help on your own post"
                      : !currentUser
                      ? "Sign in to offer help"
                      : "Offer help to this person"
                  }
                >
                  <span className="flex items-center space-x-1.5 sm:space-x-2">
                    <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>
                      {isOwnPost 
                        ? 'Your Post' 
                        : !currentUser 
                        ? 'Sign In to Help' 
                        : 'Offer Help'
                      }
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </>
  )
}
