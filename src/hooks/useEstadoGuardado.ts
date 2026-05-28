// Hook para estado de guardado con animación
import { useState } from 'react';

type EstadoGuardado = 'idle' | 'guardando' | 'guardado' | 'error';

export function useEstadoGuardado() {
  const [estado, setEstado] = useState<EstadoGuardado>('idle');

  const marcarGuardando = () => setEstado('guardando');
  
  const marcarGuardado = () => {
    setEstado('guardado');
  };

  const marcarError = () => {
    setEstado('error');
  };

  return { estado, marcarGuardando, marcarGuardado, marcarError };
}