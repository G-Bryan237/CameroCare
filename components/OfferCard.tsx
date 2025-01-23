// src/components/OfferCard.tsx
import React from 'react'

interface OfferCardProps {
    offer: {
        id: string
        title: string
        description: string
        date: string
    }
}

const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
    return (
        <div className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-bold">{offer.title}</h2>
            <p className="text-gray-600">{offer.description}</p>
            <p className="text-gray-400 text-sm">{offer.date}</p>
        </div>
    )
}

export default OfferCard
