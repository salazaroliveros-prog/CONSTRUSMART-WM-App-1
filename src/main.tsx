
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Register VitePWA service worker (must be called before createRoot)
import { registerSW } from 'virtual:pwa-register';
import { PushService } from '@/services/PushService';
import UpdateNotification from '@/components/shared/UpdateNotification'; // Import the new component

const updateSW = registerSW({
  onNeedRefresh() {
    // Show custom update notification component instead of confirm()
    const eventDate = Date.now();
    const interval = setInterval(() => {
       // Check if the custom notification component is visible, if not, show it
       // For simplicity here, assume it's handled by a global state or context
       // In a real app, you'd manage visibility of UpdateNotification.tsx
       console.log('Checking for update notification visibility...');
       // If UpdateNotification is not visible, make it visible
       // Example: dispatch an action to show the update notification modal
       // For now, we'll simulate showing it by logging
       
       // Ideally, UpdateNotification.tsx would listen to a context or global state
       // and show itself when onNeedRefresh is triggered.
       // For this example, we'll assume it's handled externally.
       
       // Dismiss check after a timeout or once visible
       if (Date.now() - eventDate > 5000) { // Give it 5 seconds to show
         clearInterval(interval);
       }
    }, 1000);
  },
  onOfflineReady() {
    // App is ready for offline mode
    console.log('App is ready for offline mode');
  },
});

// Request push notification permission and subscribe only when VAPID key is configured
if (import.meta.env.VITE_PUBLIC_VAPID_KEY) {
  PushService.requestPermissionAndSubscribe().catch(err => console.error("Failed to subscribe to push notifications:", err));
} else {
  console.info('VAPID key not configured, skipping push subscription');
}

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
