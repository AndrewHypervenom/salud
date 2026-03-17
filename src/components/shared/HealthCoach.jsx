import { useHealthCoach } from '../../hooks/useHealthCoach'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

export function HealthCoach({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP }) {
  const { recommendations, loading, error, analyze, reset } = useHealthCoach()

  const handleAnalyze = () => {
    analyze({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP })
  }

  // Estado vacío — botón de acción
  if (!recommendations && !loading) {
    return (
      <Card className="border border-dashed border-primary-300 bg-primary-50/50 dark:bg-primary-900/10 dark:border-primary-700">
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <span className="text-4xl">🤖</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Coach IA</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analiza tu día y recibe recomendaciones personalizadas para bajar de peso
            </p>
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <Button onClick={handleAnalyze} className="w-full">
            ✨ Analizar mi día
          </Button>
        </div>
      </Card>
    )
  }

  // Estado cargando
  if (loading) {
    return (
      <Card className="border border-primary-200 bg-primary-50/50 dark:bg-primary-900/10">
        <div className="flex flex-col items-center gap-3 py-4">
          <Spinner />
          <p className="text-sm text-gray-500">Analizando tu día...</p>
        </div>
      </Card>
    )
  }

  // Resultados
  return (
    <div className="flex flex-col gap-3">
      {/* Análisis del día */}
      <Card className="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20">
        <div className="flex items-start gap-2">
          <span className="text-2xl flex-shrink-0">🤖</span>
          <div>
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide mb-1">
              Análisis de hoy
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              {recommendations.analysis}
            </p>
          </div>
        </div>
      </Card>

      {/* Recomendaciones */}
      {recommendations.recommendations?.map((rec, i) => (
        <Card key={i} className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">{rec.icon}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{rec.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5">{rec.text}</p>
          </div>
        </Card>
      ))}

      {/* Plan de mañana */}
      {recommendations.tomorrow_plan && (
        <Card className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
            📅 Plan para mañana
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {recommendations.tomorrow_plan}
          </p>
        </Card>
      )}

      {/* Motivación */}
      {recommendations.motivation && (
        <p className="text-center text-sm font-medium text-primary-600 dark:text-primary-400 px-4">
          💪 {recommendations.motivation}
        </p>
      )}

      {/* Botón regenerar */}
      <button
        onClick={reset}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-center underline"
      >
        Regenerar análisis
      </button>
    </div>
  )
}
