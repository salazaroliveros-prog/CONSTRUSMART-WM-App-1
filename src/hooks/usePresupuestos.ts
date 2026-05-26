import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import CalculoService, { ResultadoCalculo } from '@/services/CalculoService';
import {
  obtenerPresupuestos,
  obtenerPresupuesto,
  guardarPresupuesto,
  eliminarPresupuesto,
  duplicarPresupuesto,
  obtenerPresupuestosPorTipologia,
  obtenerEstadisticasPresupuestos,
  type PresupuestoCompleto,
  type LineaPresupuestoCompleta,
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
  const { session } = useAppContext();
  const userId = session?.user?.id || '';

  const [presupuestos, setPresupuestos] = useState<PresupuestoCompleto[]>([]);
  const [presupuestoActual, setPresupuestoActual] = useState<PresupuestoCompleto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);

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

  useEffect(() => {
    if (options.autoCargar) cargar();
  }, [options.autoCargar, cargar]);

  const obtener = useCallback(async (id: string) => {
    if (!userId) return null;
    setCargando(true);
    setError(null);
    try {
      const presupuesto = await obtenerPresupuesto(id, userId);
      if (presupuesto) setPresupuestoActual(presupuesto);
      return presupuesto;
    } catch (err) {
      setError('Error obteniendo presupuesto');
      console.error(err);
      return null;
    } finally {
      setCargando(false);
    }
  }, [userId]);

  const guardar = useCallback(async (presupuesto: PresupuestoCompleto) => {
    if (!userId) { setError('Usuario no autenticado'); return null; }
    setCargando(true);
    setError(null);
    try {
      const id = await guardarPresupuesto(presupuesto, userId);
      if (id) {
        if (presupuesto.id) {
          setPresupuestos(prev => prev.map(p => p.id === presupuesto.id ? { ...presupuesto, id } : p));
        } else {
          setPresupuestos(prev => [{ ...presupuesto, id }, ...prev]);
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
  }, [userId]);

  const eliminar = useCallback(async (id: string) => {
    if (!userId) { setError('Usuario no autenticado'); return false; }
    setCargando(true);
    setError(null);
    try {
      const resultado = await eliminarPresupuesto(id, userId);
      if (resultado) {
        setPresupuestos(prev => prev.filter(p => p.id !== id));
        if (presupuestoActual?.id === id) setPresupuestoActual(null);
      }
      return resultado;
    } catch (err) {
      setError('Error eliminando presupuesto');
      console.error(err);
      return false;
    } finally {
      setCargando(false);
    }
  }, [userId, presupuestoActual?.id]);

  const duplicar = useCallback(async (id: string, nuevoNombre: string) => {
    if (!userId) { setError('Usuario no autenticado'); return null; }
    setCargando(true);
    setError(null);
    try {
      const nuevoId = await duplicarPresupuesto(id, userId, nuevoNombre);
      if (nuevoId) await cargar();
      return nuevoId;
    } catch (err) {
      setError('Error duplicando presupuesto');
      console.error(err);
      return null;
    } finally {
      setCargando(false);
    }
  }, [userId, cargar]);

  const cargarEstadisticas = useCallback(async () => {
    if (!userId) return;
    try {
      const stats = await obtenerEstadisticasPresupuestos(userId);
      if (stats) {
        setEstadisticas({
          total: stats.totalMonto,
          promedio: stats.promedioMonto,
          totalPresupuestos: stats.totalPresupuestos,
          mayorMonto: stats.mayorMonto,
          menorMonto: stats.menorMonto,
        });
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, [userId]);

  const filtrarPorFase = useCallback(
    (fase: 'planeación' | 'ejecución' | 'pausa' | 'finalizado') =>
      presupuestos.filter(p => p.fase === fase),
    [presupuestos]
  );

  const filtrarPorCliente = useCallback(
    (cliente: string) => presupuestos.filter(p => p.cliente === cliente),
    [presupuestos]
  );

  const buscar = useCallback((termino: string) => {
    const term = termino.toLowerCase();
    return presupuestos.filter(
      p =>
        p.proyecto.toLowerCase().includes(term) ||
        p.cliente?.toLowerCase().includes(term) ||
        p.ubicacion?.toLowerCase().includes(term)
    );
  }, [presupuestos]);

  const obtenerClientes = useCallback(() =>
    Array.from(new Set(presupuestos.map(p => p.cliente).filter(Boolean) as string[])),
    [presupuestos]
  );

  const obtenerTipologias = useCallback(() =>
    Array.from(new Set(presupuestos.map(p => p.tipologia).filter(Boolean) as string[])),
    [presupuestos]
  );

  const lineasToCalculadas = (lineas: LineaPresupuestoCompleta[]) =>
    lineas.map(item => ({
      id: item.id || '',
      costoUnitario: (item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0),
      cantidad: item.cantidad || 0,
      subtotal: ((item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0)) * (item.cantidad || 0),
      estimacionDias: item.cantidad && item.rendimiento ? Math.ceil(item.cantidad / item.rendimiento) : 0,
    }));

  const calcularPresupuesto = useCallback((presupuesto: PresupuestoCompleto): ResultadoCalculo | null => {
    try {
      const factores = presupuesto.factores || { indirectos: 10, administrativos: 8, imprevistos: 5, utilidad: 20 };
      return new CalculoService(lineasToCalculadas(presupuesto.lineas || []), factores).calcular().obtenerResultado();
    } catch (err) {
      console.error('Error calculando presupuesto:', err);
      return null;
    }
  }, []);

  const calcularSensibilidad = useCallback((presupuesto: PresupuestoCompleto) => {
    try {
      const factores = presupuesto.factores || { indirectos: 10, administrativos: 8, imprevistos: 5, utilidad: 20 };
      return new CalculoService(lineasToCalculadas(presupuesto.lineas || []), factores).obtenerSensibilidad();
    } catch (err) {
      console.error('Error calculando sensibilidad:', err);
      return null;
    }
  }, []);

  const validarPresupuesto = useCallback((presupuesto: PresupuestoCompleto) => {
    const errores: string[] = [];
    const advertencias: string[] = [];

    if (!presupuesto.proyecto?.trim()) errores.push('El nombre del proyecto es requerido');
    if (!presupuesto.cliente?.trim()) advertencias.push('Se recomienda especificar un cliente');
    if (!presupuesto.lineas || presupuesto.lineas.length === 0) errores.push('El presupuesto debe tener al menos una línea');

    presupuesto.lineas?.forEach((item: LineaPresupuestoCompleta, idx: number) => {
      if (!item.descripcion?.trim()) errores.push(`Línea ${idx + 1}: Descripción requerida`);
      if ((item.cantidad || 0) <= 0) errores.push(`Línea ${idx + 1}: Cantidad debe ser > 0`);
    });

    if ((presupuesto.factores?.utilidad || 0) === 0)
      advertencias.push('Factor de utilidad es 0% - considera agregar margen');

    const resultado = calcularPresupuesto(presupuesto);
    if (resultado && resultado.total <= 0) errores.push('El total debe ser mayor a 0');

    return { valido: errores.length === 0, errores, advertencias };
  }, [calcularPresupuesto]);

  const compararPresupuestos = useCallback((p1: PresupuestoCompleto, p2: PresupuestoCompleto) => {
    const r1 = calcularPresupuesto(p1);
    const r2 = calcularPresupuesto(p2);
    if (!r1 || !r2) return null;
    const diferencia = r2.total - r1.total;
    return {
      presupuesto1Nombre: p1.proyecto,
      presupuesto1Total: r1.total,
      presupuesto2Nombre: p2.proyecto,
      presupuesto2Total: r2.total,
      diferencia: Math.abs(diferencia),
      porcentajeDiferencia: Math.abs((diferencia / r1.total) * 100),
      masCaro: r2.total > r1.total ? p2.proyecto : p1.proyecto,
      masBarato: r2.total < r1.total ? p2.proyecto : p1.proyecto,
    };
  }, [calcularPresupuesto]);

  const exportarJSON = useCallback((presupuesto: PresupuestoCompleto): string =>
    JSON.stringify({ presupuesto, resultado: calcularPresupuesto(presupuesto), exportadoEn: new Date().toISOString() }, null, 2),
    [calcularPresupuesto]
  );

  const exportarCSV = useCallback((presupuesto: PresupuestoCompleto): string => {
    const headers = ['Descripción', 'Unidad', 'Cantidad', 'Costo Unitario', 'Subtotal'];
    const rows = (presupuesto.lineas || []).map((item: LineaPresupuestoCompleta) => {
      const cu = (item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0);
      return [item.descripcion || '', item.unidad || '', item.cantidad || 0, cu.toString(), (cu * (item.cantidad || 0)).toString()];
    });
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, []);

  const obtenerAnomalias = useCallback((presupuesto: PresupuestoCompleto): string[] => {
    const alertas: string[] = [];
    const resultado = calcularPresupuesto(presupuesto);
    if (!resultado) return alertas;
    if (resultado.margenUtilidad < 10) alertas.push('⚠️ Margen de utilidad muy bajo (< 10%)');
    if (resultado.margenUtilidad > 50) alertas.push('⚠️ Margen de utilidad muy alto (> 50%)');
    if (resultado.precioPorDia > 1000000) alertas.push('⚠️ Precio por día muy alto');
    const costosAltos = (presupuesto.lineas || []).filter((item: LineaPresupuestoCompleta) => {
      const ct = ((item.costoMaterial || 0) + (item.costoManoObra || 0) + (item.costoHerramienta || 0)) * (item.cantidad || 0);
      return ct > resultado.costoDirecto * 0.3;
    });
    if (costosAltos.length > 0) alertas.push(`⚠️ ${costosAltos.length} línea(s) representan > 30% del costo directo`);
    return alertas;
  }, [calcularPresupuesto]);

  return {
    presupuestos, presupuestoActual, cargando, error, estadisticas,
    cargar, obtener, guardar, eliminar, duplicar, cargarEstadisticas,
    filtrarPorFase, filtrarPorCliente, buscar, obtenerClientes, obtenerTipologias,
    calcularPresupuesto, calcularSensibilidad, validarPresupuesto,
    compararPresupuestos, exportarJSON, exportarCSV, obtenerAnomalias,
  };
}
