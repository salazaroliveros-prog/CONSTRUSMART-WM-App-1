import { describe, it, expect, vi } from 'vitest';
import { reporteSemanal } from './reportesAutomaticos';
import type { Presupuesto, Transaccion } from '@/types/supabase';

vi.mock('./excelUtils', () => ({
  createWorkbook: vi.fn(() => ({})),
  addAOASheet: vi.fn(),
  saveWorkbook: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('reporteSemanal', () => {
  it('debería calcular correctamente las métricas semanales', async () => {
    const presupuestos: Presupuesto[] = [
      { id: '1', fase: 'ejecución' } as unknown as Presupuesto,
      { id: '2', fase: 'planeación' } as unknown as Presupuesto,
    ];
    
    const fechaReciente = new Date().toISOString();
    const transacciones: Transaccion[] = [
      { fecha: fechaReciente, tipo: 'ingreso', costoTotal: 100 } as unknown as Transaccion,
      { fecha: fechaReciente, tipo: 'gasto', costoTotal: 50 } as unknown as Transaccion,
    ];

    const result = await reporteSemanal(presupuestos, transacciones);
    expect(result).toBe(true);
  });
});
