import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useWaterLogs } from '../../hooks/useWaterLogs'
import { useBadges } from '../../hooks/useBadges'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

const QUICK_OPTIONS = [
  { labelKey: 'water.quick_glass', ml: 250, emoji: '🥤' },
  { labelKey: 'water.quick_small_bottle', ml: 500, emoji: '🍶' },
  { labelKey: 'water.quick_large_bottle', ml: 750, emoji: '🧴' },
]

export default function WaterPage() {
  const { t, i18n } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const profile = profiles.find(p => p.id === activeProfileId)
  const waterGoal = profile?.water_goal_ml || 2000

  const { todayEntries, todayTotal, todayPercent, loading, addWater, deleteWater } = useWaterLogs(activeProfileId, waterGoal)
  const { checkAndUnlock } = useBadges(activeProfileId)
  const [customMl, setCustomMl] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const handleAdd = async (ml) => {
    if (!ml || ml <= 0) return
    setAdding(true)
    try {
      await addWater(ml)
      const newTotal = todayTotal + ml
      await checkAndUnlock('first_water', true)
      await checkAndUnlock('hydrated_1', newTotal >= waterGoal)
    } catch (e) { console.error(e) }
    setAdding(false)
  }

  const handleCustom = () => {
    const val = parseInt(customMl)
    if (val > 0) {
      handleAdd(val)
      setCustomMl('')
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try { await deleteWater(id) } catch (e) { console.error(e) }
    setDeleting(null)
  }

  if (!activeProfileId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="text-5xl">💧</span>
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  const remaining = Math.max(waterGoal - todayTotal, 0)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">💧 {t('water.title')}</h1>

      {/* Progress ring principal */}
      <Card className="flex flex-col items-center py-6 gap-3">
        <ProgressRing percent={todayPercent} size={160} strokeWidth={14} color="#3b82f6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{todayTotal}</p>
            <p className="text-xs text-gray-400">ml</p>
          </div>
        </ProgressRing>
        <p className="text-sm text-gray-500">
          {todayPercent >= 100
            ? t('water.goal_met')
            : t('water.remaining', { remaining, goal: waterGoal })}
        </p>
      </Card>

      {/* Botones rápidos */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('water.quick_add')}</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_OPTIONS.map(opt => (
            <button
              key={opt.ml}
              onClick={() => handleAdd(opt.ml)}
              disabled={adding}
              className="flex flex-col items-center gap-1 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40"
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs font-semibold">{t(opt.labelKey)}</span>
              <span className="text-xs text-blue-400">+{opt.ml}ml</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cantidad personalizada */}
      <Card>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('water.custom_amount')}</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={customMl}
            onChange={e => setCustomMl(e.target.value)}
            placeholder={t('water.ml_placeholder')}
            min="1"
            max="2000"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            onKeyDown={e => e.key === 'Enter' && handleCustom()}
          />
          <button
            onClick={handleCustom}
            disabled={!customMl || parseInt(customMl) <= 0 || adding}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {adding ? <Spinner size="sm" /> : `+ ${t('water.add_btn')}`}
          </button>
        </div>
      </Card>

      {/* Lista del día */}
      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : todayEntries.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('water.today_log')}</p>
          <div className="flex flex-col gap-2">
            {todayEntries.map(entry => (
              <Card key={entry.id} className="flex items-center gap-3 py-2.5">
                <span className="text-xl">💧</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-600">{entry.amount_ml} ml</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.logged_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                >
                  {deleting === entry.id ? '⏳' : '✕'}
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
