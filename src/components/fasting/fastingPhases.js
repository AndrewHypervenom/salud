export const FASTING_PHASES = [
  {
    name: 'hungry',
    hoursMin: 0,
    hoursMax: 4,
    primary: '#F97316',
    glow: '#FED7AA',
    darkPrimary: '#EA580C',
    bgLight: ['#FFF7ED', '#FEF3C7'],
    bgDark: ['rgba(28,28,30,1)', 'rgba(249,115,22,0.12)'],
    labelKey: 'fasting.phase_hungry',
    descKey: 'fasting.phase_desc_hungry',
    mascotState: 'neutral',
    icon: 'utensils',
  },
  {
    name: 'adapting',
    hoursMin: 4,
    hoursMax: 8,
    primary: '#EAB308',
    glow: '#FEF08A',
    darkPrimary: '#CA8A04',
    bgLight: ['#FEFCE8', '#FEF9C3'],
    bgDark: ['rgba(28,28,30,1)', 'rgba(234,179,8,0.12)'],
    labelKey: 'fasting.phase_adapting',
    descKey: 'fasting.phase_desc_adapting',
    mascotState: 'tired',
    icon: 'battery-low',
  },
  {
    name: 'burning',
    hoursMin: 8,
    hoursMax: 14,
    primary: '#10B981',
    glow: '#A7F3D0',
    darkPrimary: '#059669',
    bgLight: ['#ECFDF5', '#D1FAE5'],
    bgDark: ['rgba(28,28,30,1)', 'rgba(16,185,129,0.12)'],
    labelKey: 'fasting.phase_burning',
    descKey: 'fasting.phase_desc_burning',
    mascotState: 'energized',
    icon: 'flame',
  },
  {
    name: 'ketosis',
    hoursMin: 14,
    hoursMax: 20,
    primary: '#8B5CF6',
    glow: '#DDD6FE',
    darkPrimary: '#7C3AED',
    bgLight: ['#F5F3FF', '#EDE9FE'],
    bgDark: ['rgba(28,28,30,1)', 'rgba(139,92,246,0.15)'],
    labelKey: 'fasting.phase_ketosis',
    descKey: 'fasting.phase_desc_ketosis',
    mascotState: 'radiant',
    icon: 'zap',
  },
  {
    name: 'deep',
    hoursMin: 20,
    hoursMax: Infinity,
    primary: '#6366F1',
    glow: '#C7D2FE',
    darkPrimary: '#4F46E5',
    bgLight: ['#EEF2FF', '#E0E7FF'],
    bgDark: ['rgba(28,28,30,1)', 'rgba(99,102,241,0.18)'],
    labelKey: 'fasting.phase_deep',
    descKey: 'fasting.phase_desc_deep',
    mascotState: 'cosmic',
    icon: 'sparkles',
  },
]

export function getPhaseIndex(elapsedHours) {
  const h = elapsedHours ?? 0
  if (h < 4) return 0
  if (h < 8) return 1
  if (h < 14) return 2
  if (h < 20) return 3
  return 4
}
