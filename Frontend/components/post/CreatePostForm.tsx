// src/components/post/CreatePostForm.tsx
'use client'

import { useState } from 'react'
import { ASSISTANCE_CATEGORIES } from '@/types'
import { MapPin } from 'lucide-react'

interface CreatePostFormProps {
  type: 'HELP_REQUEST' | 'HELP_OFFER'
  onClose: () => void
  onSuccess: () => void
}

export default function CreatePostForm({ 
  type, 
  onClose, 
  onSuccess,
}: CreatePostFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [location, setLocation] = useState<{
    region: string;
    coordinates?: { lat: number; lng: number };
  }>({ region: '' })

  const getCurrentUTCDateTime = () => {
    const now = new Date()
    return now.toISOString().slice(0, 19).replace('T', ' ')
  }

  const handleCategorySelection = (category: string) => {
    setSelectedCategories(prev => {
      // If category is already selected, remove it
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      }

      // For seeker page (HELP_REQUEST), limit to 3 categories
      if (type === 'HELP_REQUEST' && prev.length >= 3) {
        alert('You can only select up to 3 categories for help requests')
        return prev
      }

      // For helper page (HELP_OFFER), no limit on categories
      return [...prev, category]
    })
  }

 
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')

  const formData = new FormData(e.currentTarget)
  
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.get('title'),
        description: formData.get('description'),
        categories: selectedCategories,
        location: formData.get('location'),
        region: location.region,
        coordinates: location.coordinates,
        type,
        author: 'G-Bryan237', // Current user's login
        createdAt: '2025-01-25 05:03:28' // Current UTC time
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create post')
    }

    onSuccess()
    onClose()
  } catch (err) {
    setError('Failed to create post. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }))
      },
      () => {
        setError('Unable to retrieve your location')
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Display post type and category limit information */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
        {type === 'HELP_REQUEST' 
          ? 'Help Request - Select up to 3 categories'
          : 'Help Offer - Select any number of categories'
        }
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          name="title"
          type="text"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          required
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Categories {type === 'HELP_REQUEST' && `(${selectedCategories.length}/3)`}
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ASSISTANCE_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategorySelection(category)}
              className={`p-2 text-sm rounded-md text-left ${
                selectedCategories.includes(category)
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Region
          </label>
          <select
            value={location.region}
            onChange={(e) => setLocation(prev => ({ ...prev, region: e.target.value }))}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select region...</option>
            <option value="Adamaoua">Adamaoua</option>
            <option value="Centre">Centre</option>
            <option value="East">East</option>
            <option value="Far North">Far North</option>
            <option value="Littoral">Littoral</option>
            <option value="North">North</option>
            <option value="Northwest">Northwest</option>
            <option value="South">South</option>
            <option value="Southwest">Southwest</option>
            <option value="West">West</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Specific Location
          </label>
          <div className="mt-1 flex">
            <input
              name="location"
              type="text"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleLocationRequest}
              className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
            >
              <MapPin className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || selectedCategories.length === 0}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {isLoading ? 'Creating...' : 'Create Post'}
        </button>
      </div>
    </form>
  )
}