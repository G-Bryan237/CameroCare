import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({
        isBookmarked: false
      })
    }

    const postId = params.id

    // Check if user has bookmarked this post
    const { data: existingBookmark, error: bookmarkError } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', postId)
      .maybeSingle() // Use maybeSingle() instead of single()

    if (bookmarkError) {
      console.error('Error checking bookmark status:', bookmarkError)
      return NextResponse.json({
        isBookmarked: false
      })
    }

    return NextResponse.json({
      isBookmarked: !!existingBookmark
    })

  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return NextResponse.json({
      isBookmarked: false
    })
  }
}

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
    const { action } = await request.json() // 'bookmark' or 'unbookmark'

    // First check if the post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('bookmarks')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user has already bookmarked this post
    const { data: existingBookmark, error: bookmarkError } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', postId)
      .maybeSingle() // Use maybeSingle() instead of single()

    if (bookmarkError) {
      console.error('Error checking existing bookmark:', bookmarkError)
      return NextResponse.json(
        { message: 'Error checking bookmark status', error: bookmarkError.message },
        { status: 500 }
      )
    }

    let newBookmarkCount = post.bookmarks || 0

    if (action === 'bookmark' && !existingBookmark) {
      // Add bookmark
      const { error: insertError } = await supabase
        .from('user_bookmarks')
        .insert([{
          user_id: session.user.id,
          post_id: postId,
          created_at: new Date().toISOString()
        }])

      if (insertError) {
        console.error('Error inserting bookmark:', insertError)
        return NextResponse.json(
          { message: 'Failed to add bookmark', error: insertError.message },
          { status: 500 }
        )
      }

      newBookmarkCount += 1
    } else if (action === 'unbookmark' && existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', session.user.id)
        .eq('post_id', postId)

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError)
        return NextResponse.json(
          { message: 'Failed to remove bookmark', error: deleteError.message },
          { status: 500 }
        )
      }

      newBookmarkCount = Math.max(0, newBookmarkCount - 1)
    }

    // Update the post's bookmark count
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ bookmarks: newBookmarkCount })
      .eq('id', postId)
      .select('bookmarks')
      .maybeSingle() // Use maybeSingle() instead of single()

    if (updateError) {
      console.error('Error updating bookmark count:', updateError)
      return NextResponse.json(
        { message: 'Failed to update bookmark count', error: updateError.message, details: updateError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bookmarks: newBookmarkCount,
      isBookmarked: action === 'bookmark'
    })

  } catch (error) {
    console.error('Error handling bookmark:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error', details: error },
      { status: 500 }
    )
  }
}
