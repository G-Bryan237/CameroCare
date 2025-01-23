// src/components/modals/VolunteerModal.tsx
'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { XIcon } from 'lucide-react'

interface VolunteerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (message: string) => Promise<void>
  postTitle: string
}

export default function VolunteerModal({
  isOpen,
  onClose,
  onSubmit,
  postTitle
}: VolunteerModalProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await onSubmit(message)
      onClose()
    } catch (err) {
      setError('Failed to submit volunteer request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
      >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <XIcon className="h-6 w-6" />
          </button>

          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Volunteer for: {postTitle}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to the post author
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain how you can help..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </Dialog>
    </div>
  )
}