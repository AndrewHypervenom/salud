import { useTranslation } from 'react-i18next'
import { Bell, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../ui/Card'

const REMINDERS_MAP = {
  high_blood_pressure: ['reminders.bp_1', 'reminders.bp_2', 'reminders.bp_3'],
  diabetes:            ['reminders.diabetes_1', 'reminders.diabetes_2'],
  high_cholesterol:    ['reminders.chol_1', 'reminders.chol_2'],
  migraines:           ['reminders.migraine_1', 'reminders.migraine_2'],
  water_retention:     ['reminders.retention_1', 'reminders.retention_2'],
  joint_pain:          ['reminders.joint_1', 'reminders.joint_2'],
  digestive_issues:    ['reminders.digestive_1', 'reminders.digestive_2'],
  chronic_fatigue:     ['reminders.fatigue_1', 'reminders.fatigue_2'],
  anxiety_stress:      ['reminders.anxiety_1', 'reminders.anxiety_2'],
  insomnia:            ['reminders.insomnia_1', 'reminders.insomnia_2'],
}

function buildReminderPool(conditions = {}) {
  return Object.entries(conditions)
    .filter(([, active]) => active)
    .flatMap(([key]) => REMINDERS_MAP[key] || [])
}

// Devuelve un índice estable por día basado en la fecha
function todayOffset() {
  const d = new Date()
  return d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate()
}

export function RemindersWidget({ profile }) {
  const { t } = useTranslation()
  const pool = buildReminderPool(profile?.health_conditions)

  // Índice inicial basado en el día (diferente cada día, sin rotación automática)
  const [offset, setOffset] = useState(0)

  if (!pool || pool.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Bell size={16} className="text-primary-500" />
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t('reminders.widget_title')}</p>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('reminders.no_conditions')}</p>
      </Card>
    )
  }

  const idx = (todayOffset() + offset) % pool.length
  const text = t(pool[idx])

  const prev = () => setOffset(o => o - 1)
  const next = () => setOffset(o => o + 1)

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Bell size={14} strokeWidth={2} className="text-white" />
        </div>
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t('reminders.widget_title')}</p>
      </div>

      <div className="flex items-center gap-2">
        {pool.length > 1 && (
          <button
            onClick={prev}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-center">
          {text}
        </p>

        {pool.length > 1 && (
          <button
            onClick={next}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {pool.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {pool.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === idx
                  ? 'w-4 h-1.5 bg-rose-400'
                  : 'w-1.5 h-1.5 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
