import { ArrowRight, ShieldCheck, Store, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { OwnerProfile } from '../../api/types'

interface OwnerAuthScreenProps {
  hasPollarApiKey: boolean
  onLoginPollar: () => void
  onRegisterWithPollar: (profile: OwnerProfile) => Promise<void>
  onEnterDemo: (profile?: OwnerProfile) => Promise<void>
}

export function OwnerAuthScreen({
  hasPollarApiKey,
  onLoginPollar,
  onRegisterWithPollar,
  onEnterDemo,
}: OwnerAuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!storeName.trim() || !ownerName.trim() || !email.trim()) {
      setError('Completa el nombre de la tienda, dueño y correo electrónico.')
      return
    }
    await onRegisterWithPollar({
      storeName: storeName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
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
            al<span className="text-yellow-500">Fio</span>{' '}
            <span className="text-sm font-medium text-neutral-500">Tienda</span>
          </span>
        </div>
      </div>

      <section className="mx-auto my-auto w-full max-w-md py-8">
        <div className="floating-card rounded-2xl p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-neutral-100 p-1">
            <button
              id="tab-owner-login"
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
              id="tab-owner-register"
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
              Registrar tienda
            </button>
          </div>

          {tab === 'login' ? (
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Panel para <span className="underline decoration-yellow-400 decoration-4 underline-offset-4">tiendas</span>
              </h1>
              <p className="mt-2.5 text-sm text-neutral-600">
                Administra tus productos, genera códigos QR y recibe pagos a crédito al instante en Stellar.
              </p>

              <button
                id="btn-owner-pollar-login"
                type="button"
                onClick={onLoginPollar}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                <span>Ingresar con Pollar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleRegisterSubmit(e)} className="space-y-3.5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  Crea tu cuenta de tienda
                </h1>
                <p className="mt-1 text-xs text-neutral-500">
                  Completa tus datos y vincula tu wallet con Pollar.
                </p>
              </div>

              <div>
                <label htmlFor="reg-store-name" className="block text-xs font-medium text-neutral-700">
                  Nombre de la tienda
                </label>
                <input
                  id="reg-store-name"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej. Tienda Paso Firme"
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-owner-name" className="block text-xs font-medium text-neutral-700">
                  Nombre del dueño
                </label>
                <input
                  id="reg-owner-name"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-owner-email" className="block text-xs font-medium text-neutral-700">
                  Email
                </label>
                <input
                  id="reg-owner-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dueno@tutienda.com"
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                id="btn-owner-pollar-register"
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 cursor-pointer"
              >
                <Store className="h-4 w-4" />
                <span>Registrar con Pollar</span>
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-neutral-100 pt-5">
            <button
              id="btn-owner-demo-mode"
              type="button"
              onClick={() =>
                void onEnterDemo(
                  storeName.trim() || ownerName.trim() || email.trim()
                    ? {
                        storeName: storeName.trim() || 'Tienda Paso Firme',
                        ownerName: ownerName.trim() || 'Dueño Demo',
                        email: email.trim() || 'tienda@alfio.app',
                      }
                    : undefined,
                )
              }
              className="w-full rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-yellow-500 hover:bg-yellow-50/50 hover:text-neutral-900 cursor-pointer"
            >
              Entrar en modo vista previa (sin API key)
            </button>

            {!hasPollarApiKey && (
              <p className="mt-3 text-center text-xs text-neutral-500">
                Configura <code className="font-mono text-neutral-700">POLLLAR_KEY</code> en{' '}
                <code className="font-mono text-neutral-700">.env</code> para usar Pollar en vivo.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="h-4 w-4 text-yellow-500" />
          <span>Autenticación y billetera gestionadas con Pollar · Stellar</span>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-md text-center text-xs text-neutral-400">
        alFio Tienda · Gestión de ventas a crédito
      </footer>
    </main>
  )
}
