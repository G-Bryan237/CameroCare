export interface HelpOfferData {
  message: string
  availability: string
  contactMethod: 'platform' | 'phone' | 'whatsapp' | 'email'
  skillsOffered: string[]
}

export interface HelpOffer {
  id: string
  postId: string
  helperId: string
  requesterId: string
  message: string
  availability: string
  contactMethod: string
  skillsOffered: string[]
  helperProfile: HelperProfile
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
  updatedAt: string
  respondedAt?: string
  responseTimeMinutes?: number
}

export interface HelperProfile {
  id: string
  name: string
  avatar_url?: string
  bio: string
  rating: number
  helpCount: number
  responseTime: string
  completionRate: number
  badges: string[]
  skills: string[]
  verificationStatus: 'unverified' | 'phone' | 'email' | 'id'
}

export interface NotificationData {
  id: string
  userId: string
  type: 'help_offer_received' | 'help_offer_accepted' | 'help_offer_declined'
  title: string
  message: string
  data: {
    postId?: string
    offerId?: string
    helperName?: string
  }
  read: boolean
  createdAt: string
}