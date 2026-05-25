import { describe, it, expect, vi } from 'vitest';
import { reporteSemanal } from './reportesAutomaticos';
import type { Presupuesto, Transaccion } from '@/types/supabase';

// Mock de la librería XLSX
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(),
    aoa_to_sheet: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

// Mock del toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('reporteSemanal', () => {
  it('debería calcular correctamente las métricas semanales', () => {
    const presupuestos: Presupuesto[] = [
      { id: '1', fase: 'ejecución' } as unknown as Presupuesto,
      { id: '2', fase: 'planeación' } as unknown as Presupuesto,
    ];
    
    const fechaReciente = new Date().toISOString();
    const transacciones: Transaccion[] = [
      { fecha: fechaReciente, tipo: 'ingreso', costoTotal: 100 } as unknown as Transaccion,
      { fecha: fechaReciente, tipo: 'gasto', costoTotal: 50 } as unknown as Transaccion,
    ];

    const result = reporteSemanal(presupuestos, transacciones);
    expect(result).toBe(true);
  });
});
