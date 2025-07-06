import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch bookmarked post IDs
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('user_bookmarks')
      .select('post_id')
      .eq('user_id', session.user.id)

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError)
      return NextResponse.json(
        { message: 'Failed to fetch bookmarks' },
        { status: 500 }
      )
    }

    const postIds = bookmarks?.map(b => b.post_id) || []

    if (postIds.length === 0) {
      return NextResponse.json([])
    }

    // Fetch the actual posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching bookmarked posts:', postsError)
      return NextResponse.json(
        { message: 'Failed to fetch bookmarked posts' },
        { status: 500 }
      )
    }

    // Transform posts with author info
    const transformedPosts = (posts || []).map(post => ({
      ...post,
      participant_count: post.participant_count || 0,
      bookmarks: post.bookmarks || 0,
      shares: post.shares || 0,
      last_activity_at: post.last_activity_at || post.created_at,
      author: {
        id: post.author_id,
        name: 'Community Member',
        avatar_url: null
      }
    }))

    return NextResponse.json(transformedPosts)
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
