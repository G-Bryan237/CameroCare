'use client'

import { useState, useEffect } from 'react'
import { DocumentTextIcon, PencilIcon, TrashIcon, EyeIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  description: string
  type: 'HELP_REQUEST' | 'HELP_OFFER'
  categories: string[]
  location: string
  region: string
  status: 'open' | 'in-progress' | 'completed'
  participant_count: number
  created_at: string
  updated_at: string
  is_urgent: boolean
}

export default function ManagePostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'HELP_REQUEST' | 'HELP_OFFER'>('all')

  useEffect(() => {
    fetchMyPosts()
  }, [])

  const fetchMyPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/posts/my-posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const filteredPosts = posts.filter(post => 
    activeTab === 'all' || post.type === activeTab
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/feed"
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Posts</h1>
                <p className="text-sm text-gray-600">View and manage your help requests and offers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-6 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('HELP_REQUEST')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'HELP_REQUEST' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            Help Requests ({posts.filter(p => p.type === 'HELP_REQUEST').length})
          </button>
          <button
            onClick={() => setActiveTab('HELP_OFFER')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'HELP_OFFER' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            Help Offers ({posts.filter(p => p.type === 'HELP_OFFER').length})
          </button>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">You haven't created any posts yet.</p>
            <div className="space-x-4">
              <Link
                href="/seeker"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Create Help Request
              </Link>
              <Link
                href="/helper"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Help Offer
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.type === 'HELP_REQUEST' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {post.type === 'HELP_REQUEST' ? 'Help Request' : 'Help Offer'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                      {post.is_urgent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories.map((category) => (
                        <span key={category} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                          {category}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📍 {post.location}, {post.region}</span>
                      <span>👥 {post.participant_count} participants</span>
                      <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-600 rounded-md hover:bg-yellow-50">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
