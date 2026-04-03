import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProfileContext } from '../../context/ProfileContext'
import { supabase } from '../../lib/supabase'

const OWNER_PHONE = '3123661254'

export default function AdminGuard({ children }) {
  const navigate = useNavigate()
  const { isUnlocked } = useAuth()
  const { activeProfileId } = useProfileContext()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!activeProfileId || !isUnlocked(activeProfileId)) {
      navigate('/', { replace: true })
      return
    }

    supabase
      .from('profiles')
      .select('phone_whatsapp')
      .eq('id', activeProfileId)
      .single()
      .then(({ data }) => {
        if (data?.phone_whatsapp === OWNER_PHONE) {
          setAllowed(true)
        } else {
          navigate('/dashboard', { replace: true })
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId])

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
      </div>
    )
  }

  return children
}
