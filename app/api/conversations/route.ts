import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        post:posts(
          id,
          title,
          type,
          status
        )
      `)
      .or(`helper_id.eq.${session.user.id},requester_id.eq.${session.user.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ message: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json(conversations || [])

  } catch (error) {
    console.error('Error in conversations API:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, helper_id, requester_id, initial_message } = body

    // Validate required fields
    if (!post_id || !helper_id || !requester_id) {
      return NextResponse.json({ 
        message: 'Missing required fields: post_id, helper_id, requester_id' 
      }, { status: 400 })
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('post_id', post_id)
      .eq('helper_id', helper_id)
      .eq('requester_id', requester_id)
      .single()

    if (existingConv) {
      return NextResponse.json({ 
        message: 'Conversation already exists',
        conversation_id: existingConv.id 
      })
    }

    // Create new conversation
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert([{
        post_id,
        helper_id,
        requester_id,
        last_message: initial_message || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json({ 
        message: 'Failed to create conversation' 
      }, { status: 500 })
    }

    // Update participant count for the post
    await updatePostParticipantCount(supabase, post_id)

    return NextResponse.json(newConversation, { status: 201 })

  } catch (error) {
    console.error('Error in POST conversations API:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to update participant count
async function updatePostParticipantCount(supabase: any, postId: string) {
  try {
    // Get the post to know the author
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (!post) return

    // Count unique participants (excluding the post author)
    const { data: conversationData } = await supabase
      .from('conversations')
      .select('helper_id, requester_id')
      .eq('post_id', postId)

    let participantCount = 0
    if (conversationData) {
      const uniqueParticipants = new Set()
      conversationData.forEach((conv: any) => {
        // Add both helper and requester, but exclude the post author
        if (conv.helper_id !== post.author_id) uniqueParticipants.add(conv.helper_id)
        if (conv.requester_id !== post.author_id) uniqueParticipants.add(conv.requester_id)
      })
      participantCount = uniqueParticipants.size
    }

    // Update the post with new participant count
    await supabase
      .from('posts')
      .update({ 
        participant_count: participantCount,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', postId)

  } catch (error) {
    console.error('Error updating participant count:', error)
  }
}