// components/logo.tsx
'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export default function Logo({ className, size = 'medium' }: LogoProps) {
  const sizeClasses = {
    small: 'w-32 h-auto',
    medium: 'w-40 h-auto',
    large: 'w-48 h-auto'
  }

  return (
    <div className={className}>
      <Image
        src="/images/CameroCare1.png"
        alt="Cameroon Care Community Logo"
        width={200}
        height={50}
        priority
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  )
}