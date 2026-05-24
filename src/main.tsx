
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register VitePWA service worker (must be called before createRoot)
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    if (confirm("Nueva versión disponible. ¿Recargar?")) {
      registerSW({ immediate: true });
    }
  },
  onOfflineReady() {
    console.log("App lista para funcionar offline");
  },
});

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
