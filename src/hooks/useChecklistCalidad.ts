/**
 * useChecklistCalidad - Hook para checklists de calidad
 */

import { useState, useCallback, useEffect } from 'react';
import { ChecklistService } from '@/services/presupuestos/ChecklistService';
import { useAppContext } from '@/contexts/AppContext';
import {
  crearChecklistFase,
  completarItem,
  descompleterItem,
  generarResumenChecklist,
  puedeAvanzarFase,
  type ChecklistFase,
  type ChecklistItem,
} from '@/utils/checklistCalidad';
import { crearNotificacion } from '@/utils/notificaciones';

export function useChecklistCalidad(presupuesto_id: string, tipologia: string) {
  const { session } = useAppContext();
  const [checklists, setChecklists] = useState<ChecklistFase[]>([]);

  useEffect(() => {
    if (!presupuesto_id) return;
    const cargar = async () => {
      try {
        const data = await ChecklistService.getChecklist(presupuesto_id);
        if (data && data.length > 0) {
          const agrupados: Record<string, ChecklistFase> = {};
          for (const item of data) {
            const fase = item.fase;
            if (!agrupados[fase]) {
              agrupados[fase] = {
                id: `${presupuesto_id}-${fase}`,
                presupuesto_id,
                fase,
                tipologia,
                items: [],
                fecha_creacion: new Date(item.created_at),
                bloqueado: false,
                intento_avance_sin_completar: 0,
              };
            }
            agrupados[fase].items.push({
              id: item.id,
              titulo: item.item,
              descripcion: '',
              requerido: true,
              completado: item.completado,
              completado_por: item.completado_por,
              fecha_completado: item.completado_en ? new Date(item.completado_en) : undefined,
              notas: undefined,
            } as ChecklistItem);
          }
          setChecklists(Object.values(agrupados));
        }
      } catch (error) {
        console.error('Error al cargar checklists:', error);
      }
    };
    cargar();
  }, [presupuesto_id, tipologia]);

  const crearParaFase = useCallback(
    async (fase: 'planeación' | 'ejecución' | 'finalizado') => {
      const checklist = crearChecklistFase(presupuesto_id, fase, tipologia);
      setChecklists(prev => [...prev, checklist]);

      const itemsToInsert = checklist.items.map(item => ({
        presupuesto_id,
        fase,
        item: item.titulo,
        completado: false,
      }));

      await ChecklistService.addItems(itemsToInsert);

      return checklist;
    },
    [presupuesto_id, tipologia]
  );

  const completar = useCallback(
    async (checklist_id: string, item_id: string, completado_por: string, fotos?: string[], firma?: string, notas?: string) => {
      const updated = checklists.map(c =>
        c.id === checklist_id
          ? completarItem(c, item_id, completado_por, fotos, firma, notas)
          : c
      );
      setChecklists(updated);
      
      await ChecklistService.toggleItem(item_id, true, session?.user?.id || null);

      const checklistActualizado = updated.find(c => c.id === checklist_id);
      if (checklistActualizado && session?.user.id) {
        const todosCompletos = checklistActualizado.items.every(i => i.completado);
        if (todosCompletos) {
          crearNotificacion(session.user.id, 'exito', `Checklist completado: ${checklistActualizado.fase}`);
        }
      }
    },
    [checklists, session]
  );

  const descompletar = useCallback(
    async (checklist_id: string, item_id: string) => {
      const updated = checklists.map(c =>
        c.id === checklist_id ? descompleterItem(c, item_id) : c
      );
      setChecklists(updated);
      await ChecklistService.toggleItem(item_id, false, null);
    },
    [checklists]
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
