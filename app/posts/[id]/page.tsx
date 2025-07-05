import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !post) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
            <p className="text-gray-600 mb-6">{post.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {(post.categories || []).map((category: string) => (
                <span key={category} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {category}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">{post.location}, {post.region}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Type</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  post.type === 'HELP_REQUEST' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {post.type === 'HELP_REQUEST' ? 'Help Request' : 'Help Offer'}
                </span>
              </div>
            </div>

            {post.is_urgent && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">⚠️ This is marked as urgent</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching post:', error)
    notFound()
  }
}