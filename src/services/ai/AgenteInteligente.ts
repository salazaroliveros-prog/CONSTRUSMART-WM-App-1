import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';
import { CoreEngineService } from '@/services/CoreEngineService';

export const AgenteInteligente = {
  /**
   * Analiza la salud del proyecto y genera alertas proactivas.
   * Proporciona sugerencias para la activación automática del proyecto.
   */
  async diagnosticarProyecto(presupuesto: any, transacciones: any[]) {
    const gastosReal = transacciones
      .filter(t => t.proyectoId === presupuesto.id && t.tipo === 'gasto')
      .reduce((s: number, t: any) => s + (t.costoTotal || 0), 0);
      
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

    // 3. Salud Financiera Global (Solo se agrega si hay transacciones relevantes)
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
