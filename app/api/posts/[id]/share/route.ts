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

    // Check if user has already shared this post
    const { data: existingShare, error: shareCheckError } = await supabase
      .from('user_shares')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', postId)
      .maybeSingle()

    if (shareCheckError) {
      console.error('Error checking existing share:', shareCheckError)
      return NextResponse.json(
        { message: 'Error checking share status', error: shareCheckError.message },
        { status: 500 }
      )
    }

    // Record the share (allow multiple shares per user for different platforms)
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

    // Only increment share count if this is the user's first share of this post
    let newShareCount = 0
    if (!existingShare) {
      const { data: updatedPost, error: updateError } = await supabase
        .rpc('increment_shares', { post_id: postId })

      if (updateError) {
        console.error('Error updating share count:', updateError)
        return NextResponse.json(
          { message: 'Failed to update share count', error: updateError.message },
          { status: 500 }
        )
      }

      newShareCount = updatedPost || 1
    }

    // Get the actual current share count from the database
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('shares')
      .eq('id', postId)
      .single()

    if (fetchError) {
      console.error('Error fetching current post data:', fetchError)
    } else {
      newShareCount = currentPost.shares || 0
    }

    return NextResponse.json({
      success: true,
      shares: newShareCount,
      isFirstShare: !existingShare
    })

  } catch (error) {
    console.error('Error handling share:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
