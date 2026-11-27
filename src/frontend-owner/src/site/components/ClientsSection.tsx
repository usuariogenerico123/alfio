import { Users } from 'lucide-react'
import type { StoreClient } from '../../api/types'
import { formatShortDate, formatUsdc, truncateAddress } from '../utils/formatters'

interface ClientsSectionProps {
  clients: StoreClient[]
}

const STATUS_BADGE: Record<StoreClient['status'], { label: string; classes: string }> = {
  on_time: { label: 'Al día', classes: 'bg-yellow-100 text-yellow-800' },
  overdue: { label: 'Atrasado', classes: 'bg-red-100 text-red-700' },
  completed: { label: 'Sin deuda', classes: 'bg-neutral-200/80 text-neutral-700' },
}

export function ClientsSection({ clients }: ClientsSectionProps) {
  return (
    <section
      aria-labelledby="clients-section-heading"
      className="floating-card rounded-2xl p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2
            id="clients-section-heading"
            className="text-base font-semibold text-neutral-900"
          >
            Sus clientes
          </h2>
          <p className="text-xs text-neutral-500">
            Compradores activos, saldo pendiente y próximo vencimiento
          </p>
        </div>
        <span className="font-mono text-xs text-neutral-500">
          {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
        </span>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-8 text-center">
          <Users className="h-6 w-6 text-neutral-400" />
          <p className="mt-2 text-sm font-medium text-neutral-700">
            Aún no hay clientes registrados
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {clients.map((client) => {
            const badge = STATUS_BADGE[client.status]
            return (
              <li
                key={client.id}
                className="flex flex-col gap-2.5 py-3.5 first:pt-1 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {client.name}
                    </p>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-neutral-500">
                    {truncateAddress(client.walletAddress, 8, 6)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:text-right">
                  <div>
                    <p className="font-mono text-sm font-semibold text-neutral-900">
                      {formatUsdc(client.pendingBalanceUsdc)}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {client.nextDueDate
                        ? `Próx. cuota: ${formatShortDate(client.nextDueDate)}`
                        : 'Créditos cerrados'}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
