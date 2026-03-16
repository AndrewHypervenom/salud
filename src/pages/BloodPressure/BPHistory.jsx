import { useTranslation } from 'react-i18next'
import { classifyBP } from '../../lib/bpStatus'
import { Badge } from '../../components/ui/Badge'

export function BPHistory({ readings, onDelete }) {
  const { t } = useTranslation()

  if (readings.length === 0) {
    return <p className="text-gray-400 text-center py-6">{t('bp.no_readings')}</p>
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm min-w-[360px]">
        <thead>
          <tr className="text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 text-left">
            <th className="pb-2 pr-2">Fecha</th>
            <th className="pb-2 pr-2">mmHg</th>
            <th className="pb-2 pr-2">{t('bp.status')}</th>
            <th className="pb-2 text-center">{t('bp.pulse')}</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {readings.map(r => {
            const bp = classifyBP(r.systolic, r.diastolic)
            const statusKey = `bp.status_${bp.status}`
            const date = new Date(r.measured_at)
            return (
              <tr key={r.id} className={`border-b dark:border-gray-700 last:border-0 ${bp.bgClass} ${bp.bgDarkClass} border-l-4 ${bp.isCrisis ? 'border-l-red-800' : ''}`}>
                <td className="py-3 pr-2 text-gray-600 whitespace-nowrap">
                  {date.toLocaleDateString()}<br />
                  <span className="text-xs text-gray-400">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="py-3 pr-2 font-bold text-gray-900 dark:text-gray-50">
                  {r.systolic}/{r.diastolic}
                </td>
                <td className="py-3 pr-2">
                  <Badge className={bp.badgeClass}>{t(statusKey)}</Badge>
                </td>
                <td className="py-3 pr-2 text-center text-gray-500">
                  {r.pulse ?? '—'}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => confirm(t('bp.delete_confirm')) && onDelete(r.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
