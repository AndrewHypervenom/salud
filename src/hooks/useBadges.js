import { useState, useEffect, useCallback } from 'react'
import {
  UtensilsCrossed, Palette, Calendar, Moon, Sunrise, Target, CalendarDays, Crosshair,
  FlaskConical, CalendarRange, Droplets, GlassWater, Waves, CloudRain, ShowerHead,
  Scale, BarChart3, TrendingUp, RefreshCw, TrendingDown, Trophy, Heart, Stethoscope,
  HeartPulse, HeartHandshake, Timer, Zap, Star, Shield, Flame, CheckCircle2,
  Paintbrush, Medal, Award, PartyPopper, Sprout, Gem, ChefHat, Bot, Camera,
  BookOpen, Brain, Map, Crown, Building2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export const BADGE_CATEGORIES = [
  'nutricion', 'agua', 'peso', 'presion', 'ayuno', 'habitos', 'constancia', 'explorador', 'elite'
]

export const ALL_BADGES = [
  // --- nutricion ---
  {
    key: 'first_log', Icon: UtensilsCrossed, category: 'nutricion', difficulty: 'easy',
    label_es: 'Primera comida', label_en: 'First meal',
    desc_es: 'Registra tu primera comida', desc_en: 'Log your first meal',
    detail_es: 'El primer registro es el primer paso. Cada gran transformación de salud empieza con una sola acción consciente.',
    detail_en: 'The first log is the first step. Every great health transformation starts with a single conscious action.',
  },
  {
    key: 'meal_variety_day', Icon: Palette, category: 'nutricion', difficulty: 'easy',
    label_es: 'Día completo', label_en: 'Complete day',
    desc_es: 'Registra desayuno, almuerzo y cena en un día', desc_en: 'Log breakfast, lunch and dinner in one day',
    detail_es: 'Un día completo de registro te da la foto real de tu alimentación. Desayuno, almuerzo y cena juntos revelan patrones que una sola comida nunca mostraría.',
    detail_en: 'A full day of logging gives you the real picture of your eating habits. Breakfast, lunch, and dinner together reveal patterns a single meal could never show.',
  },
  {
    key: 'food_tracker_7', Icon: Calendar, category: 'nutricion', difficulty: 'easy',
    label_es: '7 días de comidas', label_en: '7 days of meals',
    desc_es: 'Registra comidas en 7 días distintos', desc_en: 'Log meals on 7 different days',
    detail_es: 'Siete días de registro construyen el hábito. Una semana completa de datos te da una imagen real de tu alimentación y los ciclos de tu semana.',
    detail_en: 'Seven days of logging build the habit. One full week of data gives you a real picture of your nutrition and your weekly patterns.',
    progress_total: 7,
  },
  {
    key: 'night_snack', Icon: Moon, category: 'nutricion', difficulty: 'easy',
    label_es: 'Cena tardía', label_en: 'Late dinner',
    desc_es: 'Registra una cena después de las 9pm', desc_en: 'Log a dinner after 9pm',
    detail_es: 'Registraste lo que comiste tarde en la noche. Conocer tus hábitos nocturnos es clave para entender cómo afectan tu descanso y metabolismo.',
    detail_en: 'You logged what you ate late at night. Knowing your nocturnal habits is key to understanding how they affect your rest and metabolism.',
  },
  {
    key: 'early_bird', Icon: Sunrise, category: 'nutricion', difficulty: 'easy',
    label_es: 'Madrugador', label_en: 'Early bird',
    desc_es: 'Registra un desayuno antes de las 8am', desc_en: 'Log a breakfast before 8am',
    detail_es: 'Empezar el día con un desayuno temprano activa el metabolismo y mejora la concentración. Eres de los que no dejan pasar la mañana.',
    detail_en: 'Starting the day with an early breakfast activates your metabolism and improves focus. You are one of those who do not let the morning slip by.',
  },
  {
    key: 'calorie_goal_3', Icon: Target, category: 'nutricion', difficulty: 'easy',
    label_es: 'En la meta x3', label_en: 'On target x3',
    desc_es: 'Cumple tu meta calórica 3 días distintos', desc_en: 'Hit your calorie goal on 3 different days',
    detail_es: 'Tres días dentro de tu meta calórica demuestran que no fue suerte. Tu meta está configurada en el perfil y se considera cumplida si consumes entre el 90% y el 120% de ella.',
    detail_en: 'Three days within your calorie goal prove it was not luck. Your goal is set in your profile and is considered met when you consume between 90% and 120% of it.',
    progress_total: 3,
  },
  {
    key: 'food_tracker_30', Icon: CalendarDays, category: 'nutricion', difficulty: 'medium',
    label_es: '30 días de comidas', label_en: '30 days of meals',
    desc_es: 'Registra comidas en 30 días distintos', desc_en: 'Log meals on 30 different days',
    detail_es: 'Un mes entero de datos nutricionales. Con 30 días ya puedes ver tendencias reales: qué funciona, qué falla y qué días son más difíciles para ti.',
    detail_en: 'A full month of nutritional data. With 30 days you can already see real trends: what works, what fails, and which days are hardest for you.',
    progress_total: 30,
  },
  {
    key: 'calorie_goal_21', Icon: Crosshair, category: 'nutricion', difficulty: 'medium',
    label_es: 'Francotirador', label_en: 'Sharpshooter',
    desc_es: 'Cumple tu meta calórica 21 días distintos', desc_en: 'Hit your calorie goal on 21 different days',
    detail_es: 'Veintiún días cumpliendo la meta calórica. La ciencia asocia este número con la formación de hábitos duraderos. Ya no es disciplina ocasional, es parte de ti.',
    detail_en: 'Twenty-one days hitting your calorie goal. Science links this number to lasting habit formation. It is no longer occasional discipline — it is part of who you are.',
    progress_total: 21,
  },
  {
    key: 'macro_master', Icon: FlaskConical, category: 'nutricion', difficulty: 'hard',
    label_es: 'Maestro de macros', label_en: 'Macro master',
    desc_es: 'Registra proteína, carbos y grasa en 15 días distintos', desc_en: 'Log protein, carbs and fat on 15 different days',
    detail_es: 'Registrar los tres macronutrientes (proteína, carbohidratos y grasa) en el mismo día es el nivel más detallado del seguimiento nutricional. 15 días así te hacen un experto.',
    detail_en: 'Logging all three macronutrients (protein, carbs, and fat) on the same day is the most detailed level of nutritional tracking. 15 days like this makes you an expert.',
    progress_total: 15,
  },
  {
    key: 'food_tracker_100', Icon: CalendarRange, category: 'nutricion', difficulty: 'hard',
    label_es: '100 días de comidas', label_en: '100 days of meals',
    desc_es: 'Registra comidas en 100 días distintos', desc_en: 'Log meals on 100 different days',
    detail_es: 'Cien días de registro es un logro extraordinario. Muy pocas personas llegan aquí. Tu base de datos personal de nutrición ya es lo suficientemente rica para revelar patrones profundos.',
    detail_en: 'One hundred days of logging is an extraordinary achievement. Very few people make it here. Your personal nutrition database is now rich enough to reveal deep patterns.',
    progress_total: 100,
  },

  // --- agua ---
  {
    key: 'first_water', Icon: Droplets, category: 'agua', difficulty: 'easy',
    label_es: 'Primera gota', label_en: 'First drop',
    desc_es: 'Registra agua por primera vez', desc_en: 'Log water for the first time',
    detail_es: 'La primera vez que registraste tu hidratación. El cuerpo es más del 60% agua y muchos problemas de salud comienzan por no tomar suficiente. Buen comienzo.',
    detail_en: 'The first time you tracked your hydration. The body is more than 60% water and many health issues begin with not drinking enough. Good start.',
  },
  {
    key: 'hydrated_1', Icon: GlassWater, category: 'agua', difficulty: 'easy',
    label_es: 'Meta de agua', label_en: 'Water goal',
    desc_es: 'Alcanza tu meta de agua en un día', desc_en: 'Reach your water goal in one day',
    detail_es: 'Tu meta de agua está configurada en tu perfil. Alcanzarla en un día demuestra que es posible. Ahora el reto es hacerlo consistentemente.',
    detail_en: 'Your water goal is set in your profile. Reaching it in one day proves it is possible. Now the challenge is doing it consistently.',
  },
  {
    key: 'hydrated_7', Icon: Waves, category: 'agua', difficulty: 'medium',
    label_es: '7 días hidratado', label_en: '7 days hydrated',
    desc_es: 'Alcanza tu meta de agua 7 días distintos', desc_en: 'Reach your water goal on 7 different days',
    detail_es: 'Una semana de hidratación óptima. Cuando mantienes una buena hidratación varios días seguidos, la diferencia en energía y claridad mental es notable.',
    detail_en: 'One week of optimal hydration. When you maintain good hydration over several days, the difference in energy and mental clarity is noticeable.',
    progress_total: 7,
  },
  {
    key: 'water_streak_5', Icon: CloudRain, category: 'agua', difficulty: 'medium',
    label_es: 'Racha acuática', label_en: 'Water streak',
    desc_es: 'Alcanza la meta de agua 5 días seguidos', desc_en: 'Reach your water goal 5 days in a row',
    detail_es: 'Cinco días consecutivos alcanzando tu meta de agua. Las rachas son más exigentes que los días sueltos porque no puedes saltarte ninguno.',
    detail_en: 'Five consecutive days reaching your water goal. Streaks are more demanding than scattered days because you cannot skip any.',
    progress_total: 5,
  },
  {
    key: 'hydrated_30', Icon: ShowerHead, category: 'agua', difficulty: 'hard',
    label_es: 'Mes hidratado', label_en: 'Hydrated month',
    desc_es: 'Alcanza tu meta de agua 30 días distintos', desc_en: 'Reach your water goal on 30 different days',
    detail_es: 'Un mes entero bebiendo suficiente agua. Tu cuerpo, piel y energía lo notan. La hidratación constante es una de las acciones más impactantes y simples para la salud.',
    detail_en: 'A full month of proper hydration. Your body, skin, and energy levels feel it. Consistent hydration is one of the simplest and most impactful health habits.',
    progress_total: 30,
  },
  {
    key: 'liter_3', Icon: FlaskConical, category: 'agua', difficulty: 'hard',
    label_es: 'Súper hidratado', label_en: 'Super hydrated',
    desc_es: 'Bebe 3,000 ml en un solo día', desc_en: 'Drink 3,000 ml in a single day',
    detail_es: 'Tres litros en un día es hidratación de alto rendimiento. Esto es lo que consumen atletas y personas muy activas para mantener su cuerpo funcionando al máximo.',
    detail_en: 'Three liters in a day is high-performance hydration. This is what athletes and very active people consume to keep their bodies running at peak performance.',
  },

  // --- peso ---
  {
    key: 'first_weight', Icon: Scale, category: 'peso', difficulty: 'easy',
    label_es: 'Primer pesaje', label_en: 'First weigh-in',
    desc_es: 'Registra tu primer peso', desc_en: 'Log your first weight',
    detail_es: 'Tu punto de partida. Sin un registro inicial no hay forma de medir el progreso. Este número es solo el comienzo de tu historia.',
    detail_en: 'Your starting point. Without an initial record there is no way to measure progress. This number is just the beginning of your story.',
  },
  {
    key: 'weight_7', Icon: BarChart3, category: 'peso', difficulty: 'easy',
    label_es: '7 pesajes', label_en: '7 weigh-ins',
    desc_es: 'Registra tu peso 7 veces', desc_en: 'Log your weight 7 times',
    detail_es: 'Con 7 mediciones ya puedes empezar a ver una tendencia. El peso fluctúa día a día por agua, comida y otros factores, por eso varios registros dan una imagen más real.',
    detail_en: 'With 7 measurements you can start to see a trend. Weight fluctuates day to day due to water, food, and other factors, which is why multiple records give a more accurate picture.',
    progress_total: 7,
  },
  {
    key: 'weight_30', Icon: TrendingUp, category: 'peso', difficulty: 'medium',
    label_es: '30 pesajes', label_en: '30 weigh-ins',
    desc_es: 'Registra tu peso 30 veces', desc_en: 'Log your weight 30 times',
    detail_es: 'Treinta mediciones construyen una curva de tendencia confiable. Con este historial puedes ver claramente si vas en la dirección correcta y qué factores influyen en tu peso.',
    detail_en: 'Thirty measurements build a reliable trend curve. With this history you can clearly see if you are heading in the right direction and what factors influence your weight.',
    progress_total: 30,
  },
  {
    key: 'consistent_weight', Icon: RefreshCw, category: 'peso', difficulty: 'medium',
    label_es: 'Peso consistente', label_en: 'Consistent weight',
    desc_es: 'Registra peso 14 días seguidos', desc_en: 'Log weight 14 days in a row',
    detail_es: 'Dos semanas sin saltarte ni un día. El seguimiento diario del peso elimina el efecto del azar y te da la tendencia más honesta posible de tu evolución.',
    detail_en: 'Two weeks without missing a single day. Daily weight tracking eliminates the effect of chance and gives you the most honest possible view of your progress.',
    progress_total: 14,
  },
  {
    key: 'weight_loss_5', Icon: TrendingDown, category: 'peso', difficulty: 'hard',
    label_es: 'Menos 5 kg', label_en: 'Minus 5 kg',
    desc_es: 'Pierde 5 kg desde tu primer registro', desc_en: 'Lose 5 kg from your first record',
    detail_es: 'Cinco kilogramos menos desde que empezaste a registrar. Esto no pasa de un día para otro; es el resultado de muchas decisiones acumuladas. Un logro genuino.',
    detail_en: 'Five kilograms less since you started tracking. This does not happen overnight; it is the result of many accumulated decisions. A genuine achievement.',
    progress_total: 5,
  },
  {
    key: 'goal_reached', Icon: Trophy, category: 'peso', difficulty: 'hard',
    label_es: 'Meta alcanzada', label_en: 'Goal reached',
    desc_es: 'Llega a tu peso objetivo', desc_en: 'Reach your target weight',
    detail_es: 'Llegaste al peso que te propusiste. Tu peso objetivo está configurado en tu perfil. Este logro se desbloquea cuando tu peso registrado coincide con esa meta.',
    detail_en: 'You reached the weight you set for yourself. Your target weight is configured in your profile. This achievement unlocks when your logged weight matches that goal.',
  },

  // --- presion ---
  {
    key: 'first_bp', Icon: Heart, category: 'presion', difficulty: 'easy',
    label_es: 'Primera lectura', label_en: 'First reading',
    desc_es: 'Toma tu primera medición de presión', desc_en: 'Take your first blood pressure reading',
    detail_es: 'La presión arterial es uno de los indicadores más importantes de salud cardiovascular. Muchas personas la tienen elevada sin saberlo. Tu primera lectura es un acto de autocuidado.',
    detail_en: 'Blood pressure is one of the most important indicators of cardiovascular health. Many people have elevated pressure without knowing it. Your first reading is an act of self-care.',
  },
  {
    key: 'bp_morning', Icon: Sunrise, category: 'presion', difficulty: 'easy',
    label_es: 'Control matutino', label_en: 'Morning check',
    desc_es: 'Registra presión antes de las 9am', desc_en: 'Log blood pressure before 9am',
    detail_es: 'La lectura matutina es la más precisa del día porque el cuerpo está en reposo. Los médicos recomiendan medir la presión por la mañana, antes de cualquier actividad intensa.',
    detail_en: 'The morning reading is the most accurate of the day because the body is at rest. Doctors recommend measuring blood pressure in the morning, before any strenuous activity.',
  },
  {
    key: 'bp_monitor_7', Icon: Stethoscope, category: 'presion', difficulty: 'medium',
    label_es: '7 días de presión', label_en: '7 days of BP',
    desc_es: 'Mide tu presión 7 días distintos', desc_en: 'Measure your BP on 7 different days',
    detail_es: 'Una semana de monitoreo de presión arterial. Una sola lectura puede ser anormal por estrés o café; una semana de datos dice la verdad.',
    detail_en: 'One week of blood pressure monitoring. A single reading can be abnormal due to stress or coffee; a week of data tells the truth.',
    progress_total: 7,
  },
  {
    key: 'bp_monitor_30', Icon: HeartPulse, category: 'presion', difficulty: 'hard',
    label_es: 'Mes cardíaco', label_en: 'Cardiac month',
    desc_es: 'Mide tu presión 30 días distintos', desc_en: 'Measure your BP on 30 different days',
    detail_es: 'Un mes completo de monitoreo cardíaco. Con 30 lecturas tienes un historial valioso para compartir con tu médico y detectar cualquier variación preocupante a tiempo.',
    detail_en: 'A full month of cardiac monitoring. With 30 readings you have a valuable history to share with your doctor and detect any concerning variation in time.',
    progress_total: 30,
  },
  {
    key: 'bp_normal_streak', Icon: HeartHandshake, category: 'presion', difficulty: 'hard',
    label_es: 'Presión normal', label_en: 'Normal pressure',
    desc_es: 'Obtén 7 lecturas consecutivas en rango normal', desc_en: 'Get 7 consecutive readings in normal range',
    detail_es: 'Siete lecturas seguidas dentro del rango normal (menos de 120/80 mmHg). Tu disciplina en el monitoreo está dando frutos medibles. El corazón te lo agradece.',
    detail_en: 'Seven consecutive readings within normal range (below 120/80 mmHg). Your monitoring discipline is yielding measurable results. Your heart thanks you.',
    progress_total: 7,
  },

  // --- ayuno ---
  {
    key: 'first_fast', Icon: Timer, category: 'ayuno', difficulty: 'easy',
    label_es: 'Primer ayuno', label_en: 'First fast',
    desc_es: 'Completa tu primer ayuno', desc_en: 'Complete your first fast',
    detail_es: 'Completaste tu primer ayuno. El ayuno intermitente tiene beneficios respaldados por la ciencia: mejora la sensibilidad a la insulina, reduce la inflamación y puede ayudar con el peso.',
    detail_en: 'You completed your first fast. Intermittent fasting has science-backed benefits: it improves insulin sensitivity, reduces inflammation, and can help with weight management.',
  },
  {
    key: 'early_fast', Icon: Moon, category: 'ayuno', difficulty: 'easy',
    label_es: 'Inicio nocturno', label_en: 'Night start',
    desc_es: 'Inicia un ayuno después de las 8pm', desc_en: 'Start a fast after 8pm',
    detail_es: 'Iniciar el ayuno por la noche es la estrategia más natural. Extiendes el ayuno nocturno normal que ya hace tu cuerpo mientras duermes, sin esfuerzo extra.',
    detail_en: 'Starting your fast at night is the most natural strategy. You extend the normal nightly fast your body already does while you sleep, with no extra effort.',
  },
  {
    key: 'fast_master_10', Icon: Zap, category: 'ayuno', difficulty: 'medium',
    label_es: '10 ayunos', label_en: '10 fasts',
    desc_es: 'Completa 10 ayunos exitosamente', desc_en: 'Complete 10 fasts successfully',
    detail_es: 'Diez ayunos completados. A estas alturas ya conoces tu cuerpo en estado de ayuno: cómo reacciona, cuándo siente hambre de verdad y cuándo es solo costumbre.',
    detail_en: 'Ten fasts completed. By now you know your body in a fasted state: how it reacts, when it feels real hunger versus habit.',
    progress_total: 10,
  },
  {
    key: 'fast_master_25', Icon: Star, category: 'ayuno', difficulty: 'hard',
    label_es: '25 ayunos', label_en: '25 fasts',
    desc_es: 'Completa 25 ayunos exitosamente', desc_en: 'Complete 25 fasts successfully',
    detail_es: 'Veinticinco ayunos exitosos. El ayuno ya no es un reto para ti, es una herramienta de tu rutina. Perteneces al grupo reducido de personas que mantienen esta práctica con consistencia.',
    detail_en: 'Twenty-five successful fasts. Fasting is no longer a challenge for you — it is a tool in your routine. You belong to the small group of people who maintain this practice consistently.',
    progress_total: 25,
  },
  {
    key: 'fast_24h', Icon: Shield, category: 'ayuno', difficulty: 'hard',
    label_es: 'Ayuno de 24h', label_en: '24h fast',
    desc_es: 'Completa un ayuno de 24 horas', desc_en: 'Complete a 24-hour fast',
    detail_es: 'Un ayuno completo de 24 horas. Este nivel activa procesos celulares como la autofagia (limpieza celular). No es para todos y requiere preparación, pero lo lograste.',
    detail_en: 'A complete 24-hour fast. This level activates cellular processes like autophagy (cellular cleansing). Not for everyone and requires preparation — but you did it.',
  },
  {
    key: 'fast_streak_7', Icon: Flame, category: 'ayuno', difficulty: 'hard',
    label_es: 'Racha de ayunos', label_en: 'Fasting streak',
    desc_es: 'Completa ayunos 7 días seguidos', desc_en: 'Complete fasts 7 days in a row',
    detail_es: 'Una semana completa ayunando cada día. No solo haces ayunos, los mantienes con consistencia diaria. Es uno de los logros de ayuno más difíciles de la app.',
    detail_en: 'A full week fasting every day. You do not just fast occasionally — you maintain it with daily consistency. It is one of the hardest fasting achievements in the app.',
    progress_total: 7,
  },

  // --- habitos ---
  {
    key: 'habit_first', Icon: CheckCircle2, category: 'habitos', difficulty: 'easy',
    label_es: 'Primer hábito', label_en: 'First habit',
    desc_es: 'Completa un hábito por primera vez', desc_en: 'Complete a habit for the first time',
    detail_es: 'Completaste tu primer hábito. Los hábitos son pequeñas acciones repetidas que, acumuladas, cambian quiénes somos. Este es el primero de muchos.',
    detail_en: 'You completed your first habit. Habits are small repeated actions that, accumulated, change who we are. This is the first of many.',
  },
  {
    key: 'habit_custom', Icon: Paintbrush, category: 'habitos', difficulty: 'easy',
    label_es: 'Creador', label_en: 'Creator',
    desc_es: 'Crea tu primer hábito personalizado', desc_en: 'Create your first custom habit',
    detail_es: 'Creaste un hábito propio. Los hábitos personalizados son más poderosos porque reflejan tus metas reales, no las de otro. Tú decidiste qué importa.',
    detail_en: 'You created your own habit. Custom habits are more powerful because they reflect your real goals, not someone else\'s. You decided what matters.',
  },
  {
    key: 'habit_all_day', Icon: Star, category: 'habitos', difficulty: 'easy',
    label_es: 'Día perfecto', label_en: 'Perfect day',
    desc_es: 'Completa todos tus hábitos en un día', desc_en: 'Complete all your habits in one day',
    detail_es: 'Un día en que no quedó ningún hábito pendiente. No importa cuántos tengas: los completaste todos. Ese es un día perfecto.',
    detail_en: 'A day where no habit was left undone. It does not matter how many you have — you completed them all. That is a perfect day.',
  },
  {
    key: 'habit_all_week', Icon: Medal, category: 'habitos', difficulty: 'medium',
    label_es: 'Semana perfecta', label_en: 'Perfect week',
    desc_es: 'Completa todos los hábitos 7 días seguidos', desc_en: 'Complete all habits 7 days in a row',
    detail_es: 'Siete días seguidos completando todos tus hábitos. Ni un solo día fallaste. Una semana perfecta es el tipo de consistencia que transforma personas.',
    detail_en: 'Seven days in a row completing all your habits. Not a single day missed. A perfect week is the kind of consistency that transforms people.',
    progress_total: 7,
  },
  {
    key: 'habit_30_days', Icon: Award, category: 'habitos', difficulty: 'hard',
    label_es: 'Mes de hábitos', label_en: 'Habit month',
    desc_es: 'Completa todos los hábitos en 30 días distintos', desc_en: 'Complete all habits on 30 different days',
    detail_es: 'Treinta días diferentes en que completaste todos tus hábitos del día. No tienen que ser consecutivos, pero la acumulación dice mucho: eres alguien que cumple.',
    detail_en: 'Thirty different days where you completed all your daily habits. They do not have to be consecutive, but the accumulation says a lot: you are someone who follows through.',
    progress_total: 30,
  },

  // --- constancia ---
  {
    key: 'weekend_warrior', Icon: PartyPopper, category: 'constancia', difficulty: 'easy',
    label_es: 'Guerrero fin de semana', label_en: 'Weekend warrior',
    desc_es: 'Registra datos un sábado Y un domingo', desc_en: 'Log data on a Saturday AND a Sunday',
    detail_es: 'Muchas personas registran solo entre semana. Tú lo hiciste también el fin de semana. La salud no toma días libres, y tú tampoco.',
    detail_en: 'Many people only track on weekdays. You did it on the weekend too. Health does not take days off, and neither do you.',
  },
  {
    key: 'streak_3', Icon: Sprout, category: 'constancia', difficulty: 'easy',
    label_es: 'Racha de 3 días', label_en: '3-day streak',
    desc_es: 'Registra datos 3 días seguidos', desc_en: 'Log data 3 days in a row',
    detail_es: 'Tres días consecutivos registrando. Una racha empieza con solo tres días. Cuando la mantienes, la app suma todos los tipos de registros: comida, agua, peso, presión o hábitos.',
    detail_en: 'Three consecutive days of logging. A streak starts with just three days. When you maintain it, the app counts all types of records: food, water, weight, blood pressure, or habits.',
    progress_total: 3,
  },
  {
    key: 'streak_7', Icon: Flame, category: 'constancia', difficulty: 'medium',
    label_es: 'Racha de 7 días', label_en: '7-day streak',
    desc_es: 'Registra datos 7 días seguidos', desc_en: 'Log data 7 days in a row',
    detail_es: 'Una semana completa sin interrupciones. Siete días seguidos de cualquier tipo de registro (comida, agua, peso, presión o hábitos) cuentan para esta racha.',
    detail_en: 'A full week without interruptions. Seven consecutive days of any type of record (food, water, weight, blood pressure, or habits) count for this streak.',
    progress_total: 7,
  },
  {
    key: 'streak_30', Icon: Gem, category: 'constancia', difficulty: 'hard',
    label_es: 'Racha de 30 días', label_en: '30-day streak',
    desc_es: 'Registra datos 30 días seguidos', desc_en: 'Log data 30 days in a row',
    detail_es: 'Treinta días consecutivos es la racha más larga de la app. No puedes saltarte ni uno. Solo quienes tienen un compromiso real con su salud llegan aquí.',
    detail_en: 'Thirty consecutive days is the longest streak in the app. You cannot skip a single one. Only those with a real commitment to their health make it here.',
    progress_total: 30,
  },

  // --- explorador ---
  {
    key: 'first_recipe', Icon: ChefHat, category: 'explorador', difficulty: 'easy',
    label_es: 'Primera receta', label_en: 'First recipe',
    desc_es: 'Crea tu primera receta', desc_en: 'Create your first recipe',
    detail_es: 'Creaste tu primera receta en la app. Las recetas te permiten guardar tus comidas habituales para registrarlas rápidamente sin tener que buscar los ingredientes cada vez.',
    detail_en: 'You created your first recipe in the app. Recipes let you save your usual meals to log them quickly without having to search for ingredients every time.',
  },
  {
    key: 'first_coach', Icon: Bot, category: 'explorador', difficulty: 'easy',
    label_es: 'Coach activado', label_en: 'Coach activated',
    desc_es: 'Usa el coach de IA por primera vez', desc_en: 'Use the AI coach for the first time',
    detail_es: 'Activaste el Coach de IA. Este asistente analiza tus datos del día y genera recomendaciones personalizadas de nutrición, hidratación y hábitos. Se activa automáticamente al registrar la cena.',
    detail_en: 'You activated the AI Coach. This assistant analyzes your daily data and generates personalized recommendations for nutrition, hydration, and habits. It activates automatically when you log dinner.',
  },
  {
    key: 'first_scan', Icon: Camera, category: 'explorador', difficulty: 'easy',
    label_es: 'Escáner', label_en: 'Scanner',
    desc_es: 'Registra un alimento usando el escáner', desc_en: 'Log a food item using the scanner',
    detail_es: 'Usaste el escáner de código de barras para registrar un alimento. Es la forma más rápida de agregar alimentos empacados con información nutricional precisa del producto real.',
    detail_en: 'You used the barcode scanner to log a food item. It is the fastest way to add packaged foods with accurate nutritional information from the real product.',
  },
  {
    key: 'recipe_5', Icon: BookOpen, category: 'explorador', difficulty: 'medium',
    label_es: 'Coleccionista', label_en: 'Collector',
    desc_es: 'Crea 5 recetas', desc_en: 'Create 5 recipes',
    detail_es: 'Cinco recetas guardadas significa que ya tienes un pequeño recetario personal. Cuantas más recetas guardes, más rápido y fácil es registrar tus comidas del día a día.',
    detail_en: 'Five saved recipes means you already have a small personal cookbook. The more recipes you save, the faster and easier it is to log your everyday meals.',
    progress_total: 5,
  },
  {
    key: 'coach_week', Icon: Brain, category: 'explorador', difficulty: 'medium',
    label_es: 'Semana con coach', label_en: 'Week with coach',
    desc_es: 'Usa el coach de IA 7 días distintos', desc_en: 'Use the AI coach on 7 different days',
    detail_es: 'Siete días distintos con análisis del Coach de IA. Con una semana de análisis personalizados, el coach empieza a identificar tus patrones y a darte recomendaciones más precisas.',
    detail_en: 'Seven different days with AI Coach analysis. With a week of personalized analyses, the coach starts identifying your patterns and giving you more precise recommendations.',
    progress_total: 7,
  },
  {
    key: 'all_modules', Icon: Map, category: 'explorador', difficulty: 'hard',
    label_es: 'Explorador total', label_en: 'Total explorer',
    desc_es: 'Visita todas las secciones de la app', desc_en: 'Visit all sections of the app',
    detail_es: 'Visitaste todas las secciones de la app: comida, agua, peso, presión arterial, ayuno, hábitos, recetas y coach. Conoces todas las herramientas disponibles para cuidar tu salud.',
    detail_en: 'You visited every section of the app: food, water, weight, blood pressure, fasting, habits, recipes, and coach. You know all the tools available to take care of your health.',
  },

  // --- elite ---
  {
    key: 'triple_crown', Icon: Award, category: 'elite', difficulty: 'elite',
    label_es: 'Triple corona', label_en: 'Triple crown',
    desc_es: 'Cumple meta de agua, calorías y todos los hábitos el mismo día', desc_en: 'Hit water goal, calorie goal, and all habits on the same day',
    detail_es: 'En un mismo día cumpliste la meta de agua, la meta calórica y completaste todos tus hábitos. La triple corona requiere que todo salga bien el mismo día. Es más difícil de lo que parece.',
    detail_en: 'In one single day you hit your water goal, calorie goal, and completed all your habits. The triple crown requires everything to go right on the same day. It is harder than it looks.',
  },
  {
    key: 'health_champion', Icon: Crown, category: 'elite', difficulty: 'elite',
    label_es: 'Campeón de salud', label_en: 'Health champion',
    desc_es: 'Desbloquea 30 logros distintos', desc_en: 'Unlock 30 different achievements',
    detail_es: 'Treinta logros desbloqueados. Para llegar aquí tuviste que ser consistente en múltiples áreas de salud durante semanas. Eres un campeón de la salud integral.',
    detail_en: 'Thirty achievements unlocked. To get here you had to be consistent across multiple health areas for weeks. You are a champion of holistic health.',
    progress_total: 30,
  },
  {
    key: 'year_active', Icon: Building2, category: 'elite', difficulty: 'elite',
    label_es: 'Un año activo', label_en: 'One year active',
    desc_es: 'Registra datos en 365 días distintos', desc_en: 'Log data on 365 different days',
    detail_es: '365 días distintos con al menos un registro. Un año completo de datos. Este es el logro más raro de la app: solo quienes convierten el seguimiento en estilo de vida llegan aquí.',
    detail_en: '365 different days with at least one record. A full year of data. This is the rarest achievement in the app: only those who turn tracking into a lifestyle make it here.',
    progress_total: 365,
  },
  {
    key: 'consistency_master', Icon: Star, category: 'elite', difficulty: 'elite',
    label_es: 'Maestro total', label_en: 'Total master',
    desc_es: 'Desbloquea Racha 30 días, Mes hidratado, Mes de hábitos y 100 días de comidas', desc_en: 'Unlock 30-day streak, Hydrated month, Habit month, and 100 days of meals',
    detail_es: 'Cuatro logros de resistencia en una sola persona: racha de 30 días, mes hidratado, mes de hábitos y 100 días de comidas. Esto no es suerte ni motivación pasajera. Es carácter.',
    detail_en: 'Four endurance achievements in one person: 30-day streak, hydrated month, habit month, and 100 days of meals. This is not luck or passing motivation. It is character.',
  },
]

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateStr(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD
}

function uniqueDates(rows, field) {
  return [...new Set(rows.map(r => toDateStr(r[field])))]
}

function calcStreak(sortedDatesDesc) {
  if (!sortedDatesDesc.length) return 0
  let streak = 0
  const expected = new Date()
  expected.setHours(0, 0, 0, 0)
  for (const dateStr of sortedDatesDesc) {
    const d = new Date(dateStr + 'T00:00:00')
    const diff = (expected - d) / 86400000
    if (diff <= 1) { streak++; expected.setTime(d.getTime()) } else break
  }
  return streak
}

function sortDesc(dates) {
  return [...dates].sort((a, b) => (a < b ? 1 : -1))
}

// ─── batch check (non-hook) ───────────────────────────────────────────────

const THROTTLE_MS = 300_000 // 5 min

export async function runBadgeChecks(profileId) {
  if (!profileId) return {}
  const THROTTLE_KEY = `badge_check_${profileId}`
  const last = sessionStorage.getItem(THROTTLE_KEY)
  if (last && Date.now() - parseInt(last) < THROTTLE_MS) return {}
  sessionStorage.setItem(THROTTLE_KEY, Date.now().toString())

  // Fetch existing badges so we can skip already-unlocked ones
  const { data: existingBadges } = await supabase
    .from('badges')
    .select('badge_key')
    .eq('profile_id', profileId)
  const unlockedKeys = new Set((existingBadges || []).map(b => b.badge_key))

  const has = (key) => unlockedKeys.has(key)

  // Parallel queries
  const [foodRes, waterRes, bpRes, weightRes, fastRes, habitLogRes, habitsRes, recipeRes, coachRes, profileRes] = await Promise.all([
    supabase.from('food_logs').select('logged_at, meal_type, calories, protein_g, carbs_g, fat_g').eq('profile_id', profileId),
    supabase.from('water_logs').select('logged_at, amount_ml').eq('profile_id', profileId),
    supabase.from('bp_readings').select('recorded_at, systolic, diastolic').eq('profile_id', profileId).order('recorded_at', { ascending: false }),
    supabase.from('weight_logs').select('recorded_at, weight_kg').eq('profile_id', profileId).order('recorded_at', { ascending: true }),
    supabase.from('fasting_sessions').select('start_time, end_time, completed, target_hours').eq('profile_id', profileId).eq('completed', true),
    supabase.from('habit_logs').select('completed_date, habit_id').eq('profile_id', profileId),
    supabase.from('habits').select('id').eq('profile_id', profileId).eq('is_active', true),
    supabase.from('recipes').select('created_at').eq('profile_id', profileId),
    supabase.from('daily_analyses').select('analysis_date').eq('profile_id', profileId),
    supabase.from('profiles').select('weight_goal_kg, water_goal_ml, calorie_goal').eq('id', profileId).maybeSingle(),
  ])

  const foodLogs    = foodRes.data    || []
  const waterLogs   = waterRes.data   || []
  const bpReadings  = bpRes.data      || []
  const weightLogs  = weightRes.data  || []
  const fasts       = fastRes.data    || []
  const habitLogs   = habitLogRes.data || []
  const habits      = habitsRes.data  || []
  const recipes     = recipeRes.data  || []
  const coachLogs   = coachRes.data   || []
  const profile     = profileRes.data || {}

  const waterGoal    = profile.water_goal_ml    || 2000
  const calorieGoal  = profile.calorie_goal     || 2000

  // ── derived data ──────────────────────────────────────────────────────

  // Food: distinct days
  const foodDays = uniqueDates(foodLogs, 'logged_at')
  const foodDaysCount = foodDays.length

  // Food: days where all three meal types logged
  const mealsByDay = {}
  foodLogs.forEach(f => {
    const d = toDateStr(f.logged_at)
    if (!mealsByDay[d]) mealsByDay[d] = new Set()
    mealsByDay[d].add(f.meal_type)
  })

  // Food: days meeting calorie goal (within 10%)
  const calorieByDay = {}
  foodLogs.forEach(f => {
    const d = toDateStr(f.logged_at)
    calorieByDay[d] = (calorieByDay[d] || 0) + (f.calories || 0)
  })
  const calGoalDays = Object.values(calorieByDay).filter(c => c >= calorieGoal * 0.9 && c <= calorieGoal * 1.2).length

  // Food: days with all macros logged
  const macroDaySet = new Set()
  foodLogs.forEach(f => {
    if (f.protein_g && f.carbs_g && f.fat_g) macroDaySet.add(toDateStr(f.logged_at))
  })
  const macroDaysCount = macroDaySet.size

  // Water: daily totals
  const waterByDay = {}
  waterLogs.forEach(w => {
    const d = toDateStr(w.logged_at)
    waterByDay[d] = (waterByDay[d] || 0) + (w.amount_ml || 0)
  })
  const waterGoalDays = Object.entries(waterByDay).filter(([, ml]) => ml >= waterGoal).map(([d]) => d)
  const waterGoalDaysCount = waterGoalDays.length

  // Water streak of goal days
  const waterGoalStreak = calcStreak(sortDesc(waterGoalDays))

  // Weight
  const weightCount = weightLogs.length
  const weightDates = uniqueDates(weightLogs, 'recorded_at')
  const weightStreak = calcStreak(sortDesc(weightDates))
  let weightLoss = 0
  if (weightLogs.length >= 2) {
    weightLoss = weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg
  }

  // BP
  const bpDays = uniqueDates(bpReadings, 'recorded_at')
  const bpDaysCount = bpDays.length
  let bpNormalStreak = 0
  for (const r of bpReadings) {
    if (r.systolic < 130 && r.diastolic < 80) bpNormalStreak++
    else break
  }

  // Fasting
  const fastCount = fasts.length
  const fastDays = uniqueDates(fasts, 'start_time')
  const fastStreakVal = calcStreak(sortDesc(fastDays))

  // Habits: days where all habits completed
  const habitIds = new Set(habits.map(h => h.id))
  const habitTotal = habitIds.size
  const habitLogsByDay = {}
  habitLogs.forEach(l => {
    const d = l.completed_date
    if (!habitLogsByDay[d]) habitLogsByDay[d] = new Set()
    habitLogsByDay[d].add(l.habit_id)
  })
  const perfectHabitDays = habitTotal > 0
    ? Object.entries(habitLogsByDay).filter(([, s]) => s.size >= habitTotal).map(([d]) => d)
    : []
  const perfectHabitDaysCount = perfectHabitDays.length
  const habitWeekStreak = calcStreak(sortDesc(perfectHabitDays))

  // Coach
  const coachDaysCount = uniqueDates(coachLogs, 'analysis_date').length

  // Recipes
  const recipesCount = recipes.length

  // Global streak (union of all activity days)
  const allDays = sortDesc([...new Set([
    ...uniqueDates(foodLogs, 'logged_at'),
    ...uniqueDates(waterLogs, 'logged_at'),
    ...uniqueDates(weightLogs, 'recorded_at'),
    ...uniqueDates(bpReadings, 'recorded_at'),
  ])])
  const globalStreak = calcStreak(allDays)
  const allDaysCount = new Set(allDays).size

  // Weekend warrior
  const hasWeekend = allDays.some(d => new Date(d + 'T12:00:00').getDay() === 6) &&
                     allDays.some(d => new Date(d + 'T12:00:00').getDay() === 0)

  // ── badge stats for progress display ──────────────────────────────────
  const stats = {
    food_tracker_7:   { current: Math.min(foodDaysCount, 7),    total: 7 },
    food_tracker_30:  { current: Math.min(foodDaysCount, 30),   total: 30 },
    food_tracker_100: { current: Math.min(foodDaysCount, 100),  total: 100 },
    calorie_goal_3:   { current: Math.min(calGoalDays, 3),      total: 3 },
    calorie_goal_21:  { current: Math.min(calGoalDays, 21),     total: 21 },
    macro_master:     { current: Math.min(macroDaysCount, 15),  total: 15 },
    hydrated_7:       { current: Math.min(waterGoalDaysCount, 7),   total: 7 },
    water_streak_5:   { current: Math.min(waterGoalStreak, 5),      total: 5 },
    hydrated_30:      { current: Math.min(waterGoalDaysCount, 30),  total: 30 },
    weight_7:         { current: Math.min(weightCount, 7),  total: 7 },
    weight_30:        { current: Math.min(weightCount, 30), total: 30 },
    consistent_weight:{ current: Math.min(weightStreak, 14), total: 14 },
    weight_loss_5:    { current: Math.min(Math.max(weightLoss, 0), 5), total: 5 },
    bp_monitor_7:     { current: Math.min(bpDaysCount, 7),  total: 7 },
    bp_monitor_30:    { current: Math.min(bpDaysCount, 30), total: 30 },
    bp_normal_streak: { current: Math.min(bpNormalStreak, 7), total: 7 },
    fast_master_10:   { current: Math.min(fastCount, 10), total: 10 },
    fast_master_25:   { current: Math.min(fastCount, 25), total: 25 },
    fast_streak_7:    { current: Math.min(fastStreakVal, 7), total: 7 },
    habit_all_week:   { current: Math.min(habitWeekStreak, 7), total: 7 },
    habit_30_days:    { current: Math.min(perfectHabitDaysCount, 30), total: 30 },
    recipe_5:         { current: Math.min(recipesCount, 5), total: 5 },
    coach_week:       { current: Math.min(coachDaysCount, 7), total: 7 },
    streak_3:         { current: Math.min(globalStreak, 3),   total: 3 },
    streak_7:         { current: Math.min(globalStreak, 7),   total: 7 },
    streak_30:        { current: Math.min(globalStreak, 30),  total: 30 },
    year_active:      { current: Math.min(allDaysCount, 365), total: 365 },
    health_champion:  { current: Math.min(unlockedKeys.size, 30), total: 30 },
  }

  // ── evaluate & unlock ─────────────────────────────────────────────────
  const toUnlock = []

  const check = (key, condition) => { if (!has(key) && condition) toUnlock.push(key) }

  // nutricion
  check('first_log',        foodDaysCount >= 1)
  check('meal_variety_day', Object.values(mealsByDay).some(s => s.has('breakfast') && s.has('lunch') && s.has('dinner')))
  check('food_tracker_7',   foodDaysCount >= 7)
  check('night_snack',      foodLogs.some(f => f.meal_type === 'dinner' && new Date(f.logged_at).getHours() >= 21))
  check('early_bird',       foodLogs.some(f => f.meal_type === 'breakfast' && new Date(f.logged_at).getHours() < 8))
  check('calorie_goal_3',   calGoalDays >= 3)
  check('food_tracker_30',  foodDaysCount >= 30)
  check('calorie_goal_21',  calGoalDays >= 21)
  check('macro_master',     macroDaysCount >= 15)
  check('food_tracker_100', foodDaysCount >= 100)

  // agua
  check('first_water',    waterLogs.length >= 1)
  check('hydrated_1',     waterGoalDaysCount >= 1)
  check('hydrated_7',     waterGoalDaysCount >= 7)
  check('water_streak_5', waterGoalStreak >= 5)
  check('hydrated_30',    waterGoalDaysCount >= 30)
  check('liter_3',        Object.values(waterByDay).some(ml => ml >= 3000))

  // peso
  check('first_weight',      weightCount >= 1)
  check('weight_7',          weightCount >= 7)
  check('weight_30',         weightCount >= 30)
  check('consistent_weight', weightStreak >= 14)
  check('weight_loss_5',     weightLoss >= 5)
  // goal_reached checked inline

  // presion
  check('first_bp',         bpReadings.length >= 1)
  check('bp_morning',       bpReadings.some(r => new Date(r.recorded_at).getHours() < 9))
  check('bp_monitor_7',     bpDaysCount >= 7)
  check('bp_monitor_30',    bpDaysCount >= 30)
  check('bp_normal_streak', bpNormalStreak >= 7)

  // ayuno
  check('first_fast',     fastCount >= 1)
  check('early_fast',     fasts.some(f => new Date(f.start_time).getHours() >= 20))
  check('fast_master_10', fastCount >= 10)
  check('fast_master_25', fastCount >= 25)
  check('fast_24h',       fasts.some(f => {
    if (!f.end_time) return false
    const hours = (new Date(f.end_time) - new Date(f.start_time)) / 3600000
    return hours >= 24
  }))
  check('fast_streak_7',  fastStreakVal >= 7)

  // habitos
  check('habit_first',    habitLogs.length >= 1)
  // habit_custom and habit_all_day checked inline
  check('habit_all_week', habitWeekStreak >= 7)
  check('habit_30_days',  perfectHabitDaysCount >= 30)

  // constancia
  check('weekend_warrior', hasWeekend)
  check('streak_3',  globalStreak >= 3)
  check('streak_7',  globalStreak >= 7)
  check('streak_30', globalStreak >= 30)

  // explorador
  check('recipe_5',   recipesCount >= 5)
  check('coach_week', coachDaysCount >= 7)
  // first_recipe, first_coach, first_scan, all_modules checked inline

  // elite
  const CONSISTENCY_KEYS = ['streak_30', 'hydrated_30', 'habit_30_days', 'food_tracker_100']
  check('health_champion',    unlockedKeys.size + toUnlock.length >= 30)
  check('year_active',        allDaysCount >= 365)
  check('consistency_master', CONSISTENCY_KEYS.every(k => unlockedKeys.has(k) || toUnlock.includes(k)))

  // Insert unlocked badges
  const newlyUnlocked = []
  for (const key of toUnlock) {
    try {
      const { data } = await supabase
        .from('badges')
        .insert([{ profile_id: profileId, badge_key: key }])
        .select()
        .single()
      if (data) {
        newlyUnlocked.push(data)
        unlockedKeys.add(key)
      }
    } catch { /* ignore duplicates */ }
  }

  // Re-check elite after batch
  if (!has('health_champion') && unlockedKeys.size >= 30) {
    try {
      await supabase.from('badges').insert([{ profile_id: profileId, badge_key: 'health_champion' }])
    } catch { /* ignore */ }
  }
  if (!has('consistency_master') && CONSISTENCY_KEYS.every(k => unlockedKeys.has(k))) {
    try {
      await supabase.from('badges').insert([{ profile_id: profileId, badge_key: 'consistency_master' }])
    } catch { /* ignore */ }
  }

  return { newlyUnlocked, stats }
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useBadges(profileId) {
  const [badges, setBadges] = useState([])
  const [newBadge, setNewBadge] = useState(null)
  const [loading, setLoading] = useState(false)
  const [badgeStats, setBadgeStats] = useState({})

  const fetchBadges = useCallback(async () => {
    if (!profileId) { setBadges([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('profile_id', profileId)
    setBadges(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => { fetchBadges() }, [fetchBadges])

  const hasBadge = (key) => badges.some(b => b.badge_key === key)

  const checkAndUnlock = async (key, condition) => {
    if (!profileId || !condition || hasBadge(key)) return null
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert([{ profile_id: profileId, badge_key: key }])
        .select()
        .single()
      if (error) return null
      setBadges(prev => [...prev, data])
      const badgeDef = ALL_BADGES.find(b => b.key === key)
      if (badgeDef) {
        setNewBadge(badgeDef)
        window.dispatchEvent(new CustomEvent('badge-unlocked', { detail: badgeDef }))
      }
      return data
    } catch {
      return null
    }
  }

  const clearNewBadge = () => setNewBadge(null)

  const runChecks = useCallback(async () => {
    const result = await runBadgeChecks(profileId)
    if (result?.newlyUnlocked?.length) {
      await fetchBadges()
      const last = result.newlyUnlocked[result.newlyUnlocked.length - 1]
      const def = ALL_BADGES.find(b => b.key === last.badge_key)
      if (def) {
        setNewBadge(def)
        window.dispatchEvent(new CustomEvent('badge-unlocked', { detail: def }))
      }
    }
    if (result?.stats) setBadgeStats(result.stats)
  }, [profileId, fetchBadges])

  return { badges, newBadge, loading, hasBadge, checkAndUnlock, clearNewBadge, refetch: fetchBadges, runChecks, badgeStats }
}
