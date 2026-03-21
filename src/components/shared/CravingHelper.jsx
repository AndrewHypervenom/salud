import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Card } from '../ui/Card'
import { supabase } from '../../lib/supabase'

export function CravingHelper({ profile }) {
  const { t } = useTranslation()
  const [craving, setCraving] = useState('')
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!craving.trim()) return
    setLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('craving-helper', {
        body: { craving: craving.trim(), healthGoal: profile?.health_goal },
      })
      if (fnError) throw fnError
      setSuggestion(data.suggestion)
    } catch (err) {
      setError(t('craving.error', 'Ups, no pude obtener una sugerencia. Intenta de nuevo.'))
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setCraving('')
    setSuggestion(null)
    setError(null)
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🍫</span>
        <h2 className="font-bold text-gray-900 dark:text-gray-100">
          {t('craving.title', '¿Tienes un antojo?')}
        </h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('craving.subtitle', 'Cuéntame qué quieres comer y te doy una idea más balanceada')}
      </p>

      {!suggestion ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={craving}
            onChange={e => setCraving(e.target.value)}
            placeholder={t('craving.placeholder', 'ej: torta de chocolate, papas fritas, helado...')}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !craving.trim()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            <Sparkles size={15} />
            {loading
              ? t('craving.loading', 'Pensando...')
              : t('craving.button', 'Buscar alternativa')}
          </button>
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              {t('craving.result_label', 'Mi sugerencia:')}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {suggestion}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <RefreshCw size={14} />
            {t('craving.try_another', 'Intentar con otro antojo')}
          </button>
        </div>
      )}
    </Card>
  )
}
