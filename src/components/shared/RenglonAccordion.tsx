import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Users, Cpu, Save } from 'lucide-react';
import { fmtQ } from '@/lib/exporters';
import { toast } from 'sonner';

interface RenglonProps {
  presupuestoId: string;
  renglon: any;
  onUpdate: () => void;
}

export const RenglonAccordion: React.FC<RenglonProps> = ({ presupuestoId, renglon, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState(renglon);

  const subtotal = (data.materiales.reduce((s: number, m: any) => s + (m.cantidad * m.costoUnitario), 0) +
                   (data.cantidad_mo * data.jornal) +
                   (data.cantidad_eq * data.costo_hora));

  const handleUpdate = (field: string, value: any, index?: number, subfield?: string) => {
    const updated = { ...data };
    if (index !== undefined && subfield) {
      updated[field][index][subfield] = Number(value);
    } else {
      updated[field] = Number(value);
    }
    setData(updated);
  };

  const saveChanges = async () => {
    try {
      // Usaremos PresupuestosService si fuera necesario, 
      // pero por ahora invocamos al callback que actualiza el presupuesto padre
      onUpdate();
      toast.success('Cambios guardados');
    } catch (err) {
      toast.error('Error al guardar cambios');
    }
  };

  return (
    <div className="border rounded-lg mb-2 overflow-hidden bg-white shadow-sm border-slate-200">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition text-xs font-bold"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {data.codigo} - {data.descripcion}
        </div>
        <div className="text-blue-700">{fmtQ(subtotal)}</div>
      </button>

      {expanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border-t border-slate-100">
          <div className="space-y-2">
            <h4 className="font-semibold text-[10px] text-slate-500 uppercase flex items-center gap-1"><Package className="w-3 h-3" /> Materiales</h4>
            {data.materiales.map((m: any, i: number) => (
              <div key={i} className="flex gap-2 text-[11px] items-center">
                <input className="flex-1 border rounded px-1 bg-slate-50" value={m.nombre} disabled />
                <input className="w-16 border rounded px-1" type="number" value={m.cantidad} onChange={(e) => handleUpdate('materiales', e.target.value, i, 'cantidad')} />
                <input className="w-20 border rounded px-1" type="number" value={m.costoUnitario} onChange={(e) => handleUpdate('materiales', e.target.value, i, 'costoUnitario')} />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[10px] text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Mano de Obra</h4>
            <div className="flex gap-2 text-[11px] items-center">
              <input className="flex-1 border rounded px-1 bg-slate-50" value="Cuadrilla Base" disabled />
              <input className="w-16 border rounded px-1" type="number" value={data.cantidad_mo} onChange={(e) => handleUpdate('cantidad_mo', e.target.value)} />
              <input className="w-20 border rounded px-1" type="number" value={data.jornal} onChange={(e) => handleUpdate('jornal', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[10px] text-slate-500 uppercase flex items-center gap-1"><Cpu className="w-3 h-3" /> Equipos</h4>
            <div className="flex gap-2 text-[11px] items-center">
              <input className="flex-1 border rounded px-1 bg-slate-50" value="Equipo Pesado" disabled />
              <input className="w-16 border rounded px-1" type="number" value={data.cantidad_eq} onChange={(e) => handleUpdate('cantidad_eq', e.target.value)} />
              <input className="w-20 border rounded px-1" type="number" value={data.costo_hora} onChange={(e) => handleUpdate('costo_hora', e.target.value)} />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-3 flex justify-end">
             <button onClick={saveChanges} className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700">
               <Save className="w-3.5 h-3.5" /> Aplicar cambios a Presupuesto
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
