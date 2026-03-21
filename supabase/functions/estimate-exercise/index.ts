const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function parseJson(content: string) {
  try {
    const match = content.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { /* ignore */ }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { exerciseName, durationMinutes, weightKg, experienceLevel, healthGoal } = await req.json()

    if (!exerciseName || !durationMinutes) {
      return new Response(
        JSON.stringify({ error: 'exerciseName and durationMinutes are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const weight = weightKg ?? 70
    const level = experienceLevel ?? 'beginner'

    const prompt = `Eres un experto en fisiología del ejercicio. Calcula las calorías quemadas con precisión.

Ejercicio: "${exerciseName}"
Duración: ${durationMinutes} minutos
Peso corporal: ${weight} kg
Nivel de experiencia: ${level}
Objetivo de salud: ${healthGoal ?? 'improve_health'}

Instrucciones:
- Usa la fórmula MET × peso_kg × (duración_min / 60)
- Para ejercicios inusuales (pole dance, parkour, boxeo tailandés, etc.), elige el MET equivalente más cercano conocido
- Pole dance tiene MET ≈ 5.5-7.0 (similar a baile y gimnasia)
- Considera que a mayor experiencia, la eficiencia puede reducir ligeramente las calorías

Responde SOLO con JSON válido sin texto adicional ni markdown:
{"calories_estimated":NUMERO,"intensity":"low|moderate|high|very_high","description":"descripción breve del ejercicio y por qué quema esas calorías","tips":["tip práctico 1","tip práctico 2"],"exercise_type_suggested":"cardio|strength|flexibility|sports|other"}

Reglas: todos los números deben ser enteros. Sin texto adicional.`

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      }),
    })

    if (!groqRes.ok) {
      throw new Error(`Groq API error: ${await groqRes.text()}`)
    }

    const groqData = await groqRes.json()
    const content: string = groqData.choices?.[0]?.message?.content ?? ''
    const result = parseJson(content)

    if (!result || typeof result.calories_estimated !== 'number') {
      throw new Error('Invalid response from AI')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
