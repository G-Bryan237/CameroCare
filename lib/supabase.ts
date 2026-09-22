import { createClientComponentClient as createLiveClient } from '@supabase/auth-helpers-nextjs'
import { MOCK_MODE } from './mock-mode'
import { mockClient } from './mock-client'
export const supabase = MOCK_MODE ? mockClient : createLiveClient()
export const createClientComponentClient = () => supabase
