import {
  Home, UtensilsCrossed, CheckCircle2, Heart, TrendingUp,
  Droplets, Scale, Zap, ChefHat, Search, Trophy, Flame,
  Salad, Dumbbell, Stethoscope, Users, MoreHorizontal,
  SlidersHorizontal, BarChart3, Bot, Sparkles,
} from 'lucide-react'

// ── Nav item key → Lucide component ──────────────────────────────────────────
export const NAV_ICON_MAP = {
  dashboard:        Home,
  food:             UtensilsCrossed,
  habits:           CheckCircle2,
  'blood-pressure': Heart,
  progress:         TrendingUp,
  water:            Droplets,
  weight:           Scale,
  fasting:          Zap,
  recipes:          ChefHat,
  'food-search':    Sparkles,
  badges:           Trophy,
  calories:         Flame,
  diet:             Salad,
  exercise:         Dumbbell,
  'doctor-questions': Stethoscope,
  profiles:         Users,
  _more:            MoreHorizontal,
  _customize:       SlidersHorizontal,
}

// ── Widget id → Lucide component ─────────────────────────────────────────────
export const WIDGET_ICON_MAP = {
  calories:      Flame,
  quick_actions: Zap,
  meals:         UtensilsCrossed,
  macros:        BarChart3,
  water:         Droplets,
  fasting:       Zap,
  habits:        CheckCircle2,
  coach:         Bot,
  bp:            Heart,
  weight:        Scale,
  doctor:        Stethoscope,
  streak:        Flame,
  craving:       Sparkles,
}

// ── Helper components ─────────────────────────────────────────────────────────
export function NavIcon({ navKey, size = 22, className }) {
  const Icon = NAV_ICON_MAP[navKey]
  if (!Icon) return null
  return <Icon size={size} className={className} strokeWidth={1.75} />
}

export function WidgetIcon({ id, size = 22, className }) {
  const Icon = WIDGET_ICON_MAP[id]
  if (!Icon) return null
  return <Icon size={size} className={className} strokeWidth={1.75} />
}
