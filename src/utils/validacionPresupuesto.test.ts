import { describe, it, expect } from 'vitest';
import { validarFactores } from './validacionPresupuesto';

describe('validarFactores', () => {
  it('debería retornar salud "buena" con factores saludables', () => {
    const presupuesto = {
      factor_indirectos: 10,
      factor_administrativos: 5,
      factor_imprevistos: 3,
      factor_utilidad: 15,
      total: 1000,
      ingresos: 1200,
      gastos: 1000,
    };
    const result = validarFactores(presupuesto);
    expect(result.salud).toBe('buena');
    expect(result.advertencias).toHaveLength(0);
  });

  it('debería retornar salud "critica" con utilidad muy baja', () => {
    const presupuesto = {
      factor_utilidad: 3,
    };
    const result = validarFactores(presupuesto);
    expect(result.salud).toBe('critica');
  });

  it('debería detectar advertencias cuando los costos indirectos son altos', () => {
    const presupuesto = {
      factor_indirectos: 30,
      factor_administrativos: 20,
      factor_imprevistos: 15,
      factor_utilidad: 15,
    };
    const result = validarFactores(presupuesto);
    expect(result.salud).toBe('critica');
    expect(result.advertencias.length).toBeGreaterThan(0);
  });
});
