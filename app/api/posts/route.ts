import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies for server-side auth
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('Authentication error:', authError)
      return NextResponse.json(
        { message: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Received post data:', body)
    console.log('User ID:', session.user.id)

    // Validate required fields
    if (!body.title || !body.description || !body.categories || body.categories.length === 0) {
      return NextResponse.json(
        { message: 'Missing required fields: title, description, and categories' },
        { status: 400 }
      )
    }

    // Validate category limits
    if (body.type === 'HELP_REQUEST' && body.categories.length > 3) {
      return NextResponse.json(
        { message: 'Help requests can have maximum 3 categories' },
        { status: 400 }
      )
    }

    // Create the post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title: body.title,
        description: body.description,
        type: body.type,
        categories: body.categories,
        location: body.location,
        region: body.region,
        coordinates: body.coordinates,
        is_urgent: body.isUrgent || false,
        status: 'open',
        author_id: session.user.id,
        participant_count: 0,
        shares: 0,
        bookmarks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { message: 'Failed to create post', error: error.message },
        { status: 500 }
      )
    }

    console.log('Post created successfully:', post)
    return NextResponse.json({ 
      id: post.id, 
      message: 'Post created successfully',
      post 
    })

  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, name, avatar_url)
      `)
      .order('last_activity_at', { ascending: false })

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
        { message: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json(posts || [])

  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
