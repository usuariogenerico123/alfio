import { useEffect, useRef, useState } from 'react'
import { ownerApi } from './api/ownerApi'
import type { OwnerProfile } from './api/types'
import { useOwnerWallet } from './pollar'
import { AlertModal } from './site/components/AlertModal'
import { OwnerAuthScreen } from './site/components/OwnerAuthScreen'
import { OwnerDashboardPage } from './site/pages/OwnerDashboardPage'

export function App() {
  const wallet = useOwnerWallet()
  // Guarda los datos del formulario hasta que Pollar confirme sesión y entregue la billetera G...
  const [pendingProfile, setPendingProfile] = useState<OwnerProfile | null>(null)
  const [isOwnerVerified, setIsOwnerVerified] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const registeringRef = useRef(false)

  useEffect(() => {
    if (!wallet.isAuthenticated) {
      setIsOwnerVerified(false)
      return
    }
    if (wallet.isDemoMode) {
      setIsOwnerVerified(true)
      return
    }
    if (!wallet.walletAddress || isOwnerVerified || registeringRef.current) return

    registeringRef.current = true

    if (pendingProfile) {
      // Registra la tienda en el backend recién cuando Pollar confirma login y devuelve walletAddress (billetera_g)
      void ownerApi
        .registerOwner({ ...pendingProfile, walletAddress: wallet.walletAddress })
        .then(() => setIsOwnerVerified(true))
        .catch(() => {
          wallet.logout()
          setAlertMessage('No se pudo registrar la tienda')
        })
        .finally(() => {
          setPendingProfile(null)
          registeringRef.current = false
        })
      return
    }

    // Verifica en la DB si la billetera G... ya está registrada como tienda
    void ownerApi
      .verifyOwnerRegistered(wallet.walletAddress)
      .then((profile) => {
        if (profile) {
          setIsOwnerVerified(true)
        } else {
          wallet.logout()
          setAlertMessage('Debes registrarte primero')
        }
      })
      .finally(() => {
        registeringRef.current = false
      })
  }, [wallet.isAuthenticated, wallet.isDemoMode, wallet.walletAddress, wallet.logout, pendingProfile, isOwnerVerified])

  const handleRegisterWithPollar = async (profile: OwnerProfile) => {
    // Primero guardamos el formulario y abrimos Pollar para obtener billetera_g tras autenticar
    setPendingProfile(profile)
    wallet.openLogin()
  }

  const handleEnterDemo = async (profile?: OwnerProfile) => {
    if (profile) {
      await ownerApi.registerOwner(profile)
    }
    wallet.enterDemoSession()
  }

  if (!wallet.isAuthenticated || !isOwnerVerified) {
    return (
      <>
        <OwnerAuthScreen
          hasPollarApiKey={wallet.hasPollarApiKey}
          onLoginPollar={wallet.openLogin}
          onRegisterWithPollar={handleRegisterWithPollar}
          onEnterDemo={handleEnterDemo}
        />
        {alertMessage && (
          <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
      </>
    )
  }

  return <OwnerDashboardPage />
}

export default App
