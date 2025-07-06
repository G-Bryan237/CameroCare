import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({
        isBookmarked: false
      })
    }

    const postId = id

    // Check if user has bookmarked this post
    const { data: existingBookmark, error: bookmarkError } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', postId)
      .maybeSingle()

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
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = id

    // Check if user has already bookmarked this post
    const { data: existingBookmark, error: bookmarkError } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', postId)
      .maybeSingle()

    if (bookmarkError) {
      console.error('Error checking existing bookmark:', bookmarkError)
      return NextResponse.json(
        { message: 'Error checking bookmark status', error: bookmarkError.message },
        { status: 500 }
      )
    }

    let isBookmarked = !!existingBookmark
    let newBookmarkCount = 0

    if (!existingBookmark) {
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

      // Try to increment bookmark count using database function
      const { data: updatedCount, error: updateError } = await supabase
        .rpc('increment_bookmarks', { p_post_id: postId })

      if (updateError) {
        console.error('Database function error, falling back to manual update:', updateError)
        
        // Fallback: manually increment bookmarks
        const { data: currentPost } = await supabase
          .from('posts')
          .select('bookmarks')
          .eq('id', postId)
          .single()
        
        const currentBookmarks = currentPost?.bookmarks || 0
        
        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('posts')
          .update({ bookmarks: currentBookmarks + 1 })
          .eq('id', postId)
          .select('bookmarks')
          .single()
        
        if (fallbackError) {
          // Clean up the bookmark if update fails
          await supabase
            .from('user_bookmarks')
            .delete()
            .eq('user_id', session.user.id)
            .eq('post_id', postId)
          
          return NextResponse.json(
            { message: 'Failed to update bookmark count', error: fallbackError.message },
            { status: 500 }
          )
        }
        
        newBookmarkCount = fallbackResult.bookmarks
      } else {
        newBookmarkCount = updatedCount || 1
      }

      isBookmarked = true
    } else {
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

      // Try to decrement bookmark count using database function
      const { data: updatedCount, error: updateError } = await supabase
        .rpc('decrement_bookmarks', { p_post_id: postId })

      if (updateError) {
        console.error('Database function error, falling back to manual update:', updateError)
        
        // Fallback: manually decrement bookmarks
        const { data: currentPost } = await supabase
          .from('posts')
          .select('bookmarks')
          .eq('id', postId)
          .single()
        
        const currentBookmarks = currentPost?.bookmarks || 0
        
        const { error: fallbackError } = await supabase
          .from('posts')
          .update({ bookmarks: Math.max(0, currentBookmarks - 1) })
          .eq('id', postId)
        
        if (fallbackError) {
          console.error('Fallback update failed:', fallbackError)
        }
        
        newBookmarkCount = Math.max(0, currentBookmarks - 1)
      } else {
        newBookmarkCount = Math.max(0, updatedCount || 0)
      }

      isBookmarked = false
    }

    // Get the actual current bookmark count from the database
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('bookmarks')
      .eq('id', postId)
      .single()

    if (!fetchError && currentPost) {
      newBookmarkCount = currentPost.bookmarks || 0
    }

    return NextResponse.json({
      success: true,
      bookmarks: newBookmarkCount,
      isBookmarked: isBookmarked
    })

  } catch (error) {
    console.error('Error handling bookmark:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
