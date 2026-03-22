import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

Deno.serve(async (_req: Request) => {
  console.log('check-reminders fired at', new Date().toISOString())

  const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
  const VAPID_EMAIL   = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@saludfamiliar.app'

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const nowUtc = new Date()

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, habits_time, food_time, timezone, profiles(name)')
    .not('habits_time', 'is', null)

  console.log('subs:', subs?.length ?? 0, 'error:', error?.message ?? 'none')

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  let sent = 0
  for (const s of subs) {
    const tz = s.timezone ?? 'America/Bogota'
    const localTime = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(nowUtc).replace('24:', '00:')

    const [hh, mm] = localTime.split(':')
    const localStr = `${hh.padStart(2, '0')}:${mm}:00`

    console.log(`tz=${tz} local=${localStr} habits=${s.habits_time} food=${s.food_time}`)

    const name = (s.profiles as { name: string })?.name ?? ''
    const pushSub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }

    if (s.habits_time === localStr) {
      try {
        await webpush.sendNotification(pushSub, JSON.stringify({
          title: '🏃 Salud Familiar',
          body: `${name ? name + ', r' : 'R'}ecuerda registrar tus hábitos de hoy.`,
        }))
        console.log('habits push sent')
        sent++
      } catch (e) {
        console.error('habits push error:', e)
      }
    }

    if (s.food_time === localStr) {
      try {
        await webpush.sendNotification(pushSub, JSON.stringify({
          title: '🥗 Salud Familiar',
          body: `${name ? name + ', r' : 'R'}ecuerda registrar tu comida de hoy.`,
        }))
        console.log('food push sent')
        sent++
      } catch (e) {
        console.error('food push error:', e)
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})
