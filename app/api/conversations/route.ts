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