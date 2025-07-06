import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
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

    // Fetch user's posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json(posts || [])
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
