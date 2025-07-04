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
    console.log('POST /api/posts - Starting request processing')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message 
    })
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { message: 'Authentication error', error: sessionError.message },
        { status: 401 }
      )
    }
    
    if (!session?.user) {
      console.error('No authenticated user found')
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in to create a post' },
        { status: 401 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('Received post data:', body)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { message: 'Invalid request body - must be valid JSON' },
        { status: 400 }
      )
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'categories', 'region', 'type']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      return NextResponse.json(
        { message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate categories array
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      console.error('Invalid categories:', body.categories)
      return NextResponse.json(
        { message: 'Categories must be a non-empty array' },
        { status: 400 }
      )
    }

    // Prepare post data for database
    const postData = {
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      categories: body.categories,
      location: body.location ? String(body.location).trim() : null,
      region: String(body.region).trim(),
      coordinates: body.coordinates || null,
      type: body.type,
      is_urgent: Boolean(body.is_urgent),
      author_id: session.user.id,
      participant_count: 0,
      bookmarks: 0,
      shares: 0,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    }

    console.log('Prepared post data for database:', postData)

    // Insert into database
    const { data, error: insertError } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { 
          message: 'Failed to create post in database', 
          error: insertError.message,
          details: insertError 
        },
        { status: 500 }
      )
    }

    console.log('Post created successfully:', data)
    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/posts:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error 
      },
      { status: 500 }
    )
  }
}