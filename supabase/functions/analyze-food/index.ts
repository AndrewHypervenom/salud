const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'
const MODEL_TEXT = 'llama-3.3-70b-versatile'

async function groqChat(model: string, messages: unknown[], maxTokens = 512) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0 }),
  })
  if (!res.ok) throw new Error(`Groq API error: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

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
    const { imageUrl, description: textDescription, correction } = await req.json()

    if (!imageUrl && !textDescription) {
      return new Response(
        JSON.stringify({ error: 'imageUrl or description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let foodDescription = textDescription ?? ''
    let detectedFoods: string[] = []

    // ── Paso 1: Si hay imagen, usar modelo de visión solo para IDENTIFICAR la comida ──
    if (imageUrl) {
      const visionContent = await groqChat(MODEL_VISION, [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: 'Eres un nutricionista experto en identificar alimentos. Mira esta imagen y responde SOLO con JSON válido sin markdown:\n{"foods":["ingrediente1","ingrediente2"],"description":"describe cada ingrediente visible con su peso estimado en gramos, ejemplo: Garbanzos cocidos (200g), pulpo a la gallega (120g), pimentón y aceite de oliva (10g)","portion_notes":"tamaño estimado del plato, ej: plato mediano para una persona"}\nSé específico con los ingredientes reales que ves.',
          },
        ],
      }])

      const visionResult = parseJson(visionContent)
      if (visionResult?.description) {
        foodDescription = visionResult.description
        detectedFoods = visionResult.foods ?? []
      } else {
        // fallback: usar el texto crudo del modelo de visión como descripción
        foodDescription = visionContent.slice(0, 300)
      }
    }

    // ── Paso 2: Modelo de texto 70b para calcular macros con precisión ──
    const correctionNote = correction
      ? `\nCORRECCIÓN DEL USUARIO: "${correction}" — ajusta la descripción y los macros según esta corrección.`
      : ''

    const nutritionPrompt = `Eres un nutricionista clínico experto en composición nutricional de alimentos.

Analiza esta comida: "${foodDescription}"${correctionNote}

Basándote en tablas nutricionales estándar (USDA, BEDCA), calcula los macronutrientes exactos para las porciones indicadas.

Responde SOLO con JSON válido sin texto adicional ni markdown:
{"foods":${JSON.stringify(detectedFoods.length ? detectedFoods : [foodDescription])},"description":"descripción actualizada incluyendo la corrección si la hay","calories_estimated":NUMERO,"macros":{"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO,"fiber_g":NUMERO}}

Reglas:
- Todos los valores deben ser números enteros
- Usa valores realistas según las cantidades descritas
- Si no hay pesos exactos, asume una porción normal para una persona adulta
- protein_g, carbs_g, fat_g, fiber_g son los gramos totales del plato completo`

    const nutritionContent = await groqChat(MODEL_TEXT, [{
      role: 'user',
      content: nutritionPrompt,
    }], 256)

    const result = parseJson(nutritionContent)

    if (!result) {
      throw new Error('No se pudo analizar la comida')
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
