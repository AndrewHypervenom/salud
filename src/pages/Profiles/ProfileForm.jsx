import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { hashPin } from '../../lib/crypto'
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
  const { profiles, loading, updateProfile } = useProfiles()
  const { setActiveProfileId } = useProfileContext()
  const { isUnlocked, unlockProfile } = useAuth()
  const isEdit = !!id

  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pinSaving, setPinSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      age: '',
      weight_kg: '',
      height_cm: '',
      sex: 'female',
      activity: 'sedentary',
      notes: '',
      phone_whatsapp: '',
      callmebot_api_key: '',
    }
  })

  const profile = profiles.find(p => p.id === id)

  // Gate: editing a PIN-protected profile requires it to be unlocked
  useEffect(() => {
    if (isEdit && profile && profile.access_code && !isUnlocked(id)) {
      navigate(`/profiles/${id}/unlock`, { replace: true })
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
        notes: profile.notes || '',
        phone_whatsapp: profile.phone_whatsapp || '',
        callmebot_api_key: profile.callmebot_api_key || '',
      })
    }
  }, [id, profiles, isEdit, reset, profile])

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      age: parseInt(data.age),
      weight_kg: parseFloat(data.weight_kg),
      height_cm: parseFloat(data.height_cm),
    }
    try {
      await updateProfile(id, payload)
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

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label={t('profile.name')}
            placeholder="María García"
            error={errors.name?.message}
            {...register('name', { required: t('common.error') })}
          />
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
          <Input
            label={t('profile.notes')}
            placeholder="Colesterol 205, triglicéridos 161..."
            {...register('notes')}
          />

          {/* WhatsApp section */}
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">📱 {t('profile.whatsapp_section')}</p>
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
              <p className="font-semibold text-gray-900">{t('pin.change_pin')}</p>
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
