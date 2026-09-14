import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// DevTools Protection & Anti-Source Code Inspection Guard
if (import.meta.env.PROD) {
  // Prevent context menu (Right Click -> Inspect)
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Prevent keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
      (e.ctrlKey && ['U', 'u'].includes(e.key))
    ) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
