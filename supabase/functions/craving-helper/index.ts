const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `Eres un asistente de salud amigable que ayuda a personas en Bogotá, Colombia cuando tienen antojos o ansiedad por comer.

Cuando el usuario te diga qué quiere comer, responde con:
1. Una opción más saludable que satisfaga ese antojo — algo que puedan encontrar en D1, OXXO, Carulla, Jumbo o una tienda de barrio en Bogotá, o que puedan preparar fácil en casa.
2. Una posible razón del antojo (azúcar baja, estrés, deshidratación, aburrimiento, etc.)
3. Un tip corto y práctico para manejarlo.

Responde de forma cálida, sin juzgar, en máximo 4-5 líneas corridas. Sin listas largas ni viñetas. Tono amigable, directo y práctico. Habla en español colombiano informal.
Si el usuario tiene un objetivo de salud específico (perder peso, ganar músculo, etc.), tenlo en cuenta para dar mejores alternativas.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { craving, healthGoal } = await req.json()

    if (!craving || craving.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'craving is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const userMessage = healthGoal
      ? `Tengo ganas de comer: ${craving}. Mi objetivo es: ${healthGoal}.`
      : `Tengo ganas de comer: ${craving}.`

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      throw new Error(`Groq API error: ${errText}`)
    }

    const groqData = await groqRes.json()
    const suggestion: string = groqData.choices?.[0]?.message?.content ?? ''

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
