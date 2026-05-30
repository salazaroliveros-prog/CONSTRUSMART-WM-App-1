import React, { useRef, useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AppContext';
import { ScreenSkeleton } from '@/components/shared/Skeleton';
import LoginScreen from '@/components/screens/LoginScreen';
import Sidebar from '@/components/shared/Sidebar';
import Loader3D from '@/components/shared/Loader3D';

// Lazy loading para reducir bundle inicial
const Dashboard = lazy(() => import('@/components/screens/Dashboard'));
const ClientesScreen = lazy(() => import('@/features/clientes/components/ClientesScreen'));
const ProyectosScreen = lazy(() => import('@/features/proyectos/components/ProyectosScreen'));
const PresupuestoScreen = lazy(() => import('@/features/presupuestos/components/PresupuestoScreen'));
const FinancieroScreen = lazy(() => import('@/features/financiero/components/FinancieroScreen'));
const SeguimientoScreen = lazy(() => import('@/components/screens/SeguimientoScreen'));
const TeamsScreen = lazy(() => import('@/components/screens/TeamsScreen'));
const BodegaScreen = lazy(() => import('@/components/screens/BodegaScreen'));
const CotizacionScreen = lazy(() => import('@/components/screens/CotizacionScreen'));
const ComprasScreen = lazy(() => import('@/features/compras/components/ComprasScreen'));
const AprobacionScreen = lazy(() => import('@/components/screens/AprobacionScreen'));

import CommandPalette from '@/components/shared/CommandPalette';
import OfflineBanner from '@/components/shared/OfflineBanner';
import DevDiagnostics from '@/dev/DevDiagnostics';

const AppLayout: React.FC = () => {
  const { view, session, loading } = useAuthContext();
  const [fadeState, setFadeState] = useState<'visible' | 'fading'>('visible');
  const [prevView, setPrevView] = useState(view);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smoothly fade between views
  useEffect(() => {
    if (prevView === view) return;
    
    // Clear any pending transition
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    // Step 1: Fade out current view
    setFadeState('fading');
    
    // Step 2: After fade out completes, update the view and fade in
    transitionTimerRef.current = setTimeout(() => {
      setPrevView(view);
      setFadeState('visible');
    }, 150); // match CSS transition duration

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [view, prevView]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const renderViewContent = useCallback((v: string) => {
    switch (v) {
      case 'dashboard': return <Dashboard />;
      case 'clientes': return <ClientesScreen />;
      case 'presupuesto': return <PresupuestoScreen />;
      case 'proyectos': return <ProyectosScreen />;
      case 'seguimiento': return <SeguimientoScreen />;
      case 'financiero': return <FinancieroScreen />;
      case 'equipos': return <TeamsScreen />;
      case 'bodega': return <BodegaScreen />;
      case 'cotizacion': return <CotizacionScreen />;
      case 'compras': return <ComprasScreen />;
      case 'aprobacion': return <AprobacionScreen />;
      default: return null;
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 mb-3 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
          </div>
          <h2 className="font-bold tracking-wide">CONSTRUCTORA WM/M&S</h2>
          <p className="text-emerald-300 italic text-sm">Edificando el Futuro</p>
          <Loader3D size={60} className="mt-4" text="Cargando..." />
        </div>
      </div>
    );
  }

  if (!loading && !session) return <LoginScreen />;

  const isNotLogin = view !== 'login' && session;

  return (
    <div className="flex h-screen overflow-hidden bg-background" data-view={view}>
      {isNotLogin && <Sidebar />}
      <div className="flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto">
        <CommandPalette />
        <DevDiagnostics />
        <div className={`w-full ${fadeState === 'fading' ? 'main-content-fade' : 'main-content'}`} style={{ transitionDuration: '0.15s' }}>
          <Suspense fallback={<ScreenSkeleton />}>
            {renderViewContent(prevView)}
          </Suspense>
        </div>
        <OfflineBanner />
      </div>
    </div>
  );
};

export default AppLayout;