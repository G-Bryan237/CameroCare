import { MOCK_MODE } from './mock-mode'
import { readStore, saveStore, decorate, startConversation, id, type Row } from './mock-store'
const json = (data: unknown, status = 200) => Response.json(data, { status })
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  if (!MOCK_MODE) return fetch(input, init)
  const url = new URL(input, 'https://demo.local'), parts = url.pathname.split('/').filter(Boolean)
  const method = init?.method || 'GET', data = readStore(), userId = data.userId
  const body: Row = typeof init?.body === 'string' ? JSON.parse(init.body) : {}
  const fail = (message: string, status: number) => json({ message, error: message }, status)
  const commit = (result: unknown) => { saveStore(data); return json(result) }
  if (parts[0] !== 'api') return fail('Unsupported demo URL', 404)
  const [, resource, target, action] = parts
  const publicRead = method === 'GET' && ((resource === 'posts' && !['my-posts', 'bookmarked'].includes(target) && !action) || (resource === 'users' && action === 'stats'))
  if (!userId && !publicRead) return fail('Please sign in to the demo.', 401)
  if (resource === 'posts') {
    const posts = data.tables.posts
    if (method === 'GET' && (!target || ['my-posts', 'bookmarked'].includes(target))) {
      let result = posts.filter(p => target !== 'my-posts' || p.author_id === userId)
      if (target === 'bookmarked') result = result.filter(p => data.tables.bookmarks.some(b => b.post_id === p.id && b.user_id === userId))
      const type = url.searchParams.get('type'), category = url.searchParams.get('category'), exclude = url.searchParams.get('excludeUserId')
      if (type) result = result.filter(p => p.type === (type === 'help' ? 'HELP_REQUEST' : type === 'offer' ? 'HELP_OFFER' : type))
      if (category && category !== 'All') result = result.filter(p => p.categories.includes(category))
      if (exclude) result = result.filter(p => p.author_id !== exclude)
      return json(result.map(p => decorate('posts', p, data)).reverse())
    }
    if (!target && method === 'POST') {
      if (!body.title?.trim() || !body.description?.trim() || !['HELP_REQUEST', 'HELP_OFFER'].includes(body.type)) return fail('Add a title, description, and valid post type.', 400)
      const post = { ...body, id: id(), author_id: userId, status: 'open', bookmarks: 0, shares: 0, participant_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      posts.push(post); return commit(post)
    }
    const post = posts.find(p => p.id === target)
    if (!post) return fail('Post not found.', 404)
    if (!action && method === 'GET') return json(decorate('posts', post, data))
    if (!action && ['DELETE', 'PATCH', 'PUT'].includes(method)) {
      if (post.author_id !== userId) return fail('You can only change your own posts.', 403)
      if (method === 'DELETE') {
        data.tables.posts = posts.filter(p => p.id !== target)
        const conversations = data.tables.conversations.filter(c => c.post_id === target).map(c => c.id)
        data.tables.conversations = data.tables.conversations.filter(c => c.post_id !== target)
        data.tables.messages = data.tables.messages.filter(m => !conversations.includes(m.conversation_id))
        for (const table of ['bookmarks', 'shares', 'help_offers', 'help_requests', 'help_interactions']) data.tables[table] = data.tables[table].filter(row => row.post_id !== target)
      } else for (const key of ['title','description','categories','location','region','status','is_urgent']) if (key in body) post[key] = body[key]
      return commit({ success: true, ...post })
    }
    if (action === 'bookmark') {
      const existing = data.tables.bookmarks.find(b => b.post_id === target && b.user_id === userId)
      if (method === 'POST') {
        const remove = body.action === 'unbookmark' || (!body.action && existing)
        if (remove) data.tables.bookmarks = data.tables.bookmarks.filter(b => b !== existing)
        else if (!existing) data.tables.bookmarks.push({ id: id(), user_id: userId, post_id: target })
        post.bookmarks = data.tables.bookmarks.filter(b => b.post_id === target).length
      }
      return commit({ isBookmarked: data.tables.bookmarks.some(b => b.post_id === target && b.user_id === userId), bookmarks: post.bookmarks })
    }
    if (action === 'share' && method === 'POST') {
      const first = !data.tables.shares.some(s => s.post_id === target && s.user_id === userId)
      if (first) { data.tables.shares.push({ id: id(), user_id: userId, post_id: target }); post.shares++ }
      return commit({ shares: post.shares, isFirstShare: first })
    }
    if (['offer-help', 'request-help'].includes(action) && method === 'POST') {
      if (post.author_id === userId) return fail('Choose a post from another community member.', 400)
      const conversation = startConversation(data, post, body.message || 'Hello, I would like to connect about this post.')
      return commit({ success: true, conversationId: conversation.id, conversation })
    }
  }
  if (resource === 'users') {
    const profile = data.tables.profiles.find(p => p.id === target)
    if (!profile) return fail('Profile not found.', 404)
    const ownPosts: Row[] = data.tables.posts.filter(p => p.author_id === target).map(p => ({ ...decorate('posts', p, data), createdAt: p.created_at, isUrgent: p.is_urgent }))
    const helpsGiven = data.tables.conversations.filter(c => c.helper_id === target).length
    const helpsReceived = data.tables.conversations.filter(c => c.requester_id === target).length
    if (action === 'stats') return json({ helpsGiven, helpsReceived, averageRating: 0, rating: 0, successRate: 0, avgResponseTime: 'N/A', isVerified: false, totalPosts: ownPosts.length })
    if (method === 'PUT') {
      if (target !== userId) return fail('You can only edit your own profile.', 403)
      if (body.email && data.tables.accounts.some(a => a.id !== target && a.email.toLowerCase() === body.email.toLowerCase())) return fail('Email already in use.', 409)
      Object.assign(profile, { name: body.name, full_name: body.name, email: body.email })
      const account = data.tables.accounts.find(a => a.id === target); if (account) account.email = body.email
      saveStore(data)
    }
    return json({ ...profile, helpOffered: helpsGiven, helpReceived: helpsReceived, activeRequests: ownPosts.filter(p => p.type === 'HELP_REQUEST'), activeOffers: ownPosts.filter(p => p.type === 'HELP_OFFER'), bookmarkedPosts: data.tables.posts.filter(p => data.tables.bookmarks.some(b => b.post_id === p.id && b.user_id === target)).map(p => decorate('posts', p, data)) })
  }
  if (resource === 'conversations' && method === 'GET') return json(data.tables.conversations.filter(c => c.helper_id === userId || c.requester_id === userId).map(c => decorate('conversations', c, data)))
  return fail('This action is not available in the local demo.', 404)
}
