const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const res = await fetch('https://www.callmebot.com/blog/free-api-whatsapp-messages/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()

    // Busca el número en formato internacional dentro del HTML
    // Ejemplo: +34 644 65 25 19 o +34644652519
    const match = html.match(/\+34[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}/)

    if (!match) throw new Error('No se encontró el número en la página')

    // Normalizar: quitar espacios y guiones para el valor a copiar
    const raw = match[0].replace(/[\s\-]/g, '')
    const display = match[0].trim()

    return new Response(
      JSON.stringify({ number: raw, display }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
