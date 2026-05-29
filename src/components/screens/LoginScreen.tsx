import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Lock, User, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import Loader3D from '@/components/shared/Loader3D';

const LoginScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, authError, resetPassword } = useAppContext();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
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
      } else if (mode === 'signup') {
        const ok = await signUp(email, password, nombre);
        if (ok) {
          setInfo('Cuenta creada. Revisa tu correo si la confirmación está activada, o inicia sesión.');
          setMode('login');
        }
      } else if (mode === 'reset') {
        const ok = await resetPassword(email);
        if (ok) {
          setInfo('Revisa tu correo para restablecer tu contraseña.');
          setMode('login');
        }
      }
    } catch (err) {
      toast.error(authError || 'Error de autenticación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error('Error al iniciar sesión con Google');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-3 sm:p-4 relative overflow-hidden animate-login-bg-enter">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-30 animate-pulse-soft" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card-strong rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 login-card">
          <div className="text-center mb-4 sm:mb-6 login-child">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 mb-3 sm:mb-4 shadow-lg animate-pulse-glow">
              <img src="/logo.png" alt="Logo CONSTRUCTORA WM/M&S" className="w-full h-full object-contain p-1" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">CONSTRUCTORA WM/M&S</h1>
            <p className="text-xs sm:text-sm text-emerald-300 italic mt-1">Edificando el Futuro</p>
            <p className="text-xs text-blue-300/60 mt-2 sm:mt-3">Plataforma de Gestión Arquitectónica</p>
          </div>

          {mode !== 'reset' && (
            <div className="flex gap-1 bg-white/5 p-1 rounded-2xl mb-4 sm:mb-5 login-child">
              <button type="button" onClick={() => { setMode('login'); setInfo(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === 'login' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
                }`}>Iniciar Sesión</button>
              <button type="button" onClick={() => { setMode('signup'); setInfo(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === 'signup' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
                }`}>Crear Cuenta</button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="text-center mb-4 login-child">
              <KeyRound className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Restablecer contraseña</p>
              <p className="text-xs text-blue-300/60 mt-1">Ingresa tu correo y te enviaremos un enlace</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 login-child">
            {mode === 'signup' && (
              <div>
                <label className="label-standard text-white/70">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
                    className="input-standard pl-10 text-white bg-white/10 border-white/20 placeholder-white/30 focus:border-blue-400"
                    placeholder="Arq. Juan Pérez" />
                </div>
              </div>
            )}
            <div>
              <label className="label-standard text-white/70">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="input-standard pl-10 text-white bg-white/10 border-white/20 placeholder-white/30 focus:border-blue-400"
                  placeholder="correo@empresa.com" />
              </div>
            </div>
            {mode !== 'reset' && (
              <div>
                <label className="label-standard text-white/70">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    className="input-standard pl-10 text-white bg-white/10 border-white/20 placeholder-white/30 focus:border-blue-400"
                    placeholder="Mínimo 6 caracteres" />
                </div>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('reset'); setInfo(null); }}
                    className="text-[10px] text-blue-300/70 hover:text-blue-300 mt-1 float-right transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
            )}

            {authError && (
              <div className="bg-red-500/15 border border-red-400/40 text-red-200 text-xs p-2 sm:p-2.5 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{authError}</span>
              </div>
            )}
            {info && (
              <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs p-2 sm:p-2.5 rounded-lg">{info}</div>
            )}

            <button type="submit" disabled={loading}
              className="btn-glow w-full py-2 sm:py-2.5 text-xs sm:text-sm justify-center animate-bounce-in"
              style={{ animationDelay: '400ms' }}>
              {loading ? <Loader3D size={28} text="" /> : (
                <>{mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear Cuenta' : 'Enviar enlace'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {mode === 'reset' && (
              <button type="button" onClick={() => { setMode('login'); setInfo(null); }}
                className="btn-ghost w-full py-2 text-xs justify-center text-white/50 hover:text-white">
                ← Volver al inicio de sesión
              </button>
            )}
          </form>

          {mode !== 'reset' && (
            <>
              <div className="relative my-3 sm:my-4 login-child">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-3 text-[10px] text-white/30 font-semibold">O CONTINÚA CON</span>
                </div>
              </div>
              <button onClick={handleGoogleSignIn}
                className="btn-glass w-full py-2 sm:py-2.5 text-xs sm:text-sm justify-center gap-2.5 login-child">
                <svg viewBox="0 0 48 48" className="w-4 h-4 sm:w-5 sm:h-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/></svg>
                <span className="text-white">Google</span>
              </button>
            </>
          )}

          <p className="text-center text-[10px] text-white/30 mt-4 sm:mt-5 login-child">
            © 2026 WM/M&S · Datos almacenados de forma segura en la nube
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoginScreen);
