import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import GoalStep from './FitnessWizardSteps/GoalStep'
import TargetWeightStep from './FitnessWizardSteps/TargetWeightStep'
import ActivitiesStep from './FitnessWizardSteps/ActivitiesStep'
import ExperienceStep from './FitnessWizardSteps/ExperienceStep'
import WaterStep from './FitnessWizardSteps/WaterStep'

function getStepFlow(goals) {
  const needsTarget = goals.includes('lose_weight') || goals.includes('gain_muscle')
  if (needsTarget) {
    return ['goal', 'target_weight', 'activities', 'experience', 'water']
  }
  return ['goal', 'activities', 'experience', 'water']
}

function getProgress(step, goals) {
  const flow = getStepFlow(goals)
  const current = flow.indexOf(step) + 1
  const total = flow.length
  return { current, total }
}

function getNextStep(step, goals) {
  const flow = getStepFlow(goals)
  const idx = flow.indexOf(step)
  return idx < flow.length - 1 ? flow[idx + 1] : null
}

export default function FitnessWizard({ profileData, onComplete, onSkip }) {
  const { t } = useTranslation()

  const [step, setStep] = useState('goal')
  const [goals, setGoals] = useState([])
  const [targetWeight, setTargetWeight] = useState('')
  const [goalSpeed, setGoalSpeed] = useState('moderate')
  const [activities, setActivities] = useState([])
  const [sedentaryInterest, setSedentaryInterest] = useState(null)
  const [frequency, setFrequency] = useState('3-4')
  const [experienceLevel, setExperienceLevel] = useState(null)
  const [waterGoal, setWaterGoal] = useState(null)

  const { current, total } = getProgress(step, goals)
  const pct = (current / total) * 100

  const goNext = () => {
    const next = getNextStep(step, goals)
    if (next) setStep(next)
  }

  const handleGoalsContinue = () => {
    const flow = getStepFlow(goals)
    setStep(flow[1])
  }

  const handleWaterComplete = (ml) => {
    const fitnessData = {
      health_goal: goals[0] ?? 'maintain',
      target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
      weight_goal_speed: goalSpeed,
      water_goal_ml: ml,
      fitness_profile: {
        completed: true,
        completed_at: new Date().toISOString(),
        experience_level: experienceLevel,
        preferred_activities: activities,
        workout_frequency: frequency,
        sedentary_interest: sedentaryInterest || null,
        goals,
      },
    }
    onComplete(fitnessData)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100">🎯 {t('fitness.wizard_title')}</p>
            <p className="text-xs text-gray-400">{t('fitness.wizard_subtitle')}</p>
          </div>
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {t('fitness.skip')}
          </button>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-2 bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {t('fitness.progress_label', { current, total })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {step === 'goal' && (
          <GoalStep values={goals} onChange={setGoals} onContinue={handleGoalsContinue} />
        )}
        {step === 'target_weight' && (
          <TargetWeightStep
            targetWeight={targetWeight}
            onTargetChange={setTargetWeight}
            goalSpeed={goalSpeed}
            onSpeedChange={setGoalSpeed}
            profileData={profileData}
            onNext={goNext}
          />
        )}
        {step === 'activities' && (
          <ActivitiesStep
            profileData={profileData}
            activities={activities}
            onActivitiesChange={setActivities}
            sedentaryInterest={sedentaryInterest}
            onSedentaryChange={setSedentaryInterest}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            onNext={goNext}
          />
        )}
        {step === 'experience' && (
          <ExperienceStep
            value={experienceLevel}
            onChange={(val) => {
              setExperienceLevel(val)
              const flow = getStepFlow(goals)
              const idx = flow.indexOf('experience')
              if (idx < flow.length - 1) setStep(flow[idx + 1])
            }}
          />
        )}
        {step === 'water' && (
          <WaterStep
            profileData={profileData}
            waterGoal={waterGoal}
            onWaterChange={setWaterGoal}
            onComplete={handleWaterComplete}
          />
        )}
      </div>
    </div>
  )
}
