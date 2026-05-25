import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { exportarPresupuestoPDF } from '@/utils/exportPDF';
import { Button } from '@/components/ui/button';
import { LineaCalculada } from '@/services/CalculoService';

interface Presupuesto {
  id: string;
  proyecto: string;
  cliente: string;
  lineas?: LineaCalculada[];
  total?: number;
  [key: string]: unknown;
}

interface Presupuesto {
  id: string;
  proyecto: string;
  cliente: string;
  lineas?: LineaCalculada[];
  total?: number;
  [key: string]: unknown;
}

const CompararPresupuestos: React.FC<{
  presupuestos: Presupuesto[];
  presupuestoA: string | null;
  setPresupuestoA: (id: string | null) => void;
  presupuestoB: string | null;
  setPresupuestoB: (id: string | null) => void;
}> = ({ presupuestos, presupuestoA, setPresupuestoA, presupuestoB, setPresupuestoB }) => {
  const presA = presupuestos.find((p: Presupuesto) => p.id === presupuestoA) || null;
  const presB = presupuestos.find((p: Presupuesto) => p.id === presupuestoB) || null;
  const areaId = 'comparar-presupuestos-area';

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs mb-1">Presupuesto A</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={presupuestoA || ''}
            onChange={e => setPresupuestoA(e.target.value || null)}
          >
            <option value="">Selecciona...</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>{p.proyecto} ({p.cliente})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Presupuesto B</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={presupuestoB || ''}
            onChange={e => setPresupuestoB(e.target.value || null)}
          >
            <option value="">Selecciona...</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>{p.proyecto} ({p.cliente})</option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="ml-4"
          onClick={() => exportarPresupuestoPDF(areaId, 'comparacion_presupuestos.pdf')}
        >
          Exportar comparación PDF
        </Button>
      </div>
      <div id={areaId} className="flex-1 grid grid-cols-2 gap-4">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Presupuesto A</CardTitle>
            {presA && <div className="text-xs text-slate-500">{presA.proyecto} ({presA.cliente})</div>}
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {presA ? <ResumenPresupuesto presupuesto={presA} /> : <span className="text-slate-400">Selecciona un presupuesto</span>}
          </CardContent>
        </Card>
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Presupuesto B</CardTitle>
            {presB && <div className="text-xs text-slate-500">{presB.proyecto} ({presB.cliente})</div>}
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {presB ? <ResumenPresupuesto presupuesto={presB} /> : <span className="text-slate-400">Selecciona un presupuesto</span>}
          </CardContent>
        </Card>
      </div>

      {/* Comparación línea a línea */}
      {presA && presB && (
        <div className="mt-6">
          <h3 className="font-bold text-base mb-2">Comparación línea a línea</h3>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-2 py-1 text-left">Código</th>
                  <th className="px-2 py-1 text-left">Descripción</th>
                  <th className="px-2 py-1 text-center">Cantidad A</th>
                  <th className="px-2 py-1 text-center">Cantidad B</th>
                  <th className="px-2 py-1 text-center">Unitario A</th>
                  <th className="px-2 py-1 text-center">Unitario B</th>
                  <th className="px-2 py-1 text-center">Subtotal A</th>
                  <th className="px-2 py-1 text-center">Subtotal B</th>
                </tr>
              </thead>
              <tbody>
                {mergeLineas(presA.lineas, presB.lineas).map((row, idx) => {
                  const diffCantidad = row.a?.cantidad !== row.b?.cantidad;
                  const diffUnitario = row.a?.costoUnitario !== row.b?.costoUnitario;
                  const diffSubtotal = row.a?.subtotal !== row.b?.subtotal;
                  return (
                    <tr key={idx} className={diffCantidad || diffUnitario || diffSubtotal ? 'bg-amber-50' : ''}>
                      <td className="px-2 py-1 font-mono">{row.a?.codigo || row.b?.codigo}</td>
                      <td className="px-2 py-1">{row.a?.descripcion || row.b?.descripcion}</td>
                      <td className={`px-2 py-1 text-center ${diffCantidad ? 'text-amber-700 font-bold' : ''}`}>{row.a?.cantidad ?? '-'}</td>
                      <td className={`px-2 py-1 text-center ${diffCantidad ? 'text-amber-700 font-bold' : ''}`}>{row.b?.cantidad ?? '-'}</td>
                      <td className={`px-2 py-1 text-center ${diffUnitario ? 'text-amber-700 font-bold' : ''}`}>{row.a?.costoUnitario ?? '-'}</td>
                      <td className={`px-2 py-1 text-center ${diffUnitario ? 'text-amber-700 font-bold' : ''}`}>{row.b?.costoUnitario ?? '-'}</td>
                      <td className={`px-2 py-1 text-center ${diffSubtotal ? 'text-amber-700 font-bold' : ''}`}>{row.a?.subtotal ?? '-'}</td>
                      <td className={`px-2 py-1 text-center ${diffSubtotal ? 'text-amber-700 font-bold' : ''}`}>{row.b?.subtotal ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Resumen simple, resaltando diferencias clave
const ResumenPresupuesto: React.FC<{ presupuesto: Presupuesto }> = ({ presupuesto }) => {
  return (
    <div className="space-y-2 text-xs">
      <div className="font-bold text-lg text-blue-800">Total: ${(presupuesto.total || 0).toLocaleString('es-CO')}</div>
      <div>Líneas: <span className="font-semibold">{presupuesto.lineas?.length || 0}</span></div>
      <div>Cliente: {presupuesto.cliente}</div>
      <div>Proyecto: {presupuesto.proyecto}</div>
    </div>
  );
};

export default CompararPresupuestos;