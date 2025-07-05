// types/supabase-auth.d.ts

// Supabase User types
export interface SupabaseUser {
  id: string
  email: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    full_name?: string
    avatar_url?: string
  }
  app_metadata?: Record<string, any>
  aud: string
  created_at: string
}

export interface SupabaseSession {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: SupabaseUser
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
  session: SupabaseSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>
}