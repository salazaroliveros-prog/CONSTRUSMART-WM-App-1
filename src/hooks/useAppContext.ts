/**
 * useAppContext.ts - Hook para acceder al contexto global de la aplicación
 */

import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe ser usado dentro de AppProvider');
  }
  return context;
}
