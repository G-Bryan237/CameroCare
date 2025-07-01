// app/seeker/page.tsx
'use client'

import { useState } from 'react'
import { MapPin, Share2, Crosshair } from 'lucide-react'
import Image from 'next/image'
import { ASSISTANCE_CATEGORIES } from '@/types'
import { CategorySelector } from '@/components/CategorySelector'

export default function SeekerPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [location, setLocation] = useState<{
    address: string;
    area: string;
    coordinates?: { lat: number; lng: number };
  }>({ address: '', area: '' })
  const [isLocating, setIsLocating] = useState(false)

  // ... (keep existing location handling functions)

  const handlePost = async () => {
    // Validate the form
    if (selectedCategories.length === 0) {
      alert('Please select at least one category')
      return
    }
    if (!location.address || !location.area) {
      alert('Please provide your location details')
      return
    }

    try {
      // Create the post data
      const postData = {
        type: 'seeker',
        categories: selectedCategories,
        location,
        timestamp: new Date().toISOString(),
      }

      // Make API call to save the post
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) throw new Error('Failed to create post')

      // Reset form
      setSelectedCategories([])
      setLocation({ address: '', area: '' })
      
      // Show success message
      alert('Your help request has been posted successfully!')
    } catch (error) {
      alert('Failed to create post. Please try again.')
      console.error('Post creation error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white py-6 mb-8 shadow-sm">
        {/* ... (keep existing header) */}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 space-y-8">
        {/* Categories Section */}
        <CategorySelector
          categories={ASSISTANCE_CATEGORIES}
          maxCategories={3}
          selectedCategories={selectedCategories}
          onCategorySelect={setSelectedCategories}
          role="seeker"
        />

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* ... (keep existing location section) */}
        </div>

        {/* Post Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={handlePost}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-colors"
          >
            <Share2 className="h-5 w-5" />
            Post Help Request
          </button>
        </div>
      </div>
    </div>
  )
}