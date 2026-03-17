import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { ProgressRing } from '../ui/ProgressRing'
import { useWaterLogs } from '../../hooks/useWaterLogs'

export function WaterWidget({ profileId, waterGoalMl = 2000 }) {
  const { todayTotal, todayPercent, addWater } = useWaterLogs(profileId, waterGoalMl)

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try { await addWater(250) } catch (err) { console.error(err) }
  }

  return (
    <Link to="/water">
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <ProgressRing percent={todayPercent} size={64} strokeWidth={7} color="#3b82f6">
            <span className="text-base">💧</span>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-0.5">Agua hoy</p>
            <p className="text-xl font-bold text-blue-600">
              {todayTotal}
              <span className="text-sm font-normal text-gray-400"> / {waterGoalMl} ml</span>
            </p>
            <p className="text-xs text-gray-400">{Math.round(todayPercent)}% de la meta</p>
          </div>
          <button
            onClick={handleQuickAdd}
            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold hover:bg-blue-600 transition-colors flex-shrink-0"
            title="+250ml"
          >
            +
          </button>
        </div>
      </Card>
    </Link>
  )
}
