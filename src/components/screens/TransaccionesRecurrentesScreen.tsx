/**
 * TransaccionesRecurrentesScreen - gestión de transacciones automáticas
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, CalendarClock, Pause, Play, Trash2 } from 'lucide-react';

interface TransaccionRecurrente {
  id: string;
  presupuesto_id: string;
  user_id: string;
  descripcion: string;
  tipo: string;
  monto: number;
  frecuencia: string;
  activa: boolean | null;
  proxima_fecha: string | null;
  ultima_fecha: string | null;
  created_at: string;
  updated_at: string;
}

const FREQUENCIAS = ['mensual', 'quincenal', 'semanal', 'diaria', 'anual'] as const;

const TransaccionesRecurrentesScreen: React.FC = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;
  const [presupuestos, setPresupuestos] = useState<{ id: string; nombre: string }[]>([]);
  const [presupuestoId, setPresupuestoId] = useState('');
  const [items, setItems] = useState<TransaccionRecurrente[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto');
  const [monto, setMonto] = useState('');
  const [frecuencia, setFrecuencia] = useState<string>('mensual');

  const cargarPresupuestos = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('presupuestos').select('id, proyecto').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setPresupuestos(data.map(p => ({ id: p.id, nombre: p.proyecto })));
  }, [userId]);

  const cargarRecurrentes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('transacciones_recurrentes')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setItems(data as TransaccionRecurrente[]);
  }, [userId, presupuestoId]);

  useEffect(() => {
    if (!userId) return;
    cargarPresupuestos();
  }, [userId, cargarPresupuestos]);

  useEffect(() => {
    if (!presupuestoId || !userId) {
      setItems([]);
      return;
    }
    cargarRecurrentes();
  }, [presupuestoId, userId, cargarRecurrentes]);

  const crearRecurrente = async () => {
    if (!userId || !presupuestoId || !descripcion.trim() || !monto || Number(monto) <= 0) {
      toast.error('Complete descripción y monto válido');
      return;
    }
    const hoy = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('transacciones_recurrentes').insert({
      presupuesto_id: presupuestoId,
      user_id: userId,
      descripcion: descripcion.trim(),
      tipo,
      monto: Number(monto),
      frecuencia,
      activa: true,
      proxima_fecha: hoy,
      ultima_fecha: null,
    });
    if (error) toast.error('Error al crear transacción recurrente');
    else {
      toast.success('Transacción recurrente creada');
      setDescripcion('');
      setMonto('');
      cargarRecurrentes();
    }
  };

  const toggleActiva = async (item: TransaccionRecurrente) => {
    const nuevo = !(item.activa ?? true);
    const { error } = await supabase.from('transacciones_recurrentes').update({ activa: nuevo }).eq('id', item.id);
    if (error) toast.error('Error al actualizar');
    else {
      toast.success(nuevo ? 'Transacción activada' : 'Transacción pausada');
      cargarRecurrentes();
    }
  };

  const eliminar = async (id: string) => {
    const { error } = await supabase.from('transacciones_recurrentes').delete().eq('id', id);
    if (error) toast.error('Error al eliminar');
    else {
      toast.success('Transacción recurrente eliminada');
      cargarRecurrentes();
    }
  };

  if (!userId) return <div className="p-4 text-center text-muted-foreground">Cargando sesión…</div>;

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarClock className="w-6 h-6" /> Transacciones Recurrentes</h1>
        <p className="text-sm text-muted-foreground">Programa entradas y salidas automáticas por presupuesto</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={presupuestoId} onValueChange={setPresupuestoId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un presupuesto" />
            </SelectTrigger>
            <SelectContent>
              {presupuestos.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {presupuestoId && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Transacción Recurrente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <Label>Descripción</Label>
              <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej. Alquiler mensual" />
            </div>
            <div className="w-28">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={v => setTipo(v as 'ingreso' | 'gasto')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="gasto">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label>Monto (Q)</Label>
              <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" />
            </div>
            <div className="w-36">
              <Label>Frecuencia</Label>
              <Select value={frecuencia} onValueChange={setFrecuencia}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIAS.map(f => (
                    <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={crearRecurrente}><Plus className="w-4 h-4 mr-2" />Crear</Button>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Transacciones programadas</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-right p-2">Monto</th>
                    <th className="text-left p-2">Frecuencia</th>
                    <th className="text-left p-2">Próxima</th>
                    <th className="text-center p-2">Estado</th>
                    <th className="text-center p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-2">{item.descripcion}</td>
                      <td className="p-2"><Badge variant={item.tipo === 'ingreso' ? 'default' : 'destructive'}>{item.tipo}</Badge></td>
                      <td className="p-2 text-right">Q{item.monto.toLocaleString()}</td>
                      <td className="p-2">{item.frecuencia}</td>
                      <td className="p-2">{item.proxima_fecha || '—'}</td>
                      <td className="p-2 text-center">
                        <Badge variant={item.activa ? 'default' : 'secondary'}>{item.activa ? 'Activa' : 'Pausada'}</Badge>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="ghost" onClick={() => toggleActiva(item)}>
                            {item.activa ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => eliminar(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransaccionesRecurrentesScreen;
