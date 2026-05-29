import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import NotificationBell from '@/components/shared/NotificationBell';
import { Home, LogOut, Search, Moon, Sun, User } from 'lucide-react';

type HeaderProps = { showHome?: boolean; title?: string };

const Header = React.memo(({ showHome = true, title }: HeaderProps) => {
  const { user, setView, signOut, darkMode, toggleDarkMode } = useAppContext();
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

  const time = now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const date = now.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-gradient-to-r from-slate-900/95 via-blue-950/95 to-indigo-950/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-b border-white/5'
          : 'bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 shadow-lg'
      }`}
    >
      {/* Animated gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent animate-pulse-soft" />

      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Logo + Brand + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 flex items-center justify-center border border-white/15 overflow-hidden shadow-lg shadow-blue-500/10 animate-pulse-glow">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain drop-shadow-sm" />
            </div>
            <div className="leading-tight min-w-0 hidden xs:block">
              <h1 className="font-bold text-xs sm:text-sm tracking-wide truncate text-gradient-emerald">CONSTRUCTORA WM/M&S</h1>
              <p className="text-[9px] sm:text-[10px] text-blue-300/60 italic truncate">Edificando el Futuro</p>
            </div>
          </div>
        </div>

        {/* Center: Title */}
        {title && (
          <div className="hidden md:block text-center min-w-0 px-2">
            <h2 className="text-sm font-semibold text-white/90 truncate tracking-tight">{title}</h2>
          </div>
        )}

        {/* Right: Time + User + Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Clock */}
          <div className="hidden sm:block text-right leading-tight">
            <div className="font-mono text-sm sm:text-base font-bold text-emerald-300/90 tabular-nums tracking-wider drop-shadow-sm">{time}</div>
            <div className="text-[9px] text-blue-300/50 capitalize leading-tight">{date}</div>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-full pl-1 pr-2.5 py-0.5 border border-white/5 transition-all duration-200 group cursor-default">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nombre} className="w-7 h-7 rounded-full object-cover border border-emerald-400/40 group-hover:border-emerald-400/70 transition-all" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-emerald-400/40 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-emerald-300/60" />
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <div className="text-[11px] font-semibold text-white/90">{user.nombre}</div>
              <div className="text-[9px] text-blue-300/50">Administrador</div>
            </div>
          </div>

          {/* Theme toggle btn-glow */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 btn-press relative overflow-hidden group"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-200 group-hover:scale-110 transition-transform" />
            )}
            <span className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/5 transition-colors" />
          </button>

          <NotificationBell />

          {/* Search btn-glass */}
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('toggle:commandpalette'))}
            className="hidden sm:flex items-center gap-1 bg-white/5 hover:bg-white/15 transition-all duration-200 px-2 py-1 rounded-lg text-[11px] border border-white/5 btn-press group"
            title="Buscar"
          >
            <Search className="w-3 h-3 text-blue-200 group-hover:text-white transition-colors" />
            <kbd className="text-[9px] opacity-40 text-blue-200">⌘K</kbd>
          </button>

          {showHome ? (
            <button
              onClick={() => setView('dashboard')}
              className="btn-glow px-3 py-1.5 text-[11px]"
              title="Tablero principal"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 bg-red-500/70 hover:bg-red-500 transition-all duration-200 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold btn-press shadow-sm shadow-red-500/10"
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
});

export default Header;
