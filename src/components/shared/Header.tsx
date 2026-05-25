import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import NotificationBell from '@/components/shared/NotificationBell';
import { Home, LogOut, Search, Moon, Sun, User } from 'lucide-react';

const Header: React.FC<{ showHome?: boolean; title?: string }> = ({ showHome = true, title }) => {
  const { user, setView, signOut, darkMode, toggleDarkMode } = useAppContext();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const date = now.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-xl border-b-4 border-emerald-500 sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <div className="leading-tight">
            <h1 className="font-bold text-sm sm:text-base tracking-wide">CONSTRUCTORA WM/M&S</h1>
            <p className="text-[10px] sm:text-xs text-emerald-200 italic">Edificando el Futuro</p>
          </div>
        </div>

        {title && (
          <div className="hidden md:block text-center">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:block text-right leading-tight">
            <div className="font-mono text-base sm:text-lg font-bold text-emerald-300">{time}</div>
            <div className="text-[10px] text-blue-200 capitalize">{date}</div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-full pl-1 pr-3 py-1 border border-white/15">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nombre} className="w-8 h-8 rounded-full object-cover border-2 border-emerald-400" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500/30 border-2 border-emerald-400 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-300" />
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-semibold">{user.nombre}</div>
              <div className="text-[10px] text-blue-200">Administrador</div>
            </div>
          </div>
          <button onClick={toggleDarkMode}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors btn-press" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-100" />}
          </button>
          <NotificationBell />
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('toggle:commandpalette'))}
            className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition px-2 py-1.5 rounded-lg text-xs shadow-md border border-white/10 btn-press"
            title="Buscar (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="text-[10px] opacity-70">⌘K</kbd>
          </button>
          {showHome ? (
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 transition px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md btn-press"
              title="Tablero principal"
            >
              <Home className="w-4 h-4" /> <span className="hidden sm:inline">Inicio</span>
            </button>
          ) : (
            <button
              onClick={() => signOut()}

              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 transition px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md btn-press"
              title="Salir"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
