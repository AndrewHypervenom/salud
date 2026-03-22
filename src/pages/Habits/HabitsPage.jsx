import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ClipboardList, Loader2, X, Plus } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useHabits, getHabitDisplayName } from '../../hooks/useHabits'
import { useBadges } from '../../hooks/useBadges'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { PushAlerts } from '../../components/shared/PushAlerts'

export default function HabitsPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const { habits, todayLogs, loading, error, toggleHabit, addHabit, deleteHabit, seedDefaultHabits } = useHabits(activeProfileId)
  const { checkAndUnlock } = useBadges(activeProfileId)

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [toggling, setToggling] = useState(null)

  const profile = profiles.find(p => p.id === activeProfileId)

  const completedCount = habits.filter(h => todayLogs.some(l => l.habit_id === h.id)).length
  const total = habits.length
  const progress = total > 0 ? (completedCount / total) * 100 : 0

  const isCompleted = (habitId) => todayLogs.some(l => l.habit_id === habitId)

  const handleToggle = async (habitId) => {
    setToggling(habitId)
    try {
      await toggleHabit(habitId)
      const wasCompleted = todayLogs.some(l => l.habit_id === habitId)
      if (!wasCompleted) {
        await checkAndUnlock('habit_first', true)
        const newCompletedCount = completedCount + 1
        await checkAndUnlock('habit_all_day', newCompletedCount >= total && total > 0)
      }
    } catch (e) { console.error(e) }
    setToggling(null)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await addHabit(newName.trim(), '')
      await checkAndUnlock('habit_custom', true)
      setNewName('')
    } catch (e) { console.error(e) }
    setAdding(false)
  }

  const handleSeed = async () => {
    setSeeding(true)
    try { await seedDefaultHabits() } catch (e) { console.error(e) }
    setSeeding(false)
  }

  const habitsMessage = profile
    ? `${t('habits.whatsapp_summary', { name: profile.name, done: completedCount, total })}\n${habits.map(h => `${isCompleted(h.id) ? '✅' : '⬜'} ${getHabitDisplayName(h.name, t)}`).join('\n')}`
    : ''

  if (!activeProfileId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <p className="text-gray-500">{t('habits.no_profile')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="ios-title text-gray-900 dark:text-gray-100">{t('habits.title')}</h1>
        <p className="text-ios-gray mt-0.5">{t('habits.subtitle')}</p>
      </div>

      {/* Progress */}
      {total > 0 && (
        <Card className="bg-gradient-to-br from-white to-cyan-50/30 dark:from-ios-dark dark:to-ios-dark2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('habits.progress', { done: completedCount, total })}
            </span>
            {completedCount === total && (
              <span className="text-sm font-semibold" style={{ color: '#30D158' }}>{t('habits.all_done')}</span>
            )}
          </div>
          <div className="w-full bg-black/6 dark:bg-white/8 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: completedCount === total ? '#30D158' : '#5AC8F5' }}
            />
          </div>
        </Card>
      )}

      {/* Habits list */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : habits.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-10">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ClipboardList size={28} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-gray-500 text-sm">{t('habits.no_habits')}</p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-6 py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-40 active:scale-95"
            style={{ background: 'linear-gradient(145deg, #6AD4F7, #32ADE6)' }}
          >
            {seeding ? <Spinner size="sm" /> : t('habits.seed_defaults')}
          </button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {habits.map(habit => {
            const done = isCompleted(habit.id)
            const isLoading = toggling === habit.id
            return (
              <button
                key={habit.id}
                onClick={() => handleToggle(habit.id)}
                disabled={isLoading}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all text-left w-full active:scale-[0.98] ${
                  done
                    ? 'border-ios-cyan/20 dark:border-ios-cyan/15'
                    : 'bg-white dark:bg-ios-dark border-black/8 dark:border-white/8 hover:border-black/15'
                }`}
                style={done ? { background: 'rgba(90,200,245,0.08)' } : {}}
              >
                {/* Check icon */}
                <span className="flex-shrink-0">
                  {isLoading ? (
                    <Loader2 size={24} className="animate-spin" style={{ color: '#5AC8F5' }} strokeWidth={1.75} />
                  ) : done ? (
                    <CheckCircle2 size={24} strokeWidth={1.75} style={{ color: '#5AC8F5' }} />
                  ) : (
                    <Circle size={24} className="text-ios-gray/40 dark:text-ios-gray/30" strokeWidth={1.75} />
                  )}
                </span>

                {/* Name */}
                <span className={`text-sm font-medium flex-1 leading-snug ${
                  done ? 'line-through text-ios-gray' : 'text-gray-800 dark:text-gray-100'
                }`}>
                  {getHabitDisplayName(habit.name, t)}
                </span>

                {/* Delete */}
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id) }}
                  className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                  aria-label="eliminar"
                >
                  <X size={16} strokeWidth={2} />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Add habit form */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('habits.add_habit')}</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('habits.habit_name')}
            className="flex-1 px-4 py-2.5 border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ios-cyan/50"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl font-semibold disabled:opacity-40 transition-all text-sm active:scale-95"
            style={{ background: 'linear-gradient(145deg, #6AD4F7, #32ADE6)' }}
          >
            {adding ? <Spinner size="sm" /> : <><Plus size={16} strokeWidth={2.5} />{t('habits.add')}</>}
          </button>
        </form>
      </Card>

      {/* Notificaciones push */}
      <Card>
        <PushAlerts profileId={activeProfileId} />
      </Card>
    </div>
  )
}
