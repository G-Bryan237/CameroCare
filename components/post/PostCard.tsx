// components/post/PostCard.tsx
"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Post {
  post: {
    id?: string
    title: string
    content: string
    authorName?: string | null
    authorImage?: string | null
    authorEmail?: string | null
    createdAt: Date | string
    updatedAt?: Date | string
  }
}

interface PostCardProps {
    post: Post
    currentUser: {
      email?: string | null
      name?: string | null
      image?: string | null
    }
    onVolunteer: () => Promise<void>
  }

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          {post.post.authorImage ? (
            <Image
              src={post.post.authorImage}
              alt={`${post.post.authorName}'s avatar`}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">
                {post.post.authorName?.[0] || 'U'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">{post.post.authorName || 'Anonymous'}</p>
            <p className="text-sm text-gray-500">
              {new Date(post.post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Link href={`/posts/${post.post.id}`}>
          <h3 className="text-xl font-semibold mb-2 hover:text-blue-600 transition-colors">
            {post.post.title}
          </h3>
        </Link>

        <p className="text-gray-600 line-clamp-3">
          {post.post.content}
        </p>

        <div className="mt-4 flex justify-between items-center">
          <Link
            href={`/posts/${post.post.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Read more
          </Link>
          {post.post.updatedAt && post.post.updatedAt !== post.post.createdAt && (
            <span className="text-xs text-gray-500">
              Updated {new Date(post.post.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}