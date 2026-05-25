/**
 * useChecklistCalidad - Hook para checklists de calidad
 */

import { useState, useCallback } from 'react';
import {
  crearChecklistFase,
  completarItem,
  descompleterItem,
  generarResumenChecklist,
  puedeAvanzarFase,
  type ChecklistFase,
} from '@/utils/checklistCalidad';

export function useChecklistCalidad(presupuesto_id: string, tipologia: string) {
  const [checklists, setChecklists] = useState<ChecklistFase[]>([]);

  const crearParaFase = useCallback(
    (fase: 'planeación' | 'ejecución' | 'finalizado') => {
      const checklist = crearChecklistFase(presupuesto_id, fase, tipologia);
      setChecklists(prev => [...prev, checklist]);
      return checklist;
    },
    [presupuesto_id, tipologia]
  );

  const completar = useCallback(
    (checklist_id: string, item_id: string, completado_por: string, fotos?: string[], firma?: string, notas?: string) => {
      setChecklists(prev =>
        prev.map(c =>
          c.id === checklist_id
            ? completarItem(c, item_id, completado_por, fotos, firma, notas)
            : c
        )
      );
    },
    []
  );

  const descompletar = useCallback(
    (checklist_id: string, item_id: string) => {
      setChecklists(prev =>
        prev.map(c =>
          c.id === checklist_id ? descompleterItem(c, item_id) : c
        )
      );
    },
    []
  );

  const verificarAvance = useCallback(
    (checklist_id: string) => {
      const checklist = checklists.find(c => c.id === checklist_id);
      if (!checklist) return { autorizado: false, razones: [] };
      return puedeAvanzarFase(checklist);
    },
    [checklists]
  );

  return {
    checklists,
    crearParaFase,
    completar,
    descompletar,
    verificarAvance,
    generarResumenChecklist,
  };
}
