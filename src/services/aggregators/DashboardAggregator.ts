// src/services/aggregators/DashboardAggregator.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Proyecto = Database['public']['Tables']['proyectos']['Row'];
type Transaccion = Database['public']['Tables']['transacciones']['Row'];
type OrdenCompra = Database['public']['Tables']['ordenes_compra']['Row'];

export const DashboardAggregator = {
  async getKPIs() {
    // Income, Expenses, Balance
    const { data: transacciones, error: errorTransacciones } = await supabase
      .from('transacciones')
      .select('tipo, costo_total')
      .limit(1000); // Limit to avoid excessive data fetching

    if (errorTransacciones) throw errorTransacciones;

    const ingresos = transacciones?.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const gastos = transacciones?.filter(t => t.tipo === 'gasto').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const balance = ingresos - gastos;

    // Total Projects (count)
    const { count: totalProyectos, error: errorProyectos } = await supabase
      .from('proyectos')
      .select('*', { count: 'exact', head: true });
      
    if (errorProyectos) throw errorProyectos;
      
    // Sample Projects for Rentability (simplified)
    const { data: proyectos, error: errorProyectosData } = await supabase
      .from('proyectos')
      .select('id, nombre, avance_financiero, presupuesto_total, estado') // Include state for filtering
      .limit(10); // Limit sample size

    if (errorProyectosData) throw errorProyectosData;

    const proyectosConRentabilidad = proyectos?.map(p => ({
      ...p,
      rentabilidad: p.presupuesto_total && p.presupuesto_total > 0
        ? ((p.avance_financiero ?? 0) / p.presupuesto_total) * 100
        : 0,
    }));

    // Pending Purchase Orders (count)
    const { count: countOCPendientes, error: errorOCPendientes } = await supabase
      .from('ordenes_compra')
      .select('*', { count: 'exact', head: true })
      .eq('estatus', 'pendiente');
      
    if (errorOCPendientes) throw errorOCPendientes;

    return {
      ingresos,
      gastos,
      balance,
      totalProyectos: totalProyectos ?? 0,
      proyectosResumen: proyectosConRentabilidad ?? [], // Renamed for clarity
      ordenesCompraPendientes: countOCPendientes ?? 0,
    };
  },

  async getBalanceChartData() {
    // Simplified: Fetch monthly balance for the last 12 months
    const { data: transacciones, error } = await supabase
      .from('transacciones')
      .select('tipo, costo_total, fecha')
      .gte('fecha', new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0])
      .limit(1000); // Limit for performance

    if (error) throw error;

    const monthlyBalance = transacciones?.reduce((acc, t) => {
      const date = new Date(t.fecha);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[month] = acc[month] || { ingresos: 0, gastos: 0, balance: 0 };
      if (t.tipo === 'ingreso') {
        acc[month].ingresos += t.costo_total ?? 0;
      } else {
        acc[month].gastos += t.costo_total ?? 0;
      }
      acc[month].balance = acc[month].ingresos - acc[month].gastos;
      return acc;
    }, {} as Record<string, { ingresos: number; gastos: number; balance: number }>);

    return Object.entries(monthlyBalance || {})
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  async getGastosPorCategoriaChartData() {
     const { data: transacciones, error } = await supabase
      .from('transacciones')
      .select('categoria, costo_total')
      .eq('tipo', 'gasto')
      .limit(1000); // Limit for performance

     if (error) throw error;

     const gastosPorCategoria = transacciones?.reduce((acc, t) => {
        const cat = t.categoria ?? 'Sin Categoría';
        acc[cat] = (acc[cat] || 0) + (t.costo_total ?? 0);
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(gastosPorCategoria || {}).map(([categoria, total]) => ({ categoria, total }));
  }
};
