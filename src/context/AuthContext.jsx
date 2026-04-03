import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'unlockedProfileIds'

function getUnlockedIds() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUnlockedIds(ids) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids))
}

export function AuthProvider({ children }) {
  const [unlockedIds, setUnlockedIds] = useState(getUnlockedIds)
  const [justLoggedInProfileId, setJustLoggedInProfileId] = useState(null)

  const isUnlocked = useCallback((id) => {
    return unlockedIds.includes(id)
  }, [unlockedIds])

  const unlockProfile = useCallback((id) => {
    setJustLoggedInProfileId(id)
    setUnlockedIds(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveUnlockedIds(next)
      return next
    })
  }, [])

  const lockAll = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlockedIds([])
  }, [])

  const acknowledgeLogin = useCallback((id) => {
    setJustLoggedInProfileId(prev => (prev === id ? null : prev))
  }, [])

  return (
    <AuthContext.Provider value={{ unlockedIds, isUnlocked, unlockProfile, lockAll, justLoggedInProfileId, acknowledgeLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
