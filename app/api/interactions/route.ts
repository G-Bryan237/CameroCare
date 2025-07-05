import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { 
      postId, 
      interactionType, 
      message, 
      preFilledMessage 
    } = await request.json()

    // Get post details to determine helper and requester
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }

    // Determine helper and requester based on interaction type
    const helperId = interactionType === 'offer_help' ? session.user.id : post.author_id
    const requesterId = interactionType === 'offer_help' ? post.author_id : session.user.id

    // Create interaction using database function
    const { data: interactionId, error: interactionError } = await supabase
      .rpc('create_help_interaction', {
        p_post_id: postId,
        p_helper_id: helperId,
        p_requester_id: requesterId,
        p_interaction_type: interactionType,
        p_message: message,
        p_pre_filled_message: preFilledMessage
      })

    if (interactionError) {
      console.error('Error creating interaction:', interactionError)
      return NextResponse.json(
        { message: 'Failed to create interaction', error: interactionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      interactionId: interactionId
    })

  } catch (error) {
    console.error('Error handling interaction:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let query = supabase
      .from('help_interactions')
      .select(`
        *,
        posts (title, description, type),
        helper:helper_id (id, email),
        requester:requester_id (id, email)
      `)
      .or(`helper_id.eq.${session.user.id},requester_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('interaction_type', type)
    }

    const { data: interactions, error } = await query

    if (error) {
      console.error('Error fetching interactions:', error)
      return NextResponse.json(
        { message: 'Failed to fetch interactions' },
        { status: 500 }
      )
    }

    return NextResponse.json(interactions || [])

  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
