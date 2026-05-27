import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { WifiOff, CloudUpload, RefreshCw } from 'lucide-react';

const OfflineBannerComponent: React.FC = () => {
  const { isOnline, pendingCount } = useAppContext();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        {!isOnline ? (
          <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl shadow-lg border border-amber-400 text-xs font-semibold animate-slide-in">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="flex-1">
              Sin conexión{pendingCount > 0 ? ` — ${pendingCount} cambio${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''}` : ''}
            </span>
            {pendingCount > 0 && <CloudUpload className="w-4 h-4 animate-pulse" />}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400 text-xs font-semibold animate-slide-in">
            <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            <span className="flex-1">Sincronizando {pendingCount} cambio{pendingCount > 1 ? 's' : ''}...</span>
          </div>
        )}
      </div>
    </div>
  );
};

const OfflineBanner = React.memo(OfflineBannerComponent);
export default OfflineBanner;
