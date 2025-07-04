// src/app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RequestCard from '@/components/RequestCard'
import OfferCard from '@/components/OfferCard'
import { PencilIcon, CheckIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'

interface UserProfile {
  id: string
  name: string
  email: string
  image?: string
  helpOffered: number
  helpReceived: number
  activeRequests: Array<any>
  activeOffers: Array<any>
  bookmarkedPosts: Array<any>
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return
    
    try {
      setError(null)
      const response = await fetch(`/api/users/${user.id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }
      
      const data = await response.json()
      setProfile(data)
      setEditForm({ name: data.name, email: data.email })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form if canceling
      setEditForm({ name: profile?.name || '', email: profile?.email || '' })
    }
    setIsEditing(!isEditing)
  }

  const handleUpdateProfile = async () => {
    if (!user || !profile) return
    
    setUpdateLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        email: editForm.email
      } : null)
      
      setIsEditing(false)
      alert('Profile updated successfully!')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setUpdateLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchProfile}
            className="mt-2 text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center mb-6 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back
      </button>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
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
                    {profile?.name?.charAt(0) || user?.email?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))
                      }
                      className="text-2xl font-bold text-gray-900 border border-gray-300 rounded-md px-2 py-1 w-full"
                      placeholder="Enter your name"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))
                      }
                      className="text-gray-500 border border-gray-300 rounded-md px-2 py-1 w-full"
                      placeholder="Enter your email"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profile?.name || user?.email}</h1>
                    <p className="text-gray-500">{profile?.email}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updateLoading}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    {updateLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.helpOffered || 0}
              </div>
              <div className="text-sm text-gray-500">Help Offered</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.helpReceived || 0}
              </div>
              <div className="text-sm text-gray-500">Help Received</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="border-t border-gray-200">
            <TabsTrigger value="requests" className="w-1/3">
              Active Requests ({profile?.activeRequests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="offers" className="w-1/3">
              Active Offers ({profile?.activeOffers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="w-1/3">
              Bookmarked ({profile?.bookmarkedPosts?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests">
            <div className="p-6">
              {profile?.activeRequests?.length ? (
                <div className="space-y-4">
                  {profile.activeRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No active help requests</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="offers">
            <div className="p-6">
              {profile?.activeOffers?.length ? (
                <div className="space-y-4">
                  {profile.activeOffers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No active help offers</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="bookmarks">
            <div className="p-6">
              {profile?.bookmarkedPosts?.length ? (
                <div className="space-y-4">
                  {profile.bookmarkedPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.type === 'HELP_REQUEST' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {post.type === 'HELP_REQUEST' ? 'Help Request' : 'Help Offer'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {post.categories?.map((category: string) => (
                          <span key={category} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No bookmarked posts</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}