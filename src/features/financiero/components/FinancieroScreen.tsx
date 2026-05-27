import { CashFlowService } from '@/services/financiero/CashFlowService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useMemo, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import TransactionForm from '@/components/shared/TransactionForm';
import Calendar from '@/components/shared/Calendar';
import { fmtQ, downloadCSV, printPDF } from '@/lib/exporters';
import { Download, FileText, Trash2, TrendingUp, TrendingDown, Wallet, Filter, FileDown, Scan, DollarSign, BarChart3, PieChartIcon, ArrowLeft, ArrowRight, LineChartIcon, PiggyBank } from 'lucide-react';
import OCRFactura from '@/components/shared/OCRFactura';
import { exportTransacciones } from '@/utils/exportExcel';
import ProfitReport from './ProfitReport';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const categoriaLabels: Record<string, string> = {
  'materiales': 'Materiales',
  'mano-obra': 'Mano de Obra',
  'herramienta': 'Herramienta',
  'sub-contrato': 'Sub-Contrato',
  'administrativo': 'Administrativo',
  'personal': 'Personal',
  'transporte': 'Transporte',
  'fijos': 'Gastos Fijos',
  'hogar': 'Hogar',
  'aporte': 'Aporte',
  'trabajos-extra': 'Trabajos Extra',
};

const PIE_COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6'];
const KPIColorMap: Record<string, string> = {
  emerald: 'from-emerald-500/90 to-emerald-600/90',
  blue: 'from-blue-600/90 to-blue-700/90',
  red: 'from-red-500/90 to-red-600/90',
  purple: 'from-purple-600/90 to-purple-700/90',
  pink: 'from-pink-600/90 to-pink-700/90',
  teal: 'from-teal-500/90 to-teal-600/90',
};

const KPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-gradient-to-br ${KPIColorMap[color]} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
    <div className="flex items-center justify-between mb-1">
      <div className="p-1.5 rounded-lg bg-white/20"><Icon className="w-3.5 h-3.5" /></div>
    </div>
    <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
    <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{value}</div>
  </div>
);

const FinancieroScreen: React.FC = () => {
  const { transacciones, presupuestos, deleteTransaccion } = useAppContext();
  const proyeccion = useMemo(() => CashFlowService.proyectarTendencia(transacciones), [transacciones]);
  const [filterTipo, setFilterTipo] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [filterCat, setFilterCat] = useState<string>('todos');
  const [filterProy, setFilterProy] = useState<string>('todos');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const totalPaginas = 3;

  const filtered = transacciones.filter(t => {
    if (filterTipo !== 'todos' && t.tipo !== filterTipo) return false;
    if (filterCat !== 'todos' && t.categoria !== filterCat) return false;
    if (filterProy !== 'todos' && t.proyectoId !== filterProy) return false;
    return true;
  });

  const stats = useMemo(() => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const operativos = transacciones.filter(t => t.tipo === 'gasto' && ['materiales', 'mano-obra', 'herramienta', 'sub-contrato', 'transporte'].includes(t.categoria)).reduce((s, t) => s + t.costoTotal, 0);
    const administrativos = transacciones.filter(t => t.tipo === 'gasto' && ['administrativo', 'fijos'].includes(t.categoria)).reduce((s, t) => s + t.costoTotal, 0);
    const personales = transacciones.filter(t => t.tipo === 'gasto' && ['personal', 'hogar'].includes(t.categoria)).reduce((s, t) => s + t.costoTotal, 0);
    return { ingresos, gastos, operativos, administrativos, personales, balance: ingresos - gastos };
  }, [transacciones]);

  const porCategoria = useMemo(() => {
    const data: Record<string, number> = {};
    transacciones.filter(t => t.tipo === 'gasto').forEach(t => {
      data[t.categoria] = (data[t.categoria] || 0) + t.costoTotal;
    });
    return Object.entries(data).map(([k, v]) => ({ name: categoriaLabels[k] || k, value: v }));
  }, [transacciones]);

  const flujoMensual = useMemo(() => {
    const map: Record<string, { ingresos: number; gastos: number }> = {};
    transacciones.forEach(t => {
      const mes = t.fecha?.slice(0, 7);
      if (!mes) return;
      if (!map[mes]) map[mes] = { ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') map[mes].ingresos += t.costoTotal;
      else map[mes].gastos += t.costoTotal;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([mes, v]) => ({ mes, ...v }));
  }, [transacciones]);

  const getProyectoNombre = (id: string) => {
    if (id === 'admin') return 'Administrativo';
    if (id === 'personal') return 'Personal';
    return presupuestos.find(p => p.id === id)?.proyecto || '—';
  };

  const nextPage = useCallback(() => setPagina(p => (p + 1) % totalPaginas), []);
  const prevPage = useCallback(() => setPagina(p => (p - 1 + totalPaginas) % totalPaginas), []);

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Control Financiero - CONSTRUCTORA WM/M&S'],
      [`Fecha: ${new Date().toLocaleDateString('es-GT')}`],
      [],
      ['Fecha', 'Tipo', 'Proyecto', 'Descripción', 'Categoría', 'Cantidad', 'Unidad', 'Costo Unit.', 'Total'],
      ...filtered.map(t => [t.fecha, t.tipo, getProyectoNombre(t.proyectoId), t.descripcion, categoriaLabels[t.categoria], t.cantidad, t.unidad, t.costoUnitario, t.costoTotal]),
    ];
    downloadCSV(`control_financiero_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const handleExportPDF = () => {
    const body = `
      <h2>Resumen General</h2>
      <table>
        <tr><th style="width:60%">Concepto</th><th class="num">Monto (Q)</th></tr>
        <tr><td>Total Ingresos</td><td class="num">${fmtQ(stats.ingresos)}</td></tr>
        <tr><td>Gastos Operativos</td><td class="num">${fmtQ(stats.operativos)}</td></tr>
        <tr><td>Gastos Administrativos</td><td class="num">${fmtQ(stats.administrativos)}</td></tr>
        <tr><td>Gastos Personales</td><td class="num">${fmtQ(stats.personales)}</td></tr>
        <tr class="total-row"><td>BALANCE FINAL</td><td class="num">${fmtQ(stats.balance)}</td></tr>
      </table>
      <h2>Detalle de Transacciones</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Proyecto</th><th>Descripción</th><th>Categoría</th><th class="num">Total</th></tr></thead>
        <tbody>${filtered.map(t => `<tr><td>${t.fecha}</td><td>${t.tipo}</td><td>${getProyectoNombre(t.proyectoId)}</td><td>${t.descripcion}</td><td>${categoriaLabels[t.categoria]}</td><td class="num">${fmtQ(t.costoTotal)}</td></tr>`).join('')}</tbody>
      </table>
    `;
    printPDF('Informe de Control Financiero', body);
  };

  return (
    <PageShell showHome={false} title="Control de Planilla, Gastos Operativos y Personales">
      <div className="min-h-dvh flex flex-col p-2 sm:p-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Página {pagina + 1} / {totalPaginas}</span>
            <button onClick={prevPage} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex gap-1">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button key={i} onClick={() => setPagina(i)} className={`w-2 h-2 rounded-full transition ${i === pagina ? 'bg-blue-700' : 'bg-slate-300'}`} />
              ))}
            </div>
            <button onClick={nextPage} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {pagina === 0 && (
            <div className="grid grid-cols-12 gap-3 h-full">
              <div className="col-span-12 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
                <KPI icon={TrendingUp} label="Ingresos" value={fmtQ(stats.ingresos)} color="emerald" />
                <KPI icon={TrendingDown} label="Operativos" value={fmtQ(stats.operativos)} color="blue" />
                <KPI icon={Wallet} label="Administrativos" value={fmtQ(stats.administrativos)} color="purple" />
                <KPI icon={Wallet} label="Personales" value={fmtQ(stats.personales)} color="pink" />
                <KPI icon={TrendingUp} label="Balance" value={fmtQ(stats.balance)} color={stats.balance >= 0 ? 'teal' : 'red'} />
              </div>
              <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><PieChartIcon className="w-3.5 h-3.5 text-blue-700" />Gastos por Categoría</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={60} label={(e: { value: number }) => `${((e.value / stats.gastos) * 100).toFixed(0)}%`} labelLine={false}>
                        {porCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtQ(v)} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-blue-700" />Comparativa por Categoría</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porCategoria} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => fmtQ(v)} />
                      <Bar dataKey="value" fill="#1E3A8A" name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {pagina === 1 && (
            <div className="grid grid-cols-12 gap-3 h-full">
              <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm flex-1">
                  <CardHeader className="py-3"><CardTitle className="text-[10px] font-bold uppercase text-slate-500">Proyección 30 Días</CardTitle></CardHeader>
                  <CardContent className="py-2 text-xl font-bold text-blue-900">{fmtQ(proyeccion.dias30)}</CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm flex-1">
                  <CardHeader className="py-3"><CardTitle className="text-[10px] font-bold uppercase text-slate-500">Proyección 60 Días</CardTitle></CardHeader>
                  <CardContent className="py-2 text-xl font-bold text-blue-900">{fmtQ(proyeccion.dias60)}</CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm flex-1">
                  <CardHeader className="py-3"><CardTitle className="text-[10px] font-bold uppercase text-slate-500">Proyección 90 Días</CardTitle></CardHeader>
                  <CardContent className="py-2 text-xl font-bold text-blue-900">{fmtQ(proyeccion.dias90)}</CardContent>
                </Card>
              </div>
              <div className="col-span-12 md:col-span-8 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><LineChartIcon className="w-3.5 h-3.5 text-blue-700" />Flujo de Caja Mensual</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => fmtQ(v)} />
                      <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name="Ingresos" />
                      <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 bg-white rounded-xl shadow-md p-3">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-blue-700" />Calendario de Actividades</h3>
                <div className="h-32">
                  <Calendar />
                </div>
              </div>
            </div>
          )}
          {pagina === 2 && (
            <ProfitReport transacciones={transacciones} presupuestos={presupuestos} />
          )}
        </div>
      </div>

      {/* Transaction form + OCR + table section */}
      <div className="p-2 sm:p-3 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1"><TransactionForm /></div>
          <OcrToggle />
        </div>

        <div className="bg-white rounded-xl shadow-md p-3 flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as 'todos' | 'ingreso' | 'gasto')} className="px-2 py-1.5 text-xs border rounded">
            <option value="todos">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-2 py-1.5 text-xs border rounded">
            <option value="todos">Todas las categorías</option>
            {Object.entries(categoriaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterProy} onChange={e => setFilterProy(e.target.value)} className="px-2 py-1.5 text-xs border rounded">
            <option value="todos">Todos los proyectos</option>
            <option value="admin">Administrativo</option>
            <option value="personal">Personal</option>
            {presupuestos.map(p => <option key={p.id} value={p.id}>{p.proyecto}</option>)}
          </select>
          <div className="flex-1" />
          <button onClick={() => exportTransacciones(transacciones, presupuestos)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"><FileDown className="w-3 h-3" />Excel</button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-semibold"><Download className="w-3 h-3" />CSV</button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold"><FileText className="w-3 h-3" />PDF</button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-blue-800 to-blue-700 text-white">
                <tr>
                  <th className="p-2.5 text-left">Fecha</th>
                  <th className="p-2.5 text-left">Tipo</th>
                  <th className="p-2.5 text-left">Proyecto / Origen</th>
                  <th className="p-2.5 text-left">Descripción</th>
                  <th className="p-2.5 text-left">Categoría</th>
                  <th className="p-2.5 text-right hidden md:table-cell">Cant.</th>
                  <th className="p-2.5 text-right hidden md:table-cell">C. Unit.</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5 text-center">—</th>
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => b.fecha.localeCompare(a.fecha)).map(t => (
                  <tr key={t.id} className="border-b hover:bg-blue-50/30">
                    <td className="p-2.5">{t.fecha}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{t.tipo}</span>
                    </td>
                    <td className="p-2.5 text-slate-600">{getProyectoNombre(t.proyectoId)}</td>
                    <td className="p-2.5 font-medium">{t.descripcion}</td>
                    <td className="p-2.5 text-[10px] text-slate-500">{categoriaLabels[t.categoria]}</td>
                    <td className="p-2.5 text-right hidden md:table-cell">{t.cantidad} {t.unidad}</td>
                    <td className="p-2.5 text-right hidden md:table-cell">{fmtQ(t.costoUnitario)}</td>
                    <td className={`p-2.5 text-right font-bold ${t.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}`}>{fmtQ(t.costoTotal)}</td>
                    <td className="p-2.5 text-center">
                      <button onClick={() => setConfirmDelete(t.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3 h-3" /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-slate-400">Sin transacciones que coincidan con los filtros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={o => { if (!o) setConfirmDelete(null); }}
        onConfirm={() => { if (confirmDelete) deleteTransaccion(confirmDelete); setConfirmDelete(null); }}
        title="Eliminar transacción"
        description="Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta transacción?"
        confirmText="Aceptar"
      />
    </PageShell>
  );
};

const OcrToggle: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full md:w-64 shrink-0">
      {open ? <OCRFactura onClose={() => setOpen(false)} /> : (
        <button onClick={() => setOpen(true)}
          className="w-full h-full flex flex-col items-center justify-center gap-1.5 py-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition btn-press">
          <Scan className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] text-slate-500 font-semibold">Escanear Factura</span>
        </button>
      )}
    </div>
  );
};

export default FinancieroScreen;
