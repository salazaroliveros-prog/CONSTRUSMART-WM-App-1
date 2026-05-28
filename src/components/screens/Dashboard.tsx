import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import GanttView from '@/components/shared/GanttView';
import ProjectHeatMap from '@/components/shared/ProjectHeatMap';
import { CurvaSChart } from '@/components/shared/CurvaSChart';
import { fmtQ } from '@/lib/exporters';
import { CoreEngineService } from '@/services/CoreEngineService';
import { AgenteInteligente } from '@/services/ai/AgenteInteligente';
import { LayoutDashboard, BarChart3, TrendingUp, TrendingDown, DollarSign, Percent, Shield, AlertTriangle, ArrowLeft, ArrowRight, FolderKanban, Wallet, Users, ShoppingCart, PackageCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

type KPIColor = 'emerald' | 'red' | 'blue' | 'indigo' | 'purple' | 'amber' | 'teal';

const KPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: KPIColor; delay?: number }> = ({ icon: Icon, label, value, color, delay }) => {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500/90 to-emerald-600/90',
    red: 'from-red-500/90 to-red-600/90',
    blue: 'from-blue-600/90 to-blue-700/90',
    indigo: 'from-indigo-500/90 to-indigo-600/90',
    purple: 'from-purple-500/90 to-purple-600/90',
    amber: 'from-amber-500/90 to-amber-600/90',
    teal: 'from-teal-500/90 to-teal-600/90',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-3 shadow-md flex flex-col justify-center animate-fade-in-up`} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="flex items-center justify-between mb-1">
        <div className="p-1.5 rounded-lg bg-white/20"><Icon className="w-3.5 h-3.5" /></div>
      </div>
      <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
      <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{value}</div>
    </div>
  );
};

const PIE_COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

const Dashboard: React.FC = () => {
  const { presupuestos, transacciones, proveedores, ordenesCompra, setView, transicionFase } = useAppContext();
  const [pagina, setPagina] = useState(0);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [filtroProyecto, setFiltroProyecto] = useState('todos');
  const totalPaginas = 3;

  const presupuestosFiltrados = useMemo(
    () => (filtroProyecto === 'todos' ? presupuestos : presupuestos.filter(p => p.id === filtroProyecto)),
    [filtroProyecto, presupuestos]
  );

  const transaccionesFiltradas = useMemo(
    () => (filtroProyecto === 'todos' ? transacciones : transacciones.filter(t => t.proyectoId === filtroProyecto)),
    [filtroProyecto, transacciones]
  );

  const stats = useMemo(() => {
    const ingresos = transaccionesFiltradas.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.costoTotal, 0);
    const gastos = transaccionesFiltradas.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.costoTotal, 0);
    const totalPresupuestado = presupuestosFiltrados.reduce((sum, p) => sum + (p.total || 0), 0);
    const ocPendientes = ordenesCompra.filter(oc => ['pendiente', 'aprobada', 'recibida_parcial'].includes(oc.estatus)).length;
    const rentabilidad = ingresos === 0 ? 0 : ((ingresos - gastos) / ingresos) * 100;
    return { ingresos, gastos, balance: ingresos - gastos, activos: presupuestosFiltrados.length, rentabilidad, ocPendientes, totalPresupuestado };
  }, [transaccionesFiltradas, presupuestosFiltrados, ordenesCompra]);

  const curvaSData = useMemo(
    () => CoreEngineService.calcularCurvaS(presupuestosFiltrados, transaccionesFiltradas),
    [presupuestosFiltrados, transaccionesFiltradas]
  );

  const flujoMensual = useMemo(() => {
    const byMes: Record<string, { mes: string; ingresos: number; gastos: number }> = {};
    transaccionesFiltradas.forEach(t => {
      const mes = t.fecha?.slice(0, 7) || 'sin-fecha';
      if (!byMes[mes]) {
        byMes[mes] = { mes, ingresos: 0, gastos: 0 };
      }
      if (t.tipo === 'ingreso') byMes[mes].ingresos += t.costoTotal;
      else byMes[mes].gastos += t.costoTotal;
    });
    return Object.values(byMes).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [transaccionesFiltradas]);

  const gastosPorCategoria = useMemo(() => {
    const categorias: Record<string, number> = {};
    transaccionesFiltradas.filter(t => t.tipo === 'gasto').forEach(t => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.costoTotal;
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  }, [transaccionesFiltradas]);

  useEffect(() => {
    let activo = true;
    const cargarAlertas = async () => {
      const resultados = await Promise.all(
        presupuestos.map(p => AgenteInteligente.diagnosticarProyecto(p, transacciones))
      );
      if (activo) setAlertas(resultados.flat());
    };
    cargarAlertas();
    return () => { activo = false; };
  }, [presupuestos, transacciones]);

  const nextPage = useCallback(() => setPagina(p => (p + 1) % totalPaginas), [totalPaginas]);
  const prevPage = useCallback(() => setPagina(p => (p - 1 + totalPaginas) % totalPaginas), [totalPaginas]);

  // Optimización responsive: en pantallas pequeñas, forzar vista de lista simple en lugar de rejilla compleja
  // Responsive layout — en móvil usamos scroll vertical en lugar de grid fijo
  const layoutClass = "min-h-dvh flex flex-col p-1 sm:p-3 overflow-x-hidden animate-fadeIn";
  const gridClass = "grid grid-cols-12 gap-1 sm:gap-3";

  return (
    <PageShell title="Panel de Control">
      {/* Mobile Filter Bar - compacto para móvil */}
      <div className="flex sm:hidden items-center gap-1 px-1 pb-1 sticky top-[57px] z-10 bg-background">
        <button onClick={prevPage} className="p-2 rounded hover:bg-accent dark:hover:bg-accent text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex gap-1">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button key={i} onClick={() => setPagina(i)} className={`w-3 h-3 rounded-full transition ${i === pagina ? 'bg-blue-700 dark:bg-blue-400' : 'bg-muted dark:bg-muted'}`} />
          ))}
        </div>
        <button onClick={nextPage} className="p-2 rounded hover:bg-accent dark:hover:bg-accent text-muted-foreground"><ArrowRight className="w-4 h-4" /></button>
        <div className="flex-1" />
        <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)} className="select-standard text-[10px] max-w-[120px] truncate">
          <option value="todos">Todos</option>
          {presupuestos.map(p => <option key={p.id} value={p.id} className="truncate">{p.proyecto}</option>)}
        </select>
      </div>
      <div className={layoutClass}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden xs:block">Página {pagina + 1} / {totalPaginas}</span>
            <button onClick={prevPage} className="p-1.5 rounded hover:bg-accent dark:hover:bg-accent text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button key={i} onClick={() => setPagina(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === pagina ? 'bg-blue-700 dark:bg-blue-400' : 'bg-muted dark:bg-muted'}`} />
              ))}
            </div>
            <button onClick={nextPage} className="p-1.5 rounded hover:bg-accent dark:hover:bg-accent text-muted-foreground"><ArrowRight className="w-4 h-4" /></button>
          </div>
          <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)} className="select-standard">
            <option value="todos">Todos los proyectos</option>
            {presupuestos.map(p => <option key={p.id} value={p.id}>{p.proyecto}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pagina === 0 && (
            <div className={gridClass}>
              <div className="col-span-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <KPI icon={TrendingUp} label="Ingresos" value={fmtQ(stats.ingresos)} color="emerald" delay={100} />
                <KPI icon={TrendingDown} label="Gastos" value={fmtQ(stats.gastos)} color="red" delay={200} />
                <KPI icon={Wallet} label="Balance" value={fmtQ(stats.balance)} color={stats.balance >= 0 ? 'blue' : 'red'} delay={300} />
                <KPI icon={FolderKanban} label="Proyectos" value={String(stats.activos)} color="indigo" delay={400} />
                <KPI icon={Percent} label="Rentab." value={`${stats.rentabilidad.toFixed(1)}%`} color={stats.rentabilidad >= 0 ? 'teal' : 'amber'} delay={500} />
                <button onClick={() => setView('compras')} className="text-left"><KPI icon={ShoppingCart} label="OC Pend." value={String(stats.ocPendientes)} color="purple" delay={600} /></button>
              </div>
              
              <div className="col-span-12 lg:col-span-7 bg-card rounded-xl shadow-sm border p-3 flex flex-col min-h-[200px] sm:min-h-[250px] animate-slide-right">
                <h3 className="font-bold text-xs text-card-foreground mb-2 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-blue-700" />Análisis de Valor Ganado (Curva S)</h3>
                <div className="flex-1 min-h-0">
                  <CurvaSChart data={curvaSData} />
                </div>
              </div>
              
              <div className="col-span-12 lg:col-span-5 bg-card rounded-xl shadow-sm border p-3 flex flex-col min-h-[200px] sm:min-h-[250px] animate-slide-right">
                <h3 className="font-bold text-xs text-card-foreground mb-2 flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5 text-blue-700" />Proyectos en Gantt</h3>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <GanttView />
                </div>
              </div>
            </div>
          )}

          {pagina === 1 && (
            <div className="grid grid-cols-12 gap-3 h-full">
              <div className="col-span-12 lg:col-span-7 bg-card rounded-xl shadow-md p-3 flex flex-col min-h-[200px] animate-slide-right">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-700" />Flujo de Caja Mensual</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10, backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                      <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name="Ingresos" />
                      <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 bg-card rounded-xl shadow-md p-3 flex flex-col min-h-[200px] animate-slide-right">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-blue-700" />Gastos por Categoría</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gastosPorCategoria} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {gastosPorCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10, backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 bg-card rounded-xl shadow-md p-3 animate-slide-right">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-blue-700" />Comparativa Mensual</h3>
                <div className="h-28 sm:h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10, backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                      <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="gastos" fill="#EF4444" name="Gastos" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {pagina === 2 && (
            <div className="grid grid-cols-12 gap-3 h-full">
              <div className="col-span-12 lg:col-span-7 bg-card rounded-xl shadow-md p-3 flex flex-col animate-scale-in">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-700" />Rentabilidad por Proyecto</h3>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <ProjectHeatMap />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 bg-card rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" />Alertas Inteligentes</h3>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
                  {alertas.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground text-center py-6">Sin alertas activas</div>
                  ) : (
                    alertas.map((a, i) => (
                        <div key={i} className={`text-[10px] p-2 rounded flex items-start gap-1.5 ${a.tipo === 'alerta' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          <div>
                            <strong>{a.proyecto}:</strong> {a.mensaje}
                            {a.tipo === 'sugerencia' && (
                              <button onClick={() => transicionFase(presupuestos.find(p => p.proyecto === a.proyecto)?.id || '', 'ejecución')} className="block text-[9px] mt-1 underline">
                                Activar proyecto ahora
                              </button>
                            )}
                          </div>
                        </div>
                    ))
                  )}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4 bg-card rounded-xl shadow-md p-3">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-700" />Resumen de Clientes</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Total presupuestado</span><strong>{fmtQ(stats.totalPresupuestado)}</strong></div>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Proyectos activos</span><strong>{stats.activos}</strong></div>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Balance neto</span><strong className={stats.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{fmtQ(stats.balance)}</strong></div>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Rentabilidad</span><strong className={stats.rentabilidad >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{stats.rentabilidad.toFixed(1)}%</strong></div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4 bg-card rounded-xl shadow-md p-3">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-blue-700" />Últimas Transacciones</h3>
                <div className="space-y-1 overflow-y-auto max-h-32">
                  {transacciones.slice(-5).reverse().map(t => (
                    <div key={t.id} className="flex justify-between text-[10px] border-b border-border dark:border-border pb-0.5">
                      <span className="truncate flex-1">{t.descripcion || t.categoria}</span>
                      <span className={t.tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                        {t.tipo === 'ingreso' ? '+' : '-'}{fmtQ(t.costoTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4 bg-card rounded-xl shadow-md p-3">
                <h3 className="font-bold text-xs text-card-foreground mb-1 flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5 text-purple-700" />OC Recientes</h3>
                <div className="space-y-1 overflow-y-auto max-h-32">
                  {ordenesCompra.slice(-5).reverse().map(oc => (
                    <div key={oc.id} className="flex justify-between text-[10px] border-b border-border dark:border-border pb-0.5">
                      <span className="truncate flex-1">{oc.folio} — {proveedores.find(p => p.id === oc.proveedorId)?.nombre || '—'}</span>
                      <span className="font-semibold">{fmtQ(oc.total)}</span>
                    </div>
                  ))}
                  {ordenesCompra.length === 0 && (
                    <div className="text-[10px] text-muted-foreground text-center py-4">Sin órdenes de compra</div>
                  )}
                </div>
                <button onClick={() => setView('compras')} className="mt-2 text-[10px] text-blue-600 hover:text-blue-700 font-medium">Ir a Compras →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default React.memo(Dashboard);
