/**
 * ChangeOrdersPanel - Gestión de órdenes de cambio
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChangeOrders } from '@/hooks/useChangeOrders';
import { requiereAprobacionEspecial, calcularImpacto } from '@/utils/changeOrders';
import type { Presupuesto } from '@/types/supabase';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ChangeOrdersPanelProps {
  presupuesto: Presupuesto;
}

export const ChangeOrdersPanel: React.FC<ChangeOrdersPanelProps> = ({ presupuesto }) => {
  const { changeOrders, crearOrden, aprobar, rechazar, loading } = useChangeOrders(presupuesto);
  const [motivoNuevo, setMotivoNuevo] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleCrearOrden = async () => {
    if (!motivoNuevo.trim()) return;
    
    const lineasNuevas = (presupuesto.lineas || []).map((l: any) => ({
      id: (l as any).id,
      codigo: (l as any).codigo,
      cantidad: (l as any).cantidad,
      unitario: (l as any).costoUnitario || 0,
    }));

    await crearOrden(lineasNuevas, motivoNuevo);
    setMotivoNuevo('');
    setIsOpen(false);
  };

  const ordenesAprobadas = changeOrders.filter(co => co.estado === 'aprobada');
  const ordenesPendientes = changeOrders.filter(co => co.estado === 'pendiente');
  const impactoTotal = ordenesAprobadas.reduce((sum, co) => sum + calcularImpacto(co.cambios), 0);
  const requiereEspecial = requiereAprobacionEspecial(impactoTotal, presupuesto.total || 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Órdenes de Cambio</CardTitle>
              <CardDescription>Historial de modificaciones al presupuesto</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>+ Nueva Orden de Cambio</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Orden de Cambio</DialogTitle>
                  <DialogDescription>
                    Describe el motivo del cambio al presupuesto
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Motivo del cambio..."
                    value={motivoNuevo}
                    onChange={(e) => setMotivoNuevo(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleCrearOrden} disabled={loading || !motivoNuevo.trim()}>
                    {loading ? 'Creando...' : 'Crear Orden'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">Total Órdenes</p>
              <p className="text-2xl font-bold">{changeOrders.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Pendientes</p>
              <p className="text-2xl font-bold">{ordenesPendientes.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600">Aprobadas</p>
              <p className="text-2xl font-bold">{ordenesAprobadas.length}</p>
            </div>
            <div className={`p-3 rounded-lg ${impactoTotal > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`text-xs ${impactoTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Impacto Total
              </p>
              <p className={`text-2xl font-bold ${impactoTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Q{impactoTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Alerta si requiere aprobación especial */}
          {requiereEspecial && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                🚨 Cambios acumulados &gt;10% del presupuesto original - Requiere aprobación especial
              </AlertDescription>
            </Alert>
          )}

          {/* Listado de órdenes */}
          {changeOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No hay órdenes de cambio registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changeOrders.map((orden) => (
                <div
                  key={orden.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Versión {orden.version}</p>
                      <p className="text-sm text-slate-600">{orden.descripcion}</p>
                    </div>
                    <Badge
                      variant={
                        orden.estado === 'aprobada'
                          ? 'default'
                          : orden.estado === 'rechazada'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {orden.estado === 'aprobada' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {orden.estado === 'pendiente' && <Clock className="w-3 h-3 mr-1" />}
                      {orden.estado.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-sm">
                      <p className="text-slate-600">Cambios</p>
                      <p className="font-semibold">{orden.cambios.length}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600">Impacto</p>
                      <p className={`font-semibold ${calcularImpacto(orden.cambios) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Q{calcularImpacto(orden.cambios).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600">Fecha</p>
                      <p className="font-semibold">{orden.solicitado_fecha.toLocaleDateString('es-GT')}</p>
                    </div>
                  </div>

                  {orden.estado === 'pendiente' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => aprobar(orden.id, 'usuario_actual', 'Aprobado')}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rechazar(orden.id, 'usuario_actual', 'No aplica en este momento')}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {orden.estado === 'aprobada' && (
                    <div className="text-xs text-green-600 font-medium">
                      ✅ Aprobado por {orden.aprobado_por} el {orden.aprobado_fecha?.toLocaleDateString('es-GT')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
