import React, { useState, useEffect, useCallback } from 'react';
import { ChangeOrderService } from '@/services/presupuestos/ChangeOrderService';
import { useAppContext } from '@/contexts/AppContext';
import { GitBranch, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Cambio {
  id: string;
  presupuesto_id: string;
  version: number;
  cambios: { campo: string; anterior: unknown; nuevo: unknown }[];
  motivo: string;
  aprobado_por: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
}

const ChangeOrderPanel: React.FC<{ presupuestoId: string; onVersionChange?: () => void }> = ({ presupuestoId, onVersionChange }) => {
  const { session } = useAppContext();
  const [cambios, setCambios] = useState<Cambio[]>([]);
  const [motivo, setMotivo] = useState('');
  const [creando, setCreando] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadCambios = useCallback(async () => {
    try {
      const data = await ChangeOrderService.getCambios(presupuestoId);
      setCambios(data as unknown as Cambio[]);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar órdenes de cambio');
    }
  }, [presupuestoId]);

  useEffect(() => { if (presupuestoId) loadCambios(); }, [presupuestoId, loadCambios]);

  const crearCambio = async () => {
    if (!motivo.trim() || !session) return;
    setCreando(true);
    try {
      const nextVersion = (cambios[0]?.version || 0) + 1;
      await ChangeOrderService.crearCambio(presupuestoId, nextVersion, motivo.trim());
      toast.success(`Orden de cambio v${nextVersion} creada`);
      setMotivo('');
      await loadCambios();
      onVersionChange?.();
    } catch (err) {
      toast.error('Error al crear orden de cambio');
    } finally {
      setCreando(false);
    }
  };

  const aprobarCambio = async (id: string) => {
    if (!session) return;
    try {
      await ChangeOrderService.actualizarEstado(id, 'aprobado', session.user.id);
      toast.success('Cambio aprobado');
      await loadCambios();
    } catch { toast.error('Error al aprobar'); }
  };

  const rechazarCambio = async (id: string) => {
    try {
      await ChangeOrderService.actualizarEstado(id, 'rechazado');
      toast.success('Cambio rechazado');
      await loadCambios();
    } catch { toast.error('Error al rechazar'); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <GitBranch className="w-3.5 h-3.5 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-700">Órdenes de Cambio</h3>
        <span className="text-[10px] text-slate-400 ml-auto">v{(cambios[0]?.version || 0)}</span>
      </div>

      <div className="flex gap-2">
        <input value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo del cambio..." className="flex-1 px-2 py-1.5 text-[11px] border rounded" />
        <button onClick={crearCambio} disabled={creando || !motivo.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-[10px] font-semibold disabled:opacity-40 btn-press">
          + Nueva
        </button>
      </div>

      {cambios.map(c => (
        <div key={c.id} className="border rounded-lg p-2 text-[10px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">v{c.version}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                c.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
                c.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {c.estado}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {c.estado === 'pendiente' && (
                <>
                  <button onClick={() => aprobarCambio(c.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => rechazarCambio(c.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="text-slate-400 hover:text-slate-600 p-1">
                <span className="text-xs">{expanded === c.id ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>
          <div className="text-slate-500 mt-0.5">{c.motivo}</div>
          {c.aprobado_por && <div className="text-slate-400 mt-0.5">Aprobado por: {c.aprobado_por.slice(0, 8)}...</div>}
          {expanded === c.id && (
            <div className="mt-1.5 bg-slate-50 rounded p-1.5 space-y-1">
              {c.cambios.map((cc, i) => (
                <div key={i} className="text-[9px] text-slate-600">
                  <span className="font-semibold">{cc.campo}:</span>{' '}
                  <span className="text-red-600 line-through">{String(cc.anterior ?? '—')}</span>
                  {' → '}
                  <span className="text-emerald-600 font-semibold">{String(cc.nuevo ?? '—')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {cambios.length === 0 && (
        <div className="text-center text-[10px] text-slate-400 py-3">Sin cambios registrados</div>
      )}
    </div>
  );
};

export default ChangeOrderPanel;
