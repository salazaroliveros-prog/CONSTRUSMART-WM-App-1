import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';
import { FinancieroService } from '@/services/financiero/FinancieroService';

export const AgenteInteligente = {
  /**
   * Analiza la salud del proyecto y genera alertas proactivas.
   */
  async diagnosticarProyecto(presupuesto: any, transacciones: any[]) {
    const gastosReal = transacciones
      .filter(t => t.proyectoId === presupuesto.id && t.tipo === 'gasto')
      .reduce((s, t) => s + t.costoTotal, 0);
      
    const desviacion = PresupuestosService.analizarDesviacion(presupuesto, gastosReal);
    
    const alertas = [];
    
    // 1. Alerta financiera
    if (desviacion.nivelAlerta === 'critico') {
      alertas.push({
        tipo: 'warning',
        titulo: `Riesgo Crítico: ${presupuesto.proyecto}`,
        mensaje: `Has superado el 90% del presupuesto. Exceso actual: ${desviacion.exceso.toLocaleString()}`
      });
    }

    // 2. Alerta de rendimiento físico/financiero (si el avance financiero va muy rápido)
    if (presupuesto.avanceFinanciero > presupuesto.avance_fisico + 20) {
      alertas.push({
        tipo: 'alerta',
        titulo: `Desfase Operativo: ${presupuesto.proyecto}`,
        mensaje: `El gasto financiero (${presupuesto.avanceFinanciero}%) supera al avance físico (${presupuesto.avance_fisico}%) por más del 20%.`
      });
    }

    return alertas;
  }
};
