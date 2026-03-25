const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function buildSystemPrompt(dayComplete: boolean, nextMeal: string): string {
  const planFieldInstruction = dayComplete
    ? `"tomorrow_plan": "Plan para mañana. Empieza con 'Mañana desayuna...'. Sugiere desayuno, almuerzo y cena con platos y porciones concretas. Máx 3 oraciones."`
    : `"tomorrow_plan": "Recomendación para ${nextMeal} de hoy. Sugiere 1-2 opciones concretas con nombre del plato, porción y calorías aproximadas. Empieza con 'Para ${nextMeal}...'. Máx 2 oraciones."`

  return `Eres un coach de salud y nutrición personalizado.

REGLAS:
1. Basa tus recomendaciones en las calorías restantes del usuario (meta − consumido).
2. Propón platos CONCRETOS con nombre y porción (ej: "arroz con pollo 300g ≈ 420 kcal").
3. Si el usuario superó su meta calórica: no sugieras más comida, recomienda hidratación.
4. Adapta al objetivo del usuario (bajar de peso, mantener, ganar músculo).
5. Tono motivador y directo.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
{
  "analysis": "Máx 2 oraciones. Resumen de calorías consumidas y restantes hoy.",
  "recommendations": [
    { "icon": "emoji", "title": "Título corto", "text": "Recomendación concreta con plato y calorías aproximadas" }
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

    // Modo informe médico personalizado
    if (body.mode === 'doctor_report') {
      const { profile, calTarget, nutrition, weight, bloodPressure, exercise, habits } = body

      const DOCTOR_REPORT_SYSTEM = `Eres un asistente clínico de la app Salud Familiar.
Analizas los datos de salud reales de un paciente y generas:
1. Entre 5 y 8 preguntas ESPECÍFICAS y RELEVANTES para su consulta médica (basadas en sus datos reales, no genéricas)
2. Un párrafo breve de observaciones clínicas
3. Hasta 3 áreas de atención prioritaria

REGLAS para las preguntas:
- Si avg_systolic >= 130: incluir al menos 2 preguntas sobre hipertensión/presión arterial
- Si BMI > 28 o weight.trend_kg > 1: preguntar sobre metas de peso
- Si avg_calories > calTarget * 1.15: preguntar sobre adherencia nutricional
- Si exercise.days_active_14d < 3: preguntar sobre actividad física segura
- Si habits.completion_pct_30d < 60: preguntar sobre adherencia a hábitos
- Si el perfil tiene notes con condiciones médicas: hacer preguntas específicas a esas condiciones
- Usar el nombre del paciente en al menos 1 pregunta
- Las preguntas deben ser concretas y accionables, no genéricas
- NUNCA generar preguntas sobre condiciones que no aparecen en los datos

Responde ÚNICAMENTE con JSON válido, sin markdown:
{
  "questions": ["pregunta 1", "pregunta 2"],
  "observations": "Párrafo de observaciones clínicas. Máx 3 oraciones.",
  "attention_areas": ["área 1", "área 2", "área 3"]
}`

      const bmi = weight?.current_kg && profile?.height_cm
        ? Math.round((weight.current_kg / Math.pow(profile.height_cm / 100, 2)) * 10) / 10
        : null

      const bpSummary = bloodPressure?.last_readings?.length > 0
        ? bloodPressure.last_readings.map((r: { systolic: number; diastolic: number; measured_at: string }) =>
            `  ${r.systolic}/${r.diastolic} mmHg (${r.measured_at})`
          ).join('\n') + `\n  Promedio: ${bloodPressure.avg_systolic}/${bloodPressure.avg_diastolic} mmHg`
        : '  Sin lecturas registradas'

      const userPrompt = `
PACIENTE: ${profile.name}, ${profile.age} años, ${profile.sex === 'male' ? 'Masculino' : 'Femenino'}
Peso: ${profile.weight_kg} kg | Estatura: ${profile.height_cm} cm | IMC: ${bmi ?? 'N/D'}
Nivel de actividad: ${profile.activity}
Objetivo de salud: ${profile.health_goal === 'lose_weight' ? 'Bajar de peso' : profile.health_goal === 'gain_muscle' ? 'Ganar músculo' : profile.health_goal === 'improve_health' ? 'Mejorar salud' : 'Mantener peso'}
Peso objetivo: ${profile.target_weight_kg ? profile.target_weight_kg + ' kg' : 'No definido'}
Notas médicas: ${profile.notes || 'Ninguna'}

NUTRICIÓN (meta: ${calTarget} kcal/día):
- Promedio últimos 7 días: ${nutrition.avg7d_calories} kcal (${nutrition.days_logged_7d}/7 días registrados)
- Promedio últimos 30 días: ${nutrition.avg30d_calories} kcal (${nutrition.days_logged_30d}/30 días con registro)

TENDENCIA DE PESO:
- Actual: ${weight.current_kg} kg
- Tendencia: ${weight.trend_kg > 0 ? '+' : ''}${weight.trend_kg} kg en ${weight.readings_count} mediciones
${profile.target_weight_kg ? `- Diferencia vs objetivo: ${Math.round((weight.current_kg - profile.target_weight_kg) * 10) / 10} kg` : ''}

PRESIÓN ARTERIAL (últimas lecturas):
${bpSummary}

ACTIVIDAD FÍSICA (últimas 2 semanas):
- Días activos: ${exercise.days_active_14d}/14
- Tipos de ejercicio: ${exercise.types?.join(', ') || 'Ninguno registrado'}
- Tiempo total: ${exercise.total_minutes_14d} minutos

HÁBITOS (últimos 30 días):
- Cumplimiento: ${habits.completion_pct_30d}%
- Hábitos activos: ${habits.habit_names?.join(', ') || 'Ninguno'}
- Baja adherencia: ${habits.low_compliance?.join(', ') || 'Ninguno'}
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
            { role: 'system', content: DOCTOR_REPORT_SYSTEM },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 1024,
        }),
      })

      if (!groqRes.ok) {
        const errText = await groqRes.text()
        throw new Error(`Groq API error: ${errText}`)
      }

      const groqData = await groqRes.json()
      const content = groqData.choices?.[0]?.message?.content ?? ''
      let result = { questions: [], observations: '', attention_areas: [] }
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) result = JSON.parse(jsonMatch[0])
      } catch { /* fallback vacío */ }

      return new Response(
        JSON.stringify(result),
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

    // El servidor decide cuál es la próxima comida — el LLM solo ejecuta esa instrucción
    const dayComplete = hasDinner || hour >= 21

    let nextMeal: string
    if (dayComplete) {
      nextMeal = 'mañana'
    } else if (hasLunch) {
      nextMeal = 'la cena'
    } else if (hasBreakfast) {
      nextMeal = 'el almuerzo'
    } else {
      // Nada registrado aún — usar la hora para decidir
      nextMeal = hour < 11 ? 'el desayuno' : hour < 16 ? 'el almuerzo' : 'la cena'
    }

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
PRÓXIMA COMIDA A ORIENTAR: ${nextMeal}

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
          { role: 'system', content: buildSystemPrompt(dayComplete, nextMeal) },
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
