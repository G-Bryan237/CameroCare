import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow users to fetch their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Fetch user's posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching user posts:', postsError)
      return NextResponse.json(
        { message: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Fetch bookmarked posts
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('user_bookmarks')
      .select('post_id')
      .eq('user_id', session.user.id)

    let bookmarkedPosts = []
    if (!bookmarksError && bookmarks?.length > 0) {
      const postIds = bookmarks.map(b => b.post_id)
      const { data: bookmarkedPostsData } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .order('created_at', { ascending: false })
      
      bookmarkedPosts = bookmarkedPostsData || []
    }

    // Calculate stats from posts
    const helpRequests = posts?.filter(post => post.type === 'HELP_REQUEST') || []
    const helpOffers = posts?.filter(post => post.type === 'HELP_OFFER') || []
    
    // For now, use simple counts. You can enhance this with actual help completion tracking
    const helpOffered = helpOffers.length
    const helpReceived = helpRequests.filter(post => post.status === 'completed').length

    const profile = {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      email: session.user.email,
      image: session.user.user_metadata?.avatar_url,
      helpOffered,
      helpReceived,
      activeRequests: helpRequests.filter(post => post.status === 'open'),
      activeOffers: helpOffers.filter(post => post.status === 'open'),
      bookmarkedPosts: bookmarkedPosts.map(post => ({
        ...post,
        author: {
          id: post.author_id,
          name: 'Community Member',
          avatar_url: null
        }
      }))
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Error fetching user profile:', error)
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
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow users to update their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { name, email } = await request.json()

    // Update user metadata
    const { data, error } = await supabase.auth.updateUser({
      email: email,
      data: {
        full_name: name,
        name: name
      }
    })

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { message: 'Failed to update profile', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: data.user
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
