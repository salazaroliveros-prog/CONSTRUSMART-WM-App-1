// Hook para estado de guardado con animación
import { useState, useEffect } from 'react';

type EstadoGuardado = 'idle' | 'guardando' | 'guardado' | 'error';

export function useEstadoGuardado() {
  const [estado, setEstado] = useState<EstadoGuardado>('idle');

  const marcarGuardando = () => setEstado('guardando');
  
  const marcarGuardado = () => {
    setEstado('guardado');
    const timeout = setTimeout(() => setEstado('idle'), 2000);
    return () => clearTimeout(timeout);
  };

  const marcarError = () => {
    setEstado('error');
    const timeout = setTimeout(() => setEstado('idle'), 3000);
    return () => clearTimeout(timeout);
  };

  return { estado, marcarGuardando, marcarGuardado, marcarError };
}
