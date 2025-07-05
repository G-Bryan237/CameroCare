'use client'

import { useState, useEffect } from 'react'
import { 
  X, ChevronLeft, ChevronRight, User, MessageSquare, 
  CheckCircle, Star, Shield, Award, Send, Heart, AlertTriangle, MapPin, Clock
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

interface OfferHelpModalProps {
  isOpen: boolean
  onClose: () => void
  post: any
  helper: any
  onSubmit: (offerData: any) => Promise<void>
}

export default function OfferHelpModal({ isOpen, onClose, post, helper, onSubmit }: OfferHelpModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [offerData, setOfferData] = useState({
    message: '',
    availability: '',
    contactMethod: 'platform',
    skillsOffered: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { number: 1, title: 'Review Request', icon: User },
    { number: 2, title: 'Your Profile', icon: Shield },
    { number: 3, title: 'Compose Message', icon: MessageSquare },
    { number: 4, title: 'Confirm & Send', icon: CheckCircle }
  ]

  const generateSmartMessage = () => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : 'afternoon'
    return `Hi! Good ${timeOfDay}. I saw your help request for "${post.title}" and I'd love to assist. I have experience with ${post.categories?.join(', ')} and I'm available to help. Let me know how we can connect!`
  }

  useEffect(() => {
    if (currentStep === 3 && !offerData.message) {
      setOfferData(prev => ({ ...prev, message: generateSmartMessage() }))
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(offerData)
      onClose()
    } catch (error) {
      console.error('Error submitting help offer:', error)
      alert('Failed to submit help offer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={onClose} />

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleBack} 
                className={`p-2 rounded-lg ${currentStep === 1 ? 'invisible' : 'hover:bg-gray-100'}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Offer Help</h2>
                <p className="text-sm text-gray-600">Step {currentStep} of 4</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step) => {
                const StepIcon = step.icon
                return (
                  <div key={step.number} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.number <= currentStep 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1 text-gray-600">{step.title}</span>
                  </div>
                )
              })}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && <ReviewRequestStep post={post} />}
            {currentStep === 2 && <HelperProfileStep helper={helper} />}
            {currentStep === 3 && <ComposeMessageStep offerData={offerData} setOfferData={setOfferData} />}
            {currentStep === 4 && <ConfirmStep post={post} helper={helper} offerData={offerData} />}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {currentStep === 4 ? 'Ready to send your help offer?' : 'Complete all steps to send your offer'}
            </div>
            
            <div className="flex space-x-3">
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Offer</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Components
function ReviewRequestStep({ post }: { post: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-red-600">
              {post.author_id ? 'CM' : 'Anonymous'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
            <p className="text-gray-700 mb-4">{post.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories?.map((category: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {category}
                </span>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <p className="text-gray-600">{post.location}, {post.region}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Posted:</span>
                <p className="text-gray-600">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {post.is_urgent && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">This is an urgent request</span>
          </div>
          <p className="text-orange-700 text-sm mt-1">The person needs help as soon as possible.</p>
        </div>
      )}
    </div>
  )
}

function HelperProfileStep({ helper }: { helper: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Helper Profile</h3>
        <p className="text-gray-600">This is how others will see you when you offer help</p>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-white">
                {helper.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-1">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="text-xl font-semibold text-gray-900">{helper.name}</h4>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-700">{helper.rating}</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{helper.bio}</p>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {helper.badges?.map((badge: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1">
                  <Award className="h-3 w-3" />
                  <span>{badge}</span>
                </span>
              ))}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-blue-600">{helper.helpCount}</div>
                <div className="text-xs text-gray-600">People Helped</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-green-600">{helper.responseTime}</div>
                <div className="text-xs text-gray-600">Avg Response</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-lg font-semibold text-orange-600">{helper.completionRate}%</div>
                <div className="text-xs text-gray-600">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComposeMessageStep({ offerData, setOfferData }: { offerData: any, setOfferData: Function }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Compose Your Message</h3>
        <p className="text-gray-600">Send a personalized message to introduce yourself and explain how you can help.</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            value={offerData.message}
            onChange={(e) => setOfferData((prev: any) => ({ ...prev, message: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Write your message..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Be specific about how you can help and when you're available.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Availability</label>
            <select
              value={offerData.availability}
              onChange={(e) => setOfferData((prev: any) => ({ ...prev, availability: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select availability</option>
              <option value="immediately">Available immediately</option>
              <option value="today">Available today</option>
              <option value="tomorrow">Available tomorrow</option>
              <option value="this-week">Available this week</option>
              <option value="flexible">Flexible schedule</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact</label>
            <select
              value={offerData.contactMethod}
              onChange={(e) => setOfferData((prev: any) => ({ ...prev, contactMethod: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="platform">Through platform</option>
              <option value="phone">Phone call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmStep({ post, helper, offerData }: { post: any, helper: any, offerData: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Send Your Offer</h3>
        <p className="text-gray-600">Review your offer before sending it.</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Your Message Preview:</h4>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-gray-700">{offerData.message}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Availability:</span>
            <p className="text-gray-600 capitalize">{offerData.availability.replace('-', ' ')}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Contact Method:</span>
            <p className="text-gray-600 capitalize">{offerData.contactMethod.replace('-', ' ')}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your offer will be sent to the post author</li>
          <li>• You'll receive a notification when they respond</li>
          <li>• You can track the status in your dashboard</li>
          <li>• If accepted, you can start coordinating the help</li>
        </ul>
      </div>
    </div>
  )
}
