import { ArrowRight, ShieldCheck, Wallet } from 'lucide-react'

interface LoginScreenProps {
  hasPollarApiKey: boolean
  onLogin: () => void
  onEnterDemo: () => void
}

export function LoginScreen({
  hasPollarApiKey,
  onLogin,
  onEnterDemo,
}: LoginScreenProps) {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-[#f6f7f9] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-neutral-900 shadow-xs">
            aF
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            al<span className="text-yellow-500">Fio</span>
          </span>
        </div>
      </div>

      <section className="mx-auto my-auto w-full max-w-md py-10">
        <div className="floating-card rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Compra ahora, paga en{' '}
              <span className="underline decoration-yellow-400 decoration-4 underline-offset-4">
                4 cuotas
              </span>
              .
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Escanea el QR del producto en tienda, abona el 50% inicial en USDC
              y divide el resto en 4 cuotas cada 15 días sobre Stellar.
            </p>
          </div>

          <div className="space-y-3">
            <button
              id="btn-pollar-login"
              type="button"
              onClick={onLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 cursor-pointer"
            >
              <Wallet className="h-4 w-4" />
              <span>Iniciar sesión con Pollar</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              id="btn-pollar-signup"
              type="button"
              onClick={onLogin}
              className="flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer"
            >
              Crear cuenta nueva
            </button>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-5">
            <button
              id="btn-demo-mode"
              type="button"
              onClick={onEnterDemo}
              className="w-full rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-yellow-500 hover:bg-yellow-50/50 hover:text-neutral-900 cursor-pointer"
            >
              Entrar en modo vista previa (prueba)
            </button>

            {!hasPollarApiKey && (
              <p className="mt-3 text-center text-xs text-neutral-500">
                Configura <code className="font-mono text-neutral-700">POLLLAR_KEY</code> en{' '}
                <code className="font-mono text-neutral-700">.env</code> para usar Pollar Testnet en vivo.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="h-4 w-4 text-yellow-500" />
          <span>Wallet embebida sin frases semilla · Red Stellar Testnet</span>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-md text-center text-xs text-neutral-400">
        alFio · Plataforma de crédito en cuotas
      </footer>
    </main>
  )
}
