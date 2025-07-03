// src/components/post/PostActions.tsx
'use client'

import { useState } from 'react'
import { MoreVertical, Edit, Trash, X } from 'lucide-react'
import { formatDateTime } from '@/utils/dateTime'

interface PostActionsProps {
  id: string
  isAuthor: boolean
  onEdit: () => void
  onDelete: () => Promise<void>
}

export default function PostActions({ id, isAuthor, onEdit, onDelete }: PostActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true)
      try {
        await onDelete()
      } finally {
        setIsDeleting(false)
        setShowMenu(false)
      }
    }
  }

  const currentDateTime = '2025-01-17 16:22:00' // Using the provided timestamp

  if (!isAuthor) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <MoreVertical className="h-5 w-5 text-gray-500" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onEdit()
                setShowMenu(false)
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Post
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
            >
              <Trash className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}