/**
 * useExports Hook
 * Hook especializado para manejo de exportaciones
 */

import { useCallback, useState } from 'react';
import type { PresupuestoCompleto } from '@/services/PresupuestoService';
import {
  exportarCSV,
  exportarPDF,
  copiarAlPortapapeles,
  generarCSV,
  generarCSVDetallado,
  generarHTML,
} from '@/services/ExportService';

export function useExports() {
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const descargarCSV = useCallback(async (presupuesto: PresupuestoCompleto) => {
    try {
      setExportando(true);
      setError(null);
      exportarCSV(presupuesto, false);
    } catch (err) {
      setError('Error exportando CSV');
      console.error(err);
    } finally {
      setExportando(false);
    }
  }, []);

  const descargarCSVDetallado = useCallback(async (presupuesto: PresupuestoCompleto) => {
    try {
      setExportando(true);
      setError(null);
      exportarCSV(presupuesto, true);
    } catch (err) {
      setError('Error exportando CSV detallado');
      console.error(err);
    } finally {
      setExportando(false);
    }
  }, []);

  const abrirPDF = useCallback(async (presupuesto: PresupuestoCompleto) => {
    try {
      setExportando(true);
      setError(null);
      exportarPDF(presupuesto);
    } catch (err) {
      setError('Error generando PDF');
      console.error(err);
    } finally {
      setExportando(false);
    }
  }, []);

  const copiarCSV = useCallback(async (presupuesto: PresupuestoCompleto) => {
    try {
      setExportando(true);
      setError(null);
      const resultado = await copiarAlPortapapeles(presupuesto);
      if (resultado) {
        setError(null);
      } else {
        setError('No se pudo copiar');
      }
      return resultado;
    } catch (err) {
      setError('Error copiando');
      console.error(err);
      return false;
    } finally {
      setExportando(false);
    }
  }, []);

  const obtenerCSVTexto = useCallback((presupuesto: PresupuestoCompleto, detallado: boolean = false) => {
    return detallado ? generarCSVDetallado(presupuesto) : generarCSV(presupuesto);
  }, []);

  const obtenerHTMLTexto = useCallback((presupuesto: PresupuestoCompleto) => {
    return generarHTML(presupuesto);
  }, []);

  return {
    exportando,
    error,
    descargarCSV,
    descargarCSVDetallado,
    abrirPDF,
    copiarCSV,
    obtenerCSVTexto,
    obtenerHTMLTexto,
  };
}
