import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FileText, Plus, Trash2, Printer, Search, Copy } from 'lucide-react';

interface CotizacionItem {
  id: string;
  categoria: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

interface Cotizacion {
  id: string;
  proyectoId: string;
  cliente: string;
  proyecto: string;
  fecha: string;
  validez: string;
  items: CotizacionItem[];
  descuento: number;
  notas: string;
  creada: string;
}

const CATEGORIAS = [
  'Anteproyecto Residencial',
  'Anteproyecto Comercial',
  'Anteproyecto Industrial',
  'Anteproyecto Civil',
  'Anteproyecto Público',
  'Topografía',
  'Planos de Registro',
  'Otros',
];

const EMPRESA = {
  nombre: 'CONSTRUCTORA WM/M&S',
  slogan: 'Edificando el Futuro',
  logo: '/logo.png',
  direccion: 'Barrio El Centro, Quesada, Jutiapa',
  correo1: 'multiserviciosdeguatemala@gmail.com',
  correo2: 'salazaroliveros@gmail.com',
  whatsapp1: '5560-6172',
  whatsapp2: '4060-1526',
};

function generarId() {
  return `COT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const CotizacionScreen: React.FC = () => {
  const { presupuestos } = useAppContext();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(() => {
    try { return JSON.parse(localStorage.getItem('cotizaciones') || '[]'); }
    catch { return []; }
  });
  const [selectedId, setSelectedId] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRemoveItem, setConfirmRemoveItem] = useState<string | null>(null);

  const current = cotizaciones.find(c => c.id === selectedId);

  const defaultItems: CotizacionItem[] = CATEGORIAS.map(c => ({
    id: crypto.randomUUID(),
    categoria: c,
    descripcion: '',
    cantidad: 1,
    unidad: 'Global',
    precioUnitario: 0,
  }));

  const [items, setItems] = useState<CotizacionItem[]>(defaultItems);
  const [cliente, setCliente] = useState('');
  const [proyectoNombre, setProyectoNombre] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [validez, setValidez] = useState('30 días');
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
  }, [cotizaciones]);

  const selectProyecto = (id: string) => {
    setProyectoId(id);
    const p = presupuestos.find(pr => pr.id === id);
    if (p) {
      setCliente(p.cliente || '');
      setProyectoNombre(p.proyecto || '');
    }
  };

  const loadCotizacion = (c: Cotizacion) => {
    setSelectedId(c.id);
    setCliente(c.cliente);
    setProyectoNombre(c.proyecto);
    setProyectoId(c.proyectoId);
    setValidez(c.validez);
    setDescuento(c.descuento);
    setNotas(c.notas);
    setItems(c.items);
    setShowForm(true);
  };

  const nuevaCotizacion = () => {
    setSelectedId('');
    setCliente('');
    setProyectoNombre('');
    setProyectoId('');
    setValidez('30 días');
    setDescuento(0);
    setNotas('');
    setItems(defaultItems.map(i => ({ ...i, id: crypto.randomUUID() })));
    setShowForm(true);
  };

  const guardarCotizacion = () => {
    if (!cliente) { toast.error('Debe seleccionar un proyecto o ingresar un cliente'); return; }
    const valid = items.filter(i => i.descripcion.trim());
    if (valid.length === 0) { toast.error('Agregue al menos un item con descripción'); return; }

    const cot: Cotizacion = {
      id: selectedId || generarId(),
      proyectoId,
      cliente,
      proyecto: proyectoNombre,
      fecha: new Date().toISOString().split('T')[0],
      validez,
      items: valid,
      descuento,
      notas,
      creada: new Date().toISOString(),
    };

    setCotizaciones(prev => {
      const idx = prev.findIndex(c => c.id === cot.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cot;
        return next;
      }
      return [cot, ...prev];
    });
    setSelectedId(cot.id);
    toast.success('Cotización guardada');
  };

  const duplicarCotizacion = (c: Cotizacion) => {
    const dup: Cotizacion = { ...c, id: generarId(), creada: new Date().toISOString(), fecha: new Date().toISOString().split('T')[0] };
    setCotizaciones(prev => [dup, ...prev]);
    loadCotizacion(dup);
    toast.success('Cotización duplicada');
  };

  const eliminarCotizacion = (id: string) => {
    setCotizaciones(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) nuevaCotizacion();
    toast.success('Cotización eliminada');
  };

  const updateItem = (id: string, field: keyof CotizacionItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const agregarItem = (categoria: string) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      categoria,
      descripcion: '',
      cantidad: 1,
      unidad: 'Global',
      precioUnitario: 0,
    }]);
  };

  const subtotal = items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  const descuentoMonto = subtotal * (descuento / 100);
  const total = subtotal - descuentoMonto;

  const filtered = cotizaciones.filter(c =>
    c.cliente.toLowerCase().includes(search.toLowerCase()) ||
    c.proyecto.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const printPDF = () => {
    const itemsHtml = items.filter(i => i.descripcion.trim()).map(i => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px">${i.categoria}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px">${i.descripcion}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;text-align:center">${i.cantidad}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;text-align:center">${i.unidad}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;text-align:right">Q ${i.precioUnitario.toFixed(2)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;text-align:right">Q ${(i.cantidad * i.precioUnitario).toFixed(2)}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank');
    if (!win) { toast.error('Permita ventanas emergentes'); return; }
    win.document.write(`
      <html>
      <head>
        <title>Cotización ${selectedId}</title>
        <style>
          @page { margin: 15mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:20px; color:#1e293b; }
          .header { text-align:center; border-bottom:3px solid #1e3a5f; padding-bottom:15px; margin-bottom:20px; }
          .header img { max-height:70px; }
          .header h1 { margin:5px 0 0; font-size:20px; color:#1e3a5f; }
          .header p { margin:2px 0; font-size:12px; color:#64748b; font-style:italic; }
          .info { display:flex; justify-content:space-between; margin-bottom:20px; font-size:12px; }
          .info .cliente { background:#f1f5f9; padding:10px; border-radius:6px; flex:1; margin-right:10px; }
          .info .folio { background:#f1f5f9; padding:10px; border-radius:6px; text-align:right; min-width:180px; }
          .info strong { color:#1e3a5f; }
          table { width:100%; border-collapse:collapse; margin-bottom:20px; }
          thead th { background:#1e3a5f; color:#fff; padding:8px; font-size:11px; text-align:left; }
          .totales { text-align:right; font-size:13px; margin-bottom:30px; }
          .totales div { padding:3px 0; }
          .totales .total { font-size:18px; font-weight:bold; color:#1e3a5f; border-top:2px solid #1e3a5f; padding-top:5px; }
          .footer { border-top:2px solid #1e3a5f; padding-top:12px; font-size:11px; color:#475569; text-align:center; }
          .footer div { margin:2px 0; }
          .notas { background:#fef9c3; padding:10px; border-radius:6px; font-size:11px; margin-bottom:20px; }
          @media print { body { padding:0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" alt="Logo" style="display:none" onerror="this.style.display='none'" />
          <h1>${EMPRESA.nombre}</h1>
          <p>${EMPRESA.slogan}</p>
        </div>
        <div class="info">
          <div class="cliente">
            <strong>Cliente:</strong> ${cliente}<br>
            <strong>Proyecto:</strong> ${proyectoNombre}
          </div>
          <div class="folio">
            <strong>Cotización:</strong> ${selectedId}<br>
            <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-GT')}<br>
            <strong>Validez:</strong> ${validez}
          </div>
        </div>
        ${notas ? `<div class="notas"><strong>Notas:</strong> ${notas}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Descripción</th>
              <th style="text-align:center">Cant.</th>
              <th style="text-align:center">Unidad</th>
              <th style="text-align:right">Precio U.</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totales">
          <div>Subtotal: <strong>Q ${subtotal.toFixed(2)}</strong></div>
          ${descuento > 0 ? `<div>Descuento (${descuento}%): <strong>-Q ${descuentoMonto.toFixed(2)}</strong></div>` : ''}
          <div class="total">Total: Q ${total.toFixed(2)}</div>
        </div>
        <div class="footer">
          <div>${EMPRESA.direccion}</div>
          <div>${EMPRESA.correo1} | ${EMPRESA.correo2}</div>
          <div>WhatsApp: ${EMPRESA.whatsapp1} | ${EMPRESA.whatsapp2}</div>
        </div>
        <script>
          setTimeout(function() {
            document.title = "Cotizacion_${selectedId}";
            window.print();
          }, 500);
        <\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <PageShell showHome={false} title="Cotización Profesional">
      <div className="p-3 sm:p-5 max-w-[1600px] mx-auto space-y-4">
        {/* Toolbar */}
        <div className="bg-card rounded-xl shadow-md p-3 flex flex-wrap items-center gap-2 justify-between border dark:border-border">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cotización..."
              className="flex-1 text-sm border-b pb-1 outline-none focus:border-primary bg-transparent dark:text-foreground" />
          </div>
          <div className="flex gap-2">
            <button onClick={nuevaCotizacion}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition">
              <Plus className="w-4 h-4" /> Nueva Cotización
            </button>
            {selectedId && (
              <button onClick={printPDF}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition">
                <Printer className="w-4 h-4" /> PDF / Imprimir
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar: listado de cotizaciones */}
          <div className="lg:col-span-1 bg-card rounded-xl shadow-md overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto border dark:border-border">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white p-3">
              <h3 className="font-bold text-sm">Cotizaciones ({filtered.length})</h3>
            </div>
            {filtered.map(c => (
              <div key={c.id}
                onClick={() => loadCotizacion(c)}
                className={`p-3 border-b dark:border-border cursor-pointer hover:bg-muted/50 transition ${selectedId === c.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}>
                <div className="text-xs font-semibold text-card-foreground truncate">{c.cliente}</div>
                <div className="text-[10px] text-muted-foreground truncate">{c.proyecto}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] text-muted-foreground">{c.id.slice(0, 16)}</span>
                  <span className="text-[10px] font-bold text-primary">Q {(c.items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0) * (1 - (c.descuento || 0) / 100)).toFixed(0)}</span>
                </div>
                <div className="flex gap-1 mt-1 justify-end">
                  <button onClick={(e) => { e.stopPropagation(); duplicarCotizacion(c); }}
                    className="p-0.5 text-muted-foreground hover:text-blue-600" title="Duplicar">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}
                    className="p-0.5 text-muted-foreground hover:text-red-600" title="Eliminar">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-xs">Sin cotizaciones</div>
            )}
          </div>

          {/* Formulario */}
          <div className="lg:col-span-3 space-y-3">
            {showForm && (
              <>
                {/* Encabezado empresa */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl shadow-md p-4 text-center">
                  <h2 className="text-xl font-bold tracking-wide">{EMPRESA.nombre}</h2>
                  <p className="text-blue-200 italic text-sm">{EMPRESA.slogan}</p>
                </div>

                {/* Proyecto / Cliente */}
                <div className="bg-card rounded-xl shadow-md p-4 border dark:border-border">
                  <h3 className="font-bold text-sm text-card-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Datos del Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Proyecto</label>
                      <select value={proyectoId} onChange={e => selectProyecto(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-background dark:bg-muted dark:border-border dark:text-foreground">
                        <option value="">-- Seleccionar proyecto --</option>
                        {presupuestos.map(p => (
                          <option key={p.id} value={p.id}>{p.proyecto} — {p.cliente}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Cliente</label>
                      <input value={cliente} onChange={e => setCliente(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-background dark:bg-muted dark:border-border dark:text-foreground" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Proyecto / Descripción</label>
                      <input value={proyectoNombre} onChange={e => setProyectoNombre(e.target.value)}
                        placeholder="Nombre del proyecto"
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-background dark:bg-muted dark:border-border dark:text-foreground" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Validez</label>
                      <select value={validez} onChange={e => setValidez(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-background dark:bg-muted dark:border-border dark:text-foreground">
                        <option>15 días</option>
                        <option>30 días</option>
                        <option>45 días</option>
                        <option>60 días</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items por categoría */}
                <div className="bg-card rounded-xl shadow-md overflow-hidden border dark:border-border">
                  <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white p-3 flex items-center justify-between">
                    <h3 className="font-bold text-sm">Servicios y Productos</h3>
                    <span className="text-[10px] opacity-80">{items.filter(i => i.descripcion.trim()).length} items</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted dark:bg-muted">
                        <tr>
                          <th className="p-2 text-left text-muted-foreground">Categoría</th>
                          <th className="p-2 text-left text-muted-foreground">Descripción</th>
                          <th className="p-2 text-center w-16 text-muted-foreground">Cant.</th>
                          <th className="p-2 text-center w-16 text-muted-foreground">Unidad</th>
                          <th className="p-2 text-right w-24 text-muted-foreground">Precio Unit.</th>
                          <th className="p-2 text-right w-24 text-muted-foreground">Total</th>
                          <th className="p-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(i => (
                          <tr key={i.id} className="border-b dark:border-border hover:bg-muted/30 transition">
                            <td className="p-1.5">
                              <select value={i.categoria} onChange={e => updateItem(i.id, 'categoria', e.target.value)}
                                className="w-full px-1.5 py-1 text-[10px] border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground">
                                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <input value={i.descripcion} onChange={e => updateItem(i.id, 'descripcion', e.target.value)}
                                placeholder="Describa el servicio..."
                                className="w-full px-1.5 py-1 text-[10px] border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground" />
                            </td>
                            <td className="p-1.5">
                              <input type="number" min={0} step={0.01} value={i.cantidad}
                                onChange={e => updateItem(i.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-[10px] border rounded text-center" />
                            </td>
                            <td className="p-1.5">
                              <input value={i.unidad} onChange={e => updateItem(i.id, 'unidad', e.target.value)}
                                className="w-full px-1 py-1 text-[10px] border rounded text-center" />
                            </td>
                            <td className="p-1.5">
                              <input type="number" min={0} step={0.01} value={i.precioUnitario}
                                onChange={e => updateItem(i.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-[10px] border rounded text-right" />
                            </td>
                            <td className="p-1.5 text-right font-semibold text-primary">
                              Q {(i.cantidad * i.precioUnitario).toFixed(2)}
                            </td>
                            <td className="p-1.5 text-center">
                              <button onClick={() => setConfirmRemoveItem(i.id)}
                                className="p-1 text-red-400 hover:text-red-600 transition">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-2 flex gap-1.5 flex-wrap bg-muted/50">
                    {CATEGORIAS.map(c => (
                      <button key={c} onClick={() => agregarItem(c)}
                        className="text-[9px] px-2 py-1 rounded bg-card dark:bg-card border hover:bg-blue-50 text-muted-foreground transition">
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Totales y notas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-card dark:bg-card rounded-xl shadow-md p-4 md:col-span-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Notas / Condiciones</label>
                    <textarea value={notas} onChange={e => setNotas(e.target.value)}
                      placeholder="Condiciones de pago, tiempo de entrega, garantía..."
                      className="w-full px-3 py-2 border rounded-lg text-sm mt-1" rows={3} />
                  </div>
                  <div className="bg-card dark:bg-card rounded-xl shadow-md p-4">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>Q {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Descuento</span>
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} max={100} value={descuento}
                            onChange={e => setDescuento(parseFloat(e.target.value) || 0)}
                            className="w-14 px-1 py-0.5 text-xs border rounded text-right" />
                          <span>%</span>
                        </div>
                      </div>
                      {descuento > 0 && (
                        <div className="flex justify-between text-red-600 text-xs">
                          <span>- Descuento</span>
                          <span>-Q {descuentoMonto.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold text-blue-900 border-t pt-1.5 mt-1.5">
                        <span>Total</span>
                        <span>Q {total.toFixed(2)}</span>
                      </div>
                    </div>
                    <button onClick={guardarCotizacion}
                      className="w-full mt-3 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-semibold transition">
                      {selectedId && current ? 'Actualizar Cotización' : 'Guardar Cotización'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={o => { if (!o) setConfirmDelete(null); }}
        onConfirm={() => { if (confirmDelete) eliminarCotizacion(confirmDelete); setConfirmDelete(null); }}
        title="Eliminar cotización"
        description="Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta cotización?"
        confirmText="Aceptar"
      />
      <ConfirmDialog
        open={confirmRemoveItem !== null}
        onOpenChange={o => { if (!o) setConfirmRemoveItem(null); }}
        onConfirm={() => { if (confirmRemoveItem) { setItems(prev => prev.filter(x => x.id !== confirmRemoveItem)); setConfirmRemoveItem(null); } }}
        title="Eliminar partida"
        description="¿Estás seguro de eliminar esta partida de la cotización?"
        confirmText="Aceptar"
      />
    </PageShell>
  );
};

export default React.memo(CotizacionScreen);
