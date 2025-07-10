// src/components/Notifications.tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertCircle, MessageSquare, Heart, Clock, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: {
    postId?: string
    offerId?: string
    conversationId?: string
    helperName?: string
    requesterName?: string
    postTitle?: string
    isUrgent?: boolean
  }
  created_at: string
  read: boolean
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchNotifications()

      // Set up real-time listener for new notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          // Add new notification to the list
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => prev - 1)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.data) {
      if (notification.type.includes('help_offer') && notification.data.offerId) {
        router.push(`/offers/${notification.data.offerId}`)
      } else if (notification.type.includes('message') && notification.data.conversationId) {
        router.push(`/conversations/${notification.data.conversationId}`)
      } else if (notification.data.postId) {
        router.push(`/posts/${notification.data.postId}`)
      }
    }

    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes('help_offer')) return <Heart className="h-5 w-5 text-red-500" />
    if (type.includes('message')) return <MessageSquare className="h-5 w-5 text-blue-500" />
    if (type.includes('urgent')) return <AlertCircle className="h-5 w-5 text-orange-500" />
    if (type.includes('reminder')) return <Clock className="h-5 w-5 text-purple-500" />
    return <Calendar className="h-5 w-5 text-gray-500" />
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 sm:p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">
                  You'll be notified when someone interacts with your posts or when there are urgent help requests
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 ${
                    !notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  } cursor-pointer transition-colors`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      
                      {notification.data?.isUrgent && (
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex justify-between">
              <button 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                onClick={() => router.push('/notifications')}
              >
                View all
              </button>
              <button 
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                onClick={() => {
                  // Mark all as read
                  if (user && unreadCount > 0) {
                    supabase
                      .from('notifications')
                      .update({ read: true })
                      .eq('user_id', user.id)
                      .eq('read', false)
                      .then(() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                        setUnreadCount(0)
                      })
                  }
                }}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}