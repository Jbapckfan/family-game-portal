import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

if (window.__ALFORD_NATIVE__?.platform === 'ios') { document.documentElement.dataset.native = 'true'; document.documentElement.classList.add('native-app') }
createRoot(document.getElementById('root')!).render(<App />)
