'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const supabase = createClientComponentClient()

interface ConversationItem {
  id: string
  helper_id: string
  requester_id: string
  post_id: string
  last_message: string
  created_at: string
  updated_at: string
  post?: {
    id: string
    title: string
    type: 'HELP_REQUEST' | 'HELP_OFFER'
    status: string
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
  unread_count?: number
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
        router.push('/auth/signin')
      }
    }
    getCurrentUser()
  }, [router])

  useEffect(() => {
    if (currentUser) {
      fetchConversations()
      setupRealtimeSubscription()
    }
  }, [currentUser])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          post:posts(
            id,
            title,
            type,
            status
          )
        `)
        .or(`helper_id.eq.${currentUser.id},requester_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false })

      if (conversationsError) throw conversationsError

      // Get profiles for helper and requester for each conversation
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

      // Get unread message counts for each conversation
      const conversationsWithUnread = await Promise.all(
        conversationsWithProfiles.map(async (conversation) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser.id)

          return {
            ...conversation,
            unread_count: count || 0
          }
        })
      )

      setConversations(conversationsWithUnread)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('conversations_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `helper_id=eq.${currentUser.id}`
      }, () => {
        fetchConversations()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `requester_id=eq.${currentUser.id}`
      }, () => {
        fetchConversations()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const getOtherUser = (conversation: ConversationItem) => {
    return currentUser.id === conversation.helper_id 
      ? conversation.requester 
      : conversation.helper
  }

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInDays < 7) return `${diffInDays}d`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  // Helper function to get user profile info
  const getUserProfile = async (userId: string) => {
    try {
      // If it's the current user, we have their data
      if (userId === currentUser?.id) {
        return {
          id: currentUser.id,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'You',
          avatar_url: currentUser.user_metadata?.avatar_url || null
        }
      }
      
      // For other users, use fallback
      return {
        id: userId,
        name: 'User',
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
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchConversations}
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
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Back to home"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Conversations</h1>
                <p className="text-sm text-gray-600">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-4">
              Start helping others or request help to begin conversations.
            </p>
            <div className="space-x-4">
              <Link
                href="/seeker"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Request Help
              </Link>
              <Link
                href="/helper"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Offer Help
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              const isHelper = currentUser.id === conversation.helper_id

              return (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="block border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        {otherUser?.avatar_url ? (
                          <img
                            src={otherUser.avatar_url}
                            alt={otherUser.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        {/* Unread indicator */}
                        {(conversation.unread_count || 0) > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread_count! > 9 ? '9+' : conversation.unread_count}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {otherUser?.name || 'Unknown User'}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isHelper 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {isHelper ? 'Helper' : 'Requester'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatLastMessageTime(conversation.updated_at)}</span>
                          </div>
                        </div>

                        {/* Post context */}
                        {conversation.post && (
                          <p className="text-xs text-gray-500 mb-1">
                            About: <span className="font-medium">{conversation.post.title}</span>
                          </p>
                        )}

                        {/* Last message */}
                        <p className={`text-sm truncate ${
                          (conversation.unread_count || 0) > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                        }`}>
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>

                      {/* Status indicator */}
                      <div className="flex-shrink-0">
                        {(conversation.unread_count || 0) > 0 ? (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                        )}
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