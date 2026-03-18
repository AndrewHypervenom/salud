import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { Spinner } from '../../components/ui/Spinner'
import FitnessWizard from '../Onboarding/FitnessWizard'

export default function FitnessOnboardingStandalone() {
  const navigate = useNavigate()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading, updateProfile } = useProfiles()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner />
      </div>
    )
  }

  const profile = profiles.find(p => p.id === activeProfileId)

  if (!profile) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <FitnessWizard
      profileData={profile}
      onComplete={async (fitnessData) => {
        try {
          await updateProfile(activeProfileId, fitnessData)
        } catch (err) {
          console.error('fitness profile save failed:', err)
        }
        navigate('/dashboard', { replace: true })
      }}
      onSkip={() => navigate('/dashboard', { replace: true })}
    />
  )
}
