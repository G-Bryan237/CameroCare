// src/components/RoleSelection.tsx
'use client'

import { HandHeart, Users } from 'lucide-react'
import Logo from './logo'

interface RoleSelectionProps {
  onRoleSelect: (role: 'helper' | 'seeker') => void
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  return (
    <div className="max-w-md mx-auto p-8">
      <Logo />
      
      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          Welcome to CameroCare
        </h2>
        
        <button
          onClick={() => onRoleSelect('helper')}
          className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <HandHeart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">HELPER/VOLUNTEER</h3>
              <p className="text-gray-600">Provide assistance to those in need</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onRoleSelect('seeker')}
          className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">HELP SEEKER</h3>
              <p className="text-gray-600">Connect with available resources</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}