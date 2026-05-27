import React, { useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
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
import CommandPalette from '@/components/shared/CommandPalette';
import OfflineBanner from '@/components/shared/OfflineBanner';
// import { FloatingMenu } from '@/components/shared/FloatingMenu'; // Eliminado ya que ahora está en Header
import { Loader2 } from 'lucide-react';

const viewOrder = ['login', 'dashboard', 'clientes', 'presupuesto', 'proyectos', 'seguimiento', 'financiero', 'equipos', 'bodega', 'cotizacion'];

const AppLayout: React.FC = () => {
  const { view, session, loading } = useAppContext();
  const prevView = useRef(view);

  const dir = viewOrder.indexOf(prevView.current) <= viewOrder.indexOf(view) ? 'right' : 'left';
  prevView.current = view;

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
      default: return <Dashboard />;
    }
  };

  return (
    <div key={view} className={`animate-${dir === 'right' ? 'slide-right' : 'slide-left'}`}>
      <CommandPalette />
      {/* FloatingMenu eliminado */}
      {renderView()}
      <OfflineBanner />
    </div>
  );
};

export default AppLayout;
