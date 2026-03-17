const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'
const MODEL_TEXT = 'llama-3.3-70b-versatile'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, description: textDescription } = await req.json()

    if (!imageUrl && !textDescription) {
      return new Response(
        JSON.stringify({ error: 'imageUrl or description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const isImageMode = !!imageUrl
    const messageContent = isImageMode
      ? [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: 'Eres un nutricionista experto. Analiza esta imagen de comida y responde SOLO con JSON válido sin texto adicional ni markdown, usando este formato exacto:\n{"foods":["nombre principal del plato"],"description":"descripción detallada con ingredientes y sus pesos estimados en gramos, ej: Pollo a la plancha (150g) con arroz blanco (100g) y ensalada de lechuga (50g) y tomate (30g)","calories_estimated":344,"macros":{"protein_g":43,"carbs_g":33,"fat_g":4,"fiber_g":3}}\nTodos los valores numéricos deben ser enteros realistas para una porción normal.',
          },
        ]
      : [
          {
            type: 'text',
            text: `Eres un nutricionista experto. Analiza esta comida: "${textDescription}". Responde SOLO con JSON válido sin texto adicional ni markdown, usando este formato exacto: {"foods":["nombre principal del plato"],"description":"descripción detallada con ingredientes y sus pesos estimados en gramos","calories_estimated":NUMERO,"macros":{"protein_g":NUMERO,"carbs_g":NUMERO,"fat_g":NUMERO,"fiber_g":NUMERO}}. Todos los valores numéricos deben ser enteros realistas para una porción normal.`,
          },
        ]

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: isImageMode ? MODEL_VISION : MODEL_TEXT,
        messages: [
          {
            role: 'user',
            content: messageContent,
          },
        ],
        max_tokens: 512,
        temperature: 0,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      throw new Error(`Groq API error: ${errText}`)
    }

    const groqData = await groqRes.json()
    const content: string = groqData.choices?.[0]?.message?.content ?? ''

    // Parse JSON from response
    let result = { foods: [], description: '', calories_estimated: 0, macros: null }
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Return default if parsing fails
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
