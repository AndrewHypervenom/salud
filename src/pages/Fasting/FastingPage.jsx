import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useFasting } from '../../hooks/useFasting'
import { useBadges } from '../../hooks/useBadges'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { BadgeNotification } from '../../components/shared/BadgeNotification'
import { getPhaseIndex } from '../../components/fasting/fastingPhases'
import FastingActiveView from './FastingActiveView'
import FastingIdleView from './FastingIdleView'
import FastingCelebration from '../../components/fasting/FastingCelebration'

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
  const [deletingId, setDeletingId] = useState(null)
  const [reaction, setReaction] = useState('idle')
  const [celebrating, setCelebrating] = useState(false)
  const [mascotType, setMascotType] = useState(
    () => localStorage.getItem('nexvida-mascot') || 'axolotl'
  )
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleMascotChange = (type) => {
    setMascotType(type)
    localStorage.setItem('nexvida-mascot', type)
  }

  // Auto-clear reaction after animation
  useEffect(() => {
    if (reaction !== 'idle') {
      const t = setTimeout(() => setReaction('idle'), 2000)
      return () => clearTimeout(t)
    }
  }, [reaction])

  // Auto-clear celebration
  useEffect(() => {
    if (celebrating) {
      const t = setTimeout(() => setCelebrating(false), 1400)
      return () => clearTimeout(t)
    }
  }, [celebrating])

  const handleStart = async () => {
    setStarting(true)
    setReaction('dancing')
    try { await startFast(targetHours) } catch (e) { console.error(e) }
    setStarting(false)
  }

  const handleEnd = async () => {
    if (!activeSession) return
    setEnding(true)
    setReaction('waving')
    try {
      await endFast(activeSession.id)
      setCelebrating(true)
      const newCount = completedCount + 1
      if (newCount >= 10) await checkAndUnlock('fast_master_10', true)
    } catch (e) { console.error(e) }
    setEnding(false)
  }

  // datetime-local value is local time without TZ — convert to UTC ISO before saving
  const localToUTC = (s) => s ? new Date(s).toISOString() : null

  const handleDelete = async (id) => {
    try { await deleteSession(id) } catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }

  const handleEditSave = async () => {
    if (!editingId) return
    setSavingEdit(true)
    try {
      await editTimes(editingId, localToUTC(editStart), localToUTC(editEnd) || null)
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

  // Progress + phase
  let activePercent = 0
  let targetEndTime = null
  let elapsedHours = 0
  if (activeSession) {
    const elapsed = now - new Date(activeSession.start_time).getTime()
    elapsedHours = elapsed / (1000 * 60 * 60)
    activePercent = Math.min((elapsedHours / activeSession.target_hours) * 100, 100)
    targetEndTime = new Date(new Date(activeSession.start_time).getTime() + activeSession.target_hours * 60 * 60 * 1000).toISOString()
  }
  const phaseIndex = getPhaseIndex(elapsedHours)

  if (!activeProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <Zap size={48} strokeWidth={1.5} className="text-violet-300" />
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BadgeNotification badge={newBadge} onDismiss={clearNewBadge} lang={lang} />

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Zap size={26} strokeWidth={1.75} className="text-violet-500" />
        {t('fasting.title')}
      </h1>

      {/* Estado principal */}
      {activeSession ? (
        <FastingActiveView
          activeSession={activeSession}
          activePercent={activePercent}
          phaseIndex={phaseIndex}
          targetEndTime={targetEndTime}
          ending={ending}
          reaction={reaction}
          editingId={editingId}
          editStart={editStart}
          editEnd={editEnd}
          savingEdit={savingEdit}
          mascotType={mascotType}
          onEnd={handleEnd}
          onStartEdit={() => startEdit(activeSession)}
          onCancelEdit={() => setEditingId(null)}
          onSaveEdit={handleEditSave}
          setEditStart={setEditStart}
          setEditEnd={setEditEnd}
        />
      ) : (
        <FastingIdleView
          targetHours={targetHours}
          setTargetHours={setTargetHours}
          handleStart={handleStart}
          starting={starting}
          mascotType={mascotType}
          onMascotChange={handleMascotChange}
        />
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
                <Card key={s.id} className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    {s.completed
                      ? <CheckCircle2 size={20} strokeWidth={1.75} className="text-green-500 flex-shrink-0" />
                      : <Zap size={20} strokeWidth={1.75} className="text-violet-400 flex-shrink-0" />
                    }
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
                    {/* Botón editar */}
                    <button
                      onClick={() => { setDeletingId(null); startEdit(s) }}
                      className="p-1.5 rounded-full text-gray-400 hover:text-violet-500 active:scale-90 transition-all"
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </button>
                    {/* Botón eliminar — dos estados */}
                    {deletingId === s.id ? (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-full bg-red-500 text-white active:scale-90 transition-all"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditingId(null); setDeletingId(s.id) }}
                        className="p-1.5 rounded-full text-gray-400 hover:text-red-500 active:scale-90 transition-all"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    )}
                  </div>

                  {/* Panel de edición inline */}
                  {editingId === s.id && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{t('fasting.start_time')}</label>
                        <input type="datetime-local" value={editStart}
                          onChange={e => setEditStart(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl" />
                        <label className="text-xs text-gray-400">{t('fasting.end_time')} {t('fasting.optional')}</label>
                        <input type="datetime-local" value={editEnd}
                          onChange={e => setEditEnd(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl" />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => setEditingId(null)}
                          className="flex-1 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
                          {t('common.cancel')}
                        </button>
                        <button onClick={handleEditSave} disabled={savingEdit}
                          className="flex-1 py-1.5 rounded-full text-sm font-semibold text-white bg-violet-500 active:scale-95 transition-transform disabled:opacity-40">
                          {savingEdit ? '...' : t('common.save')}
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Celebración al finalizar */}
      <FastingCelebration visible={celebrating} />
    </div>
  )
}
