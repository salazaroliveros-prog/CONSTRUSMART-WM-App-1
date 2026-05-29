import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Users, Calculator, Folder, LineChart, Wallet, Shield, Package, FileText, ShoppingCart, ShieldCheck, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ViewType } from '@/types/supabase';

const STORAGE_KEY = 'sidebar_collapsed';
const SIDEBAR_W_EXPANDED = 192;
const SIDEBAR_W_COLLAPSED = 56;

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

/** Fixed sidebar width so AppLayout can react via CSS variable */
export const sidebarWidthVar = (collapsed: boolean) =>
  collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;

const Sidebar: React.FC = () => {
  const { view, setView, signOut } = useAppContext();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(collapsed)); }, [collapsed]);

  // Close mobile drawer on navigate
  const navigate = useCallback((v: ViewType) => { setView(v); setMobileOpen(false); }, [setView]);

  const navItem = (id: ViewType, label: string, Icon: React.ComponentType<{ className?: string }>) => {
    const active = view === id;
    return (
      <button
        key={id}
        onClick={() => navigate(id)}
        title={collapsed && !isMobile ? label : undefined}
        className={`w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-200
          ${collapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
          ${active
            ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'}`}
      >
        <Icon className={`shrink-0 transition-transform ${active ? 'scale-110' : ''} ${collapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
        {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
        {active && collapsed && !isMobile && <span className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />}
      </button>
    );
  };

  /* ===== MOBILE: drawer deslizante ===== */
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="fixed bottom-5 right-5 z-50 w-13 h-13 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          aria-label="Menú"
        >
          {mobileOpen ? <ChevronRight className="w-5 h-5" /> : (
            <div className="flex flex-col gap-[3px]"><span className="w-4.5 h-[2px] bg-white rounded-full" /><span className="w-4.5 h-[2px] bg-white rounded-full" /><span className="w-4.5 h-[2px] bg-white rounded-full" /></div>
          )}
        </button>
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}
        <div className={`fixed top-0 left-0 z-50 h-full bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: 220 }}>
          <div className="flex flex-col h-full p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                  <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
                </div>
                <span className="font-bold text-xs">CONSTRUSMART</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-accent"><ChevronLeft className="w-4 h-4" /></button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto">{modules.map(m => navItem(m.id, m.label, m.icon))}</nav>
            <button onClick={signOut} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition mt-2">
              <LogOut className="w-4 h-4 shrink-0" /><span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ===== DESKTOP: fixed sidebar parte de la pantalla ===== */
  const w = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;
  return (
    <aside
      className="h-full bg-sidebar border-r border-border flex flex-col shrink-0 transition-all duration-300 relative"
      style={{ width: w }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-14 z-10 w-6 h-6 rounded-full bg-background border border-border shadow flex items-center justify-center hover:bg-accent transition"
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={`flex items-center gap-2 border-b border-border ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
        <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-sm">
          <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-xs tracking-tight leading-tight">CONSTRUSMART</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Panel de Control</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-1.5 space-y-0.5 mt-1">
        {modules.map(m => navItem(m.id, m.label, m.icon))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-1.5">
        <button
          onClick={signOut}
          className={`flex items-center gap-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);