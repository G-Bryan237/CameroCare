import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id
    const { message, availability, contactMethod, skillsOffered } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 })
    }

    // Get post details
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    if (post.author_id === session.user.id) {
      return NextResponse.json({ message: 'You cannot offer help on your own post' }, { status: 400 })
    }

    // Check for existing offer
    const { data: existingOffer } = await supabase
      .from('help_offers')
      .select('id')
      .eq('post_id', postId)
      .eq('helper_id', session.user.id)
      .single()

    if (existingOffer) {
      return NextResponse.json({ message: 'You have already offered help for this post' }, { status: 409 })
    }

    // Create help offer with all fields
    const { data: helpOffer, error: offerError } = await supabase
      .from('help_offers')
      .insert({
        post_id: postId,
        helper_id: session.user.id,
        requester_id: post.author_id,
        message: message.trim(),
        availability: availability || null,
        contact_method: contactMethod || 'platform',
        skills_offered: skillsOffered || [],
        helper_profile: {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
          email: session.user.email
        },
        status: 'pending'
      })
      .select()
      .single()

    if (offerError) {
      console.error('Error creating help offer:', offerError)
      return NextResponse.json({ message: 'Failed to create help offer' }, { status: 500 })
    }

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        helper_id: session.user.id,
        requester_id: post.author_id,
        post_id: postId,
        last_message: message.trim()
      })
      .select('id')
      .single()

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      return NextResponse.json({ message: 'Failed to create conversation' }, { status: 500 })
    }

    // Insert first message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: session.user.id,
        message_text: message.trim()
      })

    return NextResponse.json({
      message: 'Help offer sent successfully!',
      offer: helpOffer,
      conversationId: conversation.id
    })

  } catch (error) {
    console.error('Error in offer help API:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = params.id

    // Check if user is the post author
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (!post || post.author_id !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized to view offers for this post' },
        { status: 403 }
      )
    }

    // Get all help offers for this post with helper details
    const { data: offers, error } = await supabase
      .from('help_offers')
      .select(`
        *,
        helper:helper_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(offers)

  } catch (error) {
    console.error('Error fetching help offers:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
