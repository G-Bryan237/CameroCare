// src/components/FeedPost.tsx
'use client'

import { useState } from 'react'
import { Heart, Share2, MessageCircle, MapPin, EyeOff } from 'lucide-react'
import type { Post } from '@/types/Post'

interface FeedPostProps {
  post: Post
}

export default function FeedPost({ post }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [showVolunteers, setShowVolunteers] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {post.isAnonymous ? (
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <EyeOff className="h-5 w-5 text-gray-400" />
              </div>
            ) : (
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {post.author.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {post.isAnonymous ? 'Anonymous Helper' : post.author}
                </h3>
                <span className="text-sm text-gray-500">• {post.timestamp}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {post.location}
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-600">{post.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {post.categories.map(category => (
              <span
                key={category}
                className="px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-500' : 'text-gray-500'
              } hover:text-red-500 transition-colors`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likes + (isLiked ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => setShowVolunteers(!showVolunteers)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{post.volunteers.length}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Share</span>
            </button>
          </div>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Volunteer
          </button>
        </div>

        {/* Volunteers Section */}
        {showVolunteers && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-4">Volunteers</h4>
            <div className="space-y-4">
              {post.volunteers.map((volunteer, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {volunteer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{volunteer.name}</p>
                    <p className="text-sm text-gray-600">{volunteer.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}