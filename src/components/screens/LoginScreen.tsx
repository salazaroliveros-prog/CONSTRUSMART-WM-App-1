import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Lock, User, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, authError } = useAppContext();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        const ok = await signUp(email, password, nombre);
        if (ok) {
          setInfo('Cuenta creada. Revisa tu correo si la confirmación está activada, o inicia sesión.');
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-3 sm:p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 sm:opacity-10">
        <div className="absolute top-10 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-500 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-white/20">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-600 mb-3 sm:mb-4 shadow-lg">
              <img src="/logo.png" alt="Logo CONSTRUCTORA WM/M&S" className="w-full h-full object-contain p-1" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">CONSTRUCTORA WM/M&S</h1>
            <p className="text-xs sm:text-sm text-emerald-300 italic mt-1">Edificando el Futuro</p>
            <p className="text-xs text-slate-300 mt-2 sm:mt-3">Plataforma de Gestión Arquitectónica</p>
          </div>

          <div className="flex gap-1 bg-slate-100/20 p-1 rounded-lg mb-4 sm:mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setInfo(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded transition ${mode === 'login' ? 'bg-white shadow text-blue-800' : 'text-white'}`}
            >Iniciar Sesión</button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setInfo(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded transition ${mode === 'signup' ? 'bg-white shadow text-blue-800' : 'text-white'}`}
            >Crear Cuenta</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 sm:py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-300/30 outline-none text-xs sm:text-sm"
                    placeholder="Arq. Juan Pérez"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-white mb-1 block">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 sm:py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-300/30 outline-none text-xs sm:text-sm"
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white mb-1 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 sm:py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-300/30 outline-none text-xs sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-100 text-xs p-2 sm:p-2.5 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            {info && (
              <div className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 text-xs p-2 sm:p-2.5 rounded-lg">{info}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 text-xs sm:text-sm"
            >
              {loading ? 'Procesando...' : (
                <>{mode === 'login' ? 'Ingresar' : 'Crear Cuenta'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="relative my-3 sm:my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
            <div className="relative flex justify-center"><span className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 px-2 sm:px-3 text-[10px] text-white/60 font-semibold">O CONTINÚA CON</span></div>
          </div>

          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 sm:py-2.5 rounded-lg transition-all shadow-sm hover:shadow text-xs sm:text-sm">
            <svg viewBox="0 0 48 48" className="w-4 h-4 sm:w-5 sm:h-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/></svg>
            <span>Google</span>
          </button>

          <p className="text-center text-[10px] text-white/50 mt-4 sm:mt-5">
            © 2026 WM/M&S · Datos almacenados de forma segura en la nube
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
