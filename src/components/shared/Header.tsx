import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import NotificationBell from '@/components/shared/NotificationBell';
import { Home, LogOut, Search, Moon, Sun, User, Menu, X, LayoutGrid, Users, Calculator, Folder, LineChart, Wallet, Shield, Package, FileText } from 'lucide-react';
import { ViewType } from '@/types/supabase';

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
];

const Header: React.FC<{ showHome?: boolean; title?: string }> = ({ showHome = true, title }) => {
  const { user, setView, signOut, darkMode, toggleDarkMode } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  const time = now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const date = now.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleSetView = useCallback((v: ViewType) => {
    setView(v);
    setMenuOpen(false);
  }, [setView]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-gradient-to-r from-blue-950/90 via-blue-900/90 to-blue-950/90 glass-dark shadow-lg'
          : 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950'
      }`}
    >
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors btn-press"
              aria-label="Menú"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {menuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 glass-strong rounded-xl p-1.5 z-50 animate-scale-in shadow-2xl">
                {modules.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSetView(m.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent rounded-lg transition-colors text-sm font-medium"
                  >
                    <m.icon className="w-4 h-4 text-primary" />
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="leading-tight min-w-0 hidden xs:block">
              <h1 className="font-bold text-xs sm:text-sm tracking-wide truncate">CONSTRUCTORA WM/M&S</h1>
              <p className="text-[9px] sm:text-[10px] text-emerald-300/80 italic truncate">Edificando el Futuro</p>
            </div>
          </div>
        </div>

        {title && (
          <div className="hidden md:block text-center min-w-0 px-2">
            <h2 className="text-sm font-semibold truncate">{title}</h2>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden sm:block text-right leading-tight">
            <div className="font-mono text-sm sm:text-base font-bold text-emerald-300 tabular-nums">{time}</div>
            <div className="text-[9px] text-blue-200/70 capitalize leading-tight">{date}</div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full pl-1 pr-2.5 py-0.5 border border-white/10">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nombre} className="w-7 h-7 rounded-full object-cover border border-emerald-400/60" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-emerald-400/60 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-emerald-300/80" />
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <div className="text-[11px] font-semibold">{user.nombre}</div>
              <div className="text-[9px] text-blue-200/60">Administrador</div>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors btn-press"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-200" />}
          </button>
          <NotificationBell />
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('toggle:commandpalette'))}
            className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 transition px-2 py-1 rounded-lg text-[11px] shadow-sm border border-white/10 btn-press"
            title="Buscar"
          >
            <Search className="w-3 h-3" />
            <kbd className="text-[9px] opacity-60">⌘K</kbd>
          </button>
          {showHome ? (
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-1 bg-emerald-500/90 hover:bg-emerald-500 transition px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-sm btn-press"
              title="Tablero principal"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 bg-red-500/80 hover:bg-red-500 transition px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-sm btn-press"
              title="Salir"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
