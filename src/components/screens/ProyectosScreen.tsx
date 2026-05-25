import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Proyecto, UpdateProyecto } from '@/types/supabase';
import Header from '@/components/shared/Header';
import { Folder, Calendar, DollarSign, BarChart3, AlertCircle, Plus, Edit2, Trash2, CheckCircle, Clock, Briefcase } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProyectosScreen: React.FC = () => {
  const { proyectos, updateProyecto, clientes, transacciones } = useAppContext();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Proyecto>>({});
  const [showNewForm, setShowNewForm] = useState(false);

  // ====== Cálculos de estados ======
  const stats = useMemo(() => {
    const ejecucion = proyectos.filter(p => p.estado === 'Ejecución').length;
    const finalizado = proyectos.filter(p => p.estado === 'Finalizado').length;
    const evaluacion = proyectos.filter(p => p.estado === 'Evaluación').length;
    const parado = proyectos.filter(p => p.estado === 'Parado').length;
    const planeacion = proyectos.filter(p => p.estado === 'Planeación').length;
    const total = proyectos.length;
    
    const presupuestoTotal = proyectos.reduce((s, p) => s + p.presupuestoTotal, 0);
    const gastosTotal = proyectos.reduce((s, p) => s + p.gastos, 0);
    const ingresosTotal = proyectos.reduce((s, p) => s + p.ingresos, 0);
    const margen = ingresosTotal - gastosTotal;
    
    return { 
      ejecucion, finalizado, evaluacion, parado, planeacion, total,
      presupuestoTotal, gastosTotal, ingresosTotal, margen 
    };
  }, [proyectos]);

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(p => 
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente.toLowerCase().includes(search.toLowerCase())
    );
  }, [proyectos, search]);

  const chartData = useMemo(() => {
    return proyectos.map(p => ({
      nombre: p.nombre.slice(0, 15),
      'Físico': p.avanceFisico,
      'Financiero': p.avanceFinanciero,
      Presupuesto: Math.round(p.presupuestoTotal / 100000),
    }));
  }, [proyectos]);

  const estadoData = useMemo(() => [
    { name: 'En Ejecución', value: stats.ejecucion, color: '#3B82F6' },
    { name: 'Finalizado', value: stats.finalizado, color: '#10B981' },
    { name: 'Evaluación', value: stats.evaluacion, color: '#F59E0B' },
    { name: 'Parado/Cancelado', value: stats.parado, color: '#EF4444' },
    { name: 'Planeación', value: stats.planeacion, color: '#8B5CF6' },
  ].filter(d => d.value > 0), [stats]);

  const handleEditClick = (proyecto: Proyecto) => {
    setEditingId(proyecto.id);
    setEditData({ ...proyecto });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updateData = editData as UpdateProyecto;
      await updateProyecto(id, updateData);
      setEditingId(null);
    } catch (e) {
      console.error('Error actualizando proyecto:', e);
    }
  };

  const getEstadoColor = (estado: string): string => {
    const colors: Record<string, string> = {
      'Planeación': 'from-purple-500 to-purple-600 text-purple-50',
      'Ejecución': 'from-blue-500 to-blue-600 text-blue-50',
      'Finalizado': 'from-green-500 to-green-600 text-green-50',
      'Evaluación': 'from-amber-500 to-amber-600 text-amber-50',
      'Parado': 'from-red-500 to-red-600 text-red-50',
    };
    return colors[estado] || 'from-slate-500 to-slate-600 text-slate-50';
  };

  const getEstadoIcon = (estado: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      'Planeación': Clock,
      'Ejecución': BarChart3,
      'Finalizado': CheckCircle,
      'Evaluación': AlertCircle,
      'Parado': AlertCircle,
    };
    return icons[estado] || Clock;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fadeIn">
      <Header title="Gestión de Proyectos" />

      <div className="flex-1 p-3 sm:p-4 grid grid-cols-12 gap-3 max-w-[1600px] mx-auto w-full">
        {/* KPIs de Estados */}
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard 
            icon={Briefcase} 
            label="Total" 
            value={String(stats.total)} 
            color="slate"
            percent={100}
          />
          <StatCard 
            icon={BarChart3} 
            label="En Ejecución" 
            value={String(stats.ejecucion)} 
            color="blue"
            percent={stats.total > 0 ? (stats.ejecucion / stats.total * 100) : 0}
          />
          <StatCard 
            icon={CheckCircle} 
            label="Finalizados" 
            value={String(stats.finalizado)} 
            color="green"
            percent={stats.total > 0 ? (stats.finalizado / stats.total * 100) : 0}
          />
          <StatCard 
            icon={AlertCircle} 
            label="En Evaluación" 
            value={String(stats.evaluacion)} 
            color="amber"
            percent={stats.total > 0 ? (stats.evaluacion / stats.total * 100) : 0}
          />
          <StatCard 
            icon={AlertCircle} 
            label="Parados/Cancelados" 
            value={String(stats.parado)} 
            color="red"
            percent={stats.total > 0 ? (stats.parado / stats.total * 100) : 0}
          />
        </div>

        {/* Tarjetas financieras */}
        <div className="col-span-12 lg:col-span-6 grid grid-cols-2 lg:grid-cols-2 gap-3">
          <FinanceCard label="Presupuesto Total" value={`Q ${(stats.presupuestoTotal / 1000).toFixed(1)}K`} icon={DollarSign} color="blue" />
          <FinanceCard label="Gastos Totales" value={`Q ${(stats.gastosTotal / 1000).toFixed(1)}K`} icon={DollarSign} color="red" />
          <FinanceCard label="Ingresos Totales" value={`Q ${(stats.ingresosTotal / 1000).toFixed(1)}K`} icon={DollarSign} color="green" />
          <FinanceCard label="Margen Global" value={`Q ${(stats.margen / 1000).toFixed(1)}K`} icon={BarChart3} color="indigo" />
        </div>

        {/* Gráfico de estados */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Distribución por Estado</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie 
                data={estadoData} 
                dataKey="value" 
                cx="50%" 
                cy="50%" 
                outerRadius={60} 
                label={({ name, value }) => `${name}: ${value}`}
              >
                {estadoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de avances */}
        <div className="col-span-12 bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Avance Físico vs Financiero</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>
              <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="Físico" fill="#1E3A8A" />
              <Bar dataKey="Financiero" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de proyectos */}
        <div className="col-span-12 bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Listado de Proyectos ({proyectosFiltrados.length})
            </h3>
            <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" /> Nuevo Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Proyecto</DialogTitle>
                  <DialogDescription>Crea un nuevo proyecto para hacer seguimiento</DialogDescription>
                </DialogHeader>
                {/* Aquí irá el formulario de nuevo proyecto */}
                <p className="text-sm text-slate-600 mt-4">Los proyectos se crean automáticamente desde el módulo de Presupuestos</p>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Input 
            placeholder="Buscar por nombre o cliente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-4"
          />

          {/* Tabla de proyectos */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="text-left p-2 font-semibold text-slate-700">Proyecto</th>
                  <th className="text-left p-2 font-semibold text-slate-700 hidden md:table-cell">Cliente</th>
                  <th className="text-center p-2 font-semibold text-slate-700">Estado</th>
                  <th className="text-right p-2 font-semibold text-slate-700 hidden md:table-cell">Presupuesto</th>
                  <th className="text-center p-2 font-semibold text-slate-700">Avance (%)</th>
                  <th className="text-center p-2 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {proyectosFiltrados.length > 0 ? (
                  proyectosFiltrados.map(p => (
                    <ProyectoRow 
                      key={p.id} 
                      proyecto={p}
                      isEditing={editingId === p.id}
                      editData={editData}
                      onEdit={() => handleEditClick(p)}
                      onSave={() => handleSaveEdit(p.id)}
                      onCancel={() => setEditingId(null)}
                      onDataChange={setEditData}
                      getEstadoColor={getEstadoColor}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-slate-500">
                      No hay proyectos que coincidan con la búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  percent: number;
}> = ({ icon: Icon, label, value, color, percent }) => {
  const colors: Record<string, string> = {
    slate: 'from-slate-500 to-slate-600 text-slate-50',
    blue: 'from-blue-500 to-blue-600 text-blue-50',
    green: 'from-green-500 to-green-600 text-green-50',
    amber: 'from-amber-500 to-amber-600 text-amber-50',
    red: 'from-red-500 to-red-600 text-red-50',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-3 shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className="w-4 h-4 opacity-80" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"></div>
      </div>
      <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
      <div className="text-lg font-bold leading-tight mt-0.5">{value}</div>
      {percent > 0 && <div className="text-[10px] opacity-70 mt-1">{percent.toFixed(0)}%</div>}
    </div>
  );
};

const FinanceCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = ({ label, value, icon: Icon, color }) => {
  const colors: Record<string, string> = {
    blue: 'from-blue-100 to-blue-200 text-blue-900',
    red: 'from-red-100 to-red-200 text-red-900',
    green: 'from-green-100 to-green-200 text-green-900',
    indigo: 'from-indigo-100 to-indigo-200 text-indigo-900',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-3 shadow-sm border`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-70" />
        <div className="text-[10px] font-semibold opacity-70">{label}</div>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
};

const ProyectoRow: React.FC<{
  proyecto: Proyecto;
  isEditing: boolean;
  editData: Partial<Proyecto>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDataChange: (data: Partial<Proyecto>) => void;
  getEstadoColor: (estado: string) => string;
}> = ({ proyecto, isEditing, editData, onEdit, onSave, onCancel, onDataChange, getEstadoColor }) => {
  const estados = ['Planeación', 'Ejecución', 'Finalizado', 'Evaluación', 'Parado'];
  
  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="p-2">
          <Input 
            value={editData.nombre || ''} 
            onChange={e => onDataChange({ ...editData, nombre: e.target.value })}
            className="text-sm"
          />
        </td>
        <td className="p-2 hidden md:table-cell">
          <Input 
            value={editData.cliente || ''} 
            onChange={e => onDataChange({ ...editData, cliente: e.target.value })}
            className="text-sm"
          />
        </td>
        <td className="p-2">
          <Select value={editData.estado} onValueChange={v => onDataChange({ ...editData, estado: v as Proyecto['estado'] })}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </td>
        <td className="p-2 text-right hidden md:table-cell">
          <Input 
            type="number" 
            value={editData.presupuestoTotal || ''} 
            onChange={e => onDataChange({ ...editData, presupuestoTotal: parseFloat(e.target.value) })}
            className="text-sm text-right"
          />
        </td>
        <td className="p-2 text-center">
          <Input 
            type="number" 
            min="0" 
            max="100" 
            value={editData.avanceFisico || ''} 
            onChange={e => onDataChange({ ...editData, avanceFisico: parseFloat(e.target.value) })}
            className="text-sm text-center w-16 mx-auto"
          />
        </td>
        <td className="p-2 text-center">
          <div className="flex gap-1 justify-center">
            <Button size="sm" variant="default" onClick={onSave} className="bg-green-600 hover:bg-green-700">Guardar</Button>
            <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 transition">
      <td className="p-2 font-medium text-slate-900">{proyecto.nombre}</td>
      <td className="p-2 text-slate-600 hidden md:table-cell">{proyecto.cliente || '-'}</td>
      <td className="p-2 text-center">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getEstadoColor(proyecto.estado)}`}>
          {proyecto.estado}
        </span>
      </td>
      <td className="p-2 text-right font-medium text-slate-900 hidden md:table-cell">Q {proyecto.presupuestoTotal.toLocaleString('es-GT', { maximumFractionDigits: 0 })}</td>
      <td className="p-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 max-w-[60px]">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: `${proyecto.avanceFisico}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700 min-w-[35px] text-right">{proyecto.avanceFisico}%</span>
        </div>
      </td>
      <td className="p-2 text-center">
        <div className="flex gap-1 justify-center">
          <button 
            onClick={onEdit}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-blue-600"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProyectosScreen;
