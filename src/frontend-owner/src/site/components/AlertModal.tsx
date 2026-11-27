interface AlertModalProps {
  message: string
  onClose: () => void
}

export function AlertModal({ message, onClose }: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-lg">
        <p className="text-sm font-medium text-neutral-900">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-900 transition-colors hover:bg-yellow-300 cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  )
}
