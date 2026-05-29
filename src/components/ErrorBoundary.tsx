import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md w-full bg-slate-900 border border-red-900/30 rounded-2xl p-8 shadow-2xl text-center animate-view-enter">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              La aplicación encontró un error inesperado. Hemos registrado el incidente para solucionarlo pronto.
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive"
                className="w-full flex items-center gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
                Recargar Aplicación
              </Button>
              
              <Button 
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-left">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Detalles del error:</p>
                <pre className="bg-black/50 p-4 rounded-lg text-xs text-red-400 overflow-auto max-h-40 font-mono">
                  {this.state.error?.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;
