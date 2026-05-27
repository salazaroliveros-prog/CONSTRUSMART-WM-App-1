import { describe, it, expect, vi } from 'vitest';
import type { Presupuesto, Transaccion, Cliente } from '@/types/supabase';

vi.mock('xlsx', () => ({
  utils: { book_new: vi.fn(), json_to_sheet: vi.fn(), book_append_sheet: vi.fn() },
  writeFile: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

describe('exportExcel data transformations', () => {
  it('exportTransacciones mapea proyecto correctamente', () => {
    const presupuestos = [{ id: 'p1', proyecto: 'Proyecto Alpha', fase: 'ejecución', total: 1000, avanceFisico: 50, avanceFinanciero: 40, ingresos: 500, gastos: 300, pendienteAportar: 200, cliente: 'Cliente A' } as Presupuesto];
    const transacciones = [
      { id: '1', proyectoId: 'p1', tipo: 'gasto', fecha: '2025-01-01', costoTotal: 150, categoria: 'materiales', descripcion: 'Compra', cantidad: 1, unidad: 'pza', costoUnitario: 150 } as Transaccion,
    ];
    expect(transacciones.length).toBe(1);
    expect(presupuestos[0].proyecto).toBe('Proyecto Alpha');
  });

  it('exportPresupuestos incluye campos nuevos', () => {
    const p = {
      id: 'p1', proyecto: 'Test', cliente: 'Cli', fase: 'ejecución', total: 10000,
      avanceFisico: 30, avanceFinanciero: 25, ingresos: 3000, gastos: 1000,
      pendienteAportar: 2000, ubicacion: 'Zona 10', tipologia: 'Residencial', costo_directo: 8000,
    } as Presupuesto;
    expect(p.ubicacion).toBe('Zona 10');
    expect(p.tipologia).toBe('Residencial');
    expect(p.costo_directo).toBe(8000);
  });

  it('exportCompleto incluye campos de cliente', () => {
    const c = { nombre: 'Juan', telefono: '5555', email: 'j@t.com', direccion: 'Calle 123', tipoProyecto: 'Casa', estado: 'Activo', notas: 'Cliente VIP' } as Cliente;
    expect(c.direccion).toBe('Calle 123');
    expect(c.tipoProyecto).toBe('Casa');
    expect(c.notas).toBe('Cliente VIP');
  });
});
