import { LogOut } from 'lucide-react'

interface HeaderProps {
  network: string
  isDemoMode: boolean
  onLogout: () => void
}

export function Header({ network, isDemoMode, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-neutral-900 shadow-xs">
            aF
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-neutral-900">
              al<span className="text-yellow-500">Fio</span>
            </span>
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              {isDemoMode ? 'Demo' : network}
            </span>
          </div>
        </div>

        <button
          id="btn-logout"
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Salir</span>
        </button>
      </div>
    </header>
  )
}
