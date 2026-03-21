import { useTranslation } from 'react-i18next'
import { Footprints, Activity, Bike, Dumbbell, Waves, Wind, Trophy, Home, Sparkles } from 'lucide-react'

const ACTIVITIES = [
  { id: 'walking',      Icon: Footprints },
  { id: 'running',      Icon: Activity },
  { id: 'cycling',      Icon: Bike },
  { id: 'gym',          Icon: Dumbbell },
  { id: 'swimming',     Icon: Waves },
  { id: 'yoga',         Icon: Wind },
  { id: 'sports',       Icon: Trophy },
  { id: 'home_workout', Icon: Home },
]

const SEDENTARY_OPTIONS = [
  { id: 'walking',  Icon: Footprints, labelKey: 'fitness.activity_walking' },
  { id: 'cycling',  Icon: Bike,       labelKey: 'fitness.activity_cycling' },
  { id: 'yoga',     Icon: Wind,       labelKey: 'fitness.activity_yoga' },
  { id: 'swimming', Icon: Waves,      labelKey: 'fitness.activity_swimming' },
  { id: 'other',    Icon: Sparkles,   labelKey: 'common.optional' },
]

const FREQUENCIES = ['1-2', '3-4', '5+']

export default function ActivitiesStep({
  profileData,
  activities,
  onActivitiesChange,
  sedentaryInterest,
  onSedentaryChange,
  frequency,
  onFrequencyChange,
  onNext,
}) {
  const { t } = useTranslation()
  const isSedentary = profileData?.activity === 'sedentary'

  const toggleActivity = (id) => {
    if (activities.includes(id)) {
      onActivitiesChange(activities.filter(a => a !== id))
    } else {
      onActivitiesChange([...activities, id])
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_activities')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isSedentary ? t('fitness.sedentary_start_hint') : t('fitness.activities_hint')}
        </p>
      </div>

      {isSedentary ? (
        <div className="flex flex-col gap-2">
          {SEDENTARY_OPTIONS.map(opt => {
            const isSelected = sedentaryInterest === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => onSedentaryChange(opt.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all active:scale-95 text-left ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <opt.Icon size={24} strokeWidth={1.75} className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'} />
                <p className={`font-semibold text-sm ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {t(opt.labelKey)}
                </p>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITIES.map(act => {
            const isSelected = activities.includes(act.id)
            return (
              <button
                key={act.id}
                onClick={() => toggleActivity(act.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <act.Icon size={22} strokeWidth={1.75} className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'} />
                <p className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  {t(`fitness.activity_${act.id}`)}
                </p>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fitness.frequency_title')}</p>
        <div className="flex gap-2">
          {FREQUENCIES.map(freq => {
            const isSelected = frequency === freq
            const key = freq.replace('+', '_plus').replace('-', '_')
            return (
              <button
                key={freq}
                onClick={() => onFrequencyChange(freq)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t(`fitness.freq_${key}`)}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-md"
      >
        {t('welcome.continue')}
      </button>
    </div>
  )
}
