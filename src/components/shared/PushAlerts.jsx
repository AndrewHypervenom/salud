import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function PushAlerts({ habitsText, foodText, summaryText }) {
  const { t } = useTranslation()
  const [permission, setPermission] = useState('default')
  const [status, setStatus] = useState({})

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const sendNotification = (key, text) => {
    if (Notification.permission !== 'granted') return
    setStatus(s => ({ ...s, [key]: 'sent' }))
    new Notification('Salud Familiar', {
      body: text,
      icon: '/icon-192.png',
    })
    setTimeout(() => setStatus(s => ({ ...s, [key]: null })), 3000)
  }

  if (!('Notification' in window)) return null

  const buttons = [
    { key: 'habits', label: t('push.send_habits'), text: habitsText },
    { key: 'food', label: t('push.send_food'), text: foodText },
    { key: 'summary', label: t('push.send_summary'), text: summaryText },
  ].filter(b => b.text)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
        🔔 {t('push.title')}
      </p>

      {permission === 'denied' && (
        <p className="text-xs text-red-500 dark:text-red-400">{t('push.denied')}</p>
      )}

      {permission === 'default' && (
        <button
          onClick={requestPermission}
          className="w-full py-3 px-4 rounded-xl text-sm font-medium border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          🔔 {t('push.enable')}
        </button>
      )}

      {permission === 'granted' && buttons.map(btn => (
        <button
          key={btn.key}
          onClick={() => sendNotification(btn.key, btn.text)}
          className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors border ${
            status[btn.key] === 'sent'
              ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          {status[btn.key] === 'sent' ? `✓ ${t('push.sent')}` : btn.label}
        </button>
      ))}
    </div>
  )
}
