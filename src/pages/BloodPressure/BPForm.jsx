import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export function BPForm({ onSubmit, onCancel }) {
  const { t } = useTranslation()
  const now = new Date()
  const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      systolic: '',
      diastolic: '',
      pulse: '',
      measured_at: localISOTime,
      notes: '',
    }
  })

  const handleFormSubmit = async (data) => {
    await onSubmit({
      systolic: parseInt(data.systolic),
      diastolic: parseInt(data.diastolic),
      pulse: data.pulse ? parseInt(data.pulse) : null,
      measured_at: new Date(data.measured_at).toISOString(),
      notes: data.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`${t('bp.systolic')} (${t('bp.mmhg')})`}
          type="number"
          min="60"
          max="300"
          placeholder="120"
          error={errors.systolic?.message}
          {...register('systolic', { required: true, min: 60, max: 300 })}
        />
        <Input
          label={`${t('bp.diastolic')} (${t('bp.mmhg')})`}
          type="number"
          min="40"
          max="200"
          placeholder="80"
          error={errors.diastolic?.message}
          {...register('diastolic', { required: true, min: 40, max: 200 })}
        />
      </div>
      <Input
        label={`${t('bp.pulse')} (${t('bp.bpm')})`}
        type="number"
        min="30"
        max="250"
        placeholder="72"
        {...register('pulse', { min: 30, max: 250 })}
      />
      <Input
        label={t('bp.measured_at')}
        type="datetime-local"
        {...register('measured_at', { required: true })}
      />
      <Input
        label={t('bp.notes')}
        placeholder="Después del descanso..."
        {...register('notes')}
      />
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? <Spinner size="sm" /> : t('bp.save')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
