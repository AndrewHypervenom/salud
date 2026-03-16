import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'

export function WhatsAppAlerts({ profile, habitsText, foodText, summaryText }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState({}) // { [key]: 'sending' | 'sent' | 'error' }

  const hasConfig = profile?.phone_whatsapp && profile?.callmebot_api_key

  const sendMessage = async (key, message) => {
    setStatus(s => ({ ...s, [key]: 'sending' }))
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: profile.phone_whatsapp,
          apiKey: profile.callmebot_api_key,
          message,
        },
      })
      if (error || !data?.success) throw new Error()
      setStatus(s => ({ ...s, [key]: 'sent' }))
      setTimeout(() => setStatus(s => ({ ...s, [key]: null })), 3000)
    } catch {
      setStatus(s => ({ ...s, [key]: 'error' }))
      setTimeout(() => setStatus(s => ({ ...s, [key]: null })), 4000)
    }
  }

  if (!hasConfig) return null

  const buttons = [
    { key: 'habits', label: t('whatsapp.send_habits'), message: habitsText },
    { key: 'food', label: t('whatsapp.send_food'), message: foodText },
    { key: 'summary', label: t('whatsapp.send_summary'), message: summaryText },
  ].filter(b => b.message)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
        <span>📱</span> {t('whatsapp.title')}
      </p>
      <div className="flex flex-col gap-2">
        {buttons.map(btn => (
          <button
            key={btn.key}
            disabled={status[btn.key] === 'sending'}
            onClick={() => sendMessage(btn.key, btn.message)}
            className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors border ${
              status[btn.key] === 'sent'
                ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                : status[btn.key] === 'error'
                ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {status[btn.key] === 'sending'
              ? t('whatsapp.sending')
              : status[btn.key] === 'sent'
              ? `✓ ${t('whatsapp.sent')}`
              : status[btn.key] === 'error'
              ? t('whatsapp.error')
              : btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
