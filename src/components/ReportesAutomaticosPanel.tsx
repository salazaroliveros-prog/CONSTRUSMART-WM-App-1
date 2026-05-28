/**
 * ReportesAutomaticosPanel - Generación de reportes
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { reporteCierreFase, reporteSemanal, reporteBatch } from '@/utils/reportesAutomaticos';
import type { Presupuesto, Transaccion } from '@/types/supabase';
import { FileText, Download, Calendar, BarChart3 } from 'lucide-react';

interface ReportesAutomaticosPanelProps {
  presupuesto: Presupuesto;
  transacciones: Transaccion[];
  presupuestos: Presupuesto[];
}

export const ReportesAutomaticosPanel: React.FC<ReportesAutomaticosPanelProps> = ({
  presupuesto,
  transacciones,
  presupuestos,
}) => {
  const [loading, setLoading] = useState(false);
  const [idsSeleccionados, setIdsSeleccionados] = useState<Set<string>>(new Set());

  const generarReporteCierre = async () => {
    setLoading(true);
    try {
      reporteCierreFase(presupuesto, transacciones);
      toast.success(`Reporte de cierre generado: ${presupuesto.proyecto}`);
    } catch (error) {
      toast.error('Error al generar reporte de cierre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generarReporteSemanal = async () => {
    setLoading(true);
    try {
      reporteSemanal(presupuestos, transacciones);
      toast.success('Reporte semanal generado exitosamente');
    } catch (error) {
      toast.error('Error al generar reporte semanal');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generarReporteBatch = async () => {
    if (idsSeleccionados.size === 0) {
      toast.error('Selecciona al menos un presupuesto');
      return;
    }

    setLoading(true);
    try {
      reporteBatch(presupuestos, Array.from(idsSeleccionados), transacciones);
      toast.success(`Exportación batch: ${idsSeleccionados.size} presupuestos`);
      setIdsSeleccionados(new Set());
    } catch (error) {
      toast.error('Error al generar reportes batch');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeleccion = (id: string) => {
    const nuevo = new Set(idsSeleccionados);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    setIdsSeleccionados(nuevo);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reporte de Cierre */}
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Reporte de Cierre
            </CardTitle>
            <CardDescription>Documento final del proyecto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Genera un PDF con resumen financiero, avances y resultados finales.
            </p>
            <Button
              onClick={generarReporteCierre}
              disabled={loading || presupuesto.fase !== 'finalizado'}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Generando...' : 'Descargar PDF'}
            </Button>
            {presupuesto.fase !== 'finalizado' && (
              <p className="text-xs text-yellow-600">
                ⚠️ Solo disponible cuando el proyecto está finalizado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reporte Semanal */}
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reporte Semanal
            </CardTitle>
            <CardDescription>Resumen de la semana actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Dashboard en Excel con proyectos activos, transacciones y avances.
            </p>
            <Button onClick={generarReporteSemanal} disabled={loading} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Generando...' : 'Descargar Excel'}
            </Button>
            <Badge variant="outline" className="w-full text-center py-2">
              Actualizado: {new Date().toLocaleDateString('es-GT')}
            </Badge>
          </CardContent>
        </Card>

        {/* Exportación Batch */}
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Exportación Batch
            </CardTitle>
            <CardDescription>Múltiples presupuestos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Exporta múltiples presupuestos en un solo archivo consolidado.
            </p>
            <Button
              onClick={generarReporteBatch}
              disabled={loading || idsSeleccionados.size === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar {idsSeleccionados.size > 0 ? `(${idsSeleccionados.size})` : ''}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Selección batch */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Presupuestos para Batch</CardTitle>
          <CardDescription>
            {idsSeleccionados.size > 0
              ? `${idsSeleccionados.size} presupuestos seleccionados`
              : 'Elige presupuestos para exportar juntos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {presupuestos.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition"
                onClick={() => toggleSeleccion(p.id)}
              >
                <input
                  type="checkbox"
                  checked={idsSeleccionados.has(p.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSeleccion(p.id);
                  }}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{p.proyecto}</p>
                  <p className="text-sm text-muted-foreground">Q{(p.total || 0).toLocaleString()}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {p.fase}
                </Badge>
              </div>
            ))}
          </div>

          {presupuestos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay presupuestos disponibles</p>
          )}
        </CardContent>
      </Card>

      {/* Información de reportes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ Información de Reportes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • <strong>Reporte de Cierre:</strong> Documento final con estado financiero y
            rentabilidad del proyecto
          </p>
          <p>
            • <strong>Reporte Semanal:</strong> Resumen de actividades de la última semana para
            seguimiento gerencial
          </p>
          <p>
            • <strong>Exportación Batch:</strong> Consolidación de múltiples presupuestos en un
            archivo para análisis comparativo
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
