/**
 * M6: PANEL DE CAMBIOS (CHANGE ORDERS)
 */

import React, { useState } from 'react';
import { Plus, GitCommit, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CambioPresupuesto {
  id: string;
  version: number;
  descripcion: string;
  cambios: Record<string, number>;
  impacto: number;
  porcentajeImpacto: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaCreacion: Date;
  usuarioCreador: string;
  usuarioAprobador?: string;
}

interface PanelCambiosProps {
  cambios: CambioPresupuesto[];
  onAprobarcambio?: (id: string) => void;
  onRechazarCambio?: (id: string) => void;
  onNuevoCambio?: () => void;
}

export const PanelCambios: React.FC<PanelCambiosProps> = ({
  cambios,
  onAprobarcambio,
  onRechazarCambio,
  onNuevoCambio,
}) => {
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pendiente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rechazado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-50 border-green-200';
      case 'pendiente':
        return 'bg-yellow-50 border-yellow-200';
      case 'rechazado':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50';
    }
  };

  const cambiosPendientes = cambios.filter((c) => c.estado === 'pendiente');

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GitCommit className="w-5 h-5" />
          Change Orders (Versionado)
          {cambiosPendientes.length > 0 && (
            <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {cambiosPendientes.length} pendientes
            </span>
          )}
        </CardTitle>
        <Button onClick={onNuevoCambio} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Cambio
        </Button>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {cambios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay cambios registrados</p>
            </div>
          ) : (
            cambios.map((cambio) => (
              <div key={cambio.id} className={`border rounded-lg p-3 ${getEstadoColor(cambio.estado)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getEstadoIcon(cambio.estado)}
                    <div>
                      <p className="font-semibold text-sm">
                        V{cambio.version}: {cambio.descripcion}
                      </p>
                      <p className="text-xs text-gray-600">
                        {cambio.usuarioCreador} • {cambio.fechaCreacion.toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    cambio.impacto > 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {cambio.impacto > 0 ? '+' : ''}Q {cambio.impacto.toLocaleString()} ({cambio.porcentajeImpacto.toFixed(1)}%)
                  </span>
                </div>

                {cambio.estado === 'pendiente' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs"
                      onClick={() => onAprobarcambio?.(cambio.id)}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      onClick={() => onRechazarCambio?.(cambio.id)}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
