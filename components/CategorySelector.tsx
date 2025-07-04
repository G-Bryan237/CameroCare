// components/CategorySelector.tsx
import { useState } from 'react'


interface CategorySelectorProps {

  categories: readonly string[]
  maxCategories: number
  selectedCategories: string[]
  onCategorySelect: (categories: string[]) => void
  role: 'seeker' | 'helper'
}


export function CategorySelector({
  categories,
  maxCategories,
  selectedCategories,
  onCategorySelect,
  role
}: CategorySelectorProps) {
  const handleCategorySelection = (category: string) => {
    const newSelection = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : selectedCategories.length >= maxCategories
      ? (alert(`You can only select up to ${maxCategories} categories as a ${role}`), selectedCategories)
      : [...selectedCategories, category]
    
    onCategorySelect(newSelection)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">
          Categories Selected ({selectedCategories.length}/{maxCategories})
        </h2>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategorySelection(category)}
            className={`
              relative py-2 px-3 text-sm text-left transition-all duration-200
              rounded-[15px] border-2
              ${selectedCategories.includes(category)
                ? role === 'seeker' 
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-blue-500 bg-blue-50 text-blue-700'
                : role === 'seeker'
                  ? 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}