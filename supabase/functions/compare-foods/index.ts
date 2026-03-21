const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'
const MODEL_TEXT = 'llama-3.3-70b-versatile'

async function groqChat(model: string, messages: unknown[], maxTokens = 512, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0 }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Groq API error: ${await res.text()}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  } finally {
    clearTimeout(timer)
  }
}

function parseJson(content: string) {
  try {
    const match = content.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { /* ignore */ }
  return null
}

async function analyzeImage(imageUrl: string) {
  try {
    const content = await groqChat(MODEL_VISION, [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        {
          type: 'text',
          text: `Eres un nutricionista experto. Analiza esta imagen de alimento/comida y responde SOLO con JSON válido sin markdown:
{"name":"nombre del alimento o plato","calories":NUMERO,"macros":{"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO},"healthScore":NUMERO,"pros":["ventaja 1","ventaja 2"],"cons":["desventaja 1","desventaja 2"]}

Reglas:
- Todos los valores numéricos son enteros
- calories: calorías estimadas para una porción normal de una persona adulta
- healthScore: 1=muy poco saludable (comida chatarra), 10=muy saludable (verduras, proteína magra)
- pros: 2-3 aspectos nutricionales positivos
- cons: 2-3 aspectos negativos o advertencias
- Si la imagen no muestra comida claramente, usa {"name":"Sin datos","calories":0,"macros":{"protein_g":0,"carbs_g":0,"fat_g":0},"healthScore":0,"pros":[],"cons":["No se pudo identificar el alimento"]}`,
        },
      ],
    }], 512, 30000)

    const result = parseJson(content)
    return result ?? { name: 'Sin datos', calories: 0, macros: { protein_g: 0, carbs_g: 0, fat_g: 0 }, healthScore: 0, pros: [], cons: ['No se pudo analizar'] }
  } catch {
    return { name: 'Sin datos', calories: 0, macros: { protein_g: 0, carbs_g: 0, fat_g: 0 }, healthScore: 0, pros: [], cons: ['Error al analizar'], error: true }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrls, context } = await req.json()

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'imageUrls must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const urls = imageUrls.slice(0, 6)

    // Analizar todas las imágenes en paralelo
    const foodResults = await Promise.all(urls.map(analyzeImage))

    // Enriquecer con las URLs originales
    const foods = foodResults.map((food, i) => ({ ...food, imageUrl: urls[i] }))

    // Segunda llamada para generar el ranking y recomendación
    const validFoods = foods.filter(f => f.healthScore > 0)

    let winner = { index: 0, reason: 'Es la opción más saludable disponible' }
    let recommendation = ''
    let warnings: string[] = []

    if (validFoods.length > 0) {
      const comparisonPrompt = `Eres un nutricionista. Analiza estas opciones de alimentos:
${JSON.stringify(foods.map((f, i) => ({ index: i, name: f.name, calories: f.calories, healthScore: f.healthScore, pros: f.pros, cons: f.cons })), null, 2)}

Contexto del usuario: "${context || 'ninguno'}"

Responde SOLO con JSON válido sin markdown:
{"winner":{"index":NUMERO,"reason":"razón breve de por qué es la mejor opción"},"recommendation":"recomendación personalizada de 1-2 oraciones considerando el contexto","warnings":["advertencia importante si algún alimento es muy poco saludable o debe evitarse"]}

Reglas:
- winner.index: índice del array (0-based) del alimento más saludable
- Si todos son igual de saludables, elige el de menos calorías
- warnings: solo incluye si hay alimentos con healthScore <= 3 o riesgos reales. Array vacío si no hay advertencias
- recommendation: si no hay contexto, da una recomendación general`

      const comparisonContent = await groqChat(MODEL_TEXT, [{
        role: 'user',
        content: comparisonPrompt,
      }], 512, 20000)

      const comparison = parseJson(comparisonContent)
      if (comparison) {
        winner = comparison.winner ?? winner
        recommendation = comparison.recommendation ?? ''
        warnings = Array.isArray(comparison.warnings) ? comparison.warnings : []
      } else {
        // Fallback: ganador por healthScore más alto
        const bestIndex = foods.reduce((best, f, i) => f.healthScore > foods[best].healthScore ? i : best, 0)
        winner = { index: bestIndex, reason: 'Mayor puntuación de salud' }
      }
    }

    return new Response(
      JSON.stringify({ foods, winner, recommendation, warnings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = (err as Error).message
    const isTimeout = message.includes('abort') || message.includes('timeout')
    return new Response(
      JSON.stringify({ error: isTimeout ? 'El análisis tardó demasiado, intenta de nuevo' : message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
