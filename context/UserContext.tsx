// src/context/UserContext.tsx
'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserContextType {
  currentUser: {
    login: string
    name?: string
    image?: string
  }
  currentDateTime: string
}

// Format date to YYYY-MM-DD HH:MM:SS in UTC
const formatDateTime = (date: Date): string => {
  return date.toISOString()
    .replace('T', ' ')
    .split('.')[0]
}

const UserContext = createContext<UserContextType>({
  currentUser: { login: 'G-Bryan237' },
  currentDateTime: formatDateTime(new Date())
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession()
  const [currentDateTime, setCurrentDateTime] = useState(formatDateTime(new Date()))

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatDateTime(new Date()))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <UserContext.Provider 
      value={{
        currentUser: {
          login: session?.user?.login || 'G-Bryan237',
          name: session?.user?.name,
          image: session?.user?.image
        },
        currentDateTime
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)