import { describe, it, expect } from 'vitest';
import type { Transaccion } from '@/types/supabase';

const CAT_OPERATIVO = ['materiales', 'mano-obra', 'herramienta', 'sub-contrato', 'transporte'] as const;
const CAT_ADMIN = ['administrativo', 'fijos'] as const;
const CAT_PERSONAL = ['personal', 'hogar'] as const;

function calcularProfit(transacciones: Transaccion[], proyectoId: string) {
  const txns = transacciones.filter(t => t.proyectoId === proyectoId);
  const ingresos = txns.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
  const gastosOperativos = txns.filter(t => t.tipo === 'gasto' && CAT_OPERATIVO.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
  const gastosAdmin = txns.filter(t => t.tipo === 'gasto' && CAT_ADMIN.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
  const gastosPersonal = txns.filter(t => t.tipo === 'gasto' && CAT_PERSONAL.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
  return { ingresos, gastosOperativos, gastosAdmin, gastosPersonal, margen: ingresos - gastosOperativos - gastosAdmin };
}

function calcularTotals(transacciones: Transaccion[]) {
  const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
  const gastoOperativo = transacciones.filter(t => t.tipo === 'gasto' && CAT_OPERATIVO.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
  const gastoAdmin = transacciones.filter(t => t.tipo === 'gasto' && CAT_ADMIN.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
  const gastoPersonal = transacciones.filter(t => t.tipo === 'gasto' && CAT_PERSONAL.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
  return { ingresos, gastoOperativo, gastoAdmin, gastoPersonal, neto: ingresos - gastoOperativo - gastoAdmin - gastoPersonal };
}

describe('ProfitReport calculation logic', () => {
  const baseTx = (overrides: Partial<Transaccion> = {}): Transaccion => ({
    id: '1', tipo: 'gasto', descripcion: '', cantidad: 1, unidad: '',
    categoria: 'materiales', costoUnitario: 0, costoTotal: 100,
    fecha: '2025-01-01', proyectoId: 'proy-1',
    ...overrides,
  });

  it('clasifica correctamente gastos operativos', () => {
    const txns = [
      baseTx({ id: '1', categoria: 'materiales', costoTotal: 500 }),
      baseTx({ id: '2', categoria: 'mano-obra', costoTotal: 300 }),
      baseTx({ id: '3', categoria: 'herramienta', costoTotal: 200 }),
    ];
    const result = calcularTotals(txns);
    expect(result.gastoOperativo).toBe(1000);
    expect(result.gastoAdmin).toBe(0);
    expect(result.gastoPersonal).toBe(0);
  });

  it('clasifica correctamente gastos administrativos', () => {
    const txns = [
      baseTx({ id: '1', categoria: 'administrativo', costoTotal: 400 }),
      baseTx({ id: '2', categoria: 'fijos', costoTotal: 150 }),
    ];
    const result = calcularTotals(txns);
    expect(result.gastoOperativo).toBe(0);
    expect(result.gastoAdmin).toBe(550);
    expect(result.gastoPersonal).toBe(0);
  });

  it('clasifica correctamente gastos personales', () => {
    const txns = [
      baseTx({ id: '1', categoria: 'personal', costoTotal: 200 }),
      baseTx({ id: '2', categoria: 'hogar', costoTotal: 100 }),
    ];
    const result = calcularTotals(txns);
    expect(result.gastoPersonal).toBe(300);
  });

  it('calcula ingreso y margen por proyecto', () => {
    const txns = [
      baseTx({ id: '1', proyectoId: 'proy-a', tipo: 'ingreso', costoTotal: 1000 }),
      baseTx({ id: '2', proyectoId: 'proy-a', tipo: 'gasto', categoria: 'materiales', costoTotal: 400 }),
      baseTx({ id: '3', proyectoId: 'proy-a', tipo: 'gasto', categoria: 'administrativo', costoTotal: 100 }),
    ];
    const result = calcularProfit(txns, 'proy-a');
    expect(result.ingresos).toBe(1000);
    expect(result.gastosOperativos).toBe(400);
    expect(result.gastosAdmin).toBe(100);
    expect(result.margen).toBe(500);
  });

  it('neto = ingresos - todos los gastos', () => {
    const txns = [
      baseTx({ id: '1', tipo: 'ingreso', costoTotal: 5000 }),
      baseTx({ id: '2', tipo: 'gasto', categoria: 'materiales', costoTotal: 2000 }),
      baseTx({ id: '3', tipo: 'gasto', categoria: 'administrativo', costoTotal: 500 }),
      baseTx({ id: '4', tipo: 'gasto', categoria: 'personal', costoTotal: 300 }),
    ];
    const result = calcularTotals(txns);
    expect(result.ingresos).toBe(5000);
    expect(result.gastoOperativo).toBe(2000);
    expect(result.gastoAdmin).toBe(500);
    expect(result.gastoPersonal).toBe(300);
    expect(result.neto).toBe(2200);
  });

  it('maneja transacciones vacias', () => {
    const result = calcularTotals([]);
    expect(result.ingresos).toBe(0);
    expect(result.gastoOperativo).toBe(0);
    expect(result.neto).toBe(0);
  });
});
