// app/helper/page.tsx
'use client'

import { useState } from 'react'
import { MapPin, Share2, Crosshair } from 'lucide-react'
import Image from 'next/image'
import { ASSISTANCE_CATEGORIES } from '@/types/index'
import { CategorySelector } from '@/components/CategorySelector'

export default function HelperPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [location, setLocation] = useState<{
    address: string;
    area: string;
    coordinates?: { lat: number; lng: number };
  }>({ address: '', area: '' })
  
  // ... (same location handling functions as seeker page)

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
        type: 'helper',
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
      alert('Your helper post has been created successfully!')
    } catch (error) {
      alert('Failed to create post. Please try again.')
      console.error('Post creation error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white py-6 mb-8 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Image
              src="/helper-logo.png"
              alt="Helper"
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Want to Help?</h1>
              <p className="text-gray-500 text-sm">Select up to 7 categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-8">
        <CategorySelector
          categories={ASSISTANCE_CATEGORIES}
          maxCategories={7}
          selectedCategories={selectedCategories}
          onCategorySelect={setSelectedCategories}
          role="helper"
        />

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* ... (same location section as seeker page) */}
        </div>

        {/* Post Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={handlePost}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-colors"
          >
            <Share2 className="h-5 w-5" />
            Post Helper Offer
          </button>
        </div>
      </div>
    </div>
  )
}