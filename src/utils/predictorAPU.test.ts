import { describe, it, expect } from 'vitest';
import { sugerirAPU } from './predictorAPU';
import type { Presupuesto } from '@/types/supabase';

describe('sugerirAPU', () => {
  it('debería retornar una lista vacía si no hay proyectos relacionados', () => {
    const presupuestos: Presupuesto[] = [];
    const result = sugerirAPU(presupuestos, 'residencial');
    expect(result).toHaveLength(0);
  });

  it('debería calcular correctamente los promedios de proyectos relacionados', () => {
    const presupuestos: Partial<Presupuesto>[] = [
      { tipologia: 'residencial', factor_indirectos: 10, factor_administrativos: 5, factor_imprevistos: 5, factor_utilidad: 10, total: 1000 },
      { tipologia: 'residencial', factor_indirectos: 20, factor_administrativos: 15, factor_imprevistos: 5, factor_utilidad: 20, total: 2000 },
    ];
    
    // Asumimos que los tipos son compatibles con el mock
    const result = sugerirAPU(presupuestos as Presupuesto[], 'residencial');
    expect(result).toHaveLength(2);
    expect(result[0].tipo).toBe('factor');
    // Indirectos: (10+20)/2 = 15
    expect(result[0].valor).toMatchObject({ factor_indirectos: 15 });
  });
});
