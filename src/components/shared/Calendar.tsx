import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, X, Clock } from 'lucide-react';

const Calendar: React.FC = () => {
  const { actividades, addActividad, deleteActividad } = useAppContext();
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', hora: '09:00', descripcion: '' });

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = current.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });
  const today = new Date().toISOString().split('T')[0];

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const fmtDate = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const actividadesDelDia = (d: number) => actividades.filter(a => a.fecha === fmtDate(d));

  const handleAdd = () => {
    if (!form.titulo || !selectedDate) return;
    addActividad({ ...form, fecha: selectedDate });
    setForm({ titulo: '', hora: '09:00', descripcion: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalIcon className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-slate-800 capitalize text-sm">{monthName}</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setCurrent(new Date(year, month - 1))} className="p-1 rounded hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCurrent(new Date())} className="px-2 text-[10px] rounded hover:bg-slate-100">Hoy</button>
          <button onClick={() => setCurrent(new Date(year, month + 1))} className="p-1 rounded hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-500 font-semibold mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = fmtDate(d);
          const acts = actividadesDelDia(d);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={i}
              onClick={() => { setSelectedDate(dateStr); setShowForm(false); }}
              className={`relative aspect-square rounded text-[11px] font-medium transition-all flex flex-col items-center justify-center
                ${isSelected ? 'bg-blue-600 text-white shadow-md scale-105' :
                  isToday ? 'bg-emerald-100 text-emerald-800 border border-emerald-400' :
                  'hover:bg-slate-100 text-slate-700'}`}
            >
              {d}
              {acts.length > 0 && (
                <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">Actividades · {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}</p>
            <button onClick={() => setShowForm(s => !s)} className="text-blue-700 hover:text-blue-900">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {showForm && (
            <div className="space-y-2 mb-2 p-2 bg-slate-50 rounded-lg">
              <input placeholder="Título de la actividad" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
              <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
              <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
              <button onClick={handleAdd} className="w-full bg-blue-700 text-white text-xs py-1 rounded hover:bg-blue-800">Guardar actividad</button>
            </div>
          )}

          <div className="space-y-1 max-h-24 overflow-y-auto">
            {actividades.filter(a => a.fecha === selectedDate).map(a => (
              <div key={a.id} className="flex items-start gap-2 bg-blue-50 p-1.5 rounded text-[11px] group">
                <Clock className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-900 truncate">{a.titulo}</div>
                  <div className="text-slate-600 text-[10px]">{a.hora} · {a.descripcion}</div>
                </div>
                <button onClick={() => deleteActividad(a.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {actividades.filter(a => a.fecha === selectedDate).length === 0 && !showForm && (
              <p className="text-[10px] text-slate-400 italic text-center py-2">Sin actividades programadas</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
