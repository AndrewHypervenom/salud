const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `Eres un coach de salud y nutrición experto, directo y sin rodeos. Tu única misión es ayudar al usuario a BAJAR DE PESO de manera efectiva, sostenible y segura.

Recibirás los datos del día del usuario y deberás generar un análisis personalizado y recomendaciones concretas.

REGLAS OBLIGATORIAS:
1. Sé directo y honesto. Si comió de más, díselo claramente pero con respeto.
2. Siempre da consejos ESPECÍFICOS y ACCIONABLES con cantidades concretas.
3. Si consumió más calorías de su meta: SIEMPRE incluye recomendación de suero casero (agua + limón + sal) para recuperación.
4. Si el objetivo es bajar de peso: menciona siempre el déficit calórico como herramienta.
5. Prioriza hidratación: el agua es clave para bajar de peso y eliminar toxinas.
6. Máximo 4 recomendaciones, ordenadas por importancia.
7. El plan de mañana debe ser CONCRETO: menciona alimentos específicos y porciones.
8. Tono: como un entrenador personal exigente pero que quiere lo mejor para ti.

RECETA SUERO CASERO (usar cuando sea relevante):
"Mezcla en 1 litro de agua: jugo de 1 limón + 1/4 cucharadita de sal + opcionalmente 1 cucharadita de azúcar o miel. Bébelo en 1-2 horas."

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
{
  "analysis": "2 oraciones máximo. Análisis honesto del día.",
  "recommendations": [
    { "icon": "emoji", "title": "Título corto", "text": "Consejo detallado con cantidades específicas" }
  ],
  "tomorrow_plan": "Plan concreto para mañana: desayuno, almuerzo y cena específicos. Máx 3 oraciones.",
  "motivation": "Frase motivacional corta y honesta. Máx 1 oración."
}`

const RECIPE_IDEAS_PROMPT = `Eres un chef nutricionista experto. El usuario te dará ingredientes o alimentos disponibles y debes sugerir 3 recetas saludables y fáciles de preparar con ellos.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
{
  "recipes": [
    {
      "name": "Nombre de la receta en español",
      "description": "Descripción apetitosa en 1 oración",
      "calories_per_serving": 350,
      "prep_time_minutes": 20,
      "servings": 2,
      "macros": { "protein_g": 25, "carbs_g": 40, "fat_g": 10 },
      "ingredients": ["200g pollo", "1 taza arroz", "2 dientes de ajo"],
      "instructions": ["Paso 1 detallado...", "Paso 2 detallado...", "Paso 3 detallado..."],
      "search_query": "pollo al ajillo receta",
      "search_query_en": "garlic chicken",
      "main_ingredient_en": "chicken"
    }
  ]
}

IMPORTANTE: "search_query_en" debe ser el nombre de la receta en inglés (1-3 palabras), y "main_ingredient_en" debe ser el ingrediente principal de ESA receta en inglés (1 palabra, ej: chicken, beef, salmon, pasta, egg, lentils).`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Modo ideas de recetas
    if (body.mode === 'recipe_ideas') {
      const { ingredients } = body
      const groqRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: RECIPE_IDEAS_PROMPT },
            { role: 'user', content: `Tengo estos ingredientes: ${ingredients}. Sugiere 3 recetas saludables.` },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      })
      if (!groqRes.ok) {
        const errText = await groqRes.text()
        throw new Error(`Groq API error: ${errText}`)
      }
      const groqData = await groqRes.json()
      const content = groqData.choices?.[0]?.message?.content ?? ''
      let recipes: Record<string, unknown>[] = []
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          recipes = parsed.recipes || []
        }
      } catch {
        // fallback vacío
      }

      // Enriquecer con TheMealDB: imagen real + link por cada receta
      async function getMealDBMeal(nameEn: string, ingredientEn: string, usedIds: Set<string>) {
        const timeout = { signal: AbortSignal.timeout(5000) }
        // 1. Buscar por nombre en inglés
        if (nameEn) {
          try {
            const r = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(nameEn)}`, timeout)
            if (r.ok) {
              const d = await r.json()
              const meal = (d.meals || []).find((m: Record<string, string>) => !usedIds.has(m.idMeal))
              if (meal) return meal
            }
          } catch { /* continuar */ }
        }
        // 2. Buscar por ingrediente principal en inglés (distinto al anterior)
        if (ingredientEn) {
          try {
            const r = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredientEn)}`, timeout)
            if (r.ok) {
              const d = await r.json()
              const candidate = (d.meals || []).find((m: Record<string, string>) => !usedIds.has(m.idMeal))
              if (candidate) {
                const detail = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${candidate.idMeal}`, timeout)
                if (detail.ok) {
                  const dd = await detail.json()
                  return dd.meals?.[0] || null
                }
              }
            }
          } catch { /* continuar */ }
        }
        return null
      }

      const usedMealIds = new Set<string>()
      const enriched: Record<string, unknown>[] = []
      for (const recipe of recipes) {
        const nameEn = (recipe.search_query_en as string) || ''
        const ingredientEn = (recipe.main_ingredient_en as string) || ''
        const meal = await getMealDBMeal(nameEn, ingredientEn, usedMealIds)
        if (meal) {
          usedMealIds.add(meal.idMeal)
          enriched.push({
            ...recipe,
            image_url: meal.strMealThumb || null,
            source_url: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
            youtube_url: meal.strYoutube || null,
          })
        } else {
          enriched.push(recipe)
        }
      }

      return new Response(
        JSON.stringify({ recipes: enriched }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { profile, calTarget, todayCalories, foodLogs, habitsCompleted, habitsTotal, habitNames, lastBP } = body

    const mealSummary = foodLogs.length === 0
      ? 'No registró ninguna comida hoy.'
      : foodLogs.map((l: { meal_type: string; description: string; calories_estimated: number }) =>
          `- ${l.meal_type}: ${l.description} (${l.calories_estimated || 0} kcal)`
        ).join('\n')

    const deficit = calTarget - todayCalories
    const deficitText = deficit >= 0
      ? `Déficit de ${deficit} kcal (¡bien! está por debajo de la meta)`
      : `Exceso de ${Math.abs(deficit)} kcal (superó la meta por ${Math.abs(deficit)} kcal)`

    const bpText = lastBP
      ? `Última presión arterial: ${lastBP.systolic}/${lastBP.diastolic} mmHg`
      : 'Sin mediciones de presión arterial.'

    const userDataPrompt = `
DATOS DEL USUARIO:
- Nombre: ${profile.name}
- Edad: ${profile.age} años | Sexo: ${profile.sex === 'male' ? 'Masculino' : 'Femenino'}
- Peso: ${profile.weight_kg} kg | Estatura: ${profile.height_cm} cm
- Actividad: ${profile.activity}
- Objetivo: ${profile.health_goal === 'lose_weight' ? 'BAJAR DE PESO' : profile.health_goal === 'gain_muscle' ? 'Ganar músculo' : 'Mantener peso'}
- Notas médicas: ${profile.notes || 'Ninguna'}

CALORÍAS HOY:
- Consumidas: ${todayCalories} kcal
- Meta ajustada: ${calTarget} kcal
- ${deficitText}

COMIDAS DE HOY:
${mealSummary}

HÁBITOS:
- Completados: ${habitsCompleted} de ${habitsTotal}
- Hábitos completados hoy: ${habitNames.completed.join(', ') || 'Ninguno'}
- Hábitos pendientes: ${habitNames.pending.join(', ') || 'Ninguno'}

SALUD:
- ${bpText}
`

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
          { role: 'user', content: userDataPrompt },
        ],
        temperature: 0.6,
        max_tokens: 1024,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      throw new Error(`Groq API error: ${errText}`)
    }

    const groqData = await groqRes.json()
    const content: string = groqData.choices?.[0]?.message?.content ?? ''

    let result = {
      analysis: '',
      recommendations: [],
      tomorrow_plan: '',
      motivation: '',
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      }
    } catch {
      result.analysis = content
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
