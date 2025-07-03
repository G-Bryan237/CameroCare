import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client with cookies for server-side auth
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', params.id)
      .eq('author_id', session.user.id) // Ensure user can only delete their own posts

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { message: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client with cookies for server-side auth
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Update the post
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('author_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

