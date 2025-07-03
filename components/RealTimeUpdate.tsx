// src/components/RealTimeUpdates.tsx
'use client'

import { useEffect } from 'react'
import socket from '@/lib/socket'
import { useUser } from '@/contexts/UserContext'

interface UpdateEvent {
  type: 'NEW_POST' | 'NEW_VOLUNTEER' | 'POST_UPDATE'
  data: any
}

export default function RealTimeUpdates({ onUpdate }: { onUpdate: (event: UpdateEvent) => void }) {
  const { currentUser } = useUser()

  useEffect(() => {
    socket.connect()
    socket.emit('join', { userId: currentUser.login })

    socket.on('update', (event: UpdateEvent) => {
      onUpdate(event)
    })

    return () => {
      socket.disconnect()
    }
  }, [currentUser.login, onUpdate])

  return null
}
