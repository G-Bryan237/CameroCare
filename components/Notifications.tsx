// src/components/Notifications.tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  type: 'VOLUNTEER_REQUEST' | 'REQUEST_ACCEPTED' | 'NEW_MESSAGE'
  message: string
  createdAt: string
  read: boolean
}

const formatDateTime = (dateTime: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Date(dateTime).toLocaleDateString(undefined, options)
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // Static data for demonstration
      const staticNotifications = [
        {
          id: '1',
          type: 'NEW_MESSAGE' as const,
          message: 'You have a new message from Emmanuel about your medical assistance offer',
          createdAt: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'REQUEST_ACCEPTED' as const,
          message: 'Your request for food assistance has been accepted by Marie',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: false
        },
        {
          id: '3',
          type: 'VOLUNTEER_REQUEST' as const,
          message: 'Jean wants to help with your education support request',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          read: true
        },
        {
          id: '4',
          type: 'NEW_MESSAGE' as const,
          message: 'New message regarding your transportation assistance request',
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          read: true
        }
      ];
      
      setNotifications(staticNotifications);
      setUnreadCount(staticNotifications.filter((n) => !n.read).length);
      
      /* Uncomment when API is ready
      const response = await fetch('/api/notifications')
      const data = await response.json()
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.read).length)
      */
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => prev - 1)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
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
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 ${
                    !notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  } cursor-pointer transition-colors`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 hover:underline">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}