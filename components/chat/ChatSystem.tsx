// src/components/chat/ChatSystem.tsx
'use client'

import { useState, useEffect, useRef } from 'react'

// Helper function to format date and time
const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}
import { Send, PaperclipIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  attachments?: string[]
}

interface ChatProps {
  recipientId: string
  id: string
}

export default function Chat({ recipientId, id }: ChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Poll for new messages
    return () => clearInterval(interval)
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${id}/${recipientId}`)
      const data = await response.json()
      setMessages(data)
      scrollToBottom()
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          recipientId,
          content: newMessage,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.senderId === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-75">
                {formatDateTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <PaperclipIcon className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}