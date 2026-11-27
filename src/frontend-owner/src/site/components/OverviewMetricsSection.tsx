import { AlertTriangle, CalendarClock, TrendingUp } from 'lucide-react'
import type { OwnerMetrics } from '../../api/types'
import { formatUsdc } from '../utils/formatters'

interface OverviewMetricsSectionProps {
  metrics: OwnerMetrics
}

export function OverviewMetricsSection({ metrics }: OverviewMetricsSectionProps) {
  return (
    <section aria-labelledby="overview-metrics-heading">
      <h1 id="overview-metrics-heading" className="sr-only">
        Resumen diario de la tienda
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="floating-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Ventas de hoy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-neutral-900">
            {formatUsdc(metrics.salesTodayUsdc)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {metrics.salesTodayCount}{' '}
            {metrics.salesTodayCount === 1 ? 'venta confirmada' : 'ventas confirmadas'}
          </p>
        </article>

        <article className="floating-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Por cobrar hoy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-neutral-900">
            {formatUsdc(metrics.receivableTodayUsdc)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {metrics.receivableTodayCount}{' '}
            {metrics.receivableTodayCount === 1 ? 'cuota vence hoy' : 'cuotas vencen hoy'}
          </p>
        </article>

        <article className="floating-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Atrasados
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-neutral-900">
            {formatUsdc(metrics.overdueAmountUsdc)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {metrics.overdueCount}{' '}
            {metrics.overdueCount === 1 ? 'cliente con atraso' : 'clientes con atraso'}
          </p>
        </article>
      </div>
    </section>
  )
}
