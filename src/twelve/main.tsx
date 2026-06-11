import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import TwelveApp from './TwelveApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TwelveApp />
  </StrictMode>,
)
