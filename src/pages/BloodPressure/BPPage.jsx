import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useBloodPressure } from '../../hooks/useBloodPressure'
import { useBadges } from '../../hooks/useBadges'
import { classifyBP } from '../../lib/bpStatus'
import { BPForm } from './BPForm'
import { BPHistory } from './BPHistory'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export default function BPPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { readings, loading, addReading, deleteReading } = useBloodPressure(activeProfileId)
  const { checkAndUnlock } = useBadges(activeProfileId)
  const [showForm, setShowForm] = useState(false)

  if (!activeProfileId) {
    return (
      <Card className="text-center py-10 text-gray-400">
        <p className="text-3xl mb-3">❤️</p>
        <p>{t('bp.no_profile')}</p>
      </Card>
    )
  }

  const handleSubmit = async (data) => {
    await addReading(data)
    setShowForm(false)
    const hour = new Date().getHours()
    await checkAndUnlock('first_bp', true)
    await checkAndUnlock('bp_morning', hour < 9)
  }

  const lastBP = readings[0]
  const bpClass = lastBP ? classifyBP(lastBP.systolic, lastBP.diastolic) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('bp.title')}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t('common.cancel') : t('bp.add')}
        </Button>
      </div>

      {/* Crisis alert */}
      {bpClass?.isCrisis && (
        <div className="bg-red-800 text-white rounded-2xl p-4 flex items-start gap-3 animate-pulse">
          <span className="text-2xl flex-shrink-0">🚨</span>
          <p className="font-semibold">{t('bp.crisis_alert')}</p>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card>
          <h2 className="font-bold mb-4">{t('bp.add')}</h2>
          <BPForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {/* History */}
      <Card>
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{t('bp.history')}</h2>
        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <BPHistory readings={readings} onDelete={deleteReading} />
        )}
      </Card>
    </div>
  )
}
