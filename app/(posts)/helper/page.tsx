// app/helper/page.tsx
'use client'

import { useState } from 'react'
import { HeartIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import CreatePostForm from '@/components/post/CreatePostForm'

export default function HelperPage() {
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSuccess = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <HeartIcon className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Offer Help</h1>
                  <p className="text-sm text-gray-600">Create a help offer (unlimited categories)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          Help offer created successfully!
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <CreatePostForm
            type="HELP_OFFER"
            onClose={() => window.history.back()}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  )
}