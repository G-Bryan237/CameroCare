// src/components/RealTimeUpdates.tsx
'use client'

import { useEffect } from 'react'
import socket from '@/lib/socket'
import { MOCK_MODE } from '@/lib/mock-mode'
import { useAuth } from '@/contexts/AuthContext'

interface UpdateEvent {
  type: 'NEW_POST' | 'NEW_VOLUNTEER' | 'POST_UPDATE'
  data: any
}

export default function RealTimeUpdates({ onUpdate }: { onUpdate: (event: UpdateEvent) => void }) {
  const { user } = useAuth()

  useEffect(() => {
    if (MOCK_MODE || !user) return

    socket.connect()
    socket.emit('join', { userId: user.id })

    socket.on('update', (event: UpdateEvent) => {
      onUpdate(event)
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id, onUpdate])

  return null
}
