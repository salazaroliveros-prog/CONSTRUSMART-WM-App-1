import React, { useState, useEffect, useCallback } from 'react';
import { ConciliacionService, type Conciliacion } from '@/services/financiero/ConciliacionService';
import { useAppContext } from '@/contexts/AppContext';
import { Banknote, Plus, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ConciliacionPanel: React.FC = () => {
  const [data, setData] = useState<Conciliacion[]>([]);
  const { session } = useAppContext();

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const d = await ConciliacionService.getConciliaciones(session.user.id);
      setData(d);
    } catch (error) {
      console.error('Error al cargar conciliaciones:', error);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const nuevaConciliacion = async () => {
    if (!session?.user?.id) return;
    const mes = new Date().toISOString().slice(0, 7) + '-01';
    try {
      await ConciliacionService.crearConciliacion({
        user_id: session.user.id,
        banco: 'Banco Industrial',
        periodo: mes,
        saldo_libros: 0,
        saldo_banco: 0,
      });
      await load();
    } catch (error) {
      toast.error('Error al crear conciliación');
      console.error(error);
    }
  };

  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Banknote className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-card-foreground">Conciliación Bancaria</h3>
        </div>
        <button onClick={nuevaConciliacion} className="flex items-center gap-1 text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-semibold btn-press">
          <Plus className="w-3 h-3" /> Nueva
        </button>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {data.map(c => (
          <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent text-[11px]">
            {c.conciliado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            <span className="font-semibold text-card-foreground w-20">{c.banco}</span>
            <span className="text-muted-foreground">{c.periodo.slice(0, 7)}</span>
            <span className={`ml-auto font-mono font-bold ${c.diferencia === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              Q{Number(c.diferencia).toLocaleString()}
            </span>
          </div>
        ))}
        {data.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Sin conciliaciones</p>}
      </div>
    </div>
  );
};

export default ConciliacionPanel;
