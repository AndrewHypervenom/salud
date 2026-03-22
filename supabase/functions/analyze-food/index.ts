const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'
const MODEL_TEXT = 'llama-3.3-70b-versatile'

async function groqChat(model: string, messages: unknown[], maxTokens = 512, timeoutMs = 25000) {
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, description: textDescription, correction, mode, query } = await req.json()

    if (!imageUrl && !textDescription && !query) {
      return new Response(
        JSON.stringify({ error: 'imageUrl, description, or query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const correctionNote = correction
      ? `\nCORRECCIÓN DEL USUARIO: "${correction}" — ajusta los valores según esta corrección.`
      : ''

    let result = null

    if (mode === 'query' && query) {
      // ── Modo búsqueda: datos nutricionales por 100g del alimento consultado ──
      const queryContent = await groqChat(MODEL_TEXT, [{
        role: 'user',
        content: `Eres un nutricionista experto con acceso a tablas nutricionales (USDA, BEDCA, FAO). Da los valores nutricionales por 100g del alimento: "${query}".
Responde SOLO con JSON válido sin markdown ni texto adicional:
{"name":"nombre oficial del alimento en español","calories_per_100g":NUMERO,"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO,"fiber_g":NUMERO}
Reglas:
- Todos los valores deben ser números enteros
- nombre en español, oficial y preciso
- Si el alimento tiene preparaciones distintas, asume la más común (hervido, cocido, natural)
- Si no conoces el alimento, usa 0 en todos los valores`,
      }], 256, 15000)

      const raw = parseJson(queryContent)
      if (raw) {
        const g = (a: string, b: string, c: string) =>
          (raw[a] ?? raw[b] ?? raw[c] ?? 0) as number
        result = {
          name:              String(raw.name || raw.product_name || query),
          calories_per_100g: g('calories_per_100g', 'calories', 'energy_kcal'),
          protein_g:         g('protein_g', 'proteins_g', 'protein'),
          carbs_g:           g('carbs_g', 'carbohydrates_g', 'carbs'),
          fat_g:             g('fat_g', 'fats_g', 'fat'),
          fiber_g:           g('fiber_g', 'fibre_g', 'fiber'),
          source:            'ai',
        }
      }
    } else if (imageUrl) {
      if (mode === 'label') {
        // ── Modo etiqueta: leer tabla nutricional por 100g ──
        const labelContent = await groqChat(MODEL_VISION, [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            {
              type: 'text',
              text: `Eres un experto en nutrición. Lee la etiqueta o tabla nutricional de este producto y responde SOLO con JSON válido sin markdown:
{"name":"nombre del producto","calories_per_100g":NUMERO,"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO,"fiber_g":NUMERO}

Reglas:
- Extrae los valores POR 100g. Si la etiqueta solo muestra "por porción", conviértelos a por 100g usando el peso de porción indicado
- name: nombre del producto tal como aparece en el envase
- Todos los valores deben ser números enteros
- Si no puedes leer un valor con certeza, usa 0${correctionNote}`,
            },
          ],
        }], 512, 25000)

        const raw = parseJson(labelContent)
        if (raw) {
          // Normalizar a campos canónicos independientemente de lo que devolvió el modelo
          const g = (a: string, b: string, c: string) =>
            (raw[a] ?? raw[b] ?? raw[c] ?? 0) as number
          result = {
            name:              String(raw.name || raw.product_name || raw.product || ''),
            calories_per_100g: g('calories_per_100g', 'calories', 'energy_kcal'),
            protein_g:         g('protein_g', 'proteins_g', 'protein'),
            carbs_g:           g('carbs_g', 'carbohydrates_g', 'carbs'),
            fat_g:             g('fat_g', 'fats_g', 'fat'),
            fiber_g:           g('fiber_g', 'fibre_g', 'fiber'),
          }
        }
      } else {
        // ── Con imagen: una sola llamada al modelo de visión que también calcula macros ──
        const visionContent = await groqChat(MODEL_VISION, [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            {
              type: 'text',
              text: `Eres un nutricionista experto. Analiza esta imagen de comida y responde SOLO con JSON válido sin markdown:
{"description":"describe los ingredientes con su peso estimado en gramos","calories_estimated":NUMERO,"macros":{"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO,"fiber_g":NUMERO}}

Reglas:
- Todos los valores numéricos deben ser números enteros
- Usa valores realistas según las cantidades visibles
- Asume porción normal para una persona adulta si no hay referencia${correctionNote}`,
            },
          ],
        }], 512, 25000)

        result = parseJson(visionContent)
      }
    } else {
      // ── Solo texto: modelo de texto para calcular macros ──
      const nutritionPrompt = `Eres un nutricionista clínico experto en composición nutricional de alimentos.

Analiza esta comida: "${textDescription}"${correctionNote}

Basándote en tablas nutricionales estándar (USDA, BEDCA), calcula los macronutrientes exactos para las porciones indicadas.

Responde SOLO con JSON válido sin texto adicional ni markdown:
{"description":"descripción actualizada incluyendo la corrección si la hay","calories_estimated":NUMERO,"macros":{"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO,"fiber_g":NUMERO}}

Reglas:
- Todos los valores deben ser números enteros
- Usa valores realistas según las cantidades descritas
- Si no hay pesos exactos, asume una porción normal para una persona adulta`

      const nutritionContent = await groqChat(MODEL_TEXT, [{
        role: 'user',
        content: nutritionPrompt,
      }], 256, 20000)

      result = parseJson(nutritionContent)
    }

    if (!result) {
      throw new Error('No se pudo analizar la comida')
    }

    return new Response(
      JSON.stringify(result),
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
