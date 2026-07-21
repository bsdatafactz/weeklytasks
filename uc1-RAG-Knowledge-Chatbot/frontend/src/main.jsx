import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { applyTheme, getStoredTheme } from './lib/theme.js'

// Applied before the first paint so there's no flash of the wrong theme.
applyTheme(getStoredTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/weeklytasks">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
