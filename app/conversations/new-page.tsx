'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/solid'
import Link from 'next/link'

const supabase = createClientComponentClient()

interface Conversation {
  id: string
  helper_id: string
  requester_id: string
  post_id: string
  last_message: string | null
  created_at: string
  updated_at: string
  post?: {
    id: string
    title: string
    type: 'HELP_REQUEST' | 'HELP_OFFER'
    status: string
    location: string
    region: string
  }
  helper?: {
    id: string
    name: string
    avatar_url?: string
  }
  requester?: {
    id: string
    name: string
    avatar_url?: string
  }
}

export default function ConversationsListPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (!session?.user) {
          router.push('/auth/signin')
          return
        }
        
        setCurrentUser(session.user)
      } catch (error) {
        console.error('Error getting user:', error)
        setError('Authentication failed')
        router.push('/auth/signin')
      }
    }
    getCurrentUser()
  }, [router])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch conversations where user is either helper or requester
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          post:posts(
            id,
            title,
            type,
            status,
            location,
            region
          )
        `)
        .or(`helper_id.eq.${currentUser.id},requester_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false })

      if (conversationsError) {
        console.error('Conversations query error:', conversationsError)
        throw conversationsError
      }

      // Get user profiles for each conversation
      const conversationsWithProfiles = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const [helperProfile, requesterProfile] = await Promise.all([
            getUserProfile(conversation.helper_id),
            getUserProfile(conversation.requester_id)
          ])

          return {
            ...conversation,
            helper: helperProfile,
            requester: requesterProfile
          }
        })
      )

      setConversations(conversationsWithProfiles)

    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  // Fetch conversations when user is available
  useEffect(() => {
    if (currentUser) {
      fetchConversations()
    }
  }, [currentUser])

  // Enhanced function to get REAL user profile info  
  const getUserProfile = async (userId: string) => {
    try {
      // If it's the current user, we have their data
      if (userId === currentUser?.id) {
        return {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || 
                currentUser.user_metadata?.name || 
                currentUser.email?.split('@')[0] || 
                'You',
          avatar_url: currentUser.user_metadata?.avatar_url || null
        }
      }
      
      // Try to get profile from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, full_name')
        .eq('id', userId)
        .single()

      if (profileData) {
        return {
          id: profileData.id,
          name: profileData.full_name || profileData.name || 'Community Member',
          avatar_url: profileData.avatar_url
        }
      }

      // Try to get from posts they created
      const { data: postData } = await supabase
        .from('posts')
        .select('author_name')
        .eq('author_id', userId)
        .limit(1)
        .single()

      if (postData?.author_name) {
        return {
          id: userId,
          name: postData.author_name,
          avatar_url: null
        }
      }

      // Fallback
      return {
        id: userId,
        name: 'Community Member',
        avatar_url: null
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return {
        id: userId,
        name: 'User',
        avatar_url: null
      }
    }
  }

  const getOtherUser = (conversation: Conversation) => {
    if (!currentUser) return null
    
    return currentUser.id === conversation.helper_id 
      ? conversation.requester 
      : conversation.helper
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${diffInMinutes / 60 !== 1 ? 's' : ''} ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
            </div>
            <Link
              href="/feed"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto p-4">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-6">
              Start helping others or request help to begin conversations!
            </p>
            <Link
              href="/feed"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Help Posts
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              
              return (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 flex-shrink-0">
                        {otherUser?.avatar_url ? (
                          <img 
                            src={otherUser.avatar_url} 
                            alt="Avatar" 
                            className="rounded-full object-cover h-full w-full"
                          />
                        ) : (
                          <UserCircleIcon className="h-full w-full text-gray-300" />
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {otherUser?.name || 'Unknown User'}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatMessageTime(conversation.updated_at)}
                          </div>
                        </div>

                        {/* Post Context */}
                        {conversation.post && (
                          <p className="text-xs text-gray-600 mb-2">
                            About: <span className="font-medium">{conversation.post.title}</span>
                            <span className="text-gray-400"> • </span>
                            <span className="capitalize">{conversation.post.type.replace('_', ' ').toLowerCase()}</span>
                          </p>
                        )}

                        {/* Last Message */}
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
