import React, { useRef, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AppContext';
import LoginScreen from '@/components/screens/LoginScreen';
import Dashboard from '@/components/screens/Dashboard';
import ClientesScreen from '@/features/clientes/components/ClientesScreen';
import ProyectosScreen from '@/features/proyectos/components/ProyectosScreen';
import PresupuestoScreen from '@/features/presupuestos/components/PresupuestoScreen';
import FinancieroScreen from '@/features/financiero/components/FinancieroScreen';
import SeguimientoScreen from '@/components/screens/SeguimientoScreen';
import TeamsScreen from '@/components/screens/TeamsScreen';
import BodegaScreen from '@/components/screens/BodegaScreen';
import CotizacionScreen from '@/components/screens/CotizacionScreen';
import ComprasScreen from '@/features/compras/components/ComprasScreen';
import CommandPalette from '@/components/shared/CommandPalette';
import OfflineBanner from '@/components/shared/OfflineBanner';
import DevDiagnostics from '@/dev/DevDiagnostics';
import { Loader2 } from 'lucide-react';

const viewOrder = ['login', 'dashboard', 'clientes', 'presupuesto', 'proyectos', 'seguimiento', 'financiero', 'equipos', 'bodega', 'cotizacion', 'compras'];

const AppLayout: React.FC = () => {
  const { view, session, loading } = useAuthContext();
  const animKeyRef = useRef(view);
  
  // SOLO cambiar animKey cuando view realmente cambia (NO en cada re-render)
  // Esto evita que la animación CSS de opacidad se re-ejecute en cada render
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

  // Sin sesión → siempre login
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
      default: return <Dashboard />;
    }
  };

  // Determinar clase de animación SOLO cuando cambia la vista
  // El key único basado en animKey.key fuerza que la animación ocurra
  // exactamente una vez por navegación, no en cada re-render
  const animClass = animKey.dir === 'none' ? '' : `animate-${animKey.dir === 'right' ? 'slide-right' : 'slide-left'}`;

  return (
    // Stable root div - la animación solo se activa en cambio REAL de vista
    <div key={animKey.key} className={animClass} data-view={view}>
      <CommandPalette />
      <DevDiagnostics />
      {renderView()}
      <OfflineBanner />
    </div>
  );
};

export default AppLayout;
