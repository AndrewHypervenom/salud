import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { hashPin } from '../../lib/crypto'
import { calcBMR, calcTDEE, calcCalorieTarget } from '../../lib/formulas'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import PinSetupStep from '../Onboarding/PinSetupStep'

export default function ProfileForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { profiles, loading, updateProfile } = useProfiles(id || undefined)
  const { activeProfileId, setActiveProfileId } = useProfileContext()
  const { isUnlocked, unlockProfile } = useAuth()
  const isEdit = !!id

  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showCallmebotGuide, setShowCallmebotGuide] = useState(false)
  const [copiedActivation, setCopiedActivation] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [pinSaving, setPinSaving] = useState(false)
  const [healthConditions, setHealthConditions] = useState({})

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      age: '',
      weight_kg: '',
      height_cm: '',
      sex: 'female',
      activity: 'sedentary',
      health_goal: 'maintain',
      notes: '',
      phone_whatsapp: '',
      callmebot_api_key: '',
      target_weight_kg: '',
      weight_goal_speed: 'moderate',
      water_goal_ml: 2000,
    }
  })

  const profile = profiles.find(p => p.id === id)

  // Gate: solo se puede editar el perfil activo propio
  useEffect(() => {
    if (isEdit && activeProfileId && id !== activeProfileId) {
      navigate('/dashboard', { replace: true })
    }
  }, [isEdit, id, activeProfileId, navigate])

  // Gate: editing a PIN-protected profile requires it to be unlocked
  useEffect(() => {
    if (isEdit && profile && profile.access_code && !isUnlocked(id)) {
      navigate('/login/pin', {
        replace: true,
        state: {
          profileId: profile.id,
          profileName: profile.name,
          accessCode: profile.access_code,
          phone: profile.phone_whatsapp,
          redirectTo: `/profiles/${profile.id}/edit`,
        }
      })
    }
  }, [isEdit, profile, id, isUnlocked, navigate])

  useEffect(() => {
    if (isEdit && profiles.length > 0 && profile) {
      reset({
        name: profile.name,
        age: profile.age,
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        sex: profile.sex,
        activity: profile.activity,
        health_goal: profile.health_goal || 'maintain',
        notes: profile.notes || '',
        phone_whatsapp: profile.phone_whatsapp || '',
        callmebot_api_key: profile.callmebot_api_key || '',
        target_weight_kg: profile.target_weight_kg || '',
        weight_goal_speed: profile.weight_goal_speed || 'moderate',
        water_goal_ml: profile.water_goal_ml || 2000,
      })
      setHealthConditions(profile.health_conditions || {})
    }
  }, [id, profiles, isEdit, reset, profile])

  const watchedValues = watch(['weight_kg', 'height_cm', 'age', 'sex', 'activity', 'health_goal', 'target_weight_kg', 'water_goal_ml'])
  const [wWeight, wHeight, wAge, wSex, wActivity, wGoal] = watchedValues
  const previewBMR = (wWeight && wHeight && wAge && wSex)
    ? calcBMR(parseFloat(wWeight), parseFloat(wHeight), parseInt(wAge), wSex) : null
  const previewTDEE = previewBMR ? calcTDEE(previewBMR, wActivity) : null
  const previewTarget = previewTDEE ? calcCalorieTarget(previewTDEE, wGoal) : null

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      age: parseInt(data.age),
      weight_kg: parseFloat(data.weight_kg),
      height_cm: parseFloat(data.height_cm),
      target_weight_kg: data.target_weight_kg ? parseFloat(data.target_weight_kg) : null,
      water_goal_ml: data.water_goal_ml ? parseInt(data.water_goal_ml) : 2000,
    }
    try {
      await updateProfile(id, { ...payload, health_conditions: healthConditions })
      navigate('/profiles')
    } catch (err) {
      console.error(err)
    }
  }

  const handlePinChange = async ({ pin, recoveryWord }) => {
    setPinSaving(true)
    try {
      const access_code = await hashPin(pin)
      const recovery_code = await hashPin(recoveryWord)
      await updateProfile(id, { access_code, recovery_code })
      setActiveProfileId(id)
      unlockProfile(id)
      setShowPinSetup(false)
    } catch (err) {
      console.error(err)
    } finally {
      setPinSaving(false)
    }
  }

  if (loading && isEdit) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">{t('common.edit')}</h1>
      </div>

      {/* Fitness Profile Card */}
      {isEdit && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                🎯 {t('fitness.profile_section_title')}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {profile?.fitness_profile?.completed
                  ? t('fitness.profile_completed')
                  : t('fitness.profile_incomplete')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/fitness-profile')}
              className="flex-shrink-0 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              {profile?.fitness_profile?.completed ? t('common.edit') : t('fitness.complete_now')}
            </button>
          </div>
        </Card>
      )}

      {/* Health Conditions Card */}
      {isEdit && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🩺</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{t('fitness.step_health_conditions')}</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('fitness.health_conditions_hint')}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'high_blood_pressure', emoji: '🩺' },
              { id: 'diabetes',            emoji: '🩸' },
              { id: 'high_cholesterol',    emoji: '🫀' },
              { id: 'water_retention',     emoji: '💧' },
              { id: 'joint_pain',          emoji: '🦵' },
              { id: 'migraines',           emoji: '🤕' },
              { id: 'digestive_issues',    emoji: '🫃' },
              { id: 'chronic_fatigue',     emoji: '😮‍💨' },
              { id: 'anxiety_stress',      emoji: '🧠' },
              { id: 'insomnia',            emoji: '🌙' },
            ].map(cond => {
              const isSelected = !!healthConditions[cond.id]
              return (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => setHealthConditions(prev => ({ ...prev, [cond.id]: !prev[cond.id] }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all active:scale-95 text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <span className="text-base flex-shrink-0">{cond.emoji}</span>
                  <p className={`font-semibold text-xs leading-tight ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {t(`fitness.cond_${cond.id}`)}
                  </p>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* Sección 1 — Datos personales */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {t('profile.section_personal')}
            </p>
            <Input
              label={t('profile.name')}
              placeholder="María García"
              error={errors.name?.message}
              {...register('name', { required: t('common.error') })}
            />
          </div>

          {/* Sección 2 — Medidas y actividad */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t('profile.section_physical')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('profile.age')}
                type="number"
                min="1"
                max="129"
                error={errors.age?.message}
                {...register('age', { required: true, min: 1, max: 129 })}
              />
              <Select
                label={t('profile.sex')}
                error={errors.sex?.message}
                {...register('sex', { required: true })}
              >
                <option value="female">{t('profile.sex_female')}</option>
                <option value="male">{t('profile.sex_male')}</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('profile.weight_kg')}
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="70"
                error={errors.weight_kg?.message}
                {...register('weight_kg', { required: true, min: 20 })}
              />
              <Input
                label={t('profile.height_cm')}
                type="number"
                step="0.1"
                min="50"
                max="250"
                placeholder="160"
                error={errors.height_cm?.message}
                {...register('height_cm', { required: true, min: 50 })}
              />
            </div>
            <Select
              label={t('profile.activity')}
              {...register('activity')}
            >
              <option value="sedentary">{t('profile.activity_sedentary')}</option>
              <option value="light">{t('profile.activity_light')}</option>
              <option value="moderate">{t('profile.activity_moderate')}</option>
              <option value="active">{t('profile.activity_active')}</option>
              <option value="very_active">{t('profile.activity_very_active')}</option>
            </Select>
          </div>

          {/* Sección 3 — Objetivo de salud */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t('profile.section_goal')}
            </p>
            <Select
              label={t('profile.health_goal')}
              {...register('health_goal')}
            >
              <option value="lose_weight">{t('profile.health_goal_lose_weight')}</option>
              <option value="maintain">{t('profile.health_goal_maintain')}</option>
              <option value="gain_muscle">{t('profile.health_goal_gain_muscle')}</option>
              <option value="improve_health">{t('fitness.goal_improve_health')}</option>
            </Select>
            {previewTarget !== null && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 flex flex-col gap-1">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                  {t('profile.tdee_preview_label')}
                </p>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{t('profile.tdee_preview_bmr')}</span>
                  <span>{Math.round(previewBMR)} kcal</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{t('profile.tdee_preview_tdee')}</span>
                  <span>{previewTDEE} kcal</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-primary-700 dark:text-primary-300">
                  <span>{t('profile.tdee_preview_target')}</span>
                  <span>{previewTarget} kcal</span>
                </div>
              </div>
            )}
          </div>

          {/* Sección 3b — Objetivos adicionales */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              🎯 {t('profile.section_targets')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('profile.target_weight_kg')}
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="65"
                {...register('target_weight_kg')}
              />
              <Input
                label={t('profile.water_goal_ml')}
                type="number"
                step="100"
                min="500"
                max="5000"
                placeholder="2000"
                {...register('water_goal_ml')}
              />
            </div>
            <Select
              label={t('profile.weight_goal_speed')}
              {...register('weight_goal_speed')}
            >
              <option value="slow">{t('profile.weight_goal_speed_slow')}</option>
              <option value="moderate">{t('profile.weight_goal_speed_moderate')}</option>
              <option value="fast">{t('profile.weight_goal_speed_fast')}</option>
            </Select>
          </div>

          {/* Sección 4 — Notas médicas */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t('profile.section_medical')}
            </p>
            <Input
              label={t('profile.notes')}
              placeholder="Colesterol 205, triglicéridos 161..."
              {...register('notes')}
            />
          </div>

          {/* Sección 5 — Notificaciones */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              📱 {t('profile.section_notifications')}
            </p>
            <Input
              label={t('whatsapp.phone')}
              type="tel"
              placeholder="506XXXXXXXX"
              {...register('phone_whatsapp')}
            />
            <p className="text-xs text-gray-400 -mt-2">{t('whatsapp.phone_hint')}</p>
            <Input
              label={t('whatsapp.api_key')}
              placeholder="123456"
              {...register('callmebot_api_key')}
            />
            <p className="text-xs text-gray-400 -mt-2">{t('whatsapp.api_key_hint')}</p>

            {/* Guía de configuración CallMeBot */}
            <button
              type="button"
              onClick={() => setShowCallmebotGuide(v => !v)}
              className="text-xs text-primary-600 dark:text-primary-400 font-medium text-left flex items-center gap-1 -mt-1"
            >
              <span>{t('whatsapp.setup_guide_title')}</span>
              <span>{showCallmebotGuide ? '▾' : '▸'}</span>
            </button>
            {showCallmebotGuide && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 -mt-1 flex flex-col gap-3">

                {/* Paso 1: copiar número */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">1. {t('whatsapp.setup_step1_label')}</p>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1">
                    <span className="text-xs font-mono text-gray-800 dark:text-gray-100 flex-1 select-all">+34 644 65 25 19</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('+34644652519')
                        setCopiedPhone(true)
                        setTimeout(() => setCopiedPhone(false), 2000)
                      }}
                      className="text-xs font-medium text-green-600 dark:text-green-400 shrink-0"
                    >
                      {copiedPhone ? '✓ ' + t('whatsapp.setup_copied') : t('whatsapp.setup_copy')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('whatsapp.setup_step1_hint')}</p>
                </div>

                {/* Paso 2: copiar mensaje */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">2. {t('whatsapp.setup_step2_label')}</p>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1">
                    <span className="text-xs font-mono text-gray-800 dark:text-gray-100 flex-1 select-all italic">I allow callmebot to send me messages</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('I allow callmebot to send me messages')
                        setCopiedActivation(true)
                        setTimeout(() => setCopiedActivation(false), 2000)
                      }}
                      className="text-xs font-medium text-green-600 dark:text-green-400 shrink-0"
                    >
                      {copiedActivation ? '✓ ' + t('whatsapp.setup_copied') : t('whatsapp.setup_copy')}
                    </button>
                  </div>
                </div>

                {/* Paso 3 */}
                <p className="text-xs text-gray-600 dark:text-gray-300">3. {t('whatsapp.setup_step3')}</p>

                <p className="text-xs text-gray-500 dark:text-gray-400 italic">{t('whatsapp.setup_note')}</p>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Spinner size="sm" /> : t('profile.save')}
          </Button>
        </form>
      </Card>

      {/* Change PIN section */}
      {isEdit && (
        <Card>
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{t('pin.change_pin')}</p>
              <p className="text-sm text-gray-500">{t('pin.change_pin_hint')}</p>
            </div>
            {showPinSetup ? (
              pinSaving ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : (
                <PinSetupStep onComplete={handlePinChange} />
              )
            ) : (
              <Button variant="secondary" onClick={() => setShowPinSetup(true)}>
                {t('pin.change_pin')}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
