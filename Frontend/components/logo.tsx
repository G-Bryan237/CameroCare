// components/logo.tsx
'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={className}>
      <Image
        src="/images/CameroCare1.png"
        alt="Cameroon Care Community Logo"
        width={200}  // Increased size
        height={50}  // Adjusted for aspect ratio
        priority
        className="w-full h-auto"
      />
    </div>
  )
}