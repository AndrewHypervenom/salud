import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * BarcodeScanner — wrapper de html5-qrcode para escanear códigos de barras
 * Props: onScan(code), onClose, active
 */
export function BarcodeScanner({ onScan, onClose, active = true }) {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!active || !containerRef.current) return

    let scanner = null
    let stopped = false

    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (stopped) return

        scanner = new Html5Qrcode('barcode-scanner-container')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan?.(decodedText)
          },
          () => {} // ignore frame errors
        )
        setLoading(false)
      } catch (e) {
        if (!stopped) {
          setError(t('scanner.camera_error', { msg: e.message }))
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      stopped = true
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [active, onScan])

  return (
    <div className="flex flex-col items-center gap-4">
      {loading && !error && (
        <p className="text-sm text-gray-500 animate-pulse">{t('scanner.starting')}</p>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3 text-center">
          {error}
          <p className="text-xs text-gray-400 mt-1">{t('scanner.permission_hint')}</p>
        </div>
      )}
      <div
        id="barcode-scanner-container"
        ref={containerRef}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
      />
      <p className="text-xs text-gray-400 text-center">
        {t('scanner.aim_hint')}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {t('common.cancel')}
      </button>
    </div>
  )
}
