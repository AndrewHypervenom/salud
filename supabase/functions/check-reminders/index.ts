import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

// Corre cada minuto. Compara la hora local del usuario (según su timezone) con la hora guardada.

Deno.serve(async (_req: Request) => {
  const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
  const VAPID_EMAIL   = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@saludfamiliar.app'

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const nowUtc = new Date()

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, habits_time, food_time, timezone, profiles(name)')
    .not('habits_time', 'is', null)

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  let sent = 0
  await Promise.all(subs.map(async (s) => {
    // Hora local del usuario
    const tz = s.timezone ?? 'America/Costa_Rica'
    const localTime = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(nowUtc)
    // localTime es algo como "13:25"
    const [hh, mm] = localTime.split(':')
    const localStr = `${hh}:${mm}:00`

    const name = (s.profiles as { name: string })?.name ?? ''
    const messages: { title: string; body: string }[] = []

    if (s.habits_time === localStr) {
      messages.push({ title: '🏃 Salud Familiar', body: `${name ? name + ', r' : 'R'}ecuerda registrar tus hábitos de hoy.` })
    }
    if (s.food_time === localStr) {
      messages.push({ title: '🥗 Salud Familiar', body: `${name ? name + ', r' : 'R'}ecuerda registrar tu comida de hoy.` })
    }

    for (const msg of messages) {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(msg)
      ).catch(() => null)
      sent++
    }
  }))

  return new Response(JSON.stringify({ sent, checked: subs.length }), { status: 200 })
})
