import { ArrowRight, ShieldCheck, UserPlus, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { ClientProfile } from '../../api/types'

interface LoginScreenProps {
  hasPollarApiKey: boolean
  onLogin: () => void
  onRegisterWithPollar: (profile: ClientProfile) => Promise<void>
  // onEnterDemo: () => void
}

export function LoginScreen({
  hasPollarApiKey,
  onLogin,
  onRegisterWithPollar,
  // onEnterDemo,
}: LoginScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [nombre, setNombre] = useState('')
  const [ci, setCi] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombre.trim() || !ci.trim() || !telefono.trim()) {
      setError('Completa tu nombre completo, CI y número de teléfono.')
      return
    }
    await onRegisterWithPollar({
      nombre: nombre.trim(),
      ci: ci.trim(),
      telefono: telefono.trim(),
    })
  }

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
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-neutral-100 p-1">
            <button
              id="tab-client-login"
              type="button"
              onClick={() => {
                setTab('login')
                setError(null)
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              id="tab-client-register"
              type="button"
              onClick={() => {
                setTab('register')
                setError(null)
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {tab === 'login' ? (
            <div>
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
            </div>
          ) : (
            <form onSubmit={(e) => void handleRegisterSubmit(e)} className="space-y-3.5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  Crea tu cuenta de cliente
                </h1>
                <p className="mt-1 text-xs text-neutral-500">
                  Completa tus datos y vincula tu billetera Stellar con Pollar.
                </p>
              </div>

              <div>
                <label htmlFor="reg-client-nombre" className="block text-xs font-medium text-neutral-700">
                  Nombre completo
                </label>
                <input
                  id="reg-client-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. María López"
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-client-ci" className="block text-xs font-medium text-neutral-700">
                  CI / Documento de identidad
                </label>
                <input
                  id="reg-client-ci"
                  type="text"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="Ej. 12345678"
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-client-telefono" className="block text-xs font-medium text-neutral-700">
                  Teléfono
                </label>
                <input
                  id="reg-client-telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. +591 70000000"
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                id="btn-pollar-signup"
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Registrar con Pollar</span>
              </button>
            </form>
          )}

          {/* Modo demo desactivado temporalmente
          <div className="mt-6 border-t border-neutral-100 pt-5">
            <button
              id="btn-demo-mode"
              type="button"
              onClick={onEnterDemo}
              className="w-full rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-yellow-500 hover:bg-yellow-50/50 hover:text-neutral-900 cursor-pointer"
            >
              Entrar en modo vista previa (prueba)
            </button>
          </div>
          */}

          {!hasPollarApiKey && (
            <p className="mt-4 text-center text-xs text-neutral-500">
              Configura <code className="font-mono text-neutral-700">POLLAR_KEY</code> en{' '}
              <code className="font-mono text-neutral-700">.env</code> para usar Pollar Testnet en vivo.
            </p>
          )}
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
