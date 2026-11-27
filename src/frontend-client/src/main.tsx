import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PollarWrapper } from './pollar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PollarWrapper>
      <App />
    </PollarWrapper>
  </StrictMode>,
)
