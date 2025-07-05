'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

interface PostgresChangesPayload {
  new: {
    status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  }
  old: any
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

export function StatusTracker({ offerId }: { offerId: string }) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending')

  useEffect(() => {
    // Get initial status
    const getInitialStatus = async () => {
      const { data } = await supabase
        .from('help_offers')
        .select('status')
        .eq('id', offerId)
        .single()
      
      if (data && (data.status === 'pending' || data.status === 'accepted' || data.status === 'declined')) {
        setStatus(data.status)
      }
    }

    getInitialStatus()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`offer-${offerId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'help_offers',
        filter: `id=eq.${offerId}`
      }, (payload: PostgresChangesPayload) => {
        if (
          payload.new.status === 'pending' ||
          payload.new.status === 'accepted' ||
          payload.new.status === 'declined'
        ) {
          setStatus(payload.new.status)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe();
    };
  }, [offerId])

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${
        status === 'pending' ? 'bg-yellow-400 animate-pulse' :
        status === 'accepted' ? 'bg-green-400' :
        'bg-red-400'
      }`} />
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  )
}