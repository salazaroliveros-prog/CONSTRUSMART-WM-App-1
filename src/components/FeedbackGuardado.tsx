// Componente de feedback de guardado con animaciones Framer Motion
import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Loader } from 'lucide-react';

interface FeedbackGuardadoProps {
  estado: 'idle' | 'guardando' | 'guardado' | 'error';
}

export const FeedbackGuardado: React.FC<FeedbackGuardadoProps> = ({ estado }) => {
  if (estado === 'idle') return null;

  const config = {
    guardando: { icon: Loader, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Guardando...' },
    guardado: { icon: Check, color: 'text-green-600', bg: 'bg-green-50', label: 'Guardado' },
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Error al guardar' },
  };

  const { icon: Icon, color, bg, label } = config[estado];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${bg} ${color} px-3 py-2 rounded text-xs font-medium flex items-center gap-2`}
    >
      {estado === 'guardando' && <Icon className="w-3 h-3 animate-spin" />}
      {estado !== 'guardando' && <Icon className="w-3 h-3" />}
      {label}
    </motion.div>
  );
};
