import React, { useState, useEffect, useCallback } from 'react';
import { MaterialesService } from '@/services/presupuestos/MaterialesService';
import { BodegaService } from '@/services/proyectos/BodegaService';
import { Package, Plus, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string; nombre: string; codigo: string | null; unidad: string; cantidad_estimada: number; cantidad_utilizada: number; costo_unitario: number; proveedor: string | null;
}

interface Props { presupuestoId: string; onClose?: () => void; }

const MaterialesPanel: React.FC<Props> = ({ presupuestoId, onClose }) => {
  const [items, setItems] = useState<Material[]>([]);
  const [nuevo, setNuevo] = useState({ nombre: '', unidad: 'unidad', cantidad: 0 });

  const load = useCallback(async () => {
    try {
      const data = await MaterialesService.getMateriales(presupuestoId);
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar materiales');
    }
  }, [presupuestoId]);

  useEffect(() => { if (presupuestoId) load(); }, [presupuestoId, load]);

  const agregar = async () => {
    if (!nuevo.nombre) return;
    try {
      await MaterialesService.addMaterial({
        presupuesto_id: presupuestoId,
        nombre: nuevo.nombre,
        unidad: nuevo.unidad,
        cantidad_estimada: nuevo.cantidad,
      });
      setNuevo({ nombre: '', unidad: 'unidad', cantidad: 0 });
      await load();
    } catch (err) {
      toast.error('Error al agregar material');
    }
  };

  const registrarCompra = async (id: string, cantidad: number) => {
    try {
      await BodegaService.registrarCompra(id, cantidad, 'Compra Directa');
      toast.success('Compra registrada en Bodega');
      await load();
    } catch (err) {
      toast.error('Error al registrar compra');
      console.error(err);
    }
  };

  const registrarUso = async (id: string, cantidad: number) => {
    try {
      await BodegaService.registrarUso(id, cantidad, 'Uso de material');
      toast.success('Uso registrado');
      await load();
    } catch (err) {
      toast.error('Error al registrar uso de material');
      console.error(err);
    }
  };

  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border p-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <Package className="w-4 h-4 text-emerald-600" />
        <h3 className="text-xs font-bold text-card-foreground">Materiales</h3>
      </div>

      <div className="flex gap-1.5">
        <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" className="flex-1 px-2 py-1 text-[10px] border rounded" />
        <input value={nuevo.cantidad || ''} onChange={e => setNuevo(p => ({ ...p, cantidad: Number(e.target.value) }))} type="number" placeholder="Cant" className="w-16 px-1 py-1 text-[10px] border rounded" />
        <button onClick={agregar} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-semibold btn-press"><Plus className="w-3 h-3" /></button>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.map(m => {
          const restante = Number(m.cantidad_estimada) - Number(m.cantidad_utilizada);
          return (
            <div key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent text-[11px] group">
              <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-card-foreground">{m.nombre}</span>
                <span className="text-muted-foreground ml-1">{m.codigo ? `(${m.codigo})` : ''}</span>
                <div className="text-[9px] text-muted-foreground">
                  Est: {Number(m.cantidad_estimada).toFixed(0)} | Usado: {Number(m.cantidad_utilizada).toFixed(0)} | Restante: <span className={restante <= 0 ? 'text-red-500 font-bold' : 'text-emerald-600'}>{restante.toFixed(0)}</span>
                </div>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">Q{Number(m.costo_unitario).toFixed(0)}</div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => registrarCompra(m.id, 1)} className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600" title="Registrar Compra">
                    <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => registrarUso(m.id, 1)} className="p-1.5 rounded hover:bg-red-100 text-red-600" title="Registrar Uso">
                    <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Sin materiales registrados</p>}
      </div>
    </div>
  );
};

export default MaterialesPanel;
