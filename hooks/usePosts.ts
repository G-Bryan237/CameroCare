'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

interface Post {
  id: string
  type: 'HELP_REQUEST' | 'HELP_OFFER'
  title: string
  description: string
  categories: string[]
  location?: string
  region?: string
  is_urgent?: boolean
  status?: 'open' | 'in-progress' | 'completed'
  participant_count?: number
  bookmarks?: number
  shares?: number
  created_at: string
  author_id: string
  author?: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface UsePostsOptions {
  type?: 'help' | 'offer'
  categories?: string[] | null
  excludeOwnPosts?: boolean
  currentUser?: User | null
}

export function usePosts({
  type,
  categories,
  excludeOwnPosts = false,
  currentUser
}: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [type, categories, excludeOwnPosts, currentUser?.id])

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      // Map type to API format
      if (type === 'help') {
        params.append('type', 'help')
      } else if (type === 'offer') {
        params.append('type', 'offer')
      }
      
      // Add category filter if specified
      if (categories && categories.length > 0 && categories[0] !== 'All') {
        params.append('category', categories[0])
      }

      // Add exclude own posts parameter
      if (excludeOwnPosts && currentUser) {
        params.append('excludeUserId', currentUser.id)
      }

      const response = await fetch(`/api/posts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }
      
      const data = await response.json()
      const postsArray = Array.isArray(data) ? data : []
      
      // Client-side filtering for own posts if needed
      let filteredPosts = postsArray
      if (excludeOwnPosts && currentUser) {
        filteredPosts = postsArray.filter(post => post.author_id !== currentUser.id)
      }
      
      setPosts(filteredPosts)
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const refreshPosts = () => {
    fetchPosts()
  }

  return {
    posts,
    loading,
    error,
    refreshPosts
  }
}