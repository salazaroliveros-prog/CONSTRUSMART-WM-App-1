/**
 * M10: Checklist de Calidad por Fase - Validaciones obligatorias
 */

export interface ChecklistItem {
  id: string;
  titulo: string;
  descripcion: string;
  requerido: boolean;
  completado: boolean;
  fecha_completado?: Date;
  completado_por?: string;
  foto_evidencia?: string[];
  firma_digital?: string;
  notas?: string;
}

export interface ChecklistFase {
  id: string;
  presupuesto_id: string;
  fase: 'planeación' | 'ejecución' | 'finalizado';
  tipologia: string;
  items: ChecklistItem[];
  fecha_creacion: Date;
  bloqueado: boolean;
  intento_avance_sin_completar: number;
}

export interface ResumenChecklist {
  total_items: number;
  items_completados: number;
  porcentaje_completacion: number;
  items_faltantes: string[];
  requiere_completo: boolean;
  puede_avanzar: boolean;
}

// Checklists predefinidos por tipología
const CHECKLISTS_PREDEFINIDOS: Record<string, Omit<ChecklistItem, 'id'>[]> = {
  'residencial': [
    {
      titulo: 'Cimentación',
      descripcion: 'Verificación de excavación, zapatas y desplante',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Estructura',
      descripcion: 'Columnas, vigas y losa de concreto',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Mampostería',
      descripcion: 'Muros levantados y horizontales',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Instalaciones',
      descripcion: 'Electricidad, plomería y sanitarios',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Acabados',
      descripcion: 'Pintura, piso y detalles',
      requerido: false,
      completado: false,
    },
  ],
  
  'comercial': [
    {
      titulo: 'Estructura metálica',
      descripcion: 'Vigas, columnas y conexiones',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Cubierta',
      descripcion: 'Láminas, impermeabilización',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Divisiones interiores',
      descripcion: 'Oficinas, baños, áreas comunes',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Sistemas HVAC',
      descripcion: 'Ventilación y aire acondicionado',
      requerido: false,
      completado: false,
    },
  ],

  'industrial': [
    {
      titulo: 'Fundaciones',
      descripcion: 'Cimentación reforzada',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Estructura de carga',
      descripcion: 'Soportes de equipos',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Pisos industriales',
      descripcion: 'Concreto y acabado',
      requerido: true,
      completado: false,
    },
  ],

  'obra-civil': [
    {
      titulo: 'Terracerías',
      descripcion: 'Movimiento de tierras',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Drenajes',
      descripcion: 'Sistema de drenaje',
      requerido: true,
      completado: false,
    },
    {
      titulo: 'Pavimentación',
      descripcion: 'Carpeta asfáltica o de concreto',
      requerido: true,
      completado: false,
    },
  ],
};

/**
 * Crear checklist para fase
 */
export function crearChecklistFase(
  presupuesto_id: string,
  fase: 'planeación' | 'ejecución' | 'finalizado',
  tipologia: string
): ChecklistFase {
  const items = (CHECKLISTS_PREDEFINIDOS[tipologia] || CHECKLISTS_PREDEFINIDOS['residencial']).map(item => ({
    ...item,
    id: crypto.randomUUID(),
  }));

  return {
    id: crypto.randomUUID(),
    presupuesto_id,
    fase,
    tipologia,
    items,
    fecha_creacion: new Date(),
    bloqueado: false,
    intento_avance_sin_completar: 0,
  };
}

/**
 * Completar un item del checklist
 */
export function completarItem(
  checklist: ChecklistFase,
  item_id: string,
  completado_por: string,
  fotos?: string[],
  firma?: string,
  notas?: string
): ChecklistFase {
  return {
    ...checklist,
    items: checklist.items.map(item =>
      item.id === item_id
        ? {
            ...item,
            completado: true,
            fecha_completado: new Date(),
            completado_por,
            foto_evidencia: fotos,
            firma_digital: firma,
            notas,
          }
        : item
    ),
  };
}

/**
 * Descompletar un item
 */
export function descompleterItem(
  checklist: ChecklistFase,
  item_id: string
): ChecklistFase {
  return {
    ...checklist,
    items: checklist.items.map(item =>
      item.id === item_id
        ? {
            ...item,
            completado: false,
            fecha_completado: undefined,
            completado_por: undefined,
            foto_evidencia: undefined,
            firma_digital: undefined,
          }
        : item
    ),
  };
}

/**
 * Generar resumen del checklist
 */
export function generarResumenChecklist(checklist: ChecklistFase): ResumenChecklist {
  const itemsRequeridos = checklist.items.filter(i => i.requerido);
  const itemsCompletados = checklist.items.filter(i => i.completado);
  const itemsRequeridosCompletados = itemsRequeridos.filter(i => i.completado);

  const porcentajeCompletacion = checklist.items.length > 0
    ? (itemsCompletados.length / checklist.items.length) * 100
    : 0;

  const itemsFaltantes = checklist.items
    .filter(i => i.requerido && !i.completado)
    .map(i => i.titulo);

  const puedeAvanzar = itemsRequeridos.length === itemsRequeridosCompletados.length;
  const requiereCompleto = itemsRequeridos.length > 0;

  return {
    total_items: checklist.items.length,
    items_completados: itemsCompletados.length,
    porcentaje_completacion: porcentajeCompletacion,
    items_faltantes: itemsFaltantes,
    requiere_completo,
    puede_avanzar,
  };
}

/**
 * Validar si puede avanzar de fase
 */
export function puedeAvanzarFase(checklist: ChecklistFase): {
  autorizado: boolean;
  razones_bloqueo: string[];
} {
  const resumen = generarResumenChecklist(checklist);

  if (resumen.puede_avanzar) {
    return { autorizado: true, razones_bloqueo: [] };
  }

  const razonesBloqueo: string[] = [];

  if (resumen.items_faltantes.length > 0) {
    razonesBloqueo.push(`Items requeridos incompletos: ${resumen.items_faltantes.join(', ')}`);
  }

  if (resumen.porcentaje_completacion < 100) {
    razonesBloqueo.push(`Solo ${resumen.porcentaje_completacion.toFixed(0)}% completado (requerido: 100% de items requeridos)`);
  }

  return {
    autorizado: false,
    razones_bloqueo: razonesBloqueo,
  };
}

/**
 * Registrar intento de avance sin completar
 */
export function registrarIntentoAvanceSinCompletar(
  checklist: ChecklistFase
): ChecklistFase {
  return {
    ...checklist,
    intento_avance_sin_completar: checklist.intento_avance_sin_completar + 1,
    bloqueado: checklist.intento_avance_sin_completar >= 3, // Bloquear después de 3 intentos
  };
}

/**
 * Generar reporte de auditoría
 */
export function generarReporteAuditoria(checklists: ChecklistFase[]): string {
  let reporte = 'REPORTE DE AUDITORÍA - CHECKLISTS POR FASE\n';
  reporte += `=${'='.repeat(80)}\n\n`;

  checklists.forEach((checklist, idx) => {
    const resumen = generarResumenChecklist(checklist);
    const { autorizado, razones_bloqueo } = puedeAvanzarFase(checklist);

    reporte += `CHECKLIST ${idx + 1}: ${checklist.fase.toUpperCase()} - ${checklist.tipologia}\n`;
    reporte += `Creado: ${checklist.fecha_creacion.toLocaleDateString('es-GT')}\n`;
    reporte += `Estado: ${autorizado ? '✅ AUTORIZADO' : '❌ BLOQUEADO'}\n`;
    reporte += `Completación: ${resumen.porcentaje_completacion.toFixed(0)}% (${resumen.items_completados}/${resumen.total_items})\n`;

    if (!autorizado) {
      reporte += `Razones de bloqueo:\n`;
      razones_bloqueo.forEach(r => {
        reporte += `  - ${r}\n`;
      });
    }

    reporte += `\nItems:\n`;
    checklist.items.forEach(item => {
      const estado = item.completado ? '✅' : '❌';
      const obligatorio = item.requerido ? '[REQUERIDO]' : '[OPCIONAL]';
      reporte += `  ${estado} ${item.titulo} ${obligatorio}\n`;
      
      if (item.completado) {
        reporte += `     Completado por: ${item.completado_por}\n`;
        reporte += `     Fecha: ${item.fecha_completado?.toLocaleDateString('es-GT')}\n`;
      }
      
      if (item.notas) {
        reporte += `     Notas: ${item.notas}\n`;
      }
    });

    reporte += `\n${'-'.repeat(80)}\n\n`;
  });

  return reporte;
}
