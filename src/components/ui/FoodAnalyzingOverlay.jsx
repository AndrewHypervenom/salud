import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const STEP_KEYS = [
  'food.step_reading',
  'food.step_identifying',
  'food.step_calculating',
  'food.step_preparing',
]

const STEP_EMOJIS = ['📸', '🧠', '🔬', '✨']

export function FoodAnalyzingOverlay({ imagePreview }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStep(s => (s + 1) % STEP_KEYS.length)
    }, 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl overflow-hidden bg-gray-950/75 backdrop-blur-sm">
      {/* Image with scan effect */}
      <div className="relative w-full max-h-40 overflow-hidden rounded-xl">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="analyzing"
            className="w-full max-h-40 object-cover opacity-60"
          />
        )}

        {/* Scan line */}
        <div
          className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan pointer-events-none"
          style={{ position: 'absolute' }}
        />

        {/* Pulse ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border-2 border-purple-400 rounded-xl animate-pulse-ring" />
        </div>

        {/* Floating particles */}
        {[0, 0.45, 0.9, 1.35].map((delay, i) => (
          <span
            key={i}
            className="absolute text-base animate-float pointer-events-none select-none"
            style={{
              animationDelay: `${delay}s`,
              left: `${20 + i * 18}%`,
              bottom: '8px',
            }}
          >
            ✨
          </span>
        ))}
      </div>

      {/* Step text */}
      <div className="mt-3 px-4 text-center">
        <p className="text-white font-semibold text-sm">
          {STEP_EMOJIS[step]} {t(STEP_KEYS[step])}
        </p>
      </div>

      {/* Shimmer progress bar */}
      <div className="mt-3 w-2/3 h-1.5 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, #7e22ce, #8b5cf6, #7e22ce)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </div>
  )
}
