export const ReportesAggregator = {
  async getReporteFinancieroProyecto(proyectoId: string) {
    const { data: proyecto, error: errorProyecto } = await supabase
      .from('proyectos')
      .select('id, nombre, estado, presupuesto_total, avance_fisico, avance_financiero, ingresos, gastos, fecha_inicio, fecha_fin')
      .eq('id', proyectoId)
      .single();

    if (errorProyecto) {
      console.error('Error fetching proyecto:', errorProyecto);
      throw errorProyecto;
    }

    const { data: presupuesto, error: errorPresupuesto } = await supabase
      .from('presupuestos')
      .select('id, proyecto, subtotal, total, factor_utilidad, avance_fisico, avance_financiero, ingresos, gastos, fecha_inicio, fecha_fin')
      .eq('proyecto_id', proyectoId)
      .single();

    if (errorPresupuesto) throw errorPresupuesto;

    const { data: transacciones, error: errorTransacciones } = await supabase
      .from('transacciones')
      .select('tipo, costo_total, categoria, proyecto_id, fecha')
      .eq('proyecto_id', proyectoId);

    if (errorTransacciones) throw errorTransacciones;

    const ingresos = transacciones?.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const gastos = transacciones?.filter(t => t.tipo === 'gasto').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const balance = ingresos - gastos;

    const monthlyCashFlow = transacciones?.reduce((acc, t) => {
      const date = new Date(t.fecha);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[month] = acc[month] || { ingresos: 0, gastos: 0, balance: 0 };
      if (t.tipo === 'ingreso') acc[month].ingresos += t.costo_total ?? 0;
      else acc[month].gastos += t.costo_total ?? 0;
      acc[month].balance = acc[month].ingresos - acc[month].gastos;
      return acc;
    }, {} as Record<string, { ingresos: number; gastos: number; balance: number }>);

    return {
      proyecto,
      presupuesto,
      ingresos,
      gastos,
      balance,
      monthlyCashFlow: Object.entries(monthlyCashFlow || {})
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  },

  async getResumenGeneralFinanciero(userId: string) {
    const { data: transacciones, error: errorTransacciones } = await supabase
      .from('transacciones')
      .select('tipo, costo_total, categoria, proyecto_id, fecha')
      .eq('user_id', userId)
      .limit(1000);

    if (errorTransacciones) throw errorTransacciones;

    const ingresos = transacciones?.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const gastos = transacciones?.filter(t => t.tipo === 'gasto').reduce((acc, t) => acc + (t.costo_total ?? 0), 0) ?? 0;
    const balance = ingresos - gastos;

    const gastosPorCategoria = transacciones
      ?.filter(t => t.tipo === 'gasto')
      .reduce((acc, t) => {
        const cat = t.categoria ?? 'Sin Categoría';
        acc[cat] = (acc[cat] || 0) + (t.costo_total ?? 0);
        return acc;
      }, {} as Record<string, number>);

    const ingresosPorProyectoMap = transacciones
      ?.filter(t => t.tipo === 'ingreso')
      .reduce((acc, t) => {
        const projId = t.proyecto_id ?? 'Sin Proyecto';
        acc[projId] = (acc[projId] || 0) + (t.costo_total ?? 0);
        return acc;
      }, {} as Record<string, number>);

    const { data: proyectos, error: errorProyectos } = await supabase.from('proyectos').select('id, nombre').eq('user_id', userId);
    if (errorProyectos) console.error('Error fetching projects for income summary:', errorProyectos);

    const ingresosPorProyecto = Object.entries(ingresosPorProyectoMap || {}).map(([projectId, total]) => {
      const projectName = proyectos?.find(p => p.id === projectId)?.nombre || projectId;
      return { projectId: projectName, totalIngresos: total };
    });

    return {
      ingresosTotales: ingresos,
      gastosTotales: gastos,
      balanceGeneral: balance,
      gastosPorCategoria: Object.entries(gastosPorCategoria || {}).map(([categoria, total]) => ({ categoria, total })),
      ingresosPorProyecto,
    };
  },
};