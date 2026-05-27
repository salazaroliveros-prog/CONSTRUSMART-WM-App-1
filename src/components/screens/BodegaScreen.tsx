import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { MaterialesService } from '@/services/presupuestos/MaterialesService';
import { BodegaService } from '@/services/proyectos/BodegaService';
import { toast } from 'sonner';
import { Package, Plus, Minus, AlertTriangle, Search, RefreshCw } from 'lucide-react';

interface MaterialRow {
  id: string;
  nombre: string;
  codigo: string | null;
  unidad: string;
  cantidad_estimada: number;
  cantidad_utilizada: number;
  costo_unitario: number;
  proveedor: string | null;
  comprado: number;
  consumido: number;
  stock: number;
}

interface ProyectoSimple {
  id: string;
  nombre: string;
  cliente: string | null;
}

const BodegaScreen: React.FC = () => {
  const { presupuestos } = useAppContext();
  const [selectedId, setSelectedId] = useState('');
  const [materiales, setMateriales] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCompra, setShowCompra] = useState<MaterialRow | null>(null);
  const [compraCantidad, setCompraCantidad] = useState(0);
  const [compraRef, setCompraRef] = useState('');
  const [showUso, setShowUso] = useState<MaterialRow | null>(null);
  const [usoCantidad, setUsoCantidad] = useState(0);

  const proyectos = useMemo<ProyectoSimple[]>(() => {
    return presupuestos.map((p) => ({
      id: p.id,
      nombre: p.proyecto,
      cliente: p.cliente ?? null,
    }));
  }, [presupuestos]);

  const loadMateriales = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const items = await MaterialesService.getMateriales(selectedId);
      // Reemplazo de supabase.from directo por BodegaService
      const movs = await BodegaService.getMovimientos(selectedId);

      const movMap: Record<string, { comprado: number; consumido: number }> = {};
      (movs || []).forEach((m: any) => {
        const mid = m.material_id as string;
        if (!movMap[mid]) movMap[mid] = { comprado: 0, consumido: 0 };
        if (m.tipo === 'entrada') movMap[mid].comprado += Number(m.cantidad);
        else if (m.tipo === 'salida') movMap[mid].consumido += Number(m.cantidad);
      });

      setMateriales(
        items.map((m: Record<string, unknown>) => {
          const mov = movMap[m.id as string] || { comprado: 0, consumido: 0 };
          return {
            id: m.id as string,
            nombre: m.nombre as string,
            codigo: (m.codigo as string | null) ?? null,
            unidad: (m.unidad as string) || 'unidad',
            cantidad_estimada: Number(m.cantidad_estimada) || 0,
            cantidad_utilizada: Number(m.cantidad_utilizada) || 0,
            costo_unitario: Number(m.costo_unitario) || 0,
            proveedor: (m.proveedor as string | null) ?? null,
            comprado: mov.comprado,
            consumido: mov.consumido,
            stock: mov.comprado - mov.consumido,
          };
        })
      );
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { loadMateriales(); }, [loadMateriales]);

  const registrarCompra = async () => {
    if (!showCompra || compraCantidad <= 0) return;
    try {
      await BodegaService.registrarCompra(showCompra.id, compraCantidad, compraRef);
      toast.success('Compra registrada');
      setShowCompra(null);
      setCompraCantidad(0);
      setCompraRef('');
      loadMateriales();
    } catch (err) {
      toast.error('Error al registrar compra');
    }
  };

  const registrarUso = async () => {
    if (!showUso || usoCantidad <= 0) return;
    try {
      await BodegaService.registrarUso(showUso.id, usoCantidad, `Uso manual`, undefined);
      toast.success('Uso registrado');
      setShowUso(null);
      setUsoCantidad(0);
      loadMateriales();
    } catch (err) {
      toast.error('Error al registrar uso');
    }
  };

  const filtered = materiales.filter((m) =>
    m.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: materiales.length,
    presupuestado: materiales.reduce((s, m) => s + m.cantidad_estimada, 0),
    comprado: materiales.reduce((s, m) => s + m.comprado, 0),
    consumido: materiales.reduce((s, m) => s + m.consumido, 0),
    alertas: materiales.filter(
      (m) => m.cantidad_estimada > 0 && (m.stock < 0 || m.comprado === 0)
    ).length,
  };

  return (
    <PageShell showHome={false} title="Gestión de Bodega">
      <div className="p-3 sm:p-5 max-w-[1400px] mx-auto space-y-4">
        {/* Project Selector */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-700" /> Seleccionar Proyecto
          </h3>
          <div className="flex gap-3 items-center">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 max-w-md px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">-- Seleccione un proyecto --</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.cliente ? ` — ${p.cliente}` : ''}
                </option>
              ))}
            </select>
            {selectedId && (
              <button
                onClick={loadMateriales}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            )}
          </div>
        </div>

        {selectedId && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-800 to-blue-700 text-white p-4 rounded-xl shadow-md">
                <p className="text-xs opacity-80">Materiales</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white p-4 rounded-xl shadow-md">
                <p className="text-xs opacity-80">Presupuestado</p>
                <p className="text-2xl font-bold">{stats.presupuestado.toFixed(1)}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-800 to-amber-700 text-white p-4 rounded-xl shadow-md">
                <p className="text-xs opacity-80">Comprado</p>
                <p className="text-2xl font-bold">{stats.comprado.toFixed(1)}</p>
              </div>
              <div
                className={`bg-gradient-to-br ${stats.alertas > 0 ? 'from-red-800 to-red-700' : 'from-slate-800 to-slate-700'} text-white p-4 rounded-xl shadow-md`}
              >
                <p className="text-xs opacity-80">Alertas</p>
                <p className="text-2xl font-bold">{stats.alertas}</p>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-md p-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm border-b pb-1 outline-none focus:border-blue-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Material Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs responsive-table">
                  <thead className="bg-gradient-to-r from-blue-800 to-blue-700 text-white">
                    <tr>
                      <th className="p-2.5 text-left">Material</th>
                      <th className="p-2.5 text-left">Unidad</th>
                      <th className="p-2.5 text-right hidden sm:table-cell">Presup.</th>
                      <th className="p-2.5 text-right">Comprado</th>
                      <th className="p-2.5 text-right">Consumido</th>
                      <th className="p-2.5 text-right">Stock</th>
                      <th className="p-2.5 text-right hidden lg:table-cell">$/Unidad</th>
                      <th className="p-2.5 text-left hidden md:table-cell">Proveedor</th>
                      <th className="p-2.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => {
                      const stockPct =
                        m.cantidad_estimada > 0
                          ? (m.stock / m.cantidad_estimada) * 100
                          : 0;
                      let stockColor = 'text-green-600';
                      if (m.stock < 0) stockColor = 'text-red-600 font-bold';
                      else if (stockPct < 20 && m.comprado > 0)
                        stockColor = 'text-amber-600 font-bold';
                      else if (m.comprado === 0 && m.cantidad_estimada > 0)
                        stockColor = 'text-amber-600';

                      return (
                        <tr
                          key={m.id}
                          className="border-b hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="p-2.5 font-medium">{m.nombre}</td>
                          <td className="p-2.5 text-slate-500">{m.unidad}</td>
                          <td className="p-2.5 text-right hidden sm:table-cell">
                            {m.cantidad_estimada.toFixed(1)}
                          </td>
                          <td className="p-2.5 text-right">
                            {m.comprado.toFixed(1)}
                          </td>
                          <td className="p-2.5 text-right">
                            {m.consumido.toFixed(1)}
                          </td>
                          <td className={`p-2.5 text-right ${stockColor}`}>
                            {m.stock.toFixed(1)}
                          </td>
                          <td className="p-2.5 text-right text-slate-600 hidden lg:table-cell">
                            ${m.costo_unitario.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-slate-500 hidden md:table-cell">
                            {m.proveedor || '—'}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => {
                                  setShowCompra(m);
                                  setCompraCantidad(0);
                                  setCompraRef('');
                                }}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded transition"
                                title="Registrar compra"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setShowUso(m);
                                  setUsoCantidad(0);
                                }}
                                className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition"
                                title="Registrar uso"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          {search
                            ? 'Sin resultados de búsqueda'
                            : 'No hay materiales registrados para este proyecto'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Purchase Modal */}
      {showCompra && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCompra(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm mx-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm mb-1">Registrar Compra</h3>
            <p className="text-xs text-slate-500 mb-4">{showCompra.nombre}</p>
            <input
              type="number"
              value={compraCantidad}
              onChange={(e) => setCompraCantidad(Number(e.target.value))}
              placeholder="Cantidad"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
              min={0}
              step={0.01}
              autoFocus
            />
            <input
              type="text"
              value={compraRef}
              onChange={(e) => setCompraRef(e.target.value)}
              placeholder="Referencia / factura"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCompra(null)}
                className="px-4 py-2 text-xs rounded-lg border text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={registrarCompra}
                disabled={compraCantidad <= 0}
                className="px-4 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
              >
                Registrar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUso && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowUso(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm mx-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm mb-1">Registrar Uso / Salida</h3>
            <p className="text-xs text-slate-500 mb-4">{showUso.nombre}</p>
            {showUso.stock <= 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2 rounded mb-3">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Stock agotado ({showUso.stock.toFixed(1)}). Verifique disponibilidad.
              </div>
            )}
            <input
              type="number"
              value={usoCantidad}
              onChange={(e) => setUsoCantidad(Number(e.target.value))}
              placeholder="Cantidad"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
              min={0}
              step={0.01}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowUso(null)}
                className="px-4 py-2 text-xs rounded-lg border text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={registrarUso}
                disabled={usoCantidad <= 0}
                className="px-4 py-2 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition"
              >
                Registrar Salida
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default BodegaScreen;
