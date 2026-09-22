// Browser-only demo database. Never contains or authenticates production users.
export type Row = Record<string, any>
export const DEMO_EMAIL = 'demo@camerocare.local'
export const DEMO_PASSWORD = 'Demo123!'
const KEY = 'camerocare-demo-v1'
const now = () => new Date().toISOString()
const profile = (id: string, name: string, email: string) => ({ id, name, full_name: name, email, avatar_url: null, created_at: now() })
export function seed() {
  const profiles = [profile('demo-user', 'Alex Demo', DEMO_EMAIL), profile('demo-amina', 'Amina Demo', 'amina@camerocare.local'), profile('demo-paul', 'Paul Demo', 'paul@camerocare.local')]
  const examples = [
    ['School supplies for children', 'Help us gather notebooks and pencils for a community study group.', 'Donations', 'Douala', 'Littoral', 'HELP_REQUEST', 'demo-amina'],
    ['Weekend computer lessons', 'I can help beginners learn email, documents, and online applications.', 'Tech Support', 'Yaounde', 'Centre', 'HELP_OFFER', 'demo-paul'],
    ['Community kitchen volunteers', 'Join our Saturday team preparing meals for neighbors.', 'Food and Water', 'Bamenda', 'Northwest', 'HELP_REQUEST', 'demo-paul'],
    ['Help with small home repairs', 'Available this weekend for basic furniture and door repairs.', 'Cleanup and Repairs', 'Douala', 'Littoral', 'HELP_OFFER', 'demo-amina'],
    ['Transport for donated books', 'Looking for a volunteer to help move boxes to the community library.', 'Transportation', 'Buea', 'Southwest', 'HELP_REQUEST', 'demo-user'],
    ['French conversation practice', 'Free friendly practice sessions for learners of all levels.', 'Volunteering', 'Yaounde', 'Centre', 'HELP_OFFER', 'demo-user'],
  ]
  return { userId: null as string | null, tables: {
    profiles,
    accounts: profiles.map(p => ({ id: p.id, email: p.email, password: DEMO_PASSWORD })),
    posts: examples.map((p, i) => ({ id: `demo-post-${i + 1}`, title: p[0], description: p[1], categories: [p[2]], location: p[3], region: p[4], type: p[5], author_id: p[6], status: 'open', is_urgent: i === 0, participant_count: i === 0 ? 1 : 0, bookmarks: 0, shares: 0, created_at: now(), updated_at: now() })),
    conversations: [{ id: 'demo-conversation', post_id: 'demo-post-1', helper_id: 'demo-user', requester_id: 'demo-amina', last_message: 'Thanks for offering to help with the school supplies!', created_at: now(), updated_at: now() }],
    messages: [{ id: 'demo-message', conversation_id: 'demo-conversation', sender_id: 'demo-amina', message_text: 'Thanks for offering to help with the school supplies!', is_read: false, created_at: now() }],
    notifications: [{ id: 'demo-notification', user_id: 'demo-user', type: 'message', title: 'Welcome to the demo', message: 'Your sample conversation is ready to explore.', data: { conversationId: 'demo-conversation' }, read: false, created_at: now() }],
    bookmarks: [], shares: [], help_offers: [], help_requests: [], help_interactions: [],
  } as Record<string, Row[]> }
}
export type Store = ReturnType<typeof seed>
export function readStore(): Store {
  if (typeof window === 'undefined') return seed()
  const saved = window.localStorage.getItem(KEY)
  if (saved) { try { return JSON.parse(saved) } catch { /* Replace invalid demo data. */ } }
  const data = seed(); saveStore(data); return data
}
export function saveStore(data: Store) { if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(data)) }
export const id = () => crypto.randomUUID()
export function userFrom(data: Store) {
  const p = data.tables.profiles.find(p => p.id === data.userId)
  return p ? { id: p.id, email: p.email, user_metadata: { ...p }, app_metadata: {}, aud: 'authenticated', created_at: p.created_at } : null
}
export function decorate(table: string, row: Row, data: Store): Row {
  if (table === 'posts') return { ...row, author: data.tables.profiles.find(p => p.id === row.author_id) }
  if (table === 'conversations') return { ...row, post: data.tables.posts.find(p => p.id === row.post_id), messages: data.tables.messages.filter(m => m.conversation_id === row.id) }
  return { ...row }
}
export function startConversation(data: Store, post: Row, message: string) {
  const helper = post.type === 'HELP_REQUEST' ? data.userId : post.author_id
  const requester = post.type === 'HELP_REQUEST' ? post.author_id : data.userId
  let conversation = data.tables.conversations.find(c => c.post_id === post.id && c.helper_id === helper && c.requester_id === requester)
  if (!conversation) {
    conversation = { id: id(), post_id: post.id, helper_id: helper, requester_id: requester, created_at: now(), updated_at: now(), last_message: message }
    data.tables.conversations.push(conversation)
    post.participant_count = (post.participant_count || 0) + 1
    if (message) data.tables.messages.push({ id: id(), conversation_id: conversation.id, sender_id: data.userId, message_text: message, is_read: false, created_at: now() })
    data.tables.notifications.push({ id: id(), user_id: post.author_id, type: 'message', title: 'New help conversation', message: message || post.title, data: { conversationId: conversation.id }, read: false, created_at: now() })
  }
  return conversation
}
