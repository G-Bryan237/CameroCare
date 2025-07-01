// components/ui/dialog.tsx
"use client"

import React, { useEffect, useRef } from 'react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
  position?: 'center' | 'top'
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center overflow-y-auto p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
          </div>
        )}
        
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}