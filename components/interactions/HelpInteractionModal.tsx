'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, HeartIcon, HandRaisedIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Post {
  id: string
  title: string
  description: string
  type: 'HELP_REQUEST' | 'HELP_OFFER'
  categories: string[]
  location: string
  region: string
  urgency_level?: number
  estimated_duration?: string
  author: {
    id: string
    name: string
    avatar_url?: string
  }
  created_at: string
}

interface HelpInteractionModalProps {
  post: Post
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
  onSuccess: () => void
}

const PRE_FILLED_MESSAGES = {
  offer_help: [
    "I'd love to help with this! I have experience in this area.",
    "I'm available and would be happy to assist you.",
    "This sounds like something I can definitely help with. Let me know!",
    "I have some free time and would like to contribute to this.",
    "I'm interested in helping out. When would be a good time?"
  ],
  request_help: [
    "Hi! I'm interested in getting help with this. Are you available?",
    "This looks exactly like what I need help with. Can we discuss?",
    "I would really appreciate your assistance with this.",
    "Your offer sounds perfect for my situation. Can you help?",
    "I'm looking for help and your post caught my attention."
  ]
}

export default function HelpInteractionModal({ 
  post, 
  isOpen, 
  onClose, 
  currentUser, 
  onSuccess 
}: HelpInteractionModalProps) {
  const [step, setStep] = useState<'details' | 'message' | 'confirmation'>('details')
  const [selectedMessage, setSelectedMessage] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authorProfile, setAuthorProfile] = useState<any>(null)
  const [showAuthorImage, setShowAuthorImage] = useState(false)

  const interactionType = post.type === 'HELP_REQUEST' ? 'offer_help' : 'request_help'
  const isOffering = interactionType === 'offer_help'

  useEffect(() => {
    if (isOpen) {
      fetchAuthorProfile()
      setStep('details')
      setSelectedMessage('')
      setCustomMessage('')
      setShowAuthorImage(false)
    }
  }, [isOpen, post.author.id])

  const fetchAuthorProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', post.author.id)
        .single()

      if (profile) {
        setAuthorProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching author profile:', error)
    }
  }

  const handleSubmitInteraction = async () => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      const message = customMessage || selectedMessage
      const helperId = isOffering ? currentUser.id : post.author.id
      const requesterId = isOffering ? post.author.id : currentUser.id

      const { data, error } = await supabase.rpc('create_help_interaction', {
        p_post_id: post.id,
        p_helper_id: helperId,
        p_requester_id: requesterId,
        p_interaction_type: interactionType,
        p_message: customMessage || null,
        p_pre_filled_message: selectedMessage || null
      })

      if (error) throw error

      setStep('confirmation')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error creating interaction:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getUrgencyColor = (level?: number) => {
    switch (level) {
      case 5: return 'text-red-600 bg-red-100'
      case 4: return 'text-orange-600 bg-orange-100'
      case 3: return 'text-yellow-600 bg-yellow-100'
      case 2: return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getUrgencyText = (level?: number) => {
    switch (level) {
      case 5: return 'Critical'
      case 4: return 'High'
      case 3: return 'Medium'
      case 2: return 'Low'
      default: return 'Normal'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {isOffering ? (
              <HeartIcon className="h-6 w-6 text-red-600" />
            ) : (
              <HandRaisedIcon className="h-6 w-6 text-blue-600" />
            )}
            <h2 className="text-xl font-semibold">
              {isOffering ? 'Offer Help' : 'Request Help'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'details' && (
            <div className="space-y-6">
              {/* Post Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{post.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories.map((category) => (
                        <span key={category} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {category}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {post.location}, {post.region}
                      </div>
                      {post.estimated_duration && (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {post.estimated_duration}
                        </div>
                      )}
                      {post.urgency_level && post.urgency_level > 2 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(post.urgency_level)}`}>
                          {getUrgencyText(post.urgency_level)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Author Profile */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {showAuthorImage && authorProfile?.avatar_url ? (
                      <img
                        src={authorProfile.avatar_url}
                        alt={post.author.name}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-white">
                          {post.author.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {!showAuthorImage && authorProfile?.show_avatar && (
                      <button
                        onClick={() => setShowAuthorImage(true)}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white text-xs hover:bg-opacity-40 transition-all"
                      >
                        Show
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{post.author.name}</h4>
                      {authorProfile?.is_verified && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {authorProfile && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Trust Score: {(authorProfile.trust_score * 100).toFixed(0)}%</p>
                        <p>{authorProfile.total_helps_given} helps given • {authorProfile.total_helps_received} helps received</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setStep('message')}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isOffering
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isOffering ? 'Continue to Offer Help' : 'Continue to Request Help'}
              </button>
            </div>
          )}

          {step === 'message' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">
                  {isOffering ? 'How would you like to help?' : 'Send your request'}
                </h3>
                <p className="text-gray-600 text-sm">
                  Choose a message or write your own
                </p>
              </div>

              {/* Pre-filled Messages */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Quick Messages:</h4>
                {PRE_FILLED_MESSAGES[interactionType].map((message, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMessage(message)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMessage === message
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm text-gray-700">{message}</p>
                  </button>
                ))}
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or write a custom message:
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Write your personalized message here..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitInteraction}
                  disabled={!selectedMessage && !customMessage.trim() || isLoading}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    isOffering
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLoading ? 'Sending...' : (isOffering ? 'Offer Help' : 'Send Request')}
                </button>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <HeartIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">
                {isOffering ? 'Help Offered!' : 'Request Sent!'}
              </h3>
              <p className="text-gray-600">
                {isOffering 
                  ? 'Your offer has been sent. You\'ll be notified when they respond.'
                  : 'Your request has been sent. You\'ll be notified when they respond.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
