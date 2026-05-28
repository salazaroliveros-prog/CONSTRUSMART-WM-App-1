import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const Calendar: React.FC = () => {
  const { actividades, addActividad, deleteActividad } = useAppContext();
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', hora: '09:00', descripcion: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Notificaciones anticipadas
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const ahora = new Date();
      actividades.forEach(act => {
        const [h, m] = act.hora.split(':').map(Number);
        const fechaActividad = new Date(act.fecha);
        fechaActividad.setHours(h, m, 0);

        const diff = fechaActividad.getTime() - ahora.getTime();
        // Notificar si faltan entre 5 y 10 minutos
        if (diff > 300000 && diff < 600000) {
          const titulo = String(act.titulo).replace(/[<>&"'\r\n]/g, '');
          const hora = String(act.hora).replace(/[^0-9:]/g, '');
          if (Notification.permission === "granted") {
            new Notification("Recordatorio de WM/M&S", {
              body: `Tu actividad "${titulo}" inicia pronto a las ${hora}`,
              icon: '/logo.png'
            });
          }
          toast.info(`Recordatorio: ${titulo} a las ${hora}`);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [actividades]);

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
    <div className="bg-card dark:bg-card rounded-xl shadow-md border border-border p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalIcon className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-card-foreground capitalize text-sm">{monthName}</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setCurrent(new Date(year, month - 1))} className="p-1 rounded hover:bg-accent"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCurrent(new Date())} className="px-2 text-[10px] rounded hover:bg-accent">Hoy</button>
          <button onClick={() => setCurrent(new Date(year, month + 1))} className="p-1 rounded hover:bg-accent"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-muted-foreground font-semibold mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 animate-fadeIn">
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
                  isToday ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-400' :
                  'hover:bg-accent text-card-foreground'}`}
            >
              {d}
              {acts.length > 0 && (
                <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-background' : 'bg-orange-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-card-foreground">Actividades · {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}</p>
            <button onClick={() => setShowForm(s => !s)} className="text-blue-700 hover:text-blue-900">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {showForm && (
            <div className="space-y-2 mb-2 p-2 bg-muted rounded-lg animate-scale-in">
              <input placeholder="Título de la actividad" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
              <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
              <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
              <button onClick={handleAdd} className="w-full bg-blue-700 text-white text-xs py-1 rounded hover:bg-blue-800">Guardar actividad</button>
            </div>
          )}

          <div className="space-y-1 max-h-24 overflow-y-auto">
            {actividades.filter(a => a.fecha === selectedDate).map(a => (
              <div key={a.id} className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 p-1.5 rounded text-[11px] group">
                <Clock className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-900 dark:text-blue-300 truncate">{a.titulo}</div>
                  <div className="text-card-foreground text-[10px]">{a.hora} · {a.descripcion}</div>
                </div>
                <button onClick={() => setConfirmDelete(a.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {actividades.filter(a => a.fecha === selectedDate).length === 0 && !showForm && (
              <p className="text-[10px] text-muted-foreground italic text-center py-2">Sin actividades programadas</p>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={o => { if (!o) setConfirmDelete(null); }}
        onConfirm={() => { if (confirmDelete) deleteActividad(confirmDelete); setConfirmDelete(null); }}
        title="Eliminar actividad"
        description="Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta actividad?"
        confirmText="Aceptar"
      />
    </div>
  );
};

export default Calendar;
