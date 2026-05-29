import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Users, Calculator, Folder, LineChart, Wallet, Shield, Package, FileText, ShoppingCart, ShieldCheck, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ViewType } from '@/types/supabase';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'sidebar_state';
const SIDEBAR_WIDTH_COLLAPSED = 60;
const SIDEBAR_WIDTH_EXPANDED = 200;

const modules = [
  { id: 'dashboard' as ViewType, label: 'Inicio', icon: LayoutGrid },
  { id: 'clientes' as ViewType, label: 'Clientes', icon: Users },
  { id: 'presupuesto' as ViewType, label: 'Presupuestos', icon: Calculator },
  { id: 'proyectos' as ViewType, label: 'Proyectos', icon: Folder },
  { id: 'bodega' as ViewType, label: 'Bodega', icon: Package },
  { id: 'seguimiento' as ViewType, label: 'Seguimiento', icon: LineChart },
  { id: 'financiero' as ViewType, label: 'Financiero', icon: Wallet },
  { id: 'equipos' as ViewType, label: 'Equipos', icon: Shield },
  { id: 'cotizacion' as ViewType, label: 'Cotización', icon: FileText },
  { id: 'compras' as ViewType, label: 'Compras', icon: ShoppingCart },
  { id: 'aprobacion' as ViewType, label: 'Aprobación', icon: ShieldCheck },
];

const loadSavedState = (): { position: Position; collapsed: boolean; side: 'left' | 'right'; vertical: 'top' | 'middle' | 'bottom' } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { position: { x: 0, y: 0 }, collapsed: false, side: 'left', vertical: 'middle' };
};

const Sidebar: React.FC = () => {
  const { view, setView, signOut } = useAppContext();
  const [state, setState] = useState(loadSavedState);
  const [dragging, setDragging] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dragStart = useRef<{ x: number; y: number; startX: number; startY: number }>({ x: 0, y: 0, startX: 0, startY: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Desktop dragging handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: state.position.x,
      startY: state.position.y,
    };
  }, [isMobile, state.position]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setState(prev => ({
        ...prev,
        position: {
          x: Math.max(-300, Math.min(300, dragStart.current.startX + dx)),
          y: Math.max(-200, Math.min(200, dragStart.current.startY + dy)),
        },
        side: dragStart.current.startX + dx > 50 ? 'right' : dragStart.current.startX + dx < -50 ? 'left' : prev.side,
        vertical: dragStart.current.startY + dy < -80 ? 'top' : dragStart.current.startY + dy > 80 ? 'bottom' : 'middle',
      }));
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  // Touch support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      startX: 0,
      startY: 0,
    };
  }, [isMobile]);

  const getSidebarClasses = () => {
    const base = 'fixed z-50 flex flex-col select-none transition-all duration-300 ease-out';

    // Position vertical
    let verticalPos = 'top-1/2 -translate-y-1/2';
    if (state.vertical === 'top') verticalPos = 'top-4';
    if (state.vertical === 'bottom') verticalPos = 'bottom-24';

    // Position horizontal + translate
    const side = state.side === 'left' ? 'left-0' : 'right-0';
    const translateX = state.side === 'left' ? state.position.x : -state.position.x;

    const width = state.collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

    return `${base} ${verticalPos} ${side} rounded-r-2xl`;
  };

  const sidebarStyle: React.CSSProperties = isMobile ? {} : {
    transform: `translate(${state.side === 'left' ? state.position.x : state.position.x}px, ${state.position.y}px)`,
    cursor: dragging ? 'grabbing' : 'grab',
    width: state.collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
  };

  const navItemClass = (id: ViewType) => {
    const active = view === id;
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? 'bg-primary/20 text-primary shadow-sm shadow-primary/10 scale-105'
        : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground hover:scale-102'
    } ${state.collapsed ? 'justify-center px-2' : ''}`;
  };

  const isActive = (id: ViewType) => view === id;

  return (
    <>
      {/* Mobile hamburger trigger */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-blue-500/25"
          aria-label="Menú"
        >
          {mobileOpen ? <ChevronRight className="w-6 h-6" /> : (
            <div className="flex flex-col gap-1 items-center">
              <span className="w-5 h-0.5 bg-white rounded-full" />
              <span className="w-5 h-0.5 bg-white rounded-full" />
              <span className="w-5 h-0.5 bg-white rounded-full" />
            </div>
          )}
        </button>
      )}

      {/* Mobile drawer overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {isMobile ? (
        <div
          className={`fixed top-0 left-0 z-50 h-full bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: SIDEBAR_WIDTH_EXPANDED }}
        >
          <div className="flex flex-col h-full p-3">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="font-bold text-xs tracking-tight">CONSTRUSMART</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {modules.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setView(m.id); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive(m.id)
                      ? 'bg-primary/20 text-primary shadow-sm shadow-primary/10'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
                  }`}
                >
                  <m.icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{m.label}</span>
                </button>
              ))}
            </nav>
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 mt-2"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      ) : (
        /* Desktop glassmorphism sidebar */
        <div
          ref={sidebarRef}
          className={`${getSidebarClasses()} backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]`}
          style={sidebarStyle}
          onMouseDown={handleMouseDown}
        >
          {/* Drag handle */}
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1.5 h-12 rounded-full bg-primary/20 dark:bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Collapse toggle */}
          <button
            onClick={() => setState(prev => ({ ...prev, collapsed: !prev.collapsed }))}
            className="absolute -right-3 top-3 w-6 h-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-accent transition-all duration-200 z-10 opacity-0 hover:opacity-100 group-hover/sidebar:opacity-100"
            title={state.collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {state.collapsed
              ? <ChevronRight className="w-3 h-3" />
              : <ChevronLeft className="w-3 h-3" />
            }
          </button>

          {/* Logo */}
          <div className={`flex items-center gap-2.5 px-3 py-3 border-b border-border/40 ${state.collapsed ? 'justify-center px-2' : ''}`}>
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-sm shadow-primary/20">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            {!state.collapsed && (
              <div className="overflow-hidden">
                <p className="font-bold text-xs tracking-tight leading-tight truncate">CONSTRUSMART</p>
                <p className="text-[9px] text-muted-foreground truncate">Panel de Control</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {modules.map(m => (
              <button
                key={m.id}
                onClick={() => setView(m.id)}
                className={navItemClass(m.id)}
                title={state.collapsed ? m.label : undefined}
              >
                <m.icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${isActive(m.id) ? 'scale-110' : ''}`} />
                {!state.collapsed && (
                  <span className="truncate">{m.label}</span>
                )}
                {isActive(m.id) && state.collapsed && (
                  <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
                )}
              </button>
            ))}
          </nav>

          {/* Bottom section */}
          <div className={`p-2 border-t border-border/40 ${state.collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
            <button
              onClick={signOut}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 ${
                state.collapsed ? 'justify-center w-10 h-10 p-0' : 'w-full'
              }`}
              title={state.collapsed ? 'Cerrar sesión' : undefined}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!state.collapsed && <span>Cerrar sesión</span>}
            </button>
          </div>

          {/* Drag visual indicator */}
          {dragging && (
            <div className="absolute -inset-1 rounded-2xl border-2 border-dashed border-primary/30 pointer-events-none animate-pulse-soft" />
          )}
        </div>
      )}
    </>
  );
};

export default React.memo(Sidebar);