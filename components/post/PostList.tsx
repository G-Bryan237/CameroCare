// src/components/post/PostList.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // Changed from next/router
import { 
  MapPin, 
  Share2, 
  EyeOff,
  Bookmark,
  Flag,
  TrendingUp,
  Users,
  CheckCircle
} from 'lucide-react'

// Update Post interface to use participantCount instead of participants array
interface Post {
  id: number;
  type: 'help' | 'offer';
  title: string;
  author: {
    id: string;
    name: string;
    isAnonymous: boolean;
    isVerified: boolean;
    rating: number;
  };
  location: {
    city: string;
    region: string;
    isUrgent: boolean;
  };
  categories: string[];
  tags: string[];
  description: string;
  participantCount: number;
  bookmarks: number;
  status: 'open' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

// Update sample posts
const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    type: 'help',
    title: "Need urgent assistance with temporary housing",
    author: {
      id: "user1",
      name: "Sarah Chen",
      isAnonymous: false,
      isVerified: true,
      rating: 4.8
    },
    location: {
      city: "Douala",
      region: "Littoral",
      isUrgent: true
    },
    categories: ["Housing", "Urgent"],
    tags: ["#Urgent", "#Housing", "#Temporary"],
    description: "Looking for temporary housing for a family of 4 due to unexpected circumstances. Need safe accommodation for 2 weeks with basic amenities.",
    participantCount: 12,
    bookmarks: 25,
    status: 'open',
    createdAt: "2025-01-22 08:30:00",
    updatedAt: "2025-01-22 09:40:35",
    lastActivityAt: "2025-01-22 09:40:35"
  },
  {
    id: 2,
    type: 'offer',
    title: "Free Math and Science Tutoring Available",
    author: {
      id: "user2",
      name: "Robert Fang",
      isAnonymous: false,
      isVerified: true,
      rating: 4.9
    },
    location: {
      city: "Yaoundé",
      region: "Centre",
      isUrgent: false
    },
    categories: ["Education", "Academic"],
    tags: ["#Education", "#STEM", "#Free"],
    description: "Offering free tutoring in Mathematics and Science subjects. Available on weekends. Can help with high school and university level topics.",
    participantCount: 8,
    bookmarks: 15,
    status: 'open',
    createdAt: "2025-01-22 07:15:00",
    updatedAt: "2025-01-22 09:35:30",
    lastActivityAt: "2025-01-22 09:35:30"
  },
  {
    id: 3,
    type: 'help',
    title: "Medical Transport Needed for Weekly Hospital Visits",
    author: {
      id: "user3",
      name: "Marie Ndi",
      isAnonymous: true,
      isVerified: false,
      rating: 4.5
    },
    location: {
      city: "Bamenda",
      region: "Northwest",
      isUrgent: true
    },
    categories: ["Medical", "Transport"],
    tags: ["#Medical", "#Transport", "#Weekly"],
    description: "Need transport assistance for weekly hospital visits. Every Wednesday morning for the next month. Can contribute to fuel costs.",
    participantCount: 4,
    bookmarks: 8,
    status: 'open',
    createdAt: "2025-01-22 09:00:00",
    updatedAt: "2025-01-22 09:42:00",
    lastActivityAt: "2025-01-22 09:42:00"
  },
  {
    id: 4,
    type: 'offer',
    title: "Weekend Food Distribution Event",
    author: {
      id: "user4",
      name: "John Ekema",
      isAnonymous: false,
      isVerified: true,
      rating: 5.0
    },
    location: {
      city: "Buea",
      region: "Southwest",
      isUrgent: false
    },
    categories: ["Food", "Community"],
    tags: ["#FoodDrive", "#Community", "#Weekend"],
    description: "Organizing a food distribution event this weekend. Fresh produce and non-perishables available. Priority given to elderly and families with children.",
    participantCount: 45,
    bookmarks: 72,
    status: 'open',
    createdAt: "2025-01-22 06:15:00",
    updatedAt: "2025-01-22 09:30:00",
    lastActivityAt: "2025-01-22 09:30:00"
  },
  {
    id: 5,
    type: 'help',
    title: "School Supplies Needed for Orphanage",
    author: {
      id: "user5",
      name: "Alice Tamba",
      isAnonymous: false,
      isVerified: true,
      rating: 4.7
    },
    location: {
      city: "Limbe",
      region: "Southwest",
      isUrgent: false
    },
    categories: ["Education", "Children"],
    tags: ["#SchoolSupplies", "#Children", "#Education"],
    description: "Local orphanage needs school supplies for 25 children. Looking for notebooks, pens, pencils, and basic stationery items.",
    participantCount: 28,
    bookmarks: 45,
    status: 'open',
    createdAt: "2025-01-22 07:30:00",
    updatedAt: "2025-01-22 09:25:00",
    lastActivityAt: "2025-01-22 09:25:00"
  },
  {
    id: 6,
    type: 'offer',
    title: "Free Legal Consultation for Small Businesses",
    author: {
      id: "user6",
      name: "Paul Biya",
      isAnonymous: false,
      isVerified: true,
      rating: 4.9
    },
    location: {
      city: "Douala",
      region: "Littoral",
      isUrgent: false
    },
    categories: ["Legal", "Business"],
    tags: ["#Legal", "#Business", "#Consultation"],
    description: "Offering free 30-minute legal consultations for small business owners. Can help with registration, permits, and basic legal questions.",
    participantCount: 15,
    bookmarks: 33,
    status: 'open',
    createdAt: "2025-01-22 08:45:00",
    updatedAt: "2025-01-22 09:20:00",
    lastActivityAt: "2025-01-22 09:20:00"
  },
  {
    id: 7,
    type: 'help',
    title: "Emergency Home Repair - Leaking Roof",
    author: {
      id: "user7",
      name: "Emma Fouda",
      isAnonymous: false,
      isVerified: false,
      rating: 4.3
    },
    location: {
      city: "Yaoundé",
      region: "Centre",
      isUrgent: true
    },
    categories: ["Housing", "Maintenance"],
    tags: ["#Emergency", "#Housing", "#Repair"],
    description: "Urgent help needed with leaking roof before heavy rains. Single mother with three children. Can provide materials if needed.",
    participantCount: 6,
    bookmarks: 12,
    status: 'open',
    createdAt: "2025-01-22 09:10:00",
    updatedAt: "2025-01-22 09:41:00",
    lastActivityAt: "2025-01-22 09:41:00"
  },
  {
    id: 8,
    type: 'offer',
    title: "IT Skills Training for Youth",
    author: {
      id: "user8",
      name: "G-Bryan237",
      isAnonymous: false,
      isVerified: true,
      rating: 4.8
    },
    location: {
      city: "Buea",
      region: "Southwest",
      isUrgent: false
    },
    categories: ["Education", "Technology"],
    tags: ["#IT", "#Youth", "#Training"],
    description: "Organizing free IT skills training for youth (15-25 years). Topics include basic computer skills, web development, and digital literacy.",
    participantCount: 32,
    bookmarks: 55,
    status: 'open',
    createdAt: "2025-01-22 08:00:00",
    updatedAt: "2025-01-22 09:15:00",
    lastActivityAt: "2025-01-22 09:15:00"
  }
];

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const router = useRouter();

  const isPopular = post.participantCount >= 10;
  const isRecent = new Date().getTime() - new Date(post.lastActivityAt).getTime() < 3600000;

  const handleActionButton = () => {
    router.push(`/chat/${post.author.id}?postId=${post.id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {post.location.isUrgent && (
        <div className="bg-red-500 text-white px-4 py-2 text-sm font-medium text-center">
          Urgent Request
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {post.author.isAnonymous ? (
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <EyeOff className="h-6 w-6 text-gray-400" />
                </div>
              ) : (
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {post.author.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {post.author.isAnonymous ? 'Anonymous' : post.author.name}
                </h3>
                {post.author.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-sm text-gray-500">★ {post.author.rating}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{post.location.city}, {post.location.region}</span>
                <span>•</span>
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isPopular && (
              <span className="flex items-center space-x-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>Popular</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
          <p className="text-gray-600">{post.description}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {post.categories.map(category => (
              <span key={category} className="px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                {category}
              </span>
            ))}
            {post.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            {/* Participants count */}
            <div className="flex items-center space-x-2 text-gray-500">
              <Users className="h-5 w-5" />
              <span className="text-sm">{post.participantCount} Participants</span>
            </div>

            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`flex items-center space-x-2 ${
                isBookmarked ? 'text-yellow-500' : 'text-gray-500'
              } hover:text-yellow-500 transition-colors`}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.bookmarks + (isBookmarked ? 1 : 0)}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Share</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
              <Flag className="h-5 w-5" />
              <span className="text-sm">Report</span>
            </button>
          </div>

          <button 
            onClick={handleActionButton}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {post.type === 'help' ? 'Offer Help' : 'Request Info'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostList({ type, categories }: { type: 'help' | 'offer', categories: string[] | null }) {
  const [posts] = useState<Post[]>(INITIAL_POSTS);
  const [sortBy, setSortBy] = useState<'recent' | 'urgent' | 'popular'>('recent');

  const filteredPosts = posts
    .filter(post => {
      const matchesType = post.type === type;
      const matchesCategories = !categories || categories.length === 0 || 
        post.categories.some(cat => categories.includes(cat));
      return matchesType && matchesCategories;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'urgent':
          return (b.location.isUrgent ? 1 : 0) - (a.location.isUrgent ? 1 : 0);
        case 'popular':
          return b.participantCount - a.participantCount;
        default:
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      }
    });

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex justify-end space-x-2 px-4">
        {(['recent', 'urgent', 'popular'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
              sortBy === option
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-6 px-4">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No posts found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}