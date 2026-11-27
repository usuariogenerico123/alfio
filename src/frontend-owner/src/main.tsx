import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PollarOwnerWrapper } from './pollar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PollarOwnerWrapper>
      <App />
    </PollarOwnerWrapper>
  </StrictMode>,
)
