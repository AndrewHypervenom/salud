import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Html5Qrcode } from 'html5-qrcode'

/**
 * BarcodeScanner — wrapper de html5-qrcode para escanear códigos de barras
 * Props: onScan(code), onClose, active
 */
export function BarcodeScanner({ onScan, onClose, active = true, fullscreen = false }) {
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

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex flex-col">
        <div className="flex items-center justify-between px-5 pt-10 pb-3">
          <p className="text-white font-semibold text-sm">Escanea el código de barras</p>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">✕</button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full">
            {loading && !error && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 animate-pulse z-10 pointer-events-none">
                {t('scanner.starting')}
              </p>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                <div className="text-sm text-red-400 bg-red-950/30 rounded-xl px-4 py-3 text-center">
                  {error}
                  <p className="text-xs text-gray-500 mt-1">{t('scanner.permission_hint')}</p>
                </div>
              </div>
            )}
            <div className="absolute -top-4 -left-4 w-10 h-10 border-t-2 border-l-2 border-white rounded-tl-lg pointer-events-none z-20" />
            <div className="absolute -top-4 -right-4 w-10 h-10 border-t-2 border-r-2 border-white rounded-tr-lg pointer-events-none z-20" />
            <div className="absolute -bottom-4 -left-4 w-10 h-10 border-b-2 border-l-2 border-white rounded-bl-lg pointer-events-none z-20" />
            <div className="absolute -bottom-4 -right-4 w-10 h-10 border-b-2 border-r-2 border-white rounded-br-lg pointer-events-none z-20" />
            <div
              id="barcode-scanner-container"
              ref={containerRef}
              className="w-full rounded-2xl overflow-hidden"
            />
          </div>
        </div>
        <div className="flex items-center justify-center px-5 pb-10">
          <button type="button" onClick={onClose}
            className="text-gray-400 text-sm">
            ¿Sin código? Buscar por nombre
          </button>
        </div>
      </div>
    )
  }

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
