// src/services/aggregators/FinancieroAggregator.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Transaccion = Database['public']['Tables']['transacciones']['Row'];
type Proyecto = Database['public']['Tables']['proyectos']['Row'];

export const FinancieroAggregator = {
  async getResumenGeneral() {
    const { data: transacciones, error: transError } = await supabase
      .from('transacciones')
      .select('tipo, costo_total, fecha, categoria, proyecto_id')
      .limit(1000); 

    if (transError) throw transError;

    const ingresos = transacciones?.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const gastos = transacciones?.filter(t => t.tipo === 'gasto').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const balance = ingresos - gastos;
    
    const monthlyCashFlow = transacciones?.reduce((acc, t) => {
      const date = new Date(t.fecha);
      // Format month as YYYY-MM
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

    // Profitability by project
    const { data: proyectos, error: proyError } = await supabase
      .from('proyectos')
      .select('id, nombre, presupuesto_total, avance_financiero') // Correct column name
      .limit(20); // Limit projects fetched

    if (proyError) console.error("Error fetching projects for profitability:", proyError);

    const profitabilityByProject = proyectos?.map(p => {
      const ingresosProyecto = transacciones
        ?.filter(t => t.tipo === 'ingreso' && t.proyecto_id === p.id)
        .reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
      
      const gastosProyecto = transacciones
        ?.filter(t => t.tipo === 'gasto' && t.proyecto_id === p.id)
        .reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
        
      const balanceProyecto = ingresosProyecto - gastosProyecto;
      
      const margenBruto = p.presupuesto_total ? ((ingresosProyecto - gastosProyecto) / p.presupuesto_total) * 100 : 0;

      return {
        proyectoId: p.id,
        nombreProyecto: p.nombre,
        totalIngresos: ingresosProyecto,
        totalGastos: gastosProyecto,
        balanceProyecto: balanceProyecto,
        margenBruto: margenBruto,
      };
    }).sort((a, b) => (b.margenBruto ?? 0) - (a.margenBruto ?? 0)); // Sort by margin DESC

    return {
      ingresosTotales: ingresos,
      gastosTotales: gastos,
      balanceGeneral: balance,
      monthlyCashFlow: Object.entries(monthlyCashFlow || {}).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month)),
      profitabilityByProject: profitabilityByProject,
    };
  },

  async getProyeccionCashFlow(days: number = 90) {
    // Placeholder: Implement actual cash flow projection logic
    // This would involve analyzing historical trends, known future income/expenses, etc.
    // For now, just return dummy data based on recent monthly averages.
    const { data: transacciones, error } = await supabase
      .from('transacciones')
      .select('tipo, costo_total, fecha')
      .limit(1000); // Limit for calculation

    if (error) throw error;

    const monthlyData = transacciones?.reduce((acc, t) => {
      const date = new Date(t.fecha);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[month] = acc[month] || { ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') acc[month].ingresos += t.costo_total ?? 0;
      else acc[month].gastos += t.costo_total ?? 0;
      return acc;
    }, {} as Record<string, { ingresos: number; gastos: number }>);
    
    const months = Object.keys(monthlyData || {}).sort();
    const lastMonth = months[months.length - 1];
    const avgIngresos = Object.values(monthlyData || {}).reduce((sum, m) => sum + m.ingresos, 0) / months.length;
    const avgGastos = Object.values(monthlyData || {}).reduce((sum, m) => sum + m.gastos, 0) / months.length;

    let currentBalance = 0; // Need actual starting balance, fetched from somewhere
     const projection = [];
     for (let i = 1; i <= days; i++) {
       const currentDate = new Date(new Date().setDate(new Date().getDate() + i));
       const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
       // Simplified projection: add average monthly income/expense
       const monthlyIncome = monthlyData?.[month]?.ingresos ?? avgIngresos;
       const monthlyExpense = monthlyData?.[month]?.gastos ?? avgGastos;
        
       currentBalance += (monthlyIncome - monthlyExpense) / 30; // Approximate daily change
       projection.push({
         date: currentDate.toISOString().split('T')[0],
         balance: currentBalance
       });
     }
     
    return projection;
  }
};
