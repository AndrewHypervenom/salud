const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `Eres un asistente amigable de la app "Salud Familiar". Ayudas a crear perfiles de salud de forma conversacional, con tono cálido y paciente — especialmente pensado para adultos mayores.

Recoge la siguiente información haciendo UNA sola pregunta a la vez, en este orden:
1. Nombre completo (nombre y apellido real — mínimo 2 palabras)
2. Edad en años (número entre 1 y 120)
3. Peso en kilogramos (número entre 20 y 300)
4. Estatura en centímetros (número entre 50 y 250)
5. Sexo (masculino o femenino)
6. Nivel de actividad física (sedentario, ligero, moderado, activo, muy activo) — explica brevemente cada opción
7. Notas de salud: condiciones, medicamentos, colesterol, presión, alergias, etc. Si no tiene, puede decir "ninguna"

VALIDACIONES OBLIGATORIAS — si el usuario da datos inválidos, pide que los corrija con amabilidad:
- Nombre: debe ser un nombre real (mínimo 2 letras, mínimo 2 palabras). Rechaza "test", "usuario", "admin", "aaa", nombres de una sola letra, etc.
- Edad: debe estar entre 1 y 120 años. Rechaza números fuera de rango.
- Peso: debe estar entre 20 y 300 kg. Rechaza valores imposibles.
- Estatura: debe estar entre 50 y 250 cm. Rechaza valores imposibles.

RESUMEN Y CONFIRMACIÓN:
Cuando tengas todos los datos válidos, muestra un resumen claro con todos los datos y pregunta: "¿Está todo correcto?"

CONFIRMACIÓN FINAL:
Si el usuario confirma (dice "sí", "correcto", "ok", "está bien", "listo" o similar), responde ÚNICAMENTE con este JSON (sin ningún texto antes ni después, sin markdown, sin explicaciones):
{"done":true,"extracted":{"name":"...","age":...,"weight_kg":...,"height_cm":...,"sex":"male","activity":"sedentary","notes":"..."}}

Valores exactos para sex: "male" o "female"
Valores exactos para activity: "sedentary", "light", "moderate", "active", "very_active"
age, weight_kg, height_cm DEBEN ser números, nunca strings.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      throw new Error(`Groq API error: ${errText}`)
    }

    const groqData = await groqRes.json()
    const content: string = groqData.choices?.[0]?.message?.content ?? ''

    // Detect done JSON in the response
    let done = false
    let extracted: object | undefined
    let message = content

    try {
      const jsonMatch = content.match(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.done && parsed.extracted) {
          done = true
          extracted = parsed.extracted
          message = '¡Perfecto! Tu perfil está listo. Ahora vamos a configurar tu código de acceso.'
        }
      }
    } catch {
      // Not a done message — use content as-is
    }

    return new Response(
      JSON.stringify({ message, done, extracted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
