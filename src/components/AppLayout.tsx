import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import LoginScreen from '@/components/screens/LoginScreen';
import Dashboard from '@/components/screens/Dashboard';
import ClientesScreen from '@/components/screens/ClientesScreen';
import PresupuestoScreen from '@/components/screens/PresupuestoScreen';
import ProyectosScreen from '@/components/screens/ProyectosScreen';
import SeguimientoScreen from '@/components/screens/SeguimientoScreen';
import FinancieroScreen from '@/components/screens/FinancieroScreen';
import CommandPalette from '@/components/shared/CommandPalette';
import { Building2, Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { view, session, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-3">
            <Building2 className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="font-bold tracking-wide">CONSTRUCTORA WM/M&S</h2>
          <p className="text-emerald-300 italic text-sm">Edificando el Futuro</p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-emerald-300" />
        </div>
      </div>
    );
  }

  // Sin sesión → siempre login
  if (!session) return <LoginScreen />;

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'clientes': return <ClientesScreen />;
      case 'presupuesto': return <PresupuestoScreen />;
      case 'proyectos': return <ProyectosScreen />;
      case 'seguimiento': return <SeguimientoScreen />;
      case 'financiero': return <FinancieroScreen />;
      default: return <Dashboard />;
    }
  };

  return (
    <div key={view} className="transition-all duration-300">
      <CommandPalette />
      {renderView()}
    </div>
  );
};

export default AppLayout;
