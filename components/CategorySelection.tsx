// src/components/CategorySelection.tsx
'use client'

import { useState } from 'react'
import { ASSISTANCE_CATEGORIES } from '@/types'
import Logo from '././logo'

interface CategorySelectionProps {
  role: 'helper' | 'seeker'
  onCategoriesSelected: (categories: string[]) => void
}

export default function CategorySelection({ role, onCategoriesSelected }: CategorySelectionProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  const handleCategoryToggle = (category: string) => {
    if (role === 'seeker' && selectedCategories.length >= 3 && !selectedCategories.includes(category)) {
      alert('You can only select up to 3 categories as a help seeker')
      return
    }
    
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Logo />
      
      <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
        {role === 'helper' 
          ? "How do you wish to help?" 
          : "Which type of help are you in need of?"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ASSISTANCE_CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryToggle(category)}
            className={`p-4 rounded-lg text-left transition-colors ${
              selectedCategories.includes(category)
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-white border-2 border-gray-200 hover:border-blue-500'
            }`}
          >
            <span className="text-sm font-medium">{category}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => onCategoriesSelected(selectedCategories)}
          disabled={selectedCategories.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
        >
          Continue
        </button>
      </div>
    </div>
  )
}