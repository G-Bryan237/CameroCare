// src/components/OfferCard.tsx
import React from 'react'
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/solid'

interface OfferCardProps {
  offer: {
    id: string
    title: string
    description: string
    categories?: string[]
    location?: string
    region?: string
    created_at: string
    status?: string
  }
}

const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Help Offer
          </span>
          {offer.status && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              offer.status === 'open' ? 'bg-green-100 text-green-800' :
              offer.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
            </span>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          {new Date(offer.created_at).toLocaleDateString()}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
      <p className="text-gray-600 mb-3 line-clamp-2">{offer.description}</p>
      
      {offer.categories && offer.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {offer.categories.map((category, index) => (
            <span key={`${category}-${index}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700">
              {category}
            </span>
          ))}
        </div>
      )}
      
      {(offer.location || offer.region) && (
        <div className="flex items-center text-sm text-gray-500">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span>{offer.location}, {offer.region}</span>
        </div>
      )}
    </div>
  )
}

export default OfferCard
