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
    const { ingredients, healthGoal, dailyCaloriesTarget, remainingCalories } = await req.json()

    if (!ingredients || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'ingredients are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const goalMap: Record<string, string> = {
      lose_weight: 'bajar de peso (recetas con déficit calórico, altas en proteína y fibra, bajas en grasa)',
      gain_muscle: 'ganar músculo (recetas altas en proteína, con carbohidratos complejos)',
      improve_health: 'mejorar la salud (recetas balanceadas y nutritivas)',
      maintain: 'mantener el peso (recetas balanceadas)',
    }

    const goalDesc = goalMap[healthGoal] ?? goalMap.improve_health
    const ingredientList = ingredients.join(', ')
    const remaining = remainingCalories ?? dailyCaloriesTarget ?? 2000

    const prompt = `Eres un chef nutricionista experto. El usuario tiene los siguientes ingredientes disponibles: ${ingredientList}.

Su objetivo de salud es: ${goalDesc}.
Calorías restantes del día: ${remaining} kcal.

Crea exactamente 3 recetas usando principalmente esos ingredientes más ingredientes básicos de cocina (sal, aceite, ajo, cebolla, especias comunes). Las recetas deben adaptarse al objetivo de salud.

Responde SOLO con JSON válido sin markdown:
{"recipes":[
  {
    "name":"Nombre de la receta",
    "calories_per_serving":NUMERO,
    "prep_time_minutes":NUMERO,
    "servings":NUMERO,
    "macros":{"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO},
    "ingredients_used":["ingrediente 1","ingrediente 2"],
    "instructions":["Paso 1","Paso 2","Paso 3"],
    "tags":["tag1","tag2"]
  }
]}

Reglas:
- Exactamente 3 recetas variadas
- Todos los números deben ser enteros
- Las instrucciones deben tener 3-5 pasos claros y cortos
- Tags ejemplos: "alto-proteína", "rápido", "sin-gluten", "bajo-carbohidrato", "vegetariano", "saciante"
- Sin texto adicional fuera del JSON`

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    })

    if (!groqRes.ok) {
      throw new Error(`Groq API error: ${await groqRes.text()}`)
    }

    const groqData = await groqRes.json()
    const content: string = groqData.choices?.[0]?.message?.content ?? ''
    const result = parseJson(content)

    if (!result || !Array.isArray(result.recipes)) {
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
