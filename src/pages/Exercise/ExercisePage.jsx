import { useTranslation } from 'react-i18next'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function ExercisePage() {
  const { t } = useTranslation()

  const program = t('exercise.program', { returnObjects: true })
  const benefits = t('exercise.benefits', { returnObjects: true })
  const safety = t('exercise.safety', { returnObjects: true })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t('exercise.title')}</h1>
        <p className="text-gray-500">{t('exercise.subtitle')}</p>
      </div>

      {/* Program table */}
      <Card>
        <h2 className="font-bold text-gray-900 dark:text-gray-50 mb-3">🏃 Programa 8 semanas</h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 text-left">
                <th className="pb-2 pr-3">{t('exercise.week')}</th>
                <th className="pb-2 pr-3">{t('exercise.type')}</th>
                <th className="pb-2 pr-3 text-center">{t('exercise.minutes')}</th>
                <th className="pb-2 text-center">{t('exercise.days_per_week')}</th>
              </tr>
            </thead>
            <tbody>
              {program.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 pr-3 font-semibold text-primary-600">{row.week_range}</td>
                  <td className="py-3 pr-3">
                    <p>{row.activity}</p>
                    <p className="text-xs text-gray-400">{row.notes}</p>
                  </td>
                  <td className="py-3 pr-3 text-center font-bold">{row.minutes}</td>
                  <td className="py-3 text-center">
                    <Badge className={row.intensity === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}>
                      {row.days}d
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Benefits */}
      <Card>
        <h2 className="font-bold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
          <span>💪</span> {t('exercise.benefits_title')}
        </h2>
        <ul className="flex flex-col gap-2">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-green-700">
              <span className="mt-0.5">✓</span><span>{b}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Safety */}
      <Card className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <h2 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
          <span>⚠️</span> {t('exercise.safety_title')}
        </h2>
        <ul className="flex flex-col gap-2">
          {safety.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-yellow-800">
              <span className="mt-0.5 flex-shrink-0">•</span><span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
