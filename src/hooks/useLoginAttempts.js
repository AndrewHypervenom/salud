import { supabase } from '../lib/supabase'

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 5

export function useLoginAttempts() {
  const checkLocked = async (identifier) => {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
    const { count, error } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .gte('attempted_at', since)
    if (error) return { locked: false, remainingMs: 0 }
    if (count >= MAX_ATTEMPTS) {
      // Find the oldest attempt in the window to calculate remaining time
      const { data } = await supabase
        .from('login_attempts')
        .select('attempted_at')
        .eq('identifier', identifier)
        .gte('attempted_at', since)
        .order('attempted_at', { ascending: true })
        .limit(1)
      const oldest = data?.[0]?.attempted_at
      const remainingMs = oldest
        ? new Date(oldest).getTime() + WINDOW_MINUTES * 60 * 1000 - Date.now()
        : 0
      return { locked: true, remainingMs: Math.max(0, remainingMs) }
    }
    return { locked: false, remainingMs: 0 }
  }

  const recordFailure = async (identifier) => {
    await supabase.from('login_attempts').insert({ identifier })
  }

  const clearAttempts = async (identifier) => {
    await supabase.from('login_attempts').delete().eq('identifier', identifier)
  }

  return { checkLocked, recordFailure, clearAttempts }
}
