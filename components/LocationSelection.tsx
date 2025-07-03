// src/components/LocationSelection.tsx
'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import Logo from './logo'

const CAMEROON_REGIONS = [
  'Adamawa',  
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'Northwest',
  'South',
  'Southwest',
  'West'
] as const

interface LocationSelectionProps {
  onLocationSet: (location: { region: string; coordinates: { lat: number; lng: number } }) => void
}

export default function LocationSelection({ onLocationSet }: LocationSelectionProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [locationError, setLocationError] = useState<string | null>(null)

  const requestLocation = () => {
    if (!selectedRegion) {
      setLocationError('Please select your region first')
      return
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSet({
          region: selectedRegion,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        })
      },
      () => {
        setLocationError("Unable to retrieve your location. Please enable location services.")
      }
    )
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <Logo />

      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center">
          Select Your Region
        </h2>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full p-3 border-2 border-gray-200 rounded-lg"
        >
          <option value="">Select a region...</option>
          {CAMEROON_REGIONS.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>

        {locationError && (
          <div className="text-red-500 text-sm">{locationError}</div>
        )}

        <button
          onClick={requestLocation}
          disabled={!selectedRegion}
          className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium 
                   hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <MapPin className="inline-block mr-2 h-5 w-5" />
          Share Location
        </button>
      </div>
    </div>
  )
}