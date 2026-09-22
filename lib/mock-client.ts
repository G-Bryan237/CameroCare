import type { SupabaseClient } from '@supabase/supabase-js'
import { readStore, saveStore, userFrom, decorate, startConversation, id, type Row } from './mock-store'
type Listener = (...args: any[]) => void
const authListeners = new Set<Listener>()
const channels = new Set<Channel>()
const session = () => { const user = userFrom(readStore()); return user ? { user, access_token: 'local-demo-only', token_type: 'bearer', expires_in: 3600, refresh_token: 'local-demo-only' } : null }
function notifyAuth(event: string) {
  const current = session()
  if (typeof document !== 'undefined') document.cookie = `camerocare-demo-session=${current ? '1' : ''}; Path=/; SameSite=Lax; Max-Age=${current ? 604800 : 0}`
  authListeners.forEach(fn => fn(event, current))
}
function emit(table: string, eventType: string, row: Row) {
  channels.forEach(channel => channel.listeners.forEach(({ kind, filter, fn }) => {
    if (kind !== 'postgres_changes' || filter.table !== table || !['*', eventType].includes(filter.event)) return
    if (filter.filter) { const [key, , value] = filter.filter.split(/[=.]/); if (String(row[key]) !== value) return }
    void fn({ new: row, old: row, eventType })
  }))
}
class Channel {
  listeners: {kind: string; filter: Row; fn: Listener}[] = []
  on(kind: string, filter: Row, fn: Listener) { this.listeners.push({ kind, filter, fn }); return this }
  subscribe(fn?: Listener) { channels.add(this); queueMicrotask(() => fn?.('SUBSCRIBED')); return this }
  unsubscribe() { channels.delete(this); return Promise.resolve('ok') }
  track() { return Promise.resolve('ok') }
  untrack() { return Promise.resolve('ok') }
  presenceState() { return {} }
  send() { return Promise.resolve('ok') }
}
class Query implements PromiseLike<any> {
  filters: ((row: Row) => boolean)[] = []
  operation = 'select'; values: Row[] = []; singleRow = false; sortKey = ''; ascending = true; max = Infinity
  constructor(private table: string) {}
  select() { return this }
  eq(key: string, value: any) { this.filters.push(row => row[key] === value); return this }
  neq(key: string, value: any) { this.filters.push(row => row[key] !== value); return this }
  in(key: string, values: any[]) { this.filters.push(row => values.includes(row[key])); return this }
  not(key: string, operator: string, value: any) { this.filters.push(row => operator === 'is' ? row[key] != value : row[key] !== value); return this }
  or(expression: string) { const choices = expression.split(',').map(part => part.split('.')); this.filters.push(row => choices.some(([key, op, ...rest]) => op === 'eq' && String(row[key]) === rest.join('.'))); return this }
  order(key: string, options?: { ascending?: boolean }) { this.sortKey = key; this.ascending = options?.ascending !== false; return this }
  limit(max: number) { this.max = max; return this }
  single() { this.singleRow = true; return this }
  maybeSingle() { return this.single() }
  insert(values: Row | Row[]) { this.operation = 'insert'; this.values = Array.isArray(values) ? values : [values]; return this }
  update(value: Row) { this.operation = 'update'; this.values = [value]; return this }
  upsert(value: Row) { this.operation = 'upsert'; this.values = [value]; return this }
  delete() { this.operation = 'delete'; return this }
  async execute() {
    const data = readStore(), table = data.tables[this.table]
    if (!table) return { data: null, error: { message: `Unsupported demo table: ${this.table}` } }
    let rows = table.filter(row => this.filters.every(filter => filter(row)))
    if (this.operation !== 'select' && !data.userId) return { data: null, error: { message: 'Please sign in to the demo.' } }
    if (this.operation === 'insert' || this.operation === 'upsert') {
      rows = this.values.map(value => {
        const existing = this.operation === 'upsert' ? table.find(row => row.id === value.id) : null
        if (existing) { Object.assign(existing, value); return existing }
        const row = { id: id(), created_at: new Date().toISOString(), ...value }; table.push(row); return row
      })
    } else if (this.operation === 'update') rows.forEach(row => Object.assign(row, this.values[0]))
    else if (this.operation === 'delete') data.tables[this.table] = table.filter(row => !rows.includes(row))
    if (this.operation !== 'select') {
      saveStore(data)
      rows.forEach(row => emit(this.table, this.operation === 'insert' ? 'INSERT' : this.operation === 'delete' ? 'DELETE' : 'UPDATE', row))
    }
    if (this.sortKey) rows.sort((a, b) => String(a[this.sortKey]).localeCompare(String(b[this.sortKey])) * (this.ascending ? 1 : -1))
    const result = rows.slice(0, this.max).map(row => decorate(this.table, row, data))
    return { data: this.singleRow ? result[0] ?? null : result, error: null, count: rows.length }
  }
  then<TResult1 = any, TResult2 = never>(resolve?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> { return this.execute().then(resolve, reject) }
}
const client = {
  auth: {
    async getSession() { return { data: { session: session() }, error: null } },
    async getUser() { return { data: { user: userFrom(readStore()) }, error: null } },
    onAuthStateChange(fn: Listener) { authListeners.add(fn); return { data: { subscription: { unsubscribe: () => authListeners.delete(fn) } } } },
    async signInWithPassword({ email, password }: Row) {
      const data = readStore(), account = data.tables.accounts.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password)
      if (!account) return { data: { session: null }, error: { message: 'Invalid demo email or password.' } }
      data.userId = account.id; saveStore(data); notifyAuth('SIGNED_IN'); return { data: { session: session() }, error: null }
    },
    async signUp({ email, password, options }: Row) {
      const data = readStore()
      if (data.tables.accounts.some(a => a.email.toLowerCase() === email.toLowerCase())) return { error: { message: 'This demo email is already registered.' } }
      const userId = id(); data.tables.accounts.push({ id: userId, email, password })
      data.tables.profiles.push({ id: userId, email, created_at: new Date().toISOString(), ...options?.data })
      saveStore(data); return { data: { user: { id: userId } }, error: null }
    },
    async signOut() { const data = readStore(); data.userId = null; saveStore(data); notifyAuth('SIGNED_OUT'); return { error: null } },
    async updateUser({ data: metadata, email }: Row) { const data = readStore(); const p = data.tables.profiles.find(p => p.id === data.userId); if (!p) return { error: { message: 'Please sign in.' } }; Object.assign(p, metadata, email ? { email } : {}); saveStore(data); notifyAuth('USER_UPDATED'); return { data: { user: userFrom(data) }, error: null } },
  },
  from: (table: string) => new Query(table),
  channel: () => new Channel(),
  removeChannel: (channel: Channel) => channel.unsubscribe(),
  async rpc(name: string, params: Row) {
    if (name !== 'create_help_interaction') return { data: null, error: { message: 'Unsupported demo action.' } }
    const data = readStore(), post = data.tables.posts.find(p => p.id === params.p_post_id)
    if (!data.userId || !post) return { data: null, error: { message: 'Sign in and select an existing post.' } }
    const conversation = startConversation(data, post, params.p_message || params.p_pre_filled_message || '')
    data.tables.help_interactions.push({ id: id(), post_id: post.id, helper_id: params.p_helper_id, requester_id: params.p_requester_id, status: 'pending', created_at: new Date().toISOString() })
    saveStore(data); return { data: conversation.id, error: null }
  },
}
export const mockClient = client as unknown as SupabaseClient
