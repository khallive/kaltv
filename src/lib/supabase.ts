import { createClient } from '@supabase/supabase-js'

export type BackendChannel = {
  name: string
  title: string
  game: string
  viewers: string
  image: string
  avatar: string
  tag: string
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function loadLiveChannels(): Promise<BackendChannel[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('channels')
    .select('name,title,game,viewers,image,avatar,tag')
    .eq('is_live', true)
    .order('viewers', { ascending: false })

  if (error) {
    console.warn('Unable to load live channels:', error.message)
    return []
  }
  return data ?? []
}
