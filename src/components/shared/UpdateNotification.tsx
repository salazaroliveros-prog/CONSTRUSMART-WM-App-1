import React, { useState, useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

const UpdateNotification: React.FC = () => {
  const [show, setShow] = useState(false);
  const updateFnRef = useRef<((opts?: { immediate?: boolean }) => Promise<void>) | null>(null);

  useEffect(() => {
    updateFnRef.current = registerSW({
      onNeedRefresh: () => setShow(true),
      onOfflineReady: () => console.log('PWA lista para uso offline'),
    });
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 glass-card-strong rounded-xl p-4 shadow-2xl animate-fade-in-up">
      <p className="text-sm font-semibold text-white mb-1">¡Nueva versión disponible!</p>
      <p className="text-xs text-white/60 mb-3">Recarga para obtener las últimas mejoras.</p>
      <div className="flex gap-2">
        <button
          onClick={() => setShow(false)}
          className="btn-ghost flex-1 text-xs py-1.5 text-white/50"
        >
          Después
        </button>
        <button
          onClick={() => updateFnRef.current?.({ immediate: true })}
          className="btn-primary flex-1 text-xs py-1.5"
        >
          Recargar ahora
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
