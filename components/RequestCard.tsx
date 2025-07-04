// src/components/RequestCard.tsx

import React from 'react'
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/solid'



interface RequestCardProps {

  request: {

    id: string

    title: string

    description: string

    categories?: string[]

    location?: string

    region?: string

    created_at: string

    status?: string

    is_urgent?: boolean

  }

}



const RequestCard: React.FC<RequestCardProps> = ({ request }) => {

  return (

    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">

      <div className="flex justify-between items-start mb-2">

        <div className="flex items-center space-x-2">

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">

            Help Request

          </span>

          {request.is_urgent && (

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">

              Urgent

            </span>

          )}

          {request.status && (

            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${

              request.status === 'open' ? 'bg-green-100 text-green-800' :

              request.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :

              'bg-gray-100 text-gray-800'

            }`}>

              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}

            </span>

          )}

        </div>

        <div className="flex items-center text-sm text-gray-500">

          <ClockIcon className="h-4 w-4 mr-1" />

          {new Date(request.created_at).toLocaleDateString()}

        </div>

      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h3>

      <p className="text-gray-600 mb-3 line-clamp-2">{request.description}</p>
      
      {request.categories && request.categories.length > 0 && (

        <div className="flex flex-wrap gap-2 mb-3">

          {request.categories.map((category, index) => (

            <span key={`${category}-${index}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-50 text-red-700">

              {category}

            </span>

          ))}

        </div>

      )}
      
      {(request.location || request.region) && (

        <div className="flex items-center text-sm text-gray-500">

          <MapPinIcon className="h-4 w-4 mr-1" />

          <span>{request.location}, {request.region}</span>

        </div>

      )}

    </div>

  )

}



export default RequestCard

