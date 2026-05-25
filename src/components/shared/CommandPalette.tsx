import React, { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useAppContext } from '@/contexts/AppContext';
import { Search, Folder, Users, Calculator, LineChart, Wallet, LayoutDashboard, Plus } from 'lucide-react';

const views: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'presupuesto', label: 'Presupuestos', icon: Calculator },
  { id: 'proyectos', label: 'Proyectos', icon: Folder },
  { id: 'seguimiento', label: 'Seguimiento', icon: LineChart },
  { id: 'financiero', label: 'Control Financiero', icon: Wallet },
];

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { setView, presupuestos, addPresupuesto } = useAppContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    const toggleHandler = () => setOpen(o => !o);
    document.addEventListener('keydown', handler);
    document.addEventListener('toggle:commandpalette', toggleHandler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('toggle:commandpalette', toggleHandler);
    };
  }, []);

  const handleSelect = useCallback((value: string) => {
    if (value.startsWith('view:')) {
      setView(value.slice(5));
    } else if (value === 'nuevo:presupuesto') {
      addPresupuesto({});
      setView('presupuesto');
    }
    setOpen(false);
  }, [setView, addPresupuesto]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <Command className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden" onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Escape') setOpen(false);
        }}>
          <div className="flex items-center border-b border-slate-200 px-4">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Command.Input
              placeholder="Buscar vistas, proyectos..."
              className="w-full py-3 px-3 text-sm bg-transparent border-none outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <Command.List className="max-h-64 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-400">
              No se encontraron resultados
            </Command.Empty>

            <Command.Group heading="Navegación" className="text-xs font-semibold text-slate-500 px-2 py-1.5">
              {views.map(v => (
                <Command.Item
                  key={v.id}
                  value={`view:${v.id}`}
                  onSelect={handleSelect}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700"
                >
                  <v.icon className="w-4 h-4 text-slate-400" />
                  {v.label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Acciones" className="text-xs font-semibold text-slate-500 px-2 py-1.5">
              <Command.Item
                value="nuevo:presupuesto"
                onSelect={handleSelect}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700"
              >
                <Plus className="w-4 h-4 text-slate-400" />
                Nuevo Presupuesto
              </Command.Item>
            </Command.Group>

            {presupuestos.length > 0 && (
              <Command.Group heading="Ir a proyecto" className="text-xs font-semibold text-slate-500 px-2 py-1.5">
                {presupuestos.slice(0, 10).map(p => (
                  <Command.Item
                    key={p.id}
                    value={p.proyecto}
                    onSelect={() => { setOpen(false); setView('seguimiento'); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700"
                  >
                    <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{p.proyecto}</span>
                    <span className="ml-auto text-xs text-slate-400">{p.fase}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
