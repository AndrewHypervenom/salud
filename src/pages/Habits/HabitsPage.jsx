import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useHabits } from '../../hooks/useHabits'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { WhatsAppAlerts } from '../../components/shared/WhatsAppAlerts'

export default function HabitsPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const { habits, todayLogs, loading, error, toggleHabit, addHabit, deleteHabit, seedDefaultHabits } = useHabits(activeProfileId)

  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✅')
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
    try { await toggleHabit(habitId) } catch (e) { console.error(e) }
    setToggling(null)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await addHabit(newName.trim(), newEmoji)
      setNewName('')
      setNewEmoji('✅')
    } catch (e) { console.error(e) }
    setAdding(false)
  }

  const handleSeed = async () => {
    setSeeding(true)
    try { await seedDefaultHabits() } catch (e) { console.error(e) }
    setSeeding(false)
  }

  const habitsMessage = profile
    ? `Hábitos de ${profile.name} hoy: ${completedCount}/${total} completados.\n${habits.map(h => `${isCompleted(h.id) ? '✅' : '⬜'} ${h.emoji} ${h.name}`).join('\n')}`
    : ''

  if (!activeProfileId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="text-5xl">✅</span>
        <p className="text-gray-500">{t('habits.no_profile')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('habits.title')}</h1>
        <p className="text-gray-500">{t('habits.subtitle')}</p>
      </div>

      {/* Progress */}
      {total > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t('habits.progress', { done: completedCount, total })}
            </span>
            {completedCount === total && (
              <span className="text-sm text-green-600 font-medium">{t('habits.all_done')}</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>
      )}

      {/* Habits list */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : habits.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-8">
          <span className="text-5xl">📋</span>
          <p className="text-gray-500">{t('habits.no_habits')}</p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-40"
          >
            {seeding ? <Spinner size="sm" /> : t('habits.seed_defaults')}
          </button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {habits.map(habit => {
            const done = isCompleted(habit.id)
            return (
              <button
                key={habit.id}
                onClick={() => handleToggle(habit.id)}
                disabled={toggling === habit.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left w-full min-h-[64px] ${
                  done
                    ? 'bg-green-50 border-green-300'
                    : 'bg-white border-gray-200 hover:border-primary-300'
                }`}
              >
                <span className="text-3xl flex-shrink-0">
                  {toggling === habit.id ? '⏳' : done ? '✅' : '⬜'}
                </span>
                <span className="text-xl flex-shrink-0">{habit.emoji}</span>
                <span className={`text-base font-medium flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {habit.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id) }}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  aria-label="eliminar"
                >
                  ✕
                </button>
              </button>
            )
          })}
        </div>
      )}

      {/* Add habit form */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 mb-3">{t('habits.add_habit')}</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newEmoji}
            onChange={e => setNewEmoji(e.target.value)}
            placeholder="✅"
            className="w-14 px-2 py-2 border border-gray-300 rounded-xl text-center text-xl focus:outline-none focus:border-primary-500"
          />
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('habits.habit_name')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-primary-700 transition-colors text-sm"
          >
            {adding ? <Spinner size="sm" /> : t('habits.add')}
          </button>
        </form>
      </Card>

      {/* WhatsApp alerts */}
      {profile?.phone_whatsapp && (
        <Card>
          <WhatsAppAlerts
            profile={profile}
            habitsText={habitsMessage}
            foodText={null}
            summaryText={habitsMessage}
          />
        </Card>
      )}

      {!profile?.phone_whatsapp && (
        <div className="text-center py-2">
          <Link to={`/profiles/${activeProfileId}/edit`} className="text-sm text-primary-600 underline">
            {t('whatsapp.configure')}
          </Link>
        </div>
      )}
    </div>
  )
}
