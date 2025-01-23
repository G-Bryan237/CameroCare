// src/components/Search.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import debounce from 'lodash/debounce'

interface SearchProps {
  onSearch: (query: string) => void
}

export default function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState('')

  const debouncedSearch = debounce((value: string) => {
    onSearch(value)
  }, 300)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search posts..."
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  )
}