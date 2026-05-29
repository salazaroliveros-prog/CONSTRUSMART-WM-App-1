import React, { useRef, useMemo, Suspense, lazy, useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AppContext';
import { ScreenSkeleton } from '@/components/shared/Skeleton';
import LoginScreen from '@/components/screens/LoginScreen';
import Sidebar from '@/components/shared/Sidebar';
import { Loader2 } from 'lucide-react';

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

const viewOrder = ['login', 'dashboard', 'clientes', 'presupuesto', 'proyectos', 'seguimiento', 'financiero', 'equipos', 'bodega', 'cotizacion', 'compras', 'aprobacion'];

const AppLayout: React.FC = () => {
  const { view, session, loading } = useAuthContext();
  const animKeyRef = useRef(view);

  const animKey = useMemo(() => {
    if (animKeyRef.current !== view) {
      const prev = animKeyRef.current;
      animKeyRef.current = view;
      return { key: view, dir: viewOrder.indexOf(prev) <= viewOrder.indexOf(view) ? 'right' : 'left' };
    }
    return { key: animKeyRef.current, dir: 'none' };
  }, [view]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 mb-3 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
          </div>
          <h2 className="font-bold tracking-wide">CONSTRUCTORA WM/M&S</h2>
          <p className="text-emerald-300 italic text-sm">Edificando el Futuro</p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-emerald-300" />
        </div>
      </div>
    );
  }

  if (!loading && !session) return <LoginScreen />;

  const renderView = () => {
    switch (view) {
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
  };

  // Improved slide animation based on direction
  const getAnimClass = () => {
    if (animKey.dir === 'none') return 'animate-view-enter';
    if (animKey.dir === 'right') return 'animate-view-slide-right';
    return 'animate-view-slide-left';
  };

  const isNotLogin = view !== 'login' && session;

  return (
    <div key={animKey.key} className={getAnimClass()} data-view={view}>
      {isNotLogin && <Sidebar />}
      <CommandPalette />
      <DevDiagnostics />
      <Suspense fallback={<ScreenSkeleton />}>
        {renderView()}
      </Suspense>
      <OfflineBanner />
    </div>
  );
};

export default AppLayout;