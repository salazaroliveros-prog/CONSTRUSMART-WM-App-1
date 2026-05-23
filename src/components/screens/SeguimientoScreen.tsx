import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/components/shared/Header';
import { fmtQ, downloadCSV, printPDF } from '@/lib/exporters';
import { Download, FileText, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Area, AreaChart } from 'recharts';

const SeguimientoScreen: React.FC = () => {
  const { proyectos, transacciones } = useAppContext();

  const ejecucion = proyectos.filter(p => p.estado === 'Ejecución');
  const planeacion = proyectos.filter(p => p.estado === 'Planeación');

  const flujoMensual = useMemo(() => {
    const data: Record<string, { mes: string; ingresos: number; gastos: number }> = {};
    transacciones.forEach(t => {
      const mes = t.fecha.slice(0, 7);
      if (!data[mes]) data[mes] = { mes, ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') data[mes].ingresos += t.costoTotal;
      else data[mes].gastos += t.costoTotal;
    });
    return Object.values(data).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [transacciones]);

  const avanceData = ejecucion.map(p => ({
    name: p.nombre.split(' ').slice(0, 3).join(' '),
    Físico: p.avanceFisico,
    Financiero: p.avanceFinanciero,
  }));

  const handleExportCSV = () => {
    const rows: any[] = [
      ['Seguimiento de Proyectos - CONSTRUCTORA WM/M&S'],
      [`Fecha: ${new Date().toLocaleDateString('es-GT')}`],
      [],
      ['Proyecto', 'Cliente', 'Tipo', 'Estado', 'Presupuesto', 'Avance Físico %', 'Avance Financiero %', 'Ingresos', 'Gastos', 'Pendiente Aportar'],
      ...proyectos.map(p => [p.nombre, p.cliente, p.tipo, p.estado, p.presupuestoTotal, p.avanceFisico, p.avanceFinanciero, p.ingresos, p.gastos, p.pendienteAportar]),
    ];
    downloadCSV(`seguimiento_proyectos_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const handleExportPDF = () => {
    const body = `
      <h2>Proyectos en Ejecución</h2>
      <table>
        <thead><tr><th>Proyecto</th><th>Cliente</th><th class="num">Presupuesto</th><th class="num">A. Físico</th><th class="num">A. Financ.</th><th class="num">Ingresos</th><th class="num">Gastos</th><th class="num">Pendiente</th></tr></thead>
        <tbody>${ejecucion.map(p => `<tr><td>${p.nombre}</td><td>${p.cliente}</td><td class="num">${fmtQ(p.presupuestoTotal)}</td><td class="num">${p.avanceFisico}%</td><td class="num">${p.avanceFinanciero}%</td><td class="num">${fmtQ(p.ingresos)}</td><td class="num">${fmtQ(p.gastos)}</td><td class="num">${fmtQ(p.pendienteAportar)}</td></tr>`).join('')}</tbody>
      </table>
      <h2>Proyectos en Planeación</h2>
      <table>
        <thead><tr><th>Proyecto</th><th>Cliente</th><th>Tipo</th><th class="num">Presupuesto</th><th>Inicio Programado</th></tr></thead>
        <tbody>${planeacion.map(p => `<tr><td>${p.nombre}</td><td>${p.cliente}</td><td>${p.tipo}</td><td class="num">${fmtQ(p.presupuestoTotal)}</td><td>${p.fechaInicio}</td></tr>`).join('')}</tbody>
      </table>
    `;
    printPDF('Informe de Seguimiento de Proyectos', body);
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fadeIn">
      <Header title="Seguimiento de Proyectos" />

      <div className="p-3 sm:p-5 max-w-[1600px] mx-auto space-y-4">
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 lg:col-span-2">
            <h3 className="font-bold text-sm text-slate-800 mb-2">Flujo de Ingresos vs Gastos (Mensual)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={flujoMensual}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => fmtQ(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="ingresos" stroke="#10B981" fill="url(#gi)" name="Ingresos" />
                <Area type="monotone" dataKey="gastos" stroke="#EF4444" fill="url(#gg)" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-sm text-slate-800 mb-2">Avance Físico vs Financiero</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avanceData} layout="vertical" margin={{ left: 50 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Físico" fill="#1E3A8A" />
                <Bar dataKey="Financiero" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-semibold">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">
            <FileText className="w-4 h-4" /> Exportar PDF
          </button>
        </div>

        {/* Proyectos en Ejecución */}
        <ProyectosTabla titulo="Proyectos en Ejecución" proyectos={ejecucion} color="emerald" />

        {/* Proyectos en Planeación */}
        <ProyectosTabla titulo="Proyectos en Planeación" proyectos={planeacion} color="amber" />
      </div>
    </div>
  );
};

const ProyectosTabla: React.FC<{ titulo: string; proyectos: any[]; color: string }> = ({ titulo, proyectos, color }) => {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-600 to-emerald-700',
    amber: 'from-amber-600 to-amber-700',
  };
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r ${colors[color]} text-white p-3`}>
        <h3 className="font-bold text-sm">{titulo} ({proyectos.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2.5 text-left">Proyecto</th>
              <th className="p-2.5 text-left hidden md:table-cell">Cliente</th>
              <th className="p-2.5 text-left">Avance Físico</th>
              <th className="p-2.5 text-left">Avance Financiero</th>
              <th className="p-2.5 text-right">Ingresos</th>
              <th className="p-2.5 text-right">Gastos</th>
              <th className="p-2.5 text-right">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map(p => (
              <tr key={p.id} className="border-b hover:bg-blue-50/30">
                <td className="p-2.5">
                  <div className="font-semibold text-slate-800">{p.nombre}</div>
                  <div className="text-[10px] text-slate-500">{p.tipo} · {fmtQ(p.presupuestoTotal)}</div>
                </td>
                <td className="p-2.5 hidden md:table-cell">{p.cliente}</td>
                <td className="p-2.5">
                  <Progreso valor={p.avanceFisico} color="bg-blue-600" />
                </td>
                <td className="p-2.5">
                  <Progreso valor={p.avanceFinanciero} color="bg-emerald-500" />
                </td>
                <td className="p-2.5 text-right text-emerald-700 font-semibold">{fmtQ(p.ingresos)}</td>
                <td className="p-2.5 text-right text-red-700 font-semibold">{fmtQ(p.gastos)}</td>
                <td className="p-2.5 text-right text-amber-700 font-semibold">{fmtQ(p.pendienteAportar)}</td>
              </tr>
            ))}
            {proyectos.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-slate-400">Sin proyectos en esta categoría</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Progreso: React.FC<{ valor: number; color: string }> = ({ valor, color }) => (
  <div className="flex items-center gap-2 min-w-[120px]">
    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-full transition-all`} style={{ width: `${valor}%` }} />
    </div>
    <span className="text-[10px] font-semibold w-8 text-right">{valor}%</span>
  </div>
);

export default SeguimientoScreen;
