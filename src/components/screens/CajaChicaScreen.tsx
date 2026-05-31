/**
 * CajaChicaScreen - Gestión de caja chica por proyecto
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wallet, Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCcw } from 'lucide-react';

interface CajaProyecto {
  id: string;
  proyecto_id: string;
  user_id: string;
  saldo_inicial: number;
  saldo_sistema_actual: number;
  saldo_real_actual: number | null;
  created_at: string;
  updated_at: string;
}

interface MovimientoCaja {
  id: string;
  caja_id: string;
  user_id: string;
  fecha: string;
  descripcion: string;
  subtipo: string;
  concepto: string | null;
  monto: number;
  saldo_sistema_antes: number;
  saldo_sistema_despues: number;
  saldo_real_confirmado: number | null;
  diferencia: number | null;
  conciliado_fecha: string | null;
  motivo_diferencia: string | null;
  created_at: string;
  updated_at: string;
}

type TipoMovimiento = 'entrada' | 'salida' | 'ajuste_ingreso' | 'ajuste_egreso';

const CajaChicaScreen: React.FC = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string>('');
  const [caja, setCaja] = useState<CajaProyecto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(true);

  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevoSubtipo, setNuevoSubtipo] = useState<TipoMovimiento>('entrada');

  useEffect(() => {
    if (!userId) return;
    cargarProyectos();
  }, [userId]);

  useEffect(() => {
    if (!proyectoSeleccionado || !userId) {
      setCaja(null);
      setMovimientos([]);
      return;
    }
    cargarCaja();
    cargarMovimientos();
  }, [proyectoSeleccionado, userId]);

  const cargarProyectos = async () => {
    if (!userId) return;
    const { data } = await supabase.from('proyectos').select('id, nombre').eq('user_id', userId).order('nombre');
    if (data) setProyectos(data);
  };

  const cargarCaja = async () => {
    if (!proyectoSeleccionado || !userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('caja_proyecto')
      .select('*')
      .eq('proyecto_id', proyectoSeleccionado)
      .eq('user_id', userId)
      .maybeSingle();
    if (data) setCaja(data as CajaProyecto);
    else setCaja(null);
    setLoading(false);
  };

  const cargarMovimientos = async () => {
    if (!proyectoSeleccionado || !userId || !caja?.id) {
      setMovimientos([]);
      return;
    }
    const { data } = await supabase
      .from('movimientos_caja')
      .select('*')
      .eq('caja_id', caja.id)
      .order('created_at', { ascending: false });
    if (data) setMovimientos(data as MovimientoCaja[]);
  };

  const inicializarCaja = async () => {
    if (!userId || !proyectoSeleccionado) return;
    const { error } = await supabase.from('caja_proyecto').insert({
      proyecto_id: proyectoSeleccionado,
      user_id: userId,
      saldo_inicial: 0,
      saldo_sistema_actual: 0,
    });
    if (error) toast.error('Error al inicializar caja chica');
    else {
      toast.success('Caja chica inicializada');
      cargarCaja();
    }
  };

  const registrarMovimiento = async () => {
    if (!userId || !caja?.id || !nuevoMonto || Number(nuevoMonto) <= 0 || !nuevaDescripcion.trim()) {
      toast.error('Complete descripción y monto válido');
      return;
    }
    const monto = Number(nuevoMonto);
    const saldoActual = caja.saldo_sistema_actual || 0;
    let saldoDespues = saldoActual;
    if (nuevoSubtipo === 'entrada' || nuevoSubtipo === 'ajuste_ingreso') saldoDespues += monto;
    else saldoDespues = Math.max(0, saldoActual - monto);

    const { error } = await supabase.from('movimientos_caja').insert({
      caja_id: caja.id,
      user_id: userId,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: nuevaDescripcion.trim(),
      subtipo: nuevoSubtipo,
      monto,
      saldo_sistema_antes: saldoActual,
      saldo_sistema_despues: saldoDespues,
    });
    if (error) {
      toast.error('Error al registrar movimiento');
      return;
    }
    await supabase.from('caja_proyecto').update({ saldo_sistema_actual: saldoDespues }).eq('id', caja.id);
    setNuevaDescripcion('');
    setNuevoMonto('');
    cargarCaja();
    cargarMovimientos();
    toast.success('Movimiento registrado');
  };

  const conciliar = async (movId: string) => {
    if (!userId || !caja?.id) return;
    const { error } = await supabase
      .from('movimientos_caja')
      .update({ conciliado_fecha: new Date().toISOString() })
      .eq('id', movId);
    if (error) toast.error('Error al conciliar');
    else {
      toast.success('Movimiento conciliado');
      cargarMovimientos();
    }
  };

  if (!userId) return <div className="p-4 text-center text-muted-foreground">Cargando sesión…</div>;

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-6 h-6" /> Caja Chica</h1>
          <p className="text-sm text-muted-foreground">Control de efectivo por proyecto</p>
        </div>
        <Button variant="outline" onClick={inicializarCaja} disabled={!proyectoSeleccionado}>
          <Plus className="w-4 h-4 mr-2" /> Inicializar caja
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={proyectoSeleccionado} onValueChange={setProyectoSeleccionado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {proyectos.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {proyectoSeleccionado && caja && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Saldo Inicial</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">Q{caja.saldo_inicial.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Saldo Sistema</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-blue-600">Q{caja.saldo_sistema_actual.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Saldo Real</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">Q{(caja.saldo_real_actual ?? 0).toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Diferencia</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${(caja.saldo_sistema_actual - (caja.saldo_real_actual ?? 0)) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                Q{(caja.saldo_sistema_actual - (caja.saldo_real_actual ?? 0)).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {proyectoSeleccionado && caja && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Movimiento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Descripción</Label>
              <Input value={nuevaDescripcion} onChange={e => setNuevaDescripcion(e.target.value)} placeholder="Descripción del movimiento" />
            </div>
            <div className="w-32">
              <Label>Monto (Q)</Label>
              <Input type="number" value={nuevoMonto} onChange={e => setNuevoMonto(e.target.value)} placeholder="0.00" />
            </div>
            <div className="w-40">
              <Label>Tipo</Label>
              <Select value={nuevoSubtipo} onValueChange={v => setNuevoSubtipo(v as TipoMovimiento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada"><ArrowDownToLine className="w-4 h-4 inline mr-1" />Entrada</SelectItem>
                  <SelectItem value="salida"><ArrowUpFromLine className="w-4 h-4 inline mr-1" />Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={registrarMovimiento}>Registrar</Button>
          </CardContent>
        </Card>
      )}

      {proyectoSeleccionado && movimientos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Movimientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-right p-2">Monto</th>
                    <th className="text-right p-2">Saldo desp.</th>
                    <th className="text-center p-2">Conciliado</th>
                    <th className="text-center p-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(m => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="p-2">{m.fecha}</td>
                      <td className="p-2">{m.descripcion}</td>
                      <td className="p-2"><Badge variant={m.subtipo.includes('entrada') || m.subtipo.includes('ingreso') ? 'default' : 'destructive'}>{m.subtipo}</Badge></td>
                      <td className={`p-2 text-right ${m.subtipo.includes('entrada') || m.subtipo.includes('ingreso') ? 'text-green-600' : 'text-red-600'}`}>Q{m.monto.toLocaleString()}</td>
                      <td className="p-2 text-right">Q{m.saldo_sistema_despues.toLocaleString()}</td>
                      <td className="p-2 text-center">{m.conciliado_fecha ? <Badge variant="outline" className="text-green-600">Sí</Badge> : <Badge variant="outline">No</Badge>}</td>
                      <td className="p-2 text-center">
                        {!m.conciliado_fecha && (
                          <Button size="sm" variant="outline" onClick={() => conciliar(m.id)}>Conciliar</Button>
                        )}
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

export default CajaChicaScreen;
