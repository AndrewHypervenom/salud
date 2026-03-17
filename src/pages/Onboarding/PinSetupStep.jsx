import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

// PINs that are too easy to guess
const WEAK_PINS = new Set([
  '0000','1111','2222','3333','4444','5555','6666','7777','8888','9999',
  '1234','2345','3456','4567','5678','6789','7890',
  '0987','9876','8765','7654','6543','5432','4321','3210',
  '1212','2121','1122','2211','1010','0101','1001','0110',
  '1230','0000','2580','1357','2468',
])

function isWeakPin(pin) {
  return WEAK_PINS.has(pin)
}

function validateRecoveryWord(word, t) {
  if (word.length < 3) return t('pin.recovery_min_chars')
  if (/^\d+$/.test(word)) return t('pin.recovery_no_numbers')
  if (/^(.)\1+$/.test(word)) return t('pin.recovery_too_simple')
  return null
}

/**
 * Multi-step PIN setup: choose PIN → confirm PIN → recovery word.
 * Calls onComplete({ pin, recoveryWord }) when done.
 */
export default function PinSetupStep({ onComplete, disabled }) {
  const { t } = useTranslation()
  const [step, setStep] = useState('pin') // 'pin' | 'confirm' | 'recovery'
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [recoveryWord, setRecoveryWord] = useState('')
  const [recoveryError, setRecoveryError] = useState('')

  const currentPin = step === 'pin' ? pin : confirmPin
  const setCurrentPin = step === 'pin' ? setPin : setConfirmPin

  const handleDigit = (d) => {
    if (disabled || currentPin.length >= 4) return
    const next = currentPin + d
    setCurrentPin(next)
    if (next.length === 4) {
      setTimeout(() => advance(next), 150)
    }
  }

  const handleDelete = () => {
    if (!disabled) setCurrentPin(prev => prev.slice(0, -1))
  }

  const advance = (p) => {
    if (step === 'pin') {
      if (isWeakPin(p)) {
        setPinError(t('pin.weak_code'))
        setPin('')
        return
      }
      setPinError('')
      setStep('confirm')
      setConfirmPin('')
      setMismatch(false)
    } else if (step === 'confirm') {
      if (p === pin) {
        setStep('recovery')
        setMismatch(false)
      } else {
        setMismatch(true)
        setConfirmPin('')
      }
    }
  }

  const handleRecoverySubmit = () => {
    const word = recoveryWord.trim()
    const err = validateRecoveryWord(word, t)
    if (err) {
      setRecoveryError(err)
      return
    }
    onComplete({ pin, recoveryWord: word })
  }

  if (step === 'recovery') {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('pin.recovery_setup_title')}</p>
          <p className="text-gray-500 text-sm mt-1">{t('pin.recovery_setup_hint')}</p>
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={recoveryWord}
            onChange={e => { setRecoveryWord(e.target.value); setRecoveryError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleRecoverySubmit() }}
            placeholder={t('pin.recovery_placeholder')}
            autoComplete="off"
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-xl text-center text-lg focus:outline-none focus:border-primary-500 disabled:opacity-40"
          />
          {recoveryError && (
            <p className="text-red-500 text-sm text-center">{recoveryError}</p>
          )}
          <button
            type="button"
            onClick={handleRecoverySubmit}
            disabled={disabled || !recoveryWord.trim()}
            className="w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all text-lg disabled:opacity-40"
          >
            {t('pin.finish_setup')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {step === 'pin' ? t('pin.setup_title') : t('pin.confirm_title')}
        </p>
        {pinError && <p className="text-red-500 text-sm mt-1">{pinError}</p>}
        {mismatch && <p className="text-red-500 text-sm mt-1">{t('pin.mismatch')}</p>}
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-100 ${
              i < currentPin.length
                ? 'bg-primary-500 border-primary-500'
                : 'border-gray-300 dark:border-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {NUMPAD.map((btn, idx) => {
          if (btn === '') return <div key={idx} />
          if (btn === '⌫') {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                disabled={disabled}
                aria-label={t('pin.delete')}
                className="w-full h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-transform disabled:opacity-40"
              >
                ⌫
              </button>
            )
          }
          return (
            <button
              key={idx}
              onClick={() => handleDigit(btn)}
              disabled={disabled}
              aria-label={btn}
              className="w-full h-20 rounded-2xl bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-gray-600 flex items-center justify-center text-3xl font-bold text-gray-800 dark:text-gray-100 active:scale-95 transition-transform disabled:opacity-40"
            >
              {btn}
            </button>
          )
        })}
      </div>
    </div>
  )
}
