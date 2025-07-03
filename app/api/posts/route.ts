import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    console.log('API GET /posts - type:', type, 'category:', category)

    // First, let's just fetch posts without trying to join profiles
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by type (help/offer)
    if (type === 'help') {
      query = query.eq('type', 'HELP_REQUEST')
    } else if (type === 'offer') {
      query = query.eq('type', 'HELP_OFFER')
    }

    // Filter by category
    if (category && category !== 'All') {
      query = query.contains('categories', [category])
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch posts', error: error.message },
        { status: 500 }
      )
    }

    console.log('Raw posts from database:', posts)

    // For now, let's create mock author data since we don't have profiles set up
    const transformedPosts = (posts || []).map(post => ({
      ...post,
      // Add default values for missing fields
      participant_count: post.participant_count || 0,
      bookmarks: post.bookmarks || 0,
      shares: post.shares || 0,
      last_activity_at: post.last_activity_at || post.created_at,
      // Create a mock author from the author_id
      author: {
        id: post.author_id,
        name: 'Community Member', // You can improve this later
        avatar_url: null
      }
    }))

    console.log('API Response - found posts:', transformedPosts.length)
    return NextResponse.json(transformedPosts)

  } catch (error) {
    console.error('Error fetching posts:', error)
    const errorMessage = (error instanceof Error) ? error.message : String(error)
    return NextResponse.json(
      { message: 'Internal server error', error: errorMessage },
      { status: 500 }
    )
  }
}

// Keep your existing POST method
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Add author_id and timestamps
    const postData = {
      ...body,
      author_id: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      participant_count: 0,
      bookmarks: 0,
      shares: 0,
      status: 'open'
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json(
        { message: 'Failed to create post', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
