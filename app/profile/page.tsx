// src/app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RequestCard from '@/components/RequestCard'
import OfferCard from '@/components/OfferCard'

interface UserProfile {
  login: string
  name: string
  image?: string
  helpOffered: number
  helpReceived: number
  activeRequests: Array<any>
  activeOffers: Array<any>
}

export default function ProfilePage() {
  const { currentUser } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${currentUser.login}`)
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              {profile?.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <span className="text-2xl font-bold text-blue-600">
                  {profile?.name?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <p className="text-gray-500">@{profile?.login}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.helpOffered}
              </div>
              <div className="text-sm text-gray-500">Help Offered</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.helpReceived}
              </div>
              <div className="text-sm text-gray-500">Help Received</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="border-t border-gray-200">
            <TabsTrigger value="requests" className="w-1/2">
              Active Requests
            </TabsTrigger>
            <TabsTrigger value="offers" className="w-1/2">
              Active Offers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="requests">
            <div className="p-6">
              {profile?.activeRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="offers">
            <div className="p-6">
              {profile?.activeOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}