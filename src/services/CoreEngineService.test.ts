import { describe, it, expect } from 'vitest';
import { CoreEngineService } from './CoreEngineService';
import type { Transaccion } from '@/types/supabase';

const mockTransaccion = (overrides: Partial<Transaccion> = {}): Transaccion => ({
  id: '1',
  tipo: 'ingreso',
  descripcion: 'Test',
  cantidad: 1,
  unidad: 'global',
  categoria: 'materiales',
  costoUnitario: 100,
  costoTotal: 100,
  fecha: new Date().toISOString().split('T')[0],
  proyectoId: 'proy-1',
  ...overrides,
});

describe('CoreEngineService', () => {
  describe('proyectarCashflow', () => {
    it('debe retornar array vacío si no hay transacciones', () => {
      const result = CoreEngineService.proyectarCashflow([], 0, 30);
      expect(result).toHaveLength(30);
      expect(result[0].saldo).toBe(0);
    });

    it('debe proyectar con saldo inicial positivo', () => {
      const result = CoreEngineService.proyectarCashflow([], 5000, 10);
      expect(result[0].saldoAcumulado).toBe(5000);
    });

    it('debe proyectar con saldo inicial y transacciones', () => {
      const txs = [
        mockTransaccion({ tipo: 'gasto', costoTotal: 8000, categoria: 'administrativo', fecha: '2026-06-01' }),
      ];
      const result = CoreEngineService.proyectarCashflow(txs, 1000, 15);
      expect(result.length).toBe(15);
      expect(result[0].saldoAcumulado).toBeGreaterThan(0);
    });
  });

  describe('detectarAlertas', () => {
    it('debe retornar alertas si hay déficit en 15 días', () => {
      const proyecciones = Array.from({ length: 15 }, (_, i) => ({
        fecha: new Date(Date.now() + i * 86400000),
        ingresos: 0,
        egresos: 0,
        saldo: -1000,
        saldoAcumulado: -1000 * (i + 1),
        esCritico: true,
      }));
      const alertas = CoreEngineService.detectarAlertas(proyecciones);
      expect(alertas.length).toBeGreaterThan(0);
      expect(alertas.some(a => a.includes('déficit'))).toBe(true);
    });

    it('no debe generar alertas sin déficit', () => {
      const proyecciones = Array.from({ length: 30 }, (_, i) => ({
        fecha: new Date(Date.now() + i * 86400000),
        ingresos: 1000,
        egresos: 500,
        saldo: 500,
        saldoAcumulado: 500 * (i + 1),
        esCritico: false,
      }));
      const alertas = CoreEngineService.detectarAlertas(proyecciones);
      expect(alertas.length).toBe(0);
    });
  });

  describe('detectarRecurrencias', () => {
    it('debe agrupar transacciones por tipo_categoria', () => {
      const txs = [
        mockTransaccion({ tipo: 'ingreso', categoria: 'materiales' }),
        mockTransaccion({ tipo: 'gasto', categoria: 'mano-obra' }),
        mockTransaccion({ tipo: 'ingreso', categoria: 'materiales', id: '2' }),
      ];
      const grupos = CoreEngineService.detectarRecurrencias(txs);
      expect(grupos.size).toBe(2);
      expect(grupos.get('ingreso_materiales')).toHaveLength(2);
    });
  });

  describe('calcularFrecuencia', () => {
    it('debe detectar frecuencia diaria', () => {
      const hoy = new Date('2026-06-01');
      const fechas = [hoy, new Date('2026-06-02'), new Date('2026-06-03')];
      expect(CoreEngineService.calcularFrecuencia(fechas)).toBe('diaria');
    });

    it('debe detectar frecuencia semanal', () => {
      const hoy = new Date('2026-06-01');
      const fechas = [hoy, new Date('2026-06-08'), new Date('2026-06-15')];
      expect(CoreEngineService.calcularFrecuencia(fechas)).toBe('semanal');
    });

    it('debe retornar irregular con 1 fecha', () => {
      expect(CoreEngineService.calcularFrecuencia([new Date()])).toBe('irregular');
    });
  });

  describe('proyectarTendencia', () => {
    it('debe calcular tendencias sin transacciones', () => {
      const result = CoreEngineService.proyectarTendencia([]);
      expect(result.dias30).toBe(0);
      expect(result.dias60).toBe(0);
      expect(result.dias90).toBe(0);
    });
  });

  describe('analizarSaludFinanciera', () => {
    it('debe retornar buena salud sin transacciones', () => {
      const salud = CoreEngineService.analizarSaludFinanciera([]);
      expect(salud.estado).toBe('buena');
    });

    it('debe detectar salud critica si gasto personal >80% utilidad bruta', () => {
      const txs = [
        mockTransaccion({ tipo: 'ingreso', costoTotal: 10000, categoria: 'materiales', fecha: '2026-06-01' }),
        mockTransaccion({ tipo: 'gasto', costoTotal: 8000, categoria: 'personal', id: '2', fecha: '2026-06-01' }),
        mockTransaccion({ tipo: 'gasto', costoTotal: 1000, categoria: 'administrativo', id: '3', fecha: '2026-06-01' }),
      ];
      const salud = CoreEngineService.analizarSaludFinanciera(txs);
      expect(salud.estado).toBe('critica');
    });
  });
});