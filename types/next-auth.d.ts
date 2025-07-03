// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      user_metadata?: {
        first_name?: string
        last_name?: string
      }
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    user_metadata?: {
      first_name?: string
      last_name?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    email?: string
  }
}

// Add Supabase-specific types
export interface SupabaseUser {
  id: string
  email: string
  user_metadata?: {
    first_name?: string
    last_name?: string
  }
}

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  created_at?: string
  updated_at?: string
}

export interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>
}