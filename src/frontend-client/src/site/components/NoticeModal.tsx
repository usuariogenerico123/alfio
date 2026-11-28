import { X } from 'lucide-react'

interface NoticeModalProps {
  open: boolean
  message: string
  bgColor?: string
  title?: string
  buttonText?: string
  onClose: () => void
}

/**
 * Ventana pequeña reutilizable que muestra un mensaje con color de fondo configurable.
 * `bgColor` acepta un color CSS (ej. "#fef2f2", "rgb(...)") o clases de Tailwind (ej. "bg-red-50").
 */
export function NoticeModal({
  open,
  message,
  bgColor = '#ffffff',
  title,
  buttonText = 'Entendido',
  onClose,
}: NoticeModalProps) {
  if (!open) return null

  const isCssColor =
    bgColor.startsWith('#') ||
    bgColor.startsWith('rgb') ||
    bgColor.startsWith('hsl')

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-[2px]"
    >
      <div
        style={isCssColor ? { backgroundColor: bgColor } : undefined}
        className={`relative w-full max-w-sm rounded-2xl border border-neutral-200 p-6 text-center shadow-lg space-y-4 ${
          isCssColor ? '' : bgColor
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 rounded-lg p-1 text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-700 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {title && (
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        )}

        <p className="text-sm font-medium text-neutral-900">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-neutral-900 transition-colors hover:bg-yellow-300 cursor-pointer"
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}
