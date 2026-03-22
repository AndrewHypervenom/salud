const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function buildSystemPrompt(dayComplete: boolean, pendingMeals: string[], hour: number): string {
  const planFieldInstruction = dayComplete
    ? `"tomorrow_plan": "Plan de alimentación para MAÑANA. Empieza con 'Mañana desayuna...'. Incluye desayuno, almuerzo y cena con platos concretos y porciones. Máx 3 oraciones."`
    : `"tomorrow_plan": "Plan para las próximas comidas de HOY (son las ${hour}:00): ${pendingMeals.length > 0 ? pendingMeals.join(', ') : 'hidratación y descanso'}. Empieza directamente con la comida más próxima (ej: 'Para la cena te recomiendo...'). NUNCA menciones mañana ni el día siguiente. Máx 3 oraciones."`

  return `Eres un coach de salud y nutrición personalizado que guía al usuario EN TIEMPO REAL durante su día alimenticio.

REGLAS OBLIGATORIAS:
1. Calcula siempre las calorías restantes (meta − consumido) y basate en ese presupuesto para recomendar.
2. Propón platos CONCRETOS con nombre y porción aproximada (ej: "sopa de pollo 300 ml ≈ 180 kcal").
3. Si el usuario ya superó su meta calórica: no sugieras más comida, recomienda hidratación y movimiento ligero.
4. Adapta al objetivo del usuario (bajar de peso, mantener, ganar músculo).
5. Máximo 3-4 recomendaciones, ordenadas por urgencia.
6. Tono motivador y directo, como un coach personal que conoce bien al usuario.
7. NUNCA sugieras una comida que ya fue registrada hoy.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
{
  "analysis": "2 oraciones máximo. Resumen honesto de cómo va el día: calorías consumidas, restantes y tendencia.",
  "recommendations": [
    { "icon": "emoji", "title": "Título corto", "text": "Recomendación concreta con plato específico y calorías aproximadas" }
  ],
  ${planFieldInstruction},
  "motivation": "Frase motivacional corta. Máx 1 oración."
}`
}

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

    const { profile, calTarget, todayCalories, foodLogs, habitsCompleted, habitsTotal, habitNames, lastBP, currentHour } = body

    const hour = typeof currentHour === 'number' ? currentHour : new Date().getHours()
    const remaining = calTarget - todayCalories

    // Detectar qué comidas ya fueron registradas
    type FoodLog = { meal_type: string; description: string; calories_estimated: number }
    const loggedTypes = new Set((foodLogs as FoodLog[]).map((l) => l.meal_type))
    const hasBreakfast = loggedTypes.has('breakfast')
    const hasLunch = loggedTypes.has('lunch')
    const hasDinner = loggedTypes.has('dinner')
    const hasSnack = loggedTypes.has('snack')

    // Determinar qué comidas faltan (según horario actual) y cuáles ya pasaron sin registrarse
    const pendingMeals: string[] = []  // Comidas que aún tienen sentido comer hoy
    const missedMeals: string[] = []   // Comidas cuyo horario habitual ya pasó sin registrarse

    if (!hasBreakfast) {
      if (hour < 11) pendingMeals.push('desayuno')
      else missedMeals.push('desayuno')
    }
    if (!hasLunch) {
      if (hour < 16) pendingMeals.push('almuerzo')
      else missedMeals.push('almuerzo')
    }
    if (!hasSnack && !hasDinner && hour >= 14 && hour < 21) {
      pendingMeals.push('merienda/snack (opcional)')
    }
    if (!hasDinner && hour >= 17) {
      pendingMeals.push('cena')
    }

    const dayComplete = hasDinner || hour >= 21
    const pendingMealsText = pendingMeals.length > 0
      ? `Comidas que aún faltan hoy (según horario actual): ${pendingMeals.join(', ')}`
      : 'No quedan comidas pendientes para el resto del día.'
    const missedMealsText = missedMeals.length > 0
      ? `Comidas no registradas (ya pasó su horario habitual): ${missedMeals.join(', ')}`
      : ''

    const mealSummary = (foodLogs as FoodLog[]).length === 0
      ? 'No registró ninguna comida hoy.'
      : (foodLogs as FoodLog[]).map((l) =>
          `- ${l.meal_type}: ${l.description} (${l.calories_estimated || 0} kcal)`
        ).join('\n')

    const deficit = calTarget - todayCalories
    const deficitText = deficit >= 0
      ? `Le quedan ${deficit} kcal disponibles para el resto del día`
      : `Superó la meta por ${Math.abs(deficit)} kcal — no recomendar más comida pesada`

    const bpText = lastBP
      ? `Última presión arterial: ${lastBP.systolic}/${lastBP.diastolic} mmHg`
      : 'Sin mediciones de presión arterial.'

    const userDataPrompt = `
HORA ACTUAL: ${hour}:00
${pendingMealsText}
${missedMealsText ? missedMealsText + '\n' : ''}DÍA COMPLETO: ${dayComplete ? 'Sí (orientar plan de mañana)' : 'No (orientar comidas pendientes de hoy)'}

DATOS DEL USUARIO:
- Nombre: ${profile.name}
- Edad: ${profile.age} años | Sexo: ${profile.sex === 'male' ? 'Masculino' : 'Femenino'}
- Peso: ${profile.weight_kg} kg | Estatura: ${profile.height_cm} cm
- Actividad: ${profile.activity}
- Objetivo: ${profile.health_goal === 'lose_weight' ? 'BAJAR DE PESO' : profile.health_goal === 'gain_muscle' ? 'Ganar músculo' : profile.health_goal === 'improve_health' ? 'Mejorar salud' : 'Mantener peso'}
- Notas médicas: ${profile.notes || 'Ninguna'}

CALORÍAS HOY:
- Consumidas: ${todayCalories} kcal de ${calTarget} kcal meta
- Restantes: ${remaining} kcal
- Estado: ${deficitText}

COMIDAS REGISTRADAS HOY:
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
          { role: 'system', content: buildSystemPrompt(dayComplete, pendingMeals, hour) },
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
