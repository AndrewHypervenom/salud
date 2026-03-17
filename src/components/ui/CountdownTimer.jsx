import { useState, useEffect, useRef } from 'react'

/**
 * CountdownTimer — live countdown to a target ISO datetime
 * Props: targetTime (ISO string), onComplete (callback), className
 */
export function CountdownTimer({ targetTime, onComplete, className = '' }) {
  const [remaining, setRemaining] = useState(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!targetTime) return
    completedRef.current = false

    const tick = () => {
      const diff = new Date(targetTime).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining(0)
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
        return
      }
      setRemaining(diff)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetTime, onComplete])

  if (remaining === null) return null

  if (remaining === 0) {
    return <span className={className}>00:00:00</span>
  }

  const totalSecs = Math.floor(remaining / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  )
}

/**
 * ElapsedTimer — time elapsed since a start ISO datetime
 */
export function ElapsedTimer({ startTime, className = '' }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime) return
    const tick = () => setElapsed(Date.now() - new Date(startTime).getTime())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const totalSecs = Math.floor(elapsed / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  )
}
