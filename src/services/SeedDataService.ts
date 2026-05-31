/**
 * Service for seeding test data to the application.
 * Centralizes all test data creation logic away from UI components.
 */
import { PresupuestosService } from './presupuestos/PresupuestosService';
import { SessionService } from './SessionService';
import type { Database } from '@/types/supabase';

export interface SeedOptions {
  verbose?: boolean;
}

export class SeedDataService {
  /**
   * Seed test projects into the database for the current authenticated user.
   * Creates 4 sample projects with various states and phases.
   */
  static async seedTestProjects(options: SeedOptions = {}): Promise<void> {
    const { verbose = false } = options;

    try {
      // Get current user
      const user = await SessionService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado. Por favor inicia sesión primero.');
      }

      if (verbose) {
        console.log('[SeedDataService] Starting seed for user:', user.id);
      }

      const presupuestosData = this.getTestProjectsData(user.id);

      if (verbose) {
        console.log(`[SeedDataService] Creating ${presupuestosData.length} test projects...`);
      }

      // Insert all projects
      await Promise.all(
        presupuestosData.map((p) => {
          if (verbose) {
            console.log(`  [SeedDataService] Creating project: "${p.proyecto}"`);
          }
          return PresupuestosService.addPresupuesto(p);
        })
      );

      if (verbose) {
        console.log('[SeedDataService] Seed completed successfully');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SeedDataService] Seed failed:', message);
      throw new Error(`Error al cargar datos de prueba: ${message}`);
    }
  }

  /**
   * Returns the hardcoded test project data.
   * Modify this to change what gets seeded.
   */
  private static getTestProjectsData(
    userId: string
  ): Array<Database['public']['Tables']['presupuestos']['Insert']> {
    return [
      {
        user_id: userId,
        proyecto: 'CONSTRUCCIÓN RESIDENCIAL VISTA AL LAGO',
        cliente: 'Carlos Méndez',
        tipologia: 'residencial',
        fase: 'planeación',
        total: 250000,
        avance_fisico: 0,
        avance_financiero: 0,
        ingresos: 0,
        gastos: 0,
        pendiente_aportar: 250000,
        fecha_inicio: '2026-06-15',
        fecha_fin: '2026-12-30',
        factor_indirectos: 15,
        factor_administrativos: 10,
        factor_imprevistos: 5,
        factor_utilidad: 10,
      },
      {
        user_id: userId,
        proyecto: 'OFICINAS COMERCIALES ZONA 10',
        cliente: 'Empresa Constructora XYZ',
        tipologia: 'comercial',
        fase: 'ejecución',
        total: 500000,
        avance_fisico: 70,
        avance_financiero: 60,
        ingresos: 300000,
        gastos: 250000,
        pendiente_aportar: 200000,
        fecha_inicio: '2026-01-10',
        fecha_fin: '2026-09-30',
        factor_indirectos: 15,
        factor_administrativos: 10,
        factor_imprevistos: 5,
        factor_utilidad: 10,
      },
      {
        user_id: userId,
        proyecto: 'CENTRO COMERCIAL SAN MIGUEL',
        cliente: 'Inversiones del Sur',
        tipologia: 'comercial',
        fase: 'pausa',
        total: 800000,
        avance_fisico: 80,
        avance_financiero: 82,
        ingresos: 656000,
        gastos: 500000,
        pendiente_aportar: 144000,
        fecha_inicio: '2025-11-01',
        fecha_fin: '2026-08-15',
        factor_indirectos: 15,
        factor_administrativos: 10,
        factor_imprevistos: 5,
        factor_utilidad: 10,
      },
      {
        user_id: userId,
        proyecto: 'BODEGA INDUSTRIAL ZONA 14',
        cliente: 'Logística Express',
        tipologia: 'industrial',
        fase: 'finalizado',
        total: 350000,
        avance_fisico: 100,
        avance_financiero: 100,
        ingresos: 350000,
        gastos: 320000,
        pendiente_aportar: 0,
        fecha_inicio: '2025-06-01',
        fecha_fin: '2026-02-28',
        factor_indirectos: 15,
        factor_administrativos: 10,
        factor_imprevistos: 5,
        factor_utilidad: 10,
      },
    ];
  }
}
