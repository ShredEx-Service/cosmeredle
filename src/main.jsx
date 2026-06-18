import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CharactersProvider } from './contexts/CharactersContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CharactersProvider>
        <App />
      </CharactersProvider>
    </AuthProvider>
  </StrictMode>,
)
