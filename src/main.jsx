import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CharactersProvider } from './contexts/CharactersContext.jsx'
import { OptionsProvider } from './contexts/OptionsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CharactersProvider>
        <OptionsProvider>
          <App />
        </OptionsProvider>
      </CharactersProvider>
    </AuthProvider>
  </StrictMode>,
)
