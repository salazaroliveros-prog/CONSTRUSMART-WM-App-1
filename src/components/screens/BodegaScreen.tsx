import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { MaterialesService } from '@/services/presupuestos/MaterialesService';
import { BodegaService } from '@/services/proyectos/BodegaService';
import { OrdenesCompraService } from '@/services/compras/OrdenesCompraService';
import { FinancieroService } from '@/services/financiero/FinancieroService';
import { toast } from 'sonner';
import type { CreateOrdenCompraItem, CreateOrdenCompra } from '@/types/supabase';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus, Minus, Package, ShoppingCart, AlertTriangle } from 'lucide-react';

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
  const { presupuestos, session, setView } = useAppContext();
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState('');
  const [materiales, setMateriales] = useState<MaterialRow[]>([]);
  const [search, setSearch] = useState('');
  const [showCompra, setShowCompra] = useState<MaterialRow | null>(null);
  const [compraCantidad, setCompraCantidad] = useState(0);
  const [compraRef, setCompraRef] = useState('');
  const [showUso, setShowUso] = useState<MaterialRow | null>(null);
  const [usoCantidad, setUsoCantidad] = useState(0);
  const [saving, setSaving] = useState(false);

  const presupuestosOptions = useMemo<ProyectoSimple[]>(() => {
    return presupuestos.map((p) => ({
      id: p.id,
      nombre: p.proyecto,
      cliente: p.cliente ?? null,
    }));
  }, [presupuestos]);

  const selectedPresupuesto = useMemo(() => {
    return presupuestos.find(p => p.id === selectedPresupuestoId);
  }, [presupuestos, selectedPresupuestoId]);

  const loadMateriales = useCallback(async () => {
    if (!selectedPresupuestoId) {
      setMateriales([]);
      return;
    }
    try {
      // 1. Persistir materiales desglosados si no existen (evita IDs efímeros)
      const items = await MaterialesService.persistDesglosados(selectedPresupuestoId);
      
      const movs = await BodegaService.getMovimientos(selectedPresupuestoId);

      const movMap: Record<string, { comprado: number; consumido: number }> = {};
      (movs || []).forEach((m: Record<string, unknown>) => {
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
    } catch {
      toast.error('Error al cargar materiales');
    }
  }, [selectedPresupuestoId]);

  useEffect(() => { loadMateriales(); }, [loadMateriales]);

  const registrarCompra = async () => {
    if (!showCompra || compraCantidad <= 0 || !session?.user?.id) return;
    setSaving(true);
    try {
      await BodegaService.registrarCompra(showCompra.id, compraCantidad, compraRef);
      // Registrar gasto en transacciones para que aparezca en Dashboard
      try {
        await FinancieroService.registrarTransaccion({
          tipo: 'gasto',
          descripcion: `Compra material: ${showCompra.nombre}${compraRef ? ` (${compraRef})` : ''}`,
          cantidad: compraCantidad,
          unidad: showCompra.unidad,
          categoria: 'materiales',
          costoUnitario: showCompra.costo_unitario,
          costoTotal: compraCantidad * showCompra.costo_unitario,
          fecha: new Date().toISOString().split('T')[0],
          proyectoId: selectedPresupuesto?.proyectoId || 'admin',
        }, session.user.id);
      } catch { /* transacción secundaria, no bloquear */ }
      toast.success('Compra registrada');
      setShowCompra(null);
      setCompraCantidad(0);
      setCompraRef('');
      loadMateriales();
    } catch (err) {
      toast.error('Error al registrar compra');
    } finally {
      setSaving(false);
    }
  };

  const registrarUso = async () => {
    if (!showUso || usoCantidad <= 0) return;
    if (usoCantidad > showUso.stock) {
      toast.error('La cantidad de uso no puede ser mayor al stock disponible');
      return;
    }
    setSaving(true);
    try {
      await BodegaService.registrarUso(showUso.id, usoCantidad, `Uso manual`, undefined);
      toast.success('Uso registrado');
      setShowUso(null);
      setUsoCantidad(0);
      loadMateriales();
    } catch (err) {
      toast.error('Error al registrar uso');
    } finally {
      setSaving(false);
    }
  };

  const filtered = materiales.filter((m) =>
    m.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const generarOC = async () => {
    if (!session?.user?.id) return;
    const sinComprar = filtered.filter(m => m.comprado === 0 && m.cantidad_estimada > 0);
    if (sinComprar.length === 0) {
      toast.info('Todos los materiales ya tienen compras registradas');
      return;
    }
    setSaving(true);
    try {
      const folio = await OrdenesCompraService.generarFolio(session.user.id);
      const subtotal = sinComprar.reduce((sum, material) => sum + material.cantidad_estimada * material.costo_unitario, 0);
      const iva = subtotal * 0.12; // Estandarizar a 12% o IVA local
      const total = subtotal + iva;
      const ocPayload: CreateOrdenCompra = {
        folio,
        proveedorId: undefined,
        proyectoId: selectedPresupuesto?.proyectoId || undefined,
        fechaEmision: new Date().toISOString().slice(0, 10),
        estatus: 'pendiente',
        subtotal,
        iva,
        total,
        notas: `Generada automáticamente desde Bodega para presupuesto: ${selectedPresupuesto?.proyecto}`,
        userId: session.user.id,
      };
      const oc = await OrdenesCompraService.crear(ocPayload, session.user.id);
      
      const items: CreateOrdenCompraItem[] = sinComprar.map(m => ({
        ordenCompraId: oc.id,
        descripcion: m.nombre,
        cantidad: m.cantidad_estimada,
        unidad: m.unidad,
        precioUnitario: m.costo_unitario,
        importe: m.cantidad_estimada * m.costo_unitario,
        cantidadRecibida: 0,
        materialId: m.id,
      }));
      await OrdenesCompraService.crearItems(items);
      
      toast.success(`OC ${folio} creada con ${sinComprar.length} materiales`);
      loadMateriales();
    } catch (err) {
      console.error(err);
      toast.error('Error al generar orden de compra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="Gestión de Bodega e Inventario">
      <div className="flex flex-col p-3 sm:p-5 max-w-7xl mx-auto space-y-4 animate-fadeIn">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[240px]">
                <label className="text-tiny font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Seleccionar Presupuesto</label>
                <select 
                  value={selectedPresupuestoId} 
                  onChange={(e) => setSelectedPresupuestoId(e.target.value)}
                  className="input-standard h-10"
                >
                  <option value="">Seleccione un proyecto...</option>
                  {presupuestosOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.cliente ? ` — ${p.cliente}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[240px]">
                <label className="text-tiny font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Buscar Material</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nombre o código..."
                    className="pl-9 h-10"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2 h-10">
                <button
                  onClick={generarOC}
                  disabled={saving || !selectedPresupuestoId}
                  className="btn-success h-10 px-3"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Generar OC
                </button>
                <button
                  onClick={() => setView('compras')}
                  className="btn-secondary h-10 px-3"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Ver OC
                </button>
              </div>
            </div>
          </Card>

        {!selectedPresupuestoId ? (
          <div className="bg-card rounded-xl shadow-md p-12 text-center">
            <Package className="w-16 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold text-card-foreground">No se ha seleccionado proyecto</h3>
            <p className="text-sm text-muted-foreground">Elija un proyecto arriba para ver el inventario de materiales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-card rounded-xl shadow-md overflow-hidden border dark:border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 dark:bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold border-b dark:border-border">
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
                          <td className="p-2.5 text-muted-foreground">{m.unidad}</td>
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
                          <td className="p-2.5 text-right text-muted-foreground hidden lg:table-cell">
                            ${m.costo_unitario.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-muted-foreground hidden md:table-cell">
                            {m.proveedor || '—'}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex gap-1 justify-center animate-fade-in-up">
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
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
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
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showCompra && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCompra(null)}
        >
          <div
            className="bg-card rounded-xl shadow-2xl p-5 w-full max-w-sm mx-3 border dark:border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm mb-1 text-card-foreground">Registrar Entrada / Compra</h3>
            <p className="text-xs text-muted-foreground mb-4">{showCompra.nombre}</p>
            <input
              type="number"
              value={compraCantidad || ''}
              onChange={(e) => setCompraCantidad(parseFloat(e.target.value) || 0)}
              placeholder="Cantidad"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2 bg-background dark:bg-muted dark:border-border"
              min={0}
              autoFocus
            />
            <input
              type="text"
              value={compraRef}
              onChange={(e) => setCompraRef(e.target.value)}
              placeholder="Referencia (ej. Factura #, OC)"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4 bg-background dark:bg-muted dark:border-border"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCompra(null)}
                className="px-4 py-2 text-xs rounded-lg border text-muted-foreground hover:bg-accent transition"
              >
                Cancelar
              </button>
              <button
                onClick={registrarCompra}
                disabled={compraCantidad <= 0 || saving}
                className="px-4 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
              >
                {saving ? 'Guardando...' : 'Registrar Entrada'}
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
            className="bg-card rounded-xl shadow-2xl p-5 w-full max-w-sm mx-3 border dark:border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm mb-1 text-card-foreground">Registrar Uso / Salida</h3>
            <p className="text-xs text-muted-foreground mb-4">{showUso.nombre}</p>
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
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4 bg-background dark:bg-muted dark:border-border"
              min={0}
              step={0.01}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowUso(null)}
                className="px-4 py-2 text-xs rounded-lg border text-muted-foreground hover:bg-accent transition"
              >
                Cancelar
              </button>
              <button
                onClick={registrarUso}
                disabled={usoCantidad <= 0 || saving}
                className="px-4 py-2 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition"
              >
                {saving ? 'Guardando...' : 'Registrar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default React.memo(BodegaScreen);
