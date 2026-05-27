import React, { useState } from 'react';
import { LayoutGrid, Users, Calculator, Folder, LineChart, Wallet, Shield, ShoppingCart, X, Menu } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ViewType } from '@/types/supabase';

export const FloatingMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setView } = useAppContext();

  const modules = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutGrid },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'presupuesto', label: 'Presupuestos', icon: Calculator },
    { id: 'proyectos', label: 'Proyectos', icon: Folder },
    { id: 'seguimiento', label: 'Seguimiento', icon: LineChart },
    { id: 'financiero', label: 'Financiero', icon: Wallet },
    { id: 'equipos', label: 'Equipos', icon: Shield },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-48 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-slate-200 p-2 animate-in slide-in-from-bottom-4 duration-300">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => { setView(m.id as ViewType); setIsOpen(false); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg text-slate-700 hover:text-blue-900 transition text-sm font-medium"
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
