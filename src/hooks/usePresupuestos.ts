/**
 * usePresupuestos Hook v2
 * Hook especializado para gestión de presupuestos con cálculos integrados
 * 
 * Features:
 * - Gestión completa de presupuestos
 * - Integración con CalculoService para cálculos en tiempo real
 * - Análisis de sensibilidad
 * - Validaciones y alertas
 * - Exportación (JSON, CSV)
 * - Historial de cambios
 */

import { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { AppContext } from '@/contexts/AppContext';
import CalculoService, { ResultadoCalculo, AnalisisSensibilidad } from '@/services/CalculoService';
import {
  obtenerPresupuestos,
  obtenerPresupuesto,
  guardarPresupuesto,
  eliminarPresupuesto,
  duplicarPresupuesto,
  obtenerPresupuestosPorTipologia,
  obtenerEstadisticasPresupuestos,
  type PresupuestoCompleto,
} from '@/services/PresupuestoService';

export interface UsePresupuestosOptions {
  autoCargar?: boolean;
  tipologia?: string;
}

interface Estadisticas {
  total: number;
  promedio: number;
  [key: string]: number | string;
}

export function usePresupuestos(options: UsePresupuestosOptions = {}) {
  const { user } = useContext(AppContext);
  const [presupuestos, setPresupuestos] = useState<PresupuestoCompleto[]>([]);
  const [presupuestoActual, setPresupuestoActual] = useState<PresupuestoCompleto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);

  const userId = user?.id || '';

  // Cargar presupuestos
  const cargar = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    setError(null);
    try {
      const datos =
        options.tipologia && options.tipologia !== 'todas'
          ? await obtenerPresupuestosPorTipologia(userId, options.tipologia)
          : await obtenerPresupuestos(userId);
      setPresupuestos(datos);
    } catch (err) {
      setError('Error cargando presupuestos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [userId, options.tipologia]);

  // Cargar automaticamente
  useEffect(() => {
    if (options.autoCargar) {
      cargar();
    }
  }, [options.autoCargar, cargar]);

  // Obtener uno por ID
  const obtener = useCallback(
    async (id: string) => {
      if (!userId) return null;
      setCargando(true);
      setError(null);
      try {
        const presupuesto = await obtenerPresupuesto(id, userId);
        if (presupuesto) {
          setPresupuestoActual(presupuesto);
        }
        return presupuesto;
      } catch (err) {
        setError('Error obteniendo presupuesto');
        console.error(err);
        return null;
      } finally {
        setCargando(false);
      }
    },
    [userId]
  );

  // Guardar
  const guardar = useCallback(
    async (presupuesto: PresupuestoCompleto) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return null;
      }

      setCargando(true);
      setError(null);
      try {
        const id = await guardarPresupuesto(presupuesto, userId);
        if (id) {
          if (presupuesto.id) {
            // Actualizar en lista
            setPresupuestos((prev) =>
              prev.map((p) => (p.id === presupuesto.id ? { ...presupuesto, id } : p))
            );
          } else {
            // Agregar a lista
            setPresupuestos((prev) => [{ ...presupuesto, id }, ...prev]);
          }
          setPresupuestoActual({ ...presupuesto, id });
        }
        return id;
      } catch (err) {
        setError('Error guardando presupuesto');
        console.error(err);
        return null;
      } finally {
        setCargando(false);
      }
    },
    [userId]
  );

  // Eliminar
  const eliminar = useCallback(
    async (id: string) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return false;
      }

      setCargando(true);
      setError(null);
      try {
        const resultado = await eliminarPresupuesto(id, userId);
        if (resultado) {
          setPresupuestos((prev) => prev.filter((p) => p.id !== id));
          if (presupuestoActual?.id === id) {
            setPresupuestoActual(null);
          }
        }
        return resultado;
      } catch (err) {
        setError('Error eliminando presupuesto');
        console.error(err);
        return false;
      } finally {
        setCargando(false);
      }
    },
    [userId, presupuestoActual?.id]
  );

  // Duplicar
  const duplicar = useCallback(
    async (id: string, nuevoNombre: string) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return null;
      }

      setCargando(true);
      setError(null);
      try {
        const nuevoId = await duplicarPresupuesto(id, userId, nuevoNombre);
        if (nuevoId) {
          // Recargar lista
          await cargar();
        }
        return nuevoId;
      } catch (err) {
        setError('Error duplicando presupuesto');
        console.error(err);
        return null;
      } finally {
        setCargando(false);
      }
    },
    [userId, cargar]
  );

  // Obtener estadísticas
  const cargarEstadisticas = useCallback(async () => {
    if (!userId) return;
    try {
      const stats = await obtenerEstadisticasPresupuestos(userId);
      setEstadisticas(stats);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, [userId]);

  // Filtrar por fase
  const filtrarPorFase = useCallback(
    (fase: 'planeación' | 'ejecución' | 'pausa' | 'finalizado') => {
      return presupuestos.filter((p) => p.fase === fase);
    },
    [presupuestos]
  );

  // Filtrar por cliente
  const filtrarPorCliente = useCallback(
    (cliente: string) => {
      return presupuestos.filter((p) => p.cliente === cliente);
    },
    [presupuestos]
  );

  // Buscar por término
  const buscar = useCallback(
    (termino: string) => {
      const term = termino.toLowerCase();
      return presupuestos.filter(
        (p) =>
          p.proyecto.toLowerCase().includes(term) ||
          p.cliente?.toLowerCase().includes(term) ||
          p.ubicacion?.toLowerCase().includes(term)
      );
    },
    [presupuestos]
  );

  // Obtener clientes únicos
  const obtenerClientes = useCallback(() => {
    return Array.from(new Set(presupuestos.map((p) => p.cliente).filter(Boolean) as string[]));
  }, [presupuestos]);

  // Obtener tipologías únicas
  const obtenerTipologias = useCallback(() => {
    return Array.from(new Set(presupuestos.map((p) => p.tipologia).filter(Boolean) as string[]));
  }, [presupuestos]);

  // ===== NUEVAS FUNCIONALIDADES DE CÁLCULO =====

  /**
   * Calcula resultado completo para un presupuesto
   */
  const calcularPresupuesto = useCallback(
    (presupuesto: PresupuestoCompleto): ResultadoCalculo | null => {
      try {
        const lineasCalculadas = (presupuesto.items || []).map((item) => ({
          id: item.id || '',
          costoUnitario: (item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0),
          cantidad: item.cantidad || 0,
          subtotal: ((item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0)) * (item.cantidad || 0),
          estimacionDias: item.cantidad && item.rendimiento ? Math.ceil(item.cantidad / item.rendimiento) : 0,
        }));

        const factores = presupuesto.factores || {
          indirectos: 10,
          administrativos: 8,
          imprevistos: 5,
          utilidad: 20,
        };

        const servicio = new CalculoService(lineasCalculadas, factores);
        return servicio.calcular().obtenerResultado();
      } catch (error) {
        console.error('Error calculando presupuesto:', error);
        return null;
      }
    },
    []
  );

  /**
   * Calcula análisis de sensibilidad
   */
  const calcularSensibilidad = useCallback(
    (presupuesto: PresupuestoCompleto) => {
      try {
        const lineasCalculadas = (presupuesto.items || []).map((item) => ({
          id: item.id || '',
          costoUnitario: (item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0),
          cantidad: item.cantidad || 0,
          subtotal: ((item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0)) * (item.cantidad || 0),
          estimacionDias: item.cantidad && item.rendimiento ? Math.ceil(item.cantidad / item.rendimiento) : 0,
        }));

        const factores = presupuesto.factores || {
          indirectos: 10,
          administrativos: 8,
          imprevistos: 5,
          utilidad: 20,
        };

        const servicio = new CalculoService(lineasCalculadas, factores);
        return servicio.obtenerSensibilidad();
      } catch (error) {
        console.error('Error calculando sensibilidad:', error);
        return null;
      }
    },
    []
  );

  /**
   * Valida coherencia del presupuesto
   */
  const validarPresupuesto = useCallback((presupuesto: PresupuestoCompleto) => {
    const errores: string[] = [];
    const advertencias: string[] = [];

    // Validar campos básicos
    if (!presupuesto.proyecto?.trim()) {
      errores.push('El nombre del proyecto es requerido');
    }

    if (!presupuesto.cliente?.trim()) {
      advertencias.push('Se recomienda especificar un cliente');
    }

    if (!presupuesto.items || presupuesto.items.length === 0) {
      errores.push('El presupuesto debe tener al menos una línea');
    }

    // Validar líneas
    if (presupuesto.items) {
      presupuesto.items.forEach((item, idx) => {
        if (!item.descripcion?.trim()) {
          errores.push(`Línea ${idx + 1}: Descripción requerida`);
        }
        if ((item.cantidad || 0) <= 0) {
          errores.push(`Línea ${idx + 1}: Cantidad debe ser > 0`);
        }
      });
    }

    // Validar factores
    const factores = presupuesto.factores || {};
    if ((factores.utilidad || 0) === 0) {
      advertencias.push('Factor de utilidad es 0% - considera agregar margen');
    }

    const resultado = calcularPresupuesto(presupuesto);
    if (resultado && resultado.total <= 0) {
      errores.push('El total debe ser mayor a 0');
    }

    return {
      valido: errores.length === 0,
      errores,
      advertencias,
    };
  }, [calcularPresupuesto]);

  /**
   * Compara dos presupuestos
   */
  const compararPresupuestos = useCallback(
    (presupuesto1: PresupuestoCompleto, presupuesto2: PresupuestoCompleto) => {
      const resultado1 = calcularPresupuesto(presupuesto1);
      const resultado2 = calcularPresupuesto(presupuesto2);

      if (!resultado1 || !resultado2) return null;

      const diferencia = resultado2.total - resultado1.total;
      const porcentaje = (diferencia / resultado1.total) * 100;

      return {
        presupuesto1Nombre: presupuesto1.proyecto,
        presupuesto1Total: resultado1.total,
        presupuesto2Nombre: presupuesto2.proyecto,
        presupuesto2Total: resultado2.total,
        diferencia: Math.abs(diferencia),
        porcentajeDiferencia: Math.abs(porcentaje),
        masCaro: resultado2.total > resultado1.total ? presupuesto2.proyecto : presupuesto1.proyecto,
        masBarato: resultado2.total < resultado1.total ? presupuesto2.proyecto : presupuesto1.proyecto,
      };
    },
    [calcularPresupuesto]
  );

  /**
   * Exporta a JSON
   */
  const exportarJSON = useCallback((presupuesto: PresupuestoCompleto): string => {
    const resultado = calcularPresupuesto(presupuesto);
    return JSON.stringify(
      {
        presupuesto,
        resultado,
        exportadoEn: new Date().toISOString(),
      },
      null,
      2
    );
  }, [calcularPresupuesto]);

  /**
   * Exporta a CSV
   */
  const exportarCSV = useCallback((presupuesto: PresupuestoCompleto): string => {
    const headers = ['Descripción', 'Unidad', 'Cantidad', 'Costo Unitario', 'Subtotal'];
    const rows =
      presupuesto.items?.map((item) => [
        item.descripcion || '',
        item.unidad || '',
        item.cantidad || 0,
        ((item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0)).toString(),
        (
          ((item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0)) *
          (item.cantidad || 0)
        ).toString(),
      ]) || [];

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }, []);

  /**
   * Obtiene alertas de anomalías
   */
  const obtenerAnomalias = useCallback((presupuesto: PresupuestoCompleto): string[] => {
    const alertas: string[] = [];
    const resultado = calcularPresupuesto(presupuesto);

    if (!resultado) return alertas;

    if (resultado.margenUtilidad < 10) {
      alertas.push('⚠️ Margen de utilidad muy bajo (< 10%)');
    }

    if (resultado.margenUtilidad > 50) {
      alertas.push('⚠️ Margen de utilidad muy alto (> 50%)');
    }

    if (resultado.precioPorDia > 1000000) {
      alertas.push('⚠️ Precio por día muy alto');
    }

    const costosAltos = presupuesto.items?.filter((item) => {
      const costoTotal =
        ((item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0)) *
        (item.cantidad || 0);
      return costoTotal > resultado.costoDirecto * 0.3;
    });

    if (costosAltos && costosAltos.length > 0) {
      alertas.push(`⚠️ ${costosAltos.length} línea(s) representan > 30% del costo directo`);
    }

    return alertas;
  }, [calcularPresupuesto]);

  return {
    presupuestos,
    presupuestoActual,
    cargando,
    error,
    estadisticas,
    cargar,
    obtener,
    guardar,
    eliminar,
    duplicar,
    cargarEstadisticas,
    filtrarPorFase,
    filtrarPorCliente,
    buscar,
    obtenerClientes,
    obtenerTipologias,
    // Nuevas funcionalidades
    calcularPresupuesto,
    calcularSensibilidad,
    validarPresupuesto,
    compararPresupuestos,
    exportarJSON,
    exportarCSV,
    obtenerAnomalias,
  };
}
