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
    const { message } = await request.json()

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
      return NextResponse.json({ message: 'You cannot request help from your own post' }, { status: 400 })
    }

    // Check for existing request
    const { data: existingRequest } = await supabase
      .from('help_requests')
      .select('id')
      .eq('post_id', postId)
      .eq('requester_id', session.user.id)
      .single()

    if (existingRequest) {
      return NextResponse.json({ message: 'You have already requested help for this post' }, { status: 409 })
    }

    // Create help request
    const { data: helpRequest, error: requestError } = await supabase
      .from('help_requests')
      .insert({
        post_id: postId,
        requester_id: session.user.id,
        helper_id: post.author_id,
        message: message.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating help request:', requestError)
      return NextResponse.json({ message: 'Failed to create help request' }, { status: 500 })
    }

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        helper_id: post.author_id,
        requester_id: session.user.id,
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
      message: 'Help request sent successfully!',
      request: helpRequest,
      conversationId: conversation.id
    })

  } catch (error) {
    console.error('Error in request help API:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}