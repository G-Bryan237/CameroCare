'use client'

import { Bell, MapPin } from 'lucide-react'
import FeedPost from './FeedPost'
import { useState } from 'react'

interface NewsFeedProps {
  role: "helper" | "seeker" | null;
}

const INITIAL_POSTS = [
  {
    id: "1",
    author: "Sarah Chen",
    isAnonymous: false,
    location: "Downtown Seattle",
    categories: ["housing", "food"],
    description: "Offering temporary shelter and meals for up to 3 people affected by the recent flooding. Safe, warm space available with private bathroom.",
    likes: 24,
    volunteers: [
      { name: "Michael Brown", message: "Available to help with transportation if needed" },
      { name: "Emma Wilson", message: "I can contribute additional supplies" }
    ],
    timestamp: "2 hours ago"
  }
]

export default function NewsFeed({ role }: NewsFeedProps) {
  const [posts, setPosts] = useState(INITIAL_POSTS)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Support Network</h2>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-900">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-900">
            <MapPin className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}