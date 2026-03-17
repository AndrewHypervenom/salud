import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useFasting } from '../../hooks/useFasting'
import { useBadges } from '../../hooks/useBadges'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { ElapsedTimer } from '../../components/ui/CountdownTimer'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { BadgeNotification } from '../../components/shared/BadgeNotification'

const TARGET_OPTIONS = [12, 14, 16, 18, 20, 24]

export default function FastingPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { activeProfileId } = useProfileContext()
  const { sessions, activeSession, completedCount, loading, startFast, endFast, editTimes, deleteSession } = useFasting(activeProfileId)
  const { newBadge, checkAndUnlock, clearNewBadge } = useBadges(activeProfileId)

  const [targetHours, setTargetHours] = useState(16)
  const [ending, setEnding] = useState(false)
  const [starting, setStarting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const handleStart = async () => {
    setStarting(true)
    try { await startFast(targetHours) } catch (e) { console.error(e) }
    setStarting(false)
  }

  const handleEnd = async () => {
    if (!activeSession) return
    setEnding(true)
    try {
      await endFast(activeSession.id)
      const newCount = completedCount + 1
      if (newCount >= 10) await checkAndUnlock('fast_master_10', true)
    } catch (e) { console.error(e) }
    setEnding(false)
  }

  const handleEditSave = async () => {
    if (!editingId) return
    setSavingEdit(true)
    try {
      await editTimes(editingId, editStart, editEnd || null)
      setEditingId(null)
    } catch (e) { console.error(e) }
    setSavingEdit(false)
  }

  const startEdit = (session) => {
    setEditingId(session.id)
    const toLocal = (iso) => {
      const d = new Date(iso)
      const offset = d.getTimezoneOffset() * 60000
      return new Date(d - offset).toISOString().slice(0, 16)
    }
    setEditStart(toLocal(session.start_time))
    setEditEnd(session.end_time ? toLocal(session.end_time) : '')
  }

  const recentSessions = sessions.filter(s => s.end_time || s.completed).slice(0, 7)

  // Progreso del ayuno activo
  let activePercent = 0
  let targetEndTime = null
  if (activeSession) {
    const elapsed = Date.now() - new Date(activeSession.start_time).getTime()
    const elapsedHours = elapsed / (1000 * 60 * 60)
    activePercent = Math.min((elapsedHours / activeSession.target_hours) * 100, 100)
    targetEndTime = new Date(new Date(activeSession.start_time).getTime() + activeSession.target_hours * 60 * 60 * 1000).toISOString()
  }

  if (!activeProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="text-5xl">⚡</span>
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BadgeNotification badge={newBadge} onDismiss={clearNewBadge} lang={lang} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">⚡ {t('fasting.title')}</h1>

      {/* Estado principal */}
      {activeSession ? (
        <Card className="flex flex-col items-center py-6 gap-4">
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">{t('fasting.active')}</p>
          <ProgressRing percent={activePercent} size={160} strokeWidth={14} color="#7c3aed">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">{t('fasting.elapsed')}</p>
              <ElapsedTimer startTime={activeSession.start_time} className="text-xl font-bold text-violet-600" />
            </div>
          </ProgressRing>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {t('fasting.meta_progress', { h: activeSession.target_hours, pct: Math.round(activePercent) })}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('fasting.end_time_est', { time: new Date(targetEndTime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) })}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => startEdit(activeSession)}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              ✏️ {t('fasting.edit_times')}
            </button>
            <button
              onClick={handleEnd}
              disabled={ending}
              className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40"
            >
              {ending ? <Spinner size="sm" /> : `✓ ${t('fasting.end')}`}
            </button>
          </div>

          {/* Edición inline */}
          {editingId === activeSession.id && (
            <div className="w-full flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase">{t('fasting.edit_times')}</p>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">{t('fasting.start_time')}</label>
                <input
                  type="datetime-local"
                  value={editStart}
                  onChange={e => setEditStart(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl"
                />
                <label className="text-xs text-gray-500">{t('fasting.end_time')} {t('fasting.optional')}</label>
                <input
                  type="datetime-local"
                  value={editEnd}
                  onChange={e => setEditEnd(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-600"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={savingEdit}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                >
                  {savingEdit ? <Spinner size="sm" /> : t('common.save')}
                </button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="flex flex-col items-center py-8 gap-4">
          <span className="text-6xl">⚡</span>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t('fasting.no_active')}</p>

          <div className="flex flex-col gap-2 w-full">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">{t('fasting.target_hours')}</p>
            <div className="grid grid-cols-6 gap-1.5">
              {TARGET_OPTIONS.map(h => (
                <button
                  key={h}
                  onClick={() => setTargetHours(h)}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                    targetHours === h
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-4 bg-violet-600 text-white rounded-2xl text-base font-bold hover:bg-violet-700 transition-colors disabled:opacity-40"
          >
            {starting ? <Spinner size="sm" /> : `⚡ ${t('fasting.start')} ${targetHours}h`}
          </button>
        </Card>
      )}

      {/* Stats */}
      {completedCount > 0 && (
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-violet-600">{completedCount}</p>
          <p className="text-xs text-gray-400">{t('fasting.completed_count')}</p>
        </Card>
      )}

      {/* Historial */}
      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : recentSessions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('fasting.history')}</p>
          <div className="flex flex-col gap-2">
            {recentSessions.map(s => {
              const elapsed = s.end_time
                ? (new Date(s.end_time) - new Date(s.start_time)) / (1000 * 60 * 60)
                : null
              return (
                <Card key={s.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl">{s.completed ? '✅' : '⚡'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {new Date(s.start_time).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                      {' · '}
                      <span className={s.completed ? 'text-green-600' : 'text-amber-500'}>
                        {elapsed ? `${Math.round(elapsed * 10) / 10}h` : '?'} / {s.target_hours}h
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.start_time).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                      {s.end_time && ` → ${new Date(s.end_time).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
