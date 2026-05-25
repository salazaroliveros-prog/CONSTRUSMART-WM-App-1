import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Command } from 'cmdk';
import { useAppContext, ViewType } from '@/contexts/AppContext';
import { Search, Folder, Users, Calculator, LineChart, Wallet, LayoutDashboard, Plus, Shield, DollarSign } from 'lucide-react';

const views = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'presupuesto', label: 'Presupuestos', icon: Calculator },
  { id: 'proyectos', label: 'Proyectos', icon: Folder },
  { id: 'seguimiento', label: 'Seguimiento', icon: LineChart },
  { id: 'financiero', label: 'Control Financiero', icon: Wallet },
  { id: 'equipos', label: 'Equipos', icon: Shield },
];

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { setView, presupuestos, clientes, addPresupuesto } = useAppContext();

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
      setView(value.slice(5) as ViewType);
    } else if (value === 'nuevo:presupuesto') {
      addPresupuesto({ proyecto: 'Nuevo Proyecto' });
      setView('presupuesto');
    } else if (value === 'nuevo:cliente') {
      setView('clientes');
    } else if (value === 'nuevo:transaccion') {
      setView('financiero');
    }
    setOpen(false);
  }, [setView, addPresupuesto]);

  const filteredClientes = useMemo(() =>
    clientes.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase())).slice(0, 5),
  [clientes, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <Command className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden" onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Escape') setOpen(false);
        }} shouldFilter={false}>
          <div className="flex items-center border-b border-slate-200 px-4">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar vistas, proyectos, clientes..."
              className="w-full py-3 px-3 text-sm bg-transparent border-none outline-none placeholder:text-slate-400"
              autoFocus
            />
            <kbd className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-400">
              No se encontraron resultados para "<span className="font-semibold">{search}</span>"
            </Command.Empty>

            {search.length === 0 && (
              <>
                <Command.Group heading="Navegación" className="text-[10px] font-semibold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
                  {views.map(v => (
                    <Command.Item key={v.id} value={`view:${v.id}`} onSelect={handleSelect}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700">
                      <v.icon className="w-4 h-4 text-slate-400" />
                      {v.label}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Acciones rápidas" className="text-[10px] font-semibold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
                  <Command.Item value="nuevo:presupuesto" onSelect={handleSelect}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700">
                    <Plus className="w-4 h-4 text-slate-400" /> Nuevo Presupuesto
                  </Command.Item>
                  <Command.Item value="nuevo:cliente" onSelect={handleSelect}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700">
                    <Users className="w-4 h-4 text-slate-400" /> Nuevo Cliente
                  </Command.Item>
                  <Command.Item value="nuevo:transaccion" onSelect={handleSelect}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700">
                    <DollarSign className="w-4 h-4 text-slate-400" /> Nueva Transacción
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {/* Búsqueda de proyectos */}
            <Command.Group heading="Proyectos" className="text-[10px] font-semibold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
              {presupuestos.filter(p => p.proyecto.toLowerCase().includes(search.toLowerCase())).slice(0, 8).map(p => (
                <Command.Item key={p.id} value={p.proyecto} onSelect={() => { setOpen(false); setView('seguimiento'); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700">
                  <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate flex-1">{p.proyecto}</span>
                  <span className="text-[10px] text-slate-400">Q{(p.total / 1000).toFixed(0)}K</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    p.fase === 'ejecución' ? 'bg-blue-100 text-blue-700' :
                    p.fase === 'planeación' ? 'bg-purple-100 text-purple-700' :
                    p.fase === 'finalizado' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{p.fase}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Búsqueda de clientes */}
            {filteredClientes.length > 0 && (
              <Command.Group heading="Clientes" className="text-[10px] font-semibold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
                {filteredClientes.map(c => (
                  <Command.Item key={c.id} value={c.nombre} onSelect={() => { setOpen(false); setView('clientes'); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{c.nombre}</span>
                    <span className="ml-auto text-[10px] text-slate-400">{c.telefono || '—'}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Sugerencias de montos */}
            {search.match(/^\d+/) && (
              <Command.Group heading="Presupuestos por monto" className="text-[10px] font-semibold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
                {presupuestos.filter(p => p.total >= Number(search)).slice(0, 5).map(p => (
                  <Command.Item key={p.id} value={`$${p.total}`} onSelect={() => { setOpen(false); setView('seguimiento'); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-blue-50">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{p.proyecto}</span>
                    <span className="ml-auto font-mono text-xs">Q{p.total.toLocaleString()}</span>
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
