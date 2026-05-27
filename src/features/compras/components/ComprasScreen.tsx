import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { toast } from 'sonner';
import {
  Building2, FileText, Plus, Search, Edit2, Trash2, PackageCheck, X, Save,
  Truck, CheckCircle, AlertCircle, Clock,
} from 'lucide-react';
import type {
  Proveedor, CreateProveedor, UpdateProveedor,
  OrdenCompra, CreateOrdenCompra, OrdenCompraItem, CreateOrdenCompraItem,
  RecepcionOC, CreateRecepcionOC, RecepcionOCItem, CreateRecepcionOCItem,
} from '@/types/supabase';
import { ProveedoresService } from '@/services/compras/ProveedoresService';
import { OrdenesCompraService } from '@/services/compras/OrdenesCompraService';
import { MaterialesService } from '@/services/presupuestos/MaterialesService';
import { BodegaService } from '@/services/proyectos/BodegaService';

type OCItemForm = Omit<CreateOrdenCompraItem, 'ordenCompraId'> & {
  materialId?: string;
};

type Tab = 'proveedores' | 'ordenes';

const estatusColor: Record<string, string> = {
  pendiente: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
  aprobada: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  recibida_parcial: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
  recibida: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  cancelada: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
};

const estatusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  pendiente: Clock,
  aprobada: CheckCircle,
  recibida_parcial: AlertCircle,
  recibida: Truck,
  cancelada: X,
};

const ComprasScreen: React.FC = () => {
  const { session, proveedores, setView, proyectos, presupuestos } = useAppContext();
  const userId = session?.user?.id;

  const [tab, setTab] = useState<Tab>('proveedores');
  const [search, setSearch] = useState('');

  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [editProveedorId, setEditProveedorId] = useState<string | null>(null);
  const [proveedorForm, setProveedorForm] = useState<CreateProveedor>({
    userId: '', nombre: '', contacto: '', telefono: '', email: '', direccion: '', rfc: '', notas: '', activo: true,
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [proveedoresLocal, setProveedoresLocal] = useState<Proveedor[]>([]);

  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [selectedOC, setSelectedOC] = useState<OrdenCompra | null>(null);
  const [ocItems, setOcItems] = useState<(OrdenCompraItem & { materialId?: string })[]>([]);
  const [showOCForm, setShowOCForm] = useState(false);
  const [ocForm, setOcForm] = useState<CreateOrdenCompra>({
    userId: '', folio: '', proveedorId: '', proyectoId: '', fechaEmision: new Date().toISOString().split('T')[0],
    fechaEntrega: '', estatus: 'pendiente', subtotal: 0, iva: 0, total: 0, notas: '',
  });
  const [ocItemForms, setOcItemForms] = useState<OCItemForm[]>([]);
  const [materialOptions, setMaterialOptions] = useState<{ id: string; nombre: string; unidad: string }[]>([]);
  const [selectedProjectMaterials, setSelectedProjectMaterials] = useState<{ id: string; nombre: string; unidad: string }[]>([]);

  const [showRecepcion, setShowRecepcion] = useState(false);
  const [recepcionCantidades, setRecepcionCantidades] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!userId) return;
    setProveedoresLocal(proveedores);
  }, [proveedores, userId]);

  useEffect(() => {
    if (!userId) return;
    OrdenesCompraService.listar(userId).then(setOrdenes).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const loadProjectMaterials = async () => {
      if (!ocForm.proyectoId) {
        setMaterialOptions([]);
        return;
      }
      const presupuesto = presupuestos.find(p => p.proyectoId === ocForm.proyectoId);
      if (!presupuesto) {
        setMaterialOptions([]);
        return;
      }
      try {
        const materials = await MaterialesService.getMateriales(presupuesto.id);
        setMaterialOptions(materials.map(m => ({ id: m.id, nombre: m.nombre, unidad: m.unidad })));
      } catch (err) {
        console.error('Error cargando materiales del proyecto', err);
        setMaterialOptions([]);
      }
    };

    loadProjectMaterials();
  }, [ocForm.proyectoId, presupuestos]);

  const proveedoresFiltrados = useMemo(() => {
    if (!search.trim()) return proveedoresLocal;
    const q = search.toLowerCase();
    return proveedoresLocal.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.contacto?.toLowerCase().includes(q) ||
      p.rfc?.toLowerCase().includes(q)
    );
  }, [proveedoresLocal, search]);

  const ordenesFiltradas = useMemo(() => {
    if (!search.trim()) return ordenes;
    const q = search.toLowerCase();
    return ordenes.filter(o =>
      o.folio.toLowerCase().includes(q) ||
      proveedoresLocal.find(p => p.id === o.proveedorId)?.nombre.toLowerCase().includes(q)
    );
  }, [ordenes, search, proveedoresLocal]);

  const proveedorNombre = (id?: string) => proveedoresLocal.find(p => p.id === id)?.nombre || '—';

  // ===== Proveedores CRUD =====
  const resetProveedorForm = () => {
    setProveedorForm({ userId: userId || '', nombre: '', contacto: '', telefono: '', email: '', direccion: '', rfc: '', notas: '', activo: true });
    setEditProveedorId(null);
    setShowProveedorForm(false);
  };

  const openEditProveedor = (p: Proveedor) => {
    setEditProveedorId(p.id);
    setProveedorForm({
      userId: p.userId, nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '',
      email: p.email || '', direccion: p.direccion || '', rfc: p.rfc || '', notas: p.notas || '', activo: p.activo,
    });
    setShowProveedorForm(true);
  };

  const handleSaveProveedor = async () => {
    if (!userId) return;
    if (!proveedorForm.nombre.trim()) { toast.error('El nombre del proveedor es requerido'); return; }
    setSaveLoading(true);
    try {
      if (editProveedorId) {
        const updated = await ProveedoresService.actualizar(editProveedorId, proveedorForm);
        setProveedoresLocal(p => p.map(x => x.id === editProveedorId ? updated : x));
        toast.success('Proveedor actualizado');
      } else {
        const created = await ProveedoresService.crear(proveedorForm, userId);
        setProveedoresLocal(p => [created, ...p]);
        toast.success('Proveedor creado');
      }
      resetProveedorForm();
    } catch (err) {
      toast.error('Error al guardar proveedor');
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProveedor = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      await ProveedoresService.eliminar(id);
      setProveedoresLocal(p => p.filter(x => x.id !== id));
      toast.success('Proveedor eliminado');
    } catch (err) {
      toast.error('Error al eliminar proveedor');
    }
  };

  // ===== Órdenes de Compra =====
  const resetOCForm = () => {
    setOcForm({
      userId: userId || '', folio: '', proveedorId: '', proyectoId: '', fechaEmision: new Date().toISOString().split('T')[0],
      fechaEntrega: '', estatus: 'pendiente', subtotal: 0, iva: 0, total: 0, notas: '',
    });
    setOcItemForms([]);
    setShowOCForm(false);
  };

  const handleCreateOC = async () => {
    if (!userId) return;
    if (!ocForm.proveedorId) { toast.error('Selecciona un proveedor'); return; }
    if (!ocForm.proyectoId) { toast.error('Selecciona un proyecto'); return; }
    if (ocItemForms.length === 0) { toast.error('Agrega al menos una partida'); return; }
    setSaveLoading(true);
    try {
      const folio = await OrdenesCompraService.generarFolio(userId);
      const itemsTotal = ocItemForms.reduce((s, i) => s + (i.cantidad * i.precioUnitario), 0);
      const ivaAmount = itemsTotal * 0.16;
      const oc = await OrdenesCompraService.crear({
        ...ocForm, folio, subtotal: itemsTotal, iva: ivaAmount, total: itemsTotal + ivaAmount,
      }, userId);
      await OrdenesCompraService.crearItems(
        ocItemForms.map(i => ({ ...i, ordenCompraId: oc.id }))
      );
      setOrdenes(p => [oc, ...p]);
      toast.success(`OC ${folio} creada`);
      resetOCForm();
    } catch (err) {
      toast.error('Error al crear orden de compra');
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const loadOCItems = async (oc: OrdenCompra) => {
    setSelectedOC(oc);
    const items = await OrdenesCompraService.listarItems(oc.id);
    setOcItems(items);
    return items;
  };

  const openRecepcion = async (oc: OrdenCompra) => {
    setSelectedOC(oc);
    const items = await loadOCItems(oc);
    const cant: Record<string, number> = {};
    items.forEach(i => { cant[i.id] = i.cantidad - i.cantidadRecibida; });
    setRecepcionCantidades(cant);

    const presupuesto = presupuestos.find(p => p.proyectoId === oc.proyectoId);
    if (presupuesto) {
      try {
        const materials = await MaterialesService.getMateriales(presupuesto.id);
        setSelectedProjectMaterials(materials.map(m => ({ id: m.id, nombre: m.nombre, unidad: m.unidad })));
      } catch (err) {
        console.error('Error cargando materiales para recepción', err);
        setSelectedProjectMaterials([]);
      }
    } else {
      setSelectedProjectMaterials([]);
    }

    setShowRecepcion(true);
  };

  const handleRecepcion = async () => {
    if (!selectedOC || !userId) return;
    try {
      const rec = await OrdenesCompraService.crearRecepcion({
        ordenCompraId: selectedOC.id, userId, fechaRecepcion: new Date().toISOString().split('T')[0],
      } as CreateRecepcionOC, userId);
      const itemsRec: CreateRecepcionOCItem[] = [];
      const presupuesto = presupuestos.find(p => p.proyectoId === selectedOC.proyectoId);
      const presupuestoId = presupuesto?.id;

      for (const item of ocItems) {
        const cant = recepcionCantidades[item.id] || 0;
        if (cant <= 0) continue;
        itemsRec.push({ recepcionId: rec.id, ordenCompraItemId: item.id, cantidadRecibida: cant });
        const nuevaRecibida = item.cantidadRecibida + cant;
        await OrdenesCompraService.actualizarCantidadRecibida(item.id, nuevaRecibida);

        let materialId: string | undefined;
        if (selectedProjectMaterials.length > 0) {
          const matched = selectedProjectMaterials.find(m =>
            item.materialId ? m.id === item.materialId : m.nombre.toLowerCase() === item.descripcion.toLowerCase()
          );
          materialId = matched?.id;
        }

        if (!materialId && presupuestoId) {
          const material = await MaterialesService.buscarPorNombre(presupuestoId, item.descripcion);
          materialId = material?.id;
        }

        if (materialId) {
          await BodegaService.registrarMovimiento(materialId, 'entrada', cant, `Recepción OC ${selectedOC.folio}`, userId);
        } else if (presupuestoId) {
          console.warn('No se encontró material vinculado para item de OC:', item.descripcion, item.id);
        }
      }
      if (itemsRec.length > 0) {
        await OrdenesCompraService.crearItemsRecepcion(itemsRec);
      }
      const totalPendiente = ocItems.reduce((s, i) => s + (i.cantidad - i.cantidadRecibida - (recepcionCantidades[i.id] || 0)), 0);
      const nuevoEstatus = totalPendiente <= 0 ? 'recibida' : 'recibida_parcial';
      await OrdenesCompraService.actualizarEstatusOC(selectedOC.id, nuevoEstatus);
      setOrdenes(p => p.map(o => o.id === selectedOC.id ? { ...o, estatus: nuevoEstatus } : o));
      toast.success('Recepción registrada');
      setShowRecepcion(false);
      setSelectedOC(null);
    } catch (err) {
      toast.error('Error al registrar recepción');
      console.error(err);
    }
  };

  const addItemRow = () => {
    setOcItemForms([...ocItemForms, { descripcion: '', cantidad: 1, unidad: 'pza', precioUnitario: 0, importe: 0, cantidadRecibida: 0, materialId: undefined }]);
  };

  const updateItemRow = (idx: number, field: keyof OCItemForm, value: string | number) => {
    setOcItemForms(prev => {
      const next = [...prev];
      const current = { ...next[idx] };
      current[field] = value as any;

      if (field === 'materialId' && typeof value === 'string') {
        const material = materialOptions.find(m => m.id === value);
        if (material) {
          current.descripcion = material.nombre;
          current.unidad = material.unidad;
        }
      }

      if (field === 'cantidad' || field === 'precioUnitario') {
        current.importe = Number(current.cantidad) * Number(current.precioUnitario);
      }

      next[idx] = current;
      return next;
    });
  };

  const removeItemRow = (idx: number) => {
    setOcItemForms(prev => prev.filter((_, i) => i !== idx));
  };

  // ===== Estatus badge =====
  const EstatusBadge = ({ estatus }: { estatus: string }) => {
    const Icon = estatusIcon[estatus] || Clock;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${estatusColor[estatus] || ''}`}>
        <Icon className="w-3 h-3" />
        {estatus.replace('_', ' ')}
      </span>
    );
  };

  return (
    <PageShell showHome={false} title="Compras">
      <div className="p-3 sm:p-5 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setTab('proveedores')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'proveedores'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
            <Building2 className="w-4 h-4" /> Proveedores
          </button>
          <button onClick={() => setTab('ordenes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'ordenes'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
            <FileText className="w-4 h-4" /> Órdenes de Compra
          </button>
        </div>

        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={tab === 'proveedores' ? 'Buscar proveedores...' : 'Buscar OC...'}
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
          </div>
          {tab === 'proveedores' ? (
            <button onClick={() => { resetProveedorForm(); setShowProveedorForm(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Nuevo Proveedor
            </button>
          ) : (
            <button onClick={async () => {
              if (!userId) return;
              const folio = await OrdenesCompraService.generarFolio(userId);
              setOcForm(f => ({ ...f, folio }));
              setShowOCForm(true);
            }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Nueva OC
            </button>
          )}
        </div>

        {/* ===== TAB: PROVEEDORES ===== */}
        {tab === 'proveedores' && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proveedoresFiltrados.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{p.nombre}</h3>
                    {p.contacto && <p className="text-xs text-gray-500 dark:text-gray-400">{p.contacto}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditProveedor(p)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteProveedor(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {p.telefono && <p>📞 {p.telefono}</p>}
                  {p.email && <p>✉️ {p.email}</p>}
                  {p.rfc && <p>🔖 RFC: {p.rfc}</p>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${p.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{p.activo ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            ))}
            {proveedoresFiltrados.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay proveedores registrados</p>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: ÓRDENES DE COMPRA ===== */}
        {tab === 'ordenes' && (
          <div className="space-y-3">
            {ordenesFiltradas.map(oc => (
              <div key={oc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{oc.folio}</span>
                    <EstatusBadge estatus={oc.estatus} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => loadOCItems(oc)}
                      className="text-xs px-3 py-1.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      Ver partidas
                    </button>
                    {(oc.estatus === 'pendiente' || oc.estatus === 'aprobada' || oc.estatus === 'recibida_parcial') && (
                      <button onClick={() => openRecepcion(oc)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                        <PackageCheck className="w-3.5 h-3.5" /> Recibir
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Proveedor: <strong className="text-gray-700 dark:text-gray-200">{proveedorNombre(oc.proveedorId)}</strong></span>
                  <span>Emisión: <strong>{oc.fechaEmision}</strong></span>
                  <span>Total: <strong className="text-gray-700 dark:text-gray-200">${oc.total.toLocaleString()}</strong></span>
                </div>
                {selectedOC?.id === oc.id && ocItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left py-1 pr-2">Descripción</th>
                          <th className="text-right px-2">Cant</th>
                          <th className="text-right px-2">P/U</th>
                          <th className="text-right pl-2">Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocItems.map(item => (
                          <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50">
                            <td className="py-1.5 pr-2 text-gray-700 dark:text-gray-300">{item.descripcion}</td>
                            <td className="text-right px-2 text-gray-600 dark:text-gray-400">{item.cantidad} {item.unidad}</td>
                            <td className="text-right px-2 text-gray-600 dark:text-gray-400">${item.precioUnitario.toLocaleString()}</td>
                            <td className="text-right pl-2 font-medium text-gray-700 dark:text-gray-200">${item.importe.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            {ordenesFiltradas.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay órdenes de compra</p>
              </div>
            )}
          </div>
        )}

        {/* ===== MODAL: Proveedor Form ===== */}
        {showProveedorForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={resetProveedorForm}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editProveedorId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <button onClick={resetProveedorForm} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <input type="text" placeholder="Nombre del proveedor *" value={proveedorForm.nombre}
                  onChange={e => setProveedorForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Contacto" value={proveedorForm.contacto} onChange={e => setProveedorForm(f => ({ ...f, contacto: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
                  <input type="text" placeholder="Teléfono" value={proveedorForm.telefono} onChange={e => setProveedorForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
                </div>
                <input type="email" placeholder="Email" value={proveedorForm.email} onChange={e => setProveedorForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="RFC" value={proveedorForm.rfc} onChange={e => setProveedorForm(f => ({ ...f, rfc: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
                  <input type="text" placeholder="Dirección" value={proveedorForm.direccion} onChange={e => setProveedorForm(f => ({ ...f, direccion: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
                </div>
                <textarea placeholder="Notas" rows={3} value={proveedorForm.notas} onChange={e => setProveedorForm(f => ({ ...f, notas: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100 resize-none" />
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input type="checkbox" checked={proveedorForm.activo} onChange={e => setProveedorForm(f => ({ ...f, activo: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600" /> Proveedor activo
                </label>
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
                <button onClick={resetProveedorForm} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                <button onClick={handleSaveProveedor} disabled={saveLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saveLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL: OC Form ===== */}
        {showOCForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nueva Orden de Compra</h2>
                <button onClick={resetOCForm} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Folio</label>
                    <input type="text" value={ocForm.folio} readOnly
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Proveedor *</label>
                    <select value={ocForm.proveedorId} onChange={e => setOcForm(f => ({ ...f, proveedorId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100">
                      <option value="">Seleccionar...</option>
                      {proveedoresLocal.filter(p => p.activo).map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Proyecto</label>
                    <select value={ocForm.proyectoId} onChange={e => setOcForm(f => ({ ...f, proyectoId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100">
                      <option value="">Seleccionar...</option>
                      {proyectos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha de emisión</label>
                    <input type="date" value={ocForm.fechaEmision} onChange={e => setOcForm(f => ({ ...f, fechaEmision: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha de entrega</label>
                  <input type="date" value={ocForm.fechaEntrega} onChange={e => setOcForm(f => ({ ...f, fechaEntrega: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100" />
                </div>
                <textarea placeholder="Notas" rows={2} value={ocForm.notas} onChange={e => setOcForm(f => ({ ...f, notas: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-gray-100 resize-none" />

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Partidas</label>
                    <button onClick={addItemRow} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">+ Agregar partida</button>
                  </div>
                  {ocItemForms.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 mb-2">
                      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_0.9fr_0.9fr_0.6fr_auto] gap-2 items-end">
                        <select value={item.materialId || ''}
                          onChange={e => updateItemRow(idx, 'materialId', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100">
                          <option value="">Material (opcional)</option>
                          {materialOptions.map(m => (
                            <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>
                          ))}
                        </select>
                        <input type="text" placeholder="Descripción" value={item.descripcion}
                          onChange={e => updateItemRow(idx, 'descripcion', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100" />
                        <input type="number" placeholder="Cant" value={item.cantidad}
                          onChange={e => updateItemRow(idx, 'cantidad', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100 text-right" />
                        <input type="text" placeholder="Und" value={item.unidad}
                          onChange={e => updateItemRow(idx, 'unidad', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100" />
                        <input type="number" placeholder="$" value={item.precioUnitario}
                          onChange={e => updateItemRow(idx, 'precioUnitario', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100 text-right" />
                        <button onClick={() => removeItemRow(idx)} className="p-1.5 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="text-right text-xs text-gray-600 dark:text-gray-400">Importe: ${item.importe.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
                <button onClick={resetOCForm} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                <button onClick={handleCreateOC} disabled={saveLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saveLoading ? 'Creando...' : 'Crear OC'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL: Recepción ===== */}
        {showRecepcion && selectedOC && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recepción — {selectedOC.folio}</h2>
                <button onClick={() => { setShowRecepcion(false); setSelectedOC(null); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Ingresa las cantidades recibidas para cada partida:</p>
                {ocItems.map(item => {
                  const matchedMaterial = selectedProjectMaterials.find(m =>
                    item.materialId ? m.id === item.materialId : m.nombre.toLowerCase() === item.descripcion.toLowerCase()
                  );
                  return (
                    <div key={item.id} className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{item.descripcion}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Pedido: {item.cantidad} {item.unidad} · Recibido: {item.cantidadRecibida} · Pendiente: {item.cantidad - item.cantidadRecibida}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${matchedMaterial ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {matchedMaterial ? `Material: ${matchedMaterial.nombre}` : 'Material no vinculado'}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={item.cantidad - item.cantidadRecibida}
                        value={recepcionCantidades[item.id] || 0}
                        onChange={e => setRecepcionCantidades(c => ({ ...c, [item.id]: Number(e.target.value) }))}
                        className="w-20 px-2 py-1.5 text-sm border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100 text-right"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => { setShowRecepcion(false); setSelectedOC(null); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                <button onClick={handleRecepcion}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700">
                  <PackageCheck className="w-4 h-4" /> Confirmar Recepción
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ComprasScreen;
