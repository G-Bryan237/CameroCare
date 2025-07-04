import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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
    const { platform } = await request.json() // 'twitter', 'facebook', 'whatsapp', 'instagram', 'copy'

    // First check if the post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('shares')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }

    // Record the share
    const { error: insertError } = await supabase
      .from('user_shares')
      .insert([{
        user_id: session.user.id,
        post_id: postId,
        platform: platform,
        created_at: new Date().toISOString()
      }])

    if (insertError) {
      console.error('Error recording share:', insertError)
      return NextResponse.json(
        { message: 'Failed to record share', error: insertError.message },
        { status: 500 }
      )
    }

    const newShareCount = (post.shares || 0) + 1

    // Update the post's share count
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ shares: newShareCount })
      .eq('id', postId)
      .select('shares')
      .maybeSingle() // Use maybeSingle() instead of single()

    if (updateError) {
      console.error('Error updating share count:', updateError)
      return NextResponse.json(
        { message: 'Failed to update share count', error: updateError.message, details: updateError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shares: newShareCount
    })

  } catch (error) {
    console.error('Error handling share:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error', details: error },
      { status: 500 }
    )
  }
}
