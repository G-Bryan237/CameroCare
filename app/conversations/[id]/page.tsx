'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ArrowLeftIcon, 
  PaperAirplaneIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid'
import Link from 'next/link'

const supabase = createClientComponentClient()

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  message_text: string
  created_at: string
  is_read: boolean
  sender?: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface Conversation {
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
    location: string
    region: string
  }
  helper?: {
    id: string
    name: string
    avatar_url?: string
    user_metadata?: Record<string, unknown>
  }
  requester?: {
    id: string
    name: string
    avatar_url?: string
    user_metadata?: Record<string, unknown>
  }
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  
  // Better parameter validation
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id
  
  // Add validation to ensure we have a valid UUID
  useEffect(() => {
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversation ID:', conversationId)
      router.push('/conversations')
      return
    }
  }, [conversationId, router])

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Helper function to get user profile info
  const getUserProfile = useCallback(async (userId: string) => {
    try {
      // If it's the current user, we have their data
      if (userId === currentUser?.id) {
        return {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || 
                currentUser.user_metadata?.name || 
                currentUser.user_metadata?.first_name + ' ' + currentUser.user_metadata?.last_name ||
                currentUser.email?.split('@')[0] || 
                'You',
          avatar_url: currentUser.user_metadata?.avatar_url || null
        }
      }
      
      // Try to get profile from profiles table (only use existing columns)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', userId)
        .single()

      if (profileData) {
        return {
          id: profileData.id,
          name: profileData.name || 'Community Member',
          avatar_url: profileData.avatar_url
        }
      }
      
      // Fallback for users not in profiles table
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
  }, [currentUser])

  const getOtherUser = useCallback(() => {
    if (!conversation || !currentUser) return null
    
    return currentUser.id === conversation.helper_id 
      ? conversation.requester 
      : conversation.helper
  }, [conversation, currentUser])

  const markUnreadMessagesAsRead = useCallback(async () => {
    try {
      const unreadMessages = messages.filter(
        msg => msg.sender_id !== currentUser?.id && !msg.is_read
      )

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id)
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', messageIds)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [messages, currentUser])

  const fetchConversationData = useCallback(async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      setError(null)

      // Fetch conversation with post data only
      const { data: conversationData, error: conversationError } = await supabase
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
        .eq('id', conversationId)
        .single()

      if (conversationError) {
        console.error('Conversation query error:', conversationError)
        throw conversationError
      }

      // Check if current user is part of this conversation
      if (conversationData.helper_id !== currentUser.id && conversationData.requester_id !== currentUser.id) {
        setError('You do not have access to this conversation')
        router.push('/conversations')
        return
      }

      // Get helper and requester profiles separately
      const [helperProfile, requesterProfile] = await Promise.all([
        getUserProfile(conversationData.helper_id),
        getUserProfile(conversationData.requester_id)
      ])

      // Add profiles to conversation data
      const conversationWithProfiles = {
        ...conversationData,
        helper: helperProfile,
        requester: requesterProfile
      }
      setConversation(conversationWithProfiles)

      // Get initial last seen for the other user from presence or set default
      const otherUserId = conversationData.helper_id === currentUser.id 
        ? conversationData.requester_id 
        : conversationData.helper_id
      
      // For now, we'll rely on presence tracking for last seen
      console.log('Other user ID for presence tracking:', otherUserId)

      // Fetch messages with sender info
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Messages query error:', messagesError)
        throw messagesError
      }
      
      // Get sender profiles for messages
      const messagesWithSenders = await Promise.all(
        (messagesData || []).map(async (message) => {
          const senderProfile = await getUserProfile(message.sender_id)
          return {
            ...message,
            sender: senderProfile
          }
        })
      )
      
      setMessages(messagesWithSenders)

    } catch (error) {
      console.error('Error fetching conversation:', error)
      setError('Failed to load conversation')
      setTimeout(() => router.push('/conversations'), 3000)
    } finally {
      setLoading(false)
    }
  }, [currentUser, conversationId, router, getUserProfile])

  // Fetch conversation and messages
  useEffect(() => {
    if (currentUser) {
      fetchConversationData()
    }
  }, [currentUser, conversationId, fetchConversationData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUser || !conversationId) return

    let messagesSubscription: ReturnType<typeof supabase.channel> | null = null
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscriptions = async () => {
      try {
        setConnectionStatus('connecting')

        // Subscribe to new messages
        messagesSubscription = supabase
          .channel(`messages:${conversationId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          }, async (payload) => {
            const newMessage = payload.new as Message
            
            // Fetch sender info for the new message
            if (newMessage.sender_id !== currentUser.id) {
              const { data: senderData } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', newMessage.sender_id)
                .single()
              
              newMessage.sender = senderData ?? undefined
            }
            
            setMessages(prev => {
              // Prevent duplicate messages
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })

            // Mark message as read if we're the recipient
            if (newMessage.sender_id !== currentUser.id) {
              markMessageAsRead(newMessage.id)
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          }, (payload) => {
            const updatedMessage = payload.new as Message
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            )
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected')
            } else if (status === 'CHANNEL_ERROR') {
              setConnectionStatus('disconnected')
              setError('Connection lost. Trying to reconnect...')
            }
          })

        // Presence tracking - Use global presence channel matching the list page
        presenceChannel = supabase
          .channel('online_users', {
            config: {
              presence: {
                key: currentUser.id,
              },
            },
          })
          .on('presence', { event: 'sync' }, () => {
            if (!presenceChannel) return
            const state = presenceChannel.presenceState()
            const otherUserId = getOtherUser()?.id
            
            // Check if other user is in the presence state
            const isOnline = !!otherUserId && !!state[otherUserId] && state[otherUserId].length > 0
            
            console.log('Presence sync - Other user ID:', otherUserId, 'Is online:', isOnline, 'State:', state)
            setOtherUserOnline(isOnline)
            
            // If user is online, clear last seen
            if (isOnline) {
              setOtherUserLastSeen(null)
            }
          })
          .on('presence', { event: 'join' }, ({ key }) => {
            const otherUserId = getOtherUser()?.id
            console.log('User joined presence:', key, 'Other user ID:', otherUserId)
            
            if (key === otherUserId) {
              setOtherUserOnline(true)
              setOtherUserLastSeen(null)
            }
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            const otherUserId = getOtherUser()?.id
            console.log('User left presence:', key, 'Other user ID:', otherUserId)
            
            if (key === otherUserId) {
              setOtherUserOnline(false)
              // Set last seen to current time when they leave
              setOtherUserLastSeen(new Date().toISOString())
            }
          })
          .subscribe(async (status) => {
            console.log('Presence subscription status:', status)
            if (status === 'SUBSCRIBED' && presenceChannel) {
              const now = new Date().toISOString()
              console.log('Tracking presence for user:', currentUser.id)
              
              await presenceChannel.track({
                user_id: currentUser.id,
                user_name: currentUser.user_metadata?.full_name || 
                          currentUser.user_metadata?.name || 
                          currentUser.email?.split('@')[0] || 
                          'User',
                online_at: now,
                avatar_url: currentUser.user_metadata?.avatar_url || null
              })
            }
          })

      } catch (error) {
        console.error('Error setting up subscriptions:', error)
        setConnectionStatus('disconnected')
        setError('Failed to connect to chat')
      }
    }

    setupSubscriptions()

    // Update last seen when user leaves the page
    const handleBeforeUnload = async () => {
      console.log('User leaving page')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (messagesSubscription) {
        messagesSubscription.unsubscribe()
      }
      if (presenceChannel) {
        presenceChannel.unsubscribe()
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      // Update last seen when component unmounts
      if (currentUser) {
        console.log('Component unmounting for user:', currentUser.id)
      }
    }
  }, [currentUser, conversationId, getOtherUser])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Mark a single message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Mark messages as read when conversation loads
  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      markUnreadMessagesAsRead()
    }
  }, [messages, currentUser, markUnreadMessagesAsRead])

const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !currentUser) return

    const messageText = newMessage.trim()
    setSending(true)
    setNewMessage('')

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          message_text: messageText,
          is_read: false
        })
        .select('*')
        .single()

      if (error) throw error

      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      messageInputRef.current?.focus()

    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes === 1) return '1 minute ago'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 120) return '1 hour ago'
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    if (diffInMinutes < 2880) return '1 day ago'
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} days ago`
    return date.toLocaleDateString()
  }

  const otherUser = getOtherUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/conversations"
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Back to conversations"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              
              {otherUser && (
                <div className="flex items-center space-x-3">
                  <div>
                    {otherUser.avatar_url ? (
                      <img
                        src={otherUser.avatar_url}
                        alt={otherUser.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {otherUser.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        {otherUser.name || 'User'}
                      </h1>
                      <div className="flex items-center space-x-2">
                        {otherUserOnline ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-green-600 font-medium text-sm">online</span>
                          </>
                        ) : otherUserLastSeen ? (
                          <span className="text-gray-500 text-sm">
                            last seen {formatLastSeen(otherUserLastSeen)}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">last seen recently</span>
                        )}
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* Post context */}
          {conversation?.post && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">About:</span>
                <Link
                  href={`/posts/${conversation.post.id}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  {conversation.post.title}
                </Link>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {conversation.post.location}, {conversation.post.region}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === currentUser?.id
              const showAvatar = !isOwn && (
                index === 0 || 
                messages[index - 1]?.sender_id !== message.sender_id
              )
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex space-x-2 max-w-xs lg:max-w-md ${
                    isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}>
                    {showAvatar && !isOwn && (
                      <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 shadow-sm border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                      <div className={`flex items-center justify-between mt-1 space-x-2 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isOwn && (
                          <div className="flex items-center">
                            {message.is_read ? (
                              <CheckCircleIcon className="h-3 w-3" title="Read" />
                            ) : (
                              <CheckIcon className="h-3 w-3" title="Sent" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || connectionStatus !== 'connected'}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || connectionStatus !== 'connected'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
          
          {connectionStatus !== 'connected' && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected - trying to reconnect...'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}