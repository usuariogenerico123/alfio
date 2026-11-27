import { LayoutDashboard, Package, PlusCircle, Radio, Store, User, Users } from 'lucide-react'
import type { SseConnectionState } from '../../api/sse/orderEvents'

export type OwnerNavSection = 'overview' | 'products' | 'add_product' | 'clients' | 'profile'

interface HeaderProps {
  storeName: string
  sseStatus: SseConnectionState
  activeSection: OwnerNavSection
  onSelectSection: (section: OwnerNavSection) => void
}

const SSE_LABELS: Record<SseConnectionState, { text: string; tone: string }> = {
  connected: { text: 'SSE en vivo', tone: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  connecting: { text: 'Conectando...', tone: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  mock: { text: 'SSE prueba', tone: 'bg-neutral-50 text-neutral-600 border-neutral-200' },
  error: { text: 'Sin SSE', tone: 'bg-red-50 text-red-700 border-red-200' },
}

const NAV_ITEMS: { id: OwnerNavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Inicio', icon: LayoutDashboard },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'add_product', label: 'Añadir', icon: PlusCircle },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'profile', label: 'Perfil', icon: User },
]

export function Header({
  storeName,
  sseStatus,
  activeSection,
  onSelectSection,
}: HeaderProps) {
  const badge = SSE_LABELS[sseStatus]

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-neutral-900 shadow-xs">
              aF
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-neutral-900">
                al<span className="text-yellow-500">Fio</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600">
                <Store className="h-3 w-3 text-yellow-600" />
                {storeName}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${badge.tone}`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{badge.text}</span>
          </span>
        </div>

        <nav
          aria-label="Secciones de la tienda"
          className="-mb-px flex items-center gap-1 overflow-x-auto pb-2"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                id={`nav-owner-${item.id}`}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-yellow-400 text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
