import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Lock, User, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { signIn, signUp, authError } = useAppContext();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-600 mb-4 shadow-lg">
                <img src="/logo.png" alt="Logo CONSTRUCTORA WM/M&S" className="w-20 h-20 object-contain mb-4" />
              </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CONSTRUCTORA WM/M&S</h1>
            <p className="text-sm text-emerald-600 italic mt-1">Edificando el Futuro</p>
            <p className="text-xs text-slate-500 mt-3">Plataforma de Gestión Arquitectónica</p>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setInfo(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded transition ${mode === 'login' ? 'bg-white shadow text-blue-800' : 'text-slate-500'}`}
            >Iniciar Sesión</button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setInfo(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded transition ${mode === 'signup' ? 'bg-white shadow text-blue-800' : 'text-slate-500'}`}
            >Crear Cuenta</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                    placeholder="Arq. Juan Pérez"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            {info && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-2.5 rounded-lg">{info}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
            >
              {loading ? 'Procesando...' : (
                <>{mode === 'login' ? 'Ingresar al Sistema' : 'Crear Cuenta'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-5">
            © 2026 WM/M&S · Datos almacenados de forma segura en la nube
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
