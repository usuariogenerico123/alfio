import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

interface QrScannerProps {
  active: boolean
  onScanSuccess: (decodedText: string) => void
}

export function QrScanner({ active, onScanSuccess }: QrScannerProps) {
  const elementId = `qr-reader-${useId().replace(/:/g, '')}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScanSuccess)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    onScanRef.current = onScanSuccess
  }, [onScanSuccess])

  useEffect(() => {
    if (!active) return

    let cancelled = false
    setCameraError(null)
    setIsStarting(true)

    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (cancelled) return
          cancelled = true
          void scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              onScanRef.current(decodedText)
            })
        },
        () => {
          // Frames sin QR detectado: ignorar silenciosamente
        },
      )
      .then(() => {
        if (!cancelled) setIsStarting(false)
      })
      .catch(() => {
        if (!cancelled) {
          setIsStarting(false)
          setCameraError(
            'No se pudo acceder a la cámara. Permite el permiso o ingresa el código manualmente.',
          )
        }
      })

    return () => {
      cancelled = true
      if (scanner.isScanning) {
        void scanner.stop().catch(() => {})
      }
      scannerRef.current = null
    }
  }, [active, elementId])

  if (!active) return null

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      {cameraError ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CameraOff className="h-6 w-6 text-neutral-400" />
          <p className="mt-2 max-w-xs text-xs text-neutral-600">{cameraError}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            id={elementId}
            className="mx-auto min-h-[220px] w-full overflow-hidden rounded-lg bg-neutral-100"
          />
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
            <Camera className="h-3.5 w-3.5 text-yellow-500" />
            <span>
              {isStarting
                ? 'Iniciando cámara...'
                : 'Apunta la cámara al código QR del producto'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
