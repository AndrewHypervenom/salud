import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'

const VAPID_PUBLIC_KEY = 'BONgw6srIhdC-HSigCA-HTfNGriBSvgwMBQPLx8gN4dvaWHhnkIVKKQLhy2JXbVqidKeWcBaTPenysKz6sks_WM'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function PushAlerts({ profileId }) {
  const { t } = useTranslation()
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [habitsTime, setHabitsTime] = useState('')
  const [foodTime, setFoodTime] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (!ok) { setLoading(false); return }
    setPermission(Notification.permission)
    init()
  }, [profileId])

  const init = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        setSubscription(sub)
        // Cargar horas guardadas
        const { data } = await supabase
          .from('push_subscriptions')
          .select('habits_time, food_time')
          .eq('profile_id', profileId)
          .eq('endpoint', sub.endpoint)
          .maybeSingle()
        if (data) {
          setHabitsTime(data.habits_time?.slice(0, 5) ?? '')
          setFoodTime(data.food_time?.slice(0, 5) ?? '')
        }
      }
    } catch (e) {
      console.error('SW init error', e)
    } finally {
      setLoading(false)
    }
  }

  const enable = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      setSubscription(sub)
      await saveSubscription(sub, habitsTime, foodTime)
    } catch (e) {
      console.error('Subscribe error', e)
    } finally {
      setLoading(false)
    }
  }

  const disable = async () => {
    if (!subscription) return
    setLoading(true)
    await supabase.from('push_subscriptions').delete()
      .eq('profile_id', profileId).eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
    setSubscription(null)
    setHabitsTime('')
    setFoodTime('')
    setLoading(false)
  }

  const saveSubscription = async (sub, hTime, fTime) => {
    const key = sub.getKey('p256dh')
    const auth = sub.getKey('auth')
    await supabase.from('push_subscriptions').upsert({
      profile_id: profileId,
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
      habits_time: hTime || null,
      food_time: fTime || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }, { onConflict: 'profile_id,endpoint' })
  }

  const saveTimes = async () => {
    if (!subscription) return
    setSaving(true)
    await saveSubscription(subscription, habitsTime, foodTime)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setSaving(false)
  }

  if (!supported) return null

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
      <span className="animate-spin">⏳</span> {t('push.loading')}
    </div>
  )

  if (permission === 'denied') return (
    <p className="text-xs text-red-500 dark:text-red-400">{t('push.denied')}</p>
  )

  if (!subscription) return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">🔔 {t('push.title')}</p>
      <button
        onClick={enable}
        className="w-full py-3 px-4 rounded-xl text-sm font-medium border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        🔔 {t('push.enable')}
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">🔔 {t('push.title')}</p>
        <button onClick={disable} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          {t('push.disable')}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t('push.schedule_hint')}</p>

      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300">🏃 {t('push.habits_time')}</span>
          <input
            type="time"
            value={habitsTime}
            onChange={e => setHabitsTime(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300">🥗 {t('push.food_time')}</span>
          <input
            type="time"
            value={foodTime}
            onChange={e => setFoodTime(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </label>
      </div>

      <button
        onClick={saveTimes}
        disabled={saving}
        className={`w-full py-2 rounded-xl text-sm font-medium transition-colors border ${
          saved
            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-400'
            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
      >
        {saved ? `✓ ${t('push.saved')}` : t('push.save_times')}
      </button>
    </div>
  )
}
