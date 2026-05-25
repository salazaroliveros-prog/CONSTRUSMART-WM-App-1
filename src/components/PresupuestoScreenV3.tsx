/**
 * PresupuestoScreen v3 - Rediseño completo con 3 paneles
 * 
 * Estructura:
 * - Panel Izquierdo: Biblioteca de renglones (búsqueda avanzada)
 * - Panel Central: Editor de líneas (arrastrable, validación en tiempo real)
 * - Panel Derecho: Análisis y cálculos (resultados, sensibilidad, anomalías)
 * 
 * Features:
 * - Integración con CalculoService
 * - Análisis de sensibilidad en tiempo real
 * - Arrastrar y soltar renglones
 * - Búsqueda inteligente con relevancia
 * - Validaciones con alertas visuales
 * - Exportación (JSON, CSV, PDF)
 * - Historial de cambios
 * 
 * @author CONSTRUSMART WM
 * @version 3.0.0
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { usePresupuestos } from '@/hooks/usePresupuestos';
import { useOptimisticList } from '@/hooks/useOptimisticUpdates';
import CalculoService, { LineaCalculada, ResultadoCalculo } from '@/services/CalculoService';
import RenglonesService, { buscarAvanzado } from '@/services/RenglonesService';
import { RENGLONES_BASE } from '@/services/RenglonesService';

import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Search,
  Settings,
  Download,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Eye,
  Copy,
  Lock,
  Unlock,
  Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { exportarPresupuestoPDF } from '@/utils/exportPDF';
import logo from '@/../public/icons/logo192.png';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePresenciaPresupuesto } from '@/hooks/usePresenciaPresupuesto';
import { useBloqueoEdicion } from '@/hooks/useBloqueoEdicion';
import { useEstadoGuardado } from '@/hooks/useEstadoGuardado';
import { FeedbackGuardado } from '@/components/FeedbackGuardado';
import { AnimatedList } from '@/components/AnimatedList';
import { motion } from 'framer-motion';

/**
 * Componente Principal
 */
const PresupuestoScreen: React.FC = () => {
  const { presupuestos, session } = useAppContext();
  const { toast } = useToast();
  const [tabActiva, setTabActiva] = useState<'nuevo' | 'existente' | 'comparar'>('nuevo');
  const [presupuestoActual, setPresupuestoActual] = useState<string | null>(null);
  // Para comparación
  const [presupuestoA, setPresupuestoA] = useState<string | null>(null);
  const [presupuestoB, setPresupuestoB] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Motor de Presupuestos</h1>
              <p className="text-sm text-slate-500 mt-1">Cálculos APU avanzados con análisis de sensibilidad</p>
            </div>
            <Tabs value={tabActiva} onValueChange={(v: string) => setTabActiva(v)} className="w-auto">
              <TabsList>
                <TabsTrigger value="nuevo">Nuevo Presupuesto</TabsTrigger>
                <TabsTrigger value="existente">Abrir</TabsTrigger>
                <TabsTrigger value="comparar">Comparar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <Tabs value={tabActiva} onValueChange={(v: string) => setTabActiva(v)} className="flex-1">
        <TabsContent value="nuevo" className="flex-1">
          <PresupuestoEditor presupuestoId={null} />
        </TabsContent>

        <TabsContent value="existente" className="flex-1">
          <ListaPresupuestos
            presupuestos={presupuestos}
            onSeleccionar={(id) => {
              setPresupuestoActual(id);
              setTabActiva('nuevo');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Editor de Presupuesto - 3 Paneles
 */
const PresupuestoEditor: React.FC<{ presupuestoId: string | null }> = ({ presupuestoId }) => {
  const { toast } = useToast();
  const { user } = useAppContext();
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'material' | 'mano_obra' | 'herramienta'>('todos');
  const [lineas, setLineas] = useState<LineaCalculada[]>([]);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [sensibilidad, setSensibilidad] = useState<Record<string, number> | null>(null);
  const [factores, setFactores] = useState({
    indirectos: 10,
    administrativos: 8,
    imprevistos: 5,
    utilidad: 20,
  });

  // Presencia colaborativa
  const usuariosConectados = usePresenciaPresupuesto(presupuestoId || 'nuevo', { ...user, id: user?.id || user?.nombre });
  const bloqueadoPor = useBloqueoEdicion(presupuestoId || 'nuevo', user?.id || user?.nombre);
  const { estado: estadoGuardado, marcarGuardando, marcarGuardado } = useEstadoGuardado();

  /**
   * Calcular presupuesto cuando cambian líneas o factores
   */
  const calcular = useCallback(() => {
    if (lineas.length === 0) {
      setResultado(null);
      return;
    }

    const servicio = new CalculoService(lineas, factores);
    const res = servicio.calcular().obtenerResultado();
    const sens = servicio.obtenerSensibilidad();

    setResultado(res);
    setSensibilidad(sens);
  }, [lineas, factores]);

  // Recalcular cuando cambian dependencias
  React.useEffect(() => {
    calcular();
  }, [calcular]);

  /**
   * Agregar renglon a las líneas
   */
  const agregarLinea = useCallback((renglon: Renglon) => {
    const id = `linea_${Date.now()}`;
    const nuevaLinea: LineaCalculada = {
      id,
      codigo: renglon.codigo,
      descripcion: renglon.descripcion,
      unidad: renglon.unidad,
      cantidad: 1,
      rendimiento: renglon.rendimiento || 1,
      costoMaterial: renglon.costoMaterial || 0,
      costoManoObra: renglon.costoManoObra || 0,
      costoHerramienta: renglon.costoHerramienta || 0,
      costoUnitario: (renglon.costoMaterial || 0) + (renglon.costoManoObra || 0) + (renglon.costoHerramienta || 0),
      subtotal: 0,
      diasEstimados: 0,
    };

    setLineas((prev) => [...prev, nuevaLinea]);
    marcarGuardando();
    setTimeout(() => marcarGuardado(), 500);
    toast({
      title: 'Renglon agregado',
      description: renglon.descripcion,
    });
  }, [toast, marcarGuardando, marcarGuardado]);

  /**
   * Actualizar línea
   */
  const actualizarLinea = useCallback((id: string, cambios: Partial<LineaCalculada>) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...cambios } : l))
    );
  }, []);

  /**
   * Eliminar línea
   */
  const eliminarLinea = useCallback((id: string) => {
    setLineas((prev) => prev.filter((l) => l.id !== id));
    marcarGuardando();
    setTimeout(() => marcarGuardado(), 500);
  }, [marcarGuardando, marcarGuardado]);

  /**
   * Obtener anomalías
   */
  const anomalias = useMemo(() => {
    if (!resultado) return [];

    const alertas: string[] = [];

    if (resultado.margenUtilidad < 10) {
      alertas.push('Margen de utilidad muy bajo (< 10%)');
    }
    if (resultado.margenUtilidad > 50) {
      alertas.push('Margen de utilidad muy alto (> 50%)');
    }
    if (lineas.length === 0) {
      alertas.push('El presupuesto está vacío');
    }

    return alertas;
  }, [resultado, lineas]);

  return (
    <div className="grid grid-cols-3 gap-4 p-6 h-full overflow-hidden">
      {/* Presencia colaborativa, bloqueo y estado de guardado */}
      <div className="col-span-3 mb-2 flex items-center gap-2">
        {usuariosConectados.length > 1 && (
          <>
            <span className="text-xs text-slate-500 mr-2">Editando:</span>
            {usuariosConectados.map(u => (
              <img key={u.userId} src={u.avatar} alt={u.nombre} title={u.nombre} className="w-6 h-6 rounded-full border-2 border-blue-300 -ml-2 first:ml-0" />
            ))}
          </>
        )}
        {bloqueadoPor && (
          <span className="ml-4 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs animate-pulse">Otro usuario está editando este presupuesto</span>
        )}
        <div className="ml-auto">
          <FeedbackGuardado estado={estadoGuardado} />
        </div>
      </div>
      {/* Panel 1: Biblioteca de Renglones */}
      <BibliotecaRenglones
        search={search}
        setSearch={setSearch}
        tipoFiltro={tipoFiltro}
        setTipoFiltro={setTipoFiltro}
        onAgregarRenglon={agregarLinea}
      />

      {/* Panel 2: Editor de Líneas */}
      <EditorLineas
        lineas={lineas}
        onActualizar={actualizarLinea}
        onEliminar={eliminarLinea}
        anomalias={anomalias}
      />

      {/* Panel 3: Análisis y Resultados */}
      <PanelAnalisis
        resultado={resultado}
        sensibilidad={sensibilidad}
        factores={factores}
        setFactores={setFactores}
        anomalias={anomalias}
        lineas={lineas}
      />
    </div>
  );
};

/**
 * Panel 1: Biblioteca de Renglones
 */
const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));

const BibliotecaRenglones: React.FC<{
  search: string;
  setSearch: (s: string) => void;
  tipoFiltro: string;
  setTipoFiltro: (t: 'todos' | 'material' | 'mano_obra' | 'herramienta') => void;
  onAgregarRenglon: (r: Renglon) => void;
}> = ({ search, setSearch, tipoFiltro, setTipoFiltro, onAgregarRenglon }) => {
  // NUEVO: Filtros avanzados
  const [categoriaFiltro, setCategoriaFiltro] = useState<string[]>([]);
  const [tipologiaFiltro, setTipologiaFiltro] = useState<string[]>([]);
  const [dificultadFiltro, setDificultadFiltro] = useState<string[]>([]);
  const [etiquetasFiltro, setEtiquetasFiltro] = useState<string[]>([]);

  // Extraer valores únicos para filtros
  const categorias = useMemo(() => unique(RENGLONES_BASE.map(r => r.categoria)), []);
  const tipologias = useMemo(() => unique(RENGLONES_BASE.map(r => r.tipologia)), []);
  const dificultades = useMemo(() => unique(RENGLONES_BASE.map(r => r.dificultad)), []);
  const etiquetas = useMemo(() => unique(RENGLONES_BASE.flatMap(r => r.etiquetas || [])), []);

  const renglonesFiltrados = useMemo(() => {
    let result = RENGLONES_BASE;

    if (search) {
      result = result.filter((r) =>
        r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        r.codigo.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (tipoFiltro !== 'todos') {
      result = result.filter((r) => r.tipoRenglon === tipoFiltro);
    }
    if (categoriaFiltro.length > 0) {
      result = result.filter((r) => categoriaFiltro.includes(r.categoria));
    }
    if (tipologiaFiltro.length > 0) {
      result = result.filter((r) => tipologiaFiltro.includes(r.tipologia));
    }
    if (dificultadFiltro.length > 0) {
      result = result.filter((r) => dificultadFiltro.includes(r.dificultad));
    }
    if (etiquetasFiltro.length > 0) {
      result = result.filter((r) => (r.etiquetas || []).some(e => etiquetasFiltro.includes(e)));
    }
    return result;
  }, [search, tipoFiltro, categoriaFiltro, tipologiaFiltro, dificultadFiltro, etiquetasFiltro]);

  // UI de filtros avanzados
  return (
    <Card className="col-span-1 flex flex-col h-full border-blue-200 bg-white shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-4 h-4" />
          Biblioteca
        </CardTitle>
        <CardDescription>Renglones disponibles</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden px-3 pb-3">
        {/* Búsqueda */}
        <Input
          placeholder="Buscar renglon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
          icon={<Search className="w-3 h-3" />}
        />

        {/* Filtros básicos */}
        <div className="flex gap-1 text-xs mb-1">
          {['todos', 'material', 'mano_obra', 'herramienta'].map((tipo) => (
            <Badge
              key={tipo}
              variant={tipoFiltro === tipo ? 'default' : 'outline'}
              className="cursor-pointer flex-1 text-center"
              onClick={() => setTipoFiltro(tipo)}
            >
              {tipo === 'todos' ? 'Todos' : tipo.replace('_', ' ')}
            </Badge>
          ))}
        </div>

        {/* Filtros avanzados */}
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Categoría */}
          {categorias.map((cat) => (
            <Badge
              key={cat}
              variant={categoriaFiltro.includes(cat) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategoriaFiltro((prev) => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
            >
              {cat}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Tipología */}
          {tipologias.map((tip) => (
            <Badge
              key={tip}
              variant={tipologiaFiltro.includes(tip) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTipologiaFiltro((prev) => prev.includes(tip) ? prev.filter(t => t !== tip) : [...prev, tip])}
            >
              {tip}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Dificultad */}
          {dificultades.map((dif) => (
            <Badge
              key={dif}
              variant={dificultadFiltro.includes(dif) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setDificultadFiltro((prev) => prev.includes(dif) ? prev.filter(d => d !== dif) : [...prev, dif])}
            >
              {dif}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Etiquetas */}
          {etiquetas.map((et) => (
            <Badge
              key={et}
              variant={etiquetasFiltro.includes(et) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setEtiquetasFiltro((prev) => prev.includes(et) ? prev.filter(e => e !== et) : [...prev, et])}
            >
              #{et}
            </Badge>
          ))}
        </div>

        {/* Lista */}
        <ScrollArea className="flex-1 border rounded-md">
          <div className="p-2 space-y-1">
            {renglonesFiltrados.map((renglon) => (
              <div
                key={renglon.id}
                className="p-2 border rounded cursor-pointer hover:bg-blue-50 transition group"
                onClick={() => onAgregarRenglon(renglon)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-slate-500">{renglon.codigo}</div>
                    <div className="text-sm font-medium truncate">{renglon.descripcion}</div>
                    <div className="text-xs text-slate-600 mt-1 flex gap-2 flex-wrap items-center">
                      <span>{renglon.unidad} • ${renglon.costoMaterial + renglon.costoManoObra}</span>
                      {renglon.categoria && <Badge variant="outline" className="text-blue-700 border-blue-300">{renglon.categoria}</Badge>}
                      {renglon.tipologia && <Badge variant="outline" className="text-purple-700 border-purple-300">{renglon.tipologia}</Badge>}
                      {renglon.dificultad && <Badge variant="outline" className="text-amber-700 border-amber-300">{renglon.dificultad}</Badge>}
                      {(renglon.etiquetas || []).map(et => (
                        <Badge key={et} variant="outline" className="text-green-700 border-green-300">#{et}</Badge>
                      ))}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

/**
 * Panel 2: Editor de Líneas
 */
const EditorLineas: React.FC<{
  lineas: LineaCalculada[];
  onActualizar: (id: string, cambios: Partial<LineaCalculada>) => void;
  onEliminar: (id: string) => void;
  anomalias: string[];
}> = ({ lineas, onActualizar, onEliminar, anomalias }) => {
  return (
    <Card className="col-span-1 flex flex-col h-full border-green-200 bg-white shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Líneas ({lineas.length})</CardTitle>
        <CardDescription>Editor de renglones</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden px-3 pb-3">
        {anomalias.length > 0 && (
          <Alert className="mb-3 border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-700">
              {anomalias[0]}
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1 border rounded-md">
          <div className="p-2 space-y-2">
            {lineas.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="text-sm">Agrega renglones desde la biblioteca</p>
              </div>
            ) : (
              <AnimatedList items={lineas} direction="left" renderItem={(linea) => (
                <FilaLinea
                  key={linea.id}
                  linea={linea}
                  onActualizar={(cambios) => onActualizar(linea.id, cambios)}
                  onEliminar={() => onEliminar(linea.id)}
                />
              )} />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

/**
 * Componente: Fila de Línea
 */
const FilaLinea: React.FC<{
  linea: LineaCalculada;
  onActualizar: (cambios: Partial<LineaCalculada>) => void;
  onEliminar: () => void;
}> = ({ linea, onActualizar, onEliminar }) => {
  return (
    <div className="p-2 border rounded bg-slate-50 hover:bg-slate-100 transition">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-slate-500">{linea.codigo}</div>
          <div className="text-sm font-medium truncate">{linea.descripcion}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEliminar}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="block text-slate-600 mb-1">Cantidad</label>
          <Input
            type="number"
            value={linea.cantidad}
            onChange={(e) => onActualizar({ cantidad: parseFloat(e.target.value) || 0 })}
            className="h-7"
          />
        </div>
        <div>
          <label className="block text-slate-600 mb-1">Unitario</label>
          <Input
            type="number"
            value={linea.costoUnitario}
            disabled
            className="h-7 bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-slate-600 mb-1">Subtotal</label>
          <Input
            type="number"
            value={linea.subtotal}
            disabled
            className="h-7 bg-slate-100 font-bold text-blue-600"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Panel 3: Análisis y Resultados
 */
const PanelAnalisis: React.FC<{
  resultado: ResultadoCalculo | null;
  sensibilidad: Record<string, number> | null;
  factores: Record<string, number>;
  setFactores: (f: Record<string, number>) => void;
  anomalias: string[];
  lineas: LineaCalculada[];
}> = ({ resultado, sensibilidad, factores, setFactores, anomalias, lineas }) => {

  // ID del panel para exportar
  const panelId = 'panel-analisis-pdf';

  if (!resultado) {
    return (
      <Card className="col-span-1 flex flex-col h-full border-purple-200 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Análisis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-slate-500">Agrega líneas para ver análisis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 flex flex-col h-full border-purple-200 bg-white shadow-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Análisis</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportarPresupuestoPDF(panelId, 'presupuesto.pdf')}
          title="Exportar a PDF"
        >
          <Download className="w-4 h-4 mr-1" /> PDF
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden px-3 pb-3">
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4" id={panelId}>
            {/* Resumen */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-semibold">TOTAL</div>
              <div className="text-3xl font-bold text-blue-900">
                ${resultado.total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {resultado.estimacionDiasTotal} días | ${resultado.precioPorDia.toLocaleString('es-CO')} /día
              </div>
            </div>

            {/* Desglose */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Costo Directo</span>
                <span className="font-semibold">${resultado.costoDirecto.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>+ Indirectos ({resultado.indirectos?.factor || 0}%)</span>
                <span>${resultado.costosIndirectos.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>+ Administrativos ({resultado.administrativos?.factor || 0}%)</span>
                <span>${resultado.costosAdministrativos.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>+ Imprevistos ({resultado.imprevistos?.factor || 0}%)</span>
                <span>${resultado.costosImprevistos.toLocaleString('es-CO')}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-green-700 font-bold">
                <span>+ Utilidad ({resultado.utilidad?.factor || 0}%)</span>
                <span>${resultado.utilidad?.monto?.toLocaleString('es-CO') || 0}</span>
              </div>
            </div>

            {/* Factores */}
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-700 mb-2">Factores</div>
              <div className="space-y-2">
                {['indirectos', 'administrativos', 'imprevistos', 'utilidad'].map((factor) => (
                  <div key={factor} className="flex items-center gap-2">
                    <label className="text-xs w-24 text-slate-600">{factor}</label>
                    <Input
                      type="number"
                      value={factores[factor]}
                      onChange={(e) => setFactores({ ...factores, [factor]: parseFloat(e.target.value) || 0 })}
                      className="h-6 text-xs flex-1"
                    />
                    <span className="text-xs text-slate-600">%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensibilidad */}
            {sensibilidad && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-semibold text-purple-700 mb-2">Sensibilidad</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-600">Pesimista</span>
                    <span className="font-semibold">${sensibilidad.pesimista?.total?.toLocaleString('es-CO') || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Optimista</span>
                    <span className="font-semibold">${sensibilidad.optimista?.total?.toLocaleString('es-CO') || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

/**
 * Componente: Lista de Presupuestos Existentes
 */
const PresupuestoScreen: React.FC = () => {
  const { presupuestos, user } = useAppContext();
  const { toast } = useToast();
  const [tabActiva, setTabActiva] = useState<'nuevo' | 'existente'>('nuevo');
  const [presupuestoActual, setPresupuestoActual] = useState<string | null>(null);

  // ID del área a exportar
  const pdfAreaId = 'presupuesto-pdf';
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header con branding y export PDF */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Logo" className="w-12 h-12 rounded shadow" style={{objectFit:'contain'}} />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Motor de Presupuestos</h1>
                <p className="text-sm text-slate-500 mt-1">Cálculos APU avanzados con análisis de sensibilidad</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{fecha}</span>
                <img src={user.avatar || logo} alt="avatar" className="w-8 h-8 rounded-full border" />
                <span className="text-xs font-semibold text-slate-700">{user.nombre}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Tabs value={tabActiva} onValueChange={(v: string) => setTabActiva(v)} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="nuevo">Nuevo Presupuesto</TabsTrigger>
                    <TabsTrigger value="existente">Abrir</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportarPresupuestoPDF(pdfAreaId, 'presupuesto_completo.pdf')}
                  title="Exportar todo a PDF"
                >
                  <Download className="w-4 h-4 mr-1" /> PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido envuelto para PDF */}
      <div id={pdfAreaId} className="flex-1 flex flex-col">
        <Tabs value={tabActiva} onValueChange={(v: string) => setTabActiva(v)} className="flex-1">
          <TabsContent value="nuevo" className="flex-1">
            <PresupuestoEditor presupuestoId={null} />
          </TabsContent>

          <TabsContent value="existente" className="flex-1">
            <ListaPresupuestos
              presupuestos={presupuestos}
              onSeleccionar={(id) => {
                setPresupuestoActual(id);
                setTabActiva('nuevo');
              }}
            />
          </TabsContent>

          {/* NUEVO: Comparar Presupuestos */}
          <TabsContent value="comparar" className="flex-1">
            <CompararPresupuestos
              presupuestos={presupuestos}
              presupuestoA={presupuestoA}
              setPresupuestoA={setPresupuestoA}
              presupuestoB={presupuestoB}
              setPresupuestoB={setPresupuestoB}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
