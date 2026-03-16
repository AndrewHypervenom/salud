import { createContext, useContext, useState, useEffect } from 'react'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [activeProfileId, setActiveProfileId] = useState(() => {
    return localStorage.getItem('activeProfileId') || null
  })

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem('activeProfileId', activeProfileId)
    } else {
      localStorage.removeItem('activeProfileId')
    }
  }, [activeProfileId])

  return (
    <ProfileContext.Provider value={{ activeProfileId, setActiveProfileId }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfileContext must be used within ProfileProvider')
  return ctx
}
