/**
 * Utilidades centralizadas para el manejo de fechas en la aplicación.
 * Asegura consistencia en formatos y zonas horarias.
 */

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const DateUtils = {
  /**
   * Formato estándar para inputs de tipo date (YYYY-MM-DD)
   */
  formatForInput(date: Date | string = new Date()): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
  },

  /**
   * Formato amigable para visualización (DD/MM/YYYY)
   */
  formatDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: es });
  },

  /**
   * Formato detallado con mes en texto
   */
  formatFull(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "d 'de' MMMM, yyyy", { locale: es });
  },

  /**
   * Obtiene la fecha actual en formato ISO string (solo fecha)
   */
  todayISO(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }
};
