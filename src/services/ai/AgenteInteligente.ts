import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';
import { CoreEngineService } from '@/services/CoreEngineService';
import type { Presupuesto, Transaccion } from '@/types/supabase';

interface Alerta {
  tipo: string;
  proyecto: string;
  mensaje: string;
}

export const AgenteInteligente = {
  async diagnosticarProyecto(presupuesto: Presupuesto, transacciones: Transaccion[]): Promise<Alerta[]> {
    const gastosReal = transacciones
      .filter(t => t.proyectoId === presupuesto.id && t.tipo === 'gasto')
      .reduce((s: number, t: Transaccion) => s + (t.costoTotal || 0), 0);
      
    const desviacion = PresupuestosService.analizarDesviacion(presupuesto, gastosReal);
    
    const alertas = [];
    
    // Sugerencia de Activación
    if (presupuesto.fase === 'planeación' && gastosReal > 0) {
      alertas.push({
        tipo: 'sugerencia',
        proyecto: presupuesto.proyecto,
        mensaje: `Se han detectado gastos iniciales. ¿Deseas activar el proyecto a fase 'Ejecución'?`
      });
    }

    // 1. Alerta financiera
    if (desviacion.nivelAlerta === 'critico') {
      alertas.push({
        tipo: 'alerta',
        proyecto: presupuesto.proyecto,
        mensaje: `Has superado el 90% del presupuesto. Exceso actual: ${desviacion.exceso.toLocaleString()}`
      });
    }

    // 2. Alerta de rendimiento físico/financiero (si el avance financiero va muy rápido)
    if (presupuesto.avanceFinanciero > (presupuesto.avanceFisico || 0) + 20) {
      alertas.push({
        tipo: 'alerta',
        proyecto: presupuesto.proyecto,
        mensaje: `El gasto financiero (${presupuesto.avanceFinanciero}%) supera al avance físico (${presupuesto.avanceFisico || 0}%) por más del 20%.`
      });
    }

    // 3. Alerta de Tiempo / Cronograma
    if (presupuesto.fechaFin) {
      const hoy = new Date();
      const fin = new Date(presupuesto.fechaFin);
      const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes < 7 && (presupuesto.avanceFisico || 0) < 90 && presupuesto.fase === 'ejecución') {
        alertas.push({
          tipo: 'alerta',
          proyecto: presupuesto.proyecto,
          mensaje: `Quedan solo ${diasRestantes} días para la fecha final y el avance es del ${(presupuesto.avanceFisico || 0)}%.`
        });
      }
    }

    // 4. Alerta de Eficiencia de Costos (Basado en transacciones vs presupuesto)
    const margenEsperado = presupuesto.factor_utilidad || 0;
    const margenReal = gastosReal > 0 ? ((presupuesto.total - gastosReal) / presupuesto.total) * 100 : margenEsperado;
    
    if (margenReal < margenEsperado * 0.7) {
      alertas.push({
        tipo: 'alerta',
        proyecto: presupuesto.proyecto,
        mensaje: `Rentabilidad comprometida: El margen real (${margenReal.toFixed(1)}%) es significativamente menor al esperado (${margenEsperado}%).`
      });
    }

    // 5. Salud Financiera Global (Solo se agrega si hay transacciones relevantes)
    const salud = CoreEngineService.analizarSaludFinanciera(transacciones);
    if (salud.estado !== 'buena') {
      salud.alertas.forEach((msg: string) => {
        alertas.push({
          tipo: salud.estado === 'critica' ? 'alerta' : 'sugerencia',
          proyecto: 'Global / Personal',
          mensaje: msg
        });
      });
    }

    return alertas;
  }
};
