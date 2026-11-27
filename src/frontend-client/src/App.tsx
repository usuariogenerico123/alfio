import { useAlfioWallet } from './pollar'
import { LoginScreen } from './site/components/LoginScreen'
import { DashboardPage } from './site/pages/DashboardPage'

export function App() {
  const { isAuthenticated, hasPollarApiKey, openLogin, enterDemoSession } =
    useAlfioWallet()

  if (!isAuthenticated) {
    return (
      <LoginScreen
        hasPollarApiKey={hasPollarApiKey}
        onLogin={openLogin}
        onEnterDemo={enterDemoSession}
      />
    )
  }

  return <DashboardPage />
}

export default App
