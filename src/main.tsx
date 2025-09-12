import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { debugDataViewing } from './utils/debugDataViewing'
import { API_CONFIG } from './services/config'

// Global debug tools for development
if (import.meta.env.DEV) {
  // Make debug functions globally available in console
  (window as any).debugDataViewing = debugDataViewing
  ;(window as any).API_CONFIG = API_CONFIG
  
  console.log('🔧 Development mode: Debug tools available')
  console.log('🔍 Run debugDataViewing() in console to test data viewing')
  console.log('⚙️ API Config:', API_CONFIG)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
