import { useEffect, useRef, useState } from 'react'
import { alfioApi } from './api/alfioApi'
import type { ClientProfile } from './api/types'
import { useAlfioWallet } from './pollar'
import { LoginScreen } from './site/components/LoginScreen'
import { DashboardPage } from './site/pages/DashboardPage'

export function App() {
  const wallet = useAlfioWallet()
  // Guarda los datos del formulario hasta que Pollar confirme sesión y entregue la dirección Stellar
  const [pendingProfile, setPendingProfile] = useState<ClientProfile | null>(null)
  const [isClientVerified, setIsClientVerified] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const registeringRef = useRef(false)

  useEffect(() => {
    if (!wallet.isAuthenticated) {
      setIsClientVerified(false)
      return
    }
    // if (wallet.isDemoMode) {
    //   setIsClientVerified(true)
    //   return
    // }
    if (!wallet.walletAddress || isClientVerified || registeringRef.current) return

    registeringRef.current = true

    if (pendingProfile) {
      // Registra al cliente en el backend recién cuando Pollar confirma login y devuelve walletAddress
      void alfioApi
        .registerClient({ ...pendingProfile, walletAddress: wallet.walletAddress })
        .then(() => setIsClientVerified(true))
        .catch(() => {
          wallet.logout()
          setAlertMessage('No se pudo registrar tu cuenta de cliente. Verifica que tu CI o billetera no estén ya registrados.')
        })
        .finally(() => {
          setPendingProfile(null)
          registeringRef.current = false
        })
      return
    }

    // Verifica en la DB si la billetera ya está registrada como cliente
    void alfioApi
      .verifyClientRegistered(wallet.walletAddress)
      .then((profile) => {
        if (profile) {
          setIsClientVerified(true)
        } else {
          wallet.logout()
          setAlertMessage('Debes registrarte primero en la pestaña "Crear cuenta".')
        }
      })
      .finally(() => {
        registeringRef.current = false
      })
  }, [
    wallet.isAuthenticated,
    wallet.walletAddress,
    wallet.logout,
    pendingProfile,
    isClientVerified,
  ])

  const handleRegisterWithPollar = async (profile: ClientProfile) => {
    setPendingProfile(profile)
    wallet.openLogin()
  }

  // Si ya inició sesión en Pollar pero aún no tiene wallet Stellar creada, permitimos crearla antes de registrar/verificar
  if (wallet.isAuthenticated && !wallet.walletAddress) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4">
        <section className="floating-card w-full max-w-md rounded-2xl p-6 text-center space-y-4">
          <h1 className="text-lg font-bold text-neutral-900">
            Activa tu billetera Stellar
          </h1>
          <p className="text-xs text-neutral-600">
            Tu sesión de Pollar está activa, pero necesitamos crear tu billetera Stellar para completar tu registro.
          </p>
          <button
            type="button"
            disabled={wallet.isCreatingWallet}
            onClick={() => void wallet.createWallet()}
            className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
          >
            {wallet.isCreatingWallet ? 'Creando billetera...' : 'Crear billetera Stellar'}
          </button>
          <button
            type="button"
            onClick={wallet.logout}
            className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 cursor-pointer"
          >
            Cancelar
          </button>
        </section>
      </main>
    )
  }

  if (!wallet.isAuthenticated || !isClientVerified) {
    return (
      <>
        <LoginScreen
          hasPollarApiKey={wallet.hasPollarApiKey}
          onLogin={wallet.openLogin}
          onRegisterWithPollar={handleRegisterWithPollar}
          // onEnterDemo={wallet.enterDemoSession}
        />
        {alertMessage && (
          <div
            role="alertdialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-[2px]"
          >
            <div className="floating-card w-full max-w-sm rounded-2xl p-6 text-center space-y-4">
              <p className="text-sm font-medium text-neutral-900">{alertMessage}</p>
              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                className="w-full rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-neutral-900 transition-colors hover:bg-yellow-300 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return <DashboardPage />
}

export default App
