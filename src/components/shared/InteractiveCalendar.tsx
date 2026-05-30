import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Plus, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  color: string; // tailwind color class
  type: 'actividad' | 'recordatorio' | 'alerta' | 'completada';
  description?: string;
  notifyBefore?: number; // minutes before
}

interface InteractiveCalendarProps {
  onEventAdd?: (event: CalendarEvent) => void;
  onEventComplete?: (id: string) => void;
  onEventDelete?: (id: string) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const EVENT_COLORS = {
  actividad: 'bg-blue-100 text-blue-800 border-blue-300',
  recordatorio: 'bg-amber-100 text-amber-800 border-amber-300',
  alerta: 'bg-red-100 text-red-800 border-red-300',
  completada: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({ onEventAdd, onEventComplete, onEventDelete }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dash_calendar_events') || '[]');
    } catch { return []; }
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '09:00',
    color: 'actividad' as CalendarEvent['type'],
    notifyBefore: 30,
  });

  const today = new Date().toISOString().split('T')[0];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay + 6) % 7; // Monday start

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push({ day: 0, date: '', isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, date: dateStr, isCurrentMonth: true });
    }
    return days;
  }, [year, month, daysInMonth, startDay]);

  const getEventsForDate = (date: string) => {
    return events.filter(e => e.date === date);
  };

  const addEvent = () => {
    if (!newEvent.title || !selectedDate) {
      toast.error('Completa el título y selecciona una fecha');
      return;
    }
    const event: CalendarEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: newEvent.title,
      date: selectedDate,
      time: newEvent.time,
      color: newEvent.color,
      type: newEvent.color,
      description: newEvent.description,
      notifyBefore: newEvent.notifyBefore,
    };
    setEvents(prev => {
      const updated = [...prev, event];
      localStorage.setItem('dash_calendar_events', JSON.stringify(updated));
      return updated;
    });
    onEventAdd?.(event);
    toast.success(`Actividad "${event.title}" programada para ${selectedDate}`);
    setNewEvent({ title: '', description: '', time: '09:00', color: 'actividad', notifyBefore: 30 });
    setShowForm(false);
  };

  const completeEvent = (id: string) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, type: 'completada' as const } : e);
      localStorage.setItem('dash_calendar_events', JSON.stringify(updated));
      return updated;
    });
    onEventComplete?.(id);
    toast.success('Actividad marcada como completada ✓');
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('dash_calendar_events', JSON.stringify(updated));
      return updated;
    });
    onEventDelete?.(id);
    toast.success('Actividad eliminada');
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const todayEvents = getEventsForDate(today);

  return (
    <div className="h-full flex flex-col">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-2 p-1">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-accent rounded">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-card-foreground">{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-accent rounded">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(today); }} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">Hoy</button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[8px] font-semibold text-muted-foreground uppercase">{d}</div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {calendarDays.map((day, idx) => {
          if (!day.isCurrentMonth) return <div key={idx} className="h-8" />;
          const dayEvents = getEventsForDate(day.date);
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;
          const hasCompletables = dayEvents.some(e => e.type !== 'completada');
          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day.date)}
              className={`relative h-8 flex flex-col items-center justify-start pt-0.5 text-[10px] rounded transition-all
                ${isSelected ? 'bg-primary text-white ring-2 ring-primary/50' : ''}
                ${isToday && !isSelected ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/30' : ''}
                ${!isSelected && !isToday ? 'hover:bg-accent text-card-foreground' : ''}
              `}
            >
              <span>{day.day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-px mt-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${e.type === 'completada' ? 'bg-emerald-400' : e.type === 'alerta' ? 'bg-red-400' : e.type === 'recordatorio' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel de eventos del día seleccionado */}
      {selectedDate && (
        <div className="border-t border-border pt-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-card-foreground">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => setShowForm(!showForm)} className="text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition">
              <Plus className="w-2.5 h-2.5" /> Agregar
            </button>
          </div>

          {/* Formulario para agregar evento */}
          {showForm && (
            <div className="bg-muted/50 p-2 rounded-lg mb-2 space-y-1.5 animate-fade-in-up">
              <input
                type="text"
                value={newEvent.title}
                onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título de la actividad..."
                className="w-full px-2 py-1 text-xs border rounded bg-background"
              />
              <div className="flex gap-1.5">
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  className="px-2 py-1 text-xs border rounded bg-background w-24"
                />
                <select
                  value={newEvent.color}
                  onChange={e => setNewEvent(prev => ({ ...prev, color: e.target.value as CalendarEvent['type'] }))}
                  className="px-2 py-1 text-xs border rounded bg-background"
                >
                  <option value="actividad">Actividad</option>
                  <option value="recordatorio">Recordatorio</option>
                  <option value="alerta">Alerta</option>
                </select>
              </div>
              <textarea
                value={newEvent.description}
                onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción (opcional)..."
                className="w-full px-2 py-1 text-[10px] border rounded bg-background resize-none h-12"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Bell className="w-2.5 h-2.5" /> Notificar {newEvent.notifyBefore} min antes
                </div>
                <button onClick={addEvent} className="px-2 py-0.5 text-[10px] font-semibold bg-primary text-white rounded hover:bg-primary/90 transition">
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Lista de eventos */}
          <div className="space-y-1">
            {selectedEvents.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-3">Sin actividades este día</div>
            ) : (
              selectedEvents.map(evt => (
                <div key={evt.id} className={`flex items-center gap-1.5 p-1.5 rounded border text-[10px] ${EVENT_COLORS[evt.type]} ${evt.type === 'completada' ? 'opacity-60' : ''}`}>
                  <span className="text-[9px] font-semibold w-10 shrink-0">{evt.time || '--:--'}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${evt.type === 'completada' ? 'line-through' : ''}`}>{evt.title}</div>
                    {evt.description && <div className="text-[8px] opacity-70 truncate">{evt.description}</div>}
                  </div>
                  {evt.type !== 'completada' && (
                    <button onClick={() => completeEvent(evt.id)} className="p-0.5 hover:bg-emerald-100 rounded" title="Completar">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </button>
                  )}
                  <button onClick={() => deleteEvent(evt.id)} className="p-0.5 hover:bg-red-100 rounded" title="Eliminar">
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resumen rápido de hoy */}
      {todayEvents.length > 0 && !selectedDate && (
        <div className="border-t border-border pt-2">
          <div className="text-[9px] font-bold text-card-foreground mb-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Hoy ({todayEvents.length} actividades)
          </div>
          {todayEvents.slice(0, 3).map(evt => (
            <div key={evt.id} className={`flex items-center gap-1 p-1 rounded text-[9px] mb-0.5 ${EVENT_COLORS[evt.type]}`}>
              <span className="w-8 shrink-0 font-semibold">{evt.time || '--:--'}</span>
              <span className={`flex-1 truncate ${evt.type === 'completada' ? 'line-through opacity-60' : ''}`}>{evt.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(InteractiveCalendar);