/**
 * SeguimientoAvanceScreen - Control y seguimiento integrado de presupuestos
 * 
 * Agrupa todos los paneles de análisis avanzado en una interfaz única:
 * - Dashboard Financiero (M7: Factor Validation + Cash Flow)
 * - Órdenes de Cambio (M6)
 * - Trazabilidad de Materiales (M9)
 * - Conciliación Bancaria (M8)
 * - Checklists de Calidad (M10)
 * - Reportes Automáticos (M1)
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  GitCommit,
  Package,
  DollarSign,
  CheckSquare,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { DashboardFinanciero } from './DashboardFinanciero';
import { ChangeOrdersPanel } from './ChangeOrdersPanel';
import { TrazabilidadMaterialesPanel } from './TrazabilidadMaterialesPanel';
import { ConciliacionBancariaPanel } from './ConciliacionBancariaPanel';
import { ChecklistCalidadPanel } from './ChecklistCalidadPanel';
import { ReportesAutomaticosPanel } from './ReportesAutomaticosPanel';
import type { Presupuesto, Transaccion } from '@/types/supabase';

interface SeguimientoAvanceScreenProps {
  presupuestoId?: string;
}

export const SeguimientoAvanceScreen: React.FC<SeguimientoAvanceScreenProps> = ({ presupuestoId }) => {
  const { presupuestos } = useAppContext();
  const [tabActiva, setTabActiva] = useState('dashboard');

  // Presupuesto actual (si presupuestoId está definido) o el primero
  const presupuestoActual = presupuestoId
    ? presupuestos.find((p) => p.id === presupuestoId) || presupuestos[0]
    : presupuestos[0];

  // Datos simulados de transacciones (en producción vendrían de Supabase)
  const transacciones: Transaccion[] = [];

  if (!presupuestoActual) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">No hay presupuestos disponibles</p>
            <p className="text-sm text-slate-500">Crea un presupuesto para ver el seguimiento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Control y Seguimiento
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Proyecto: <span className="font-medium">{presupuestoActual.proyecto}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                Q{(presupuestoActual.total || 0).toLocaleString('es-GT', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-600 capitalize">{presupuestoActual.fase}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Paneles */}
      <Tabs
        value={tabActiva}
        onValueChange={setTabActiva}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="border-b bg-white px-6">
          <TabsList className="grid w-full grid-cols-6 gap-2 bg-transparent border-b-0 rounded-none p-0 h-auto">
            <TabsTrigger
              value="dashboard"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-4"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard Financiero
            </TabsTrigger>

            <TabsTrigger
              value="cambios"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-4"
            >
              <GitCommit className="w-4 h-4 mr-2" />
              Órdenes de Cambio
            </TabsTrigger>

            <TabsTrigger
              value="materiales"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-4"
            >
              <Package className="w-4 h-4 mr-2" />
              Trazabilidad
            </TabsTrigger>

            <TabsTrigger
              value="caja"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-4"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Conciliación
            </TabsTrigger>

            <TabsTrigger
              value="calidad"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-4"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Checklists
            </TabsTrigger>

            <TabsTrigger
              value="reportes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              Reportes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contenido de Tabs */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Dashboard Financiero */}
            <TabsContent value="dashboard" className="mt-0">
              <DashboardFinanciero
                presupuesto={presupuestoActual}
                transacciones={transacciones}
                presupuestos={presupuestos}
              />
            </TabsContent>

            {/* Órdenes de Cambio */}
            <TabsContent value="cambios" className="mt-0">
              <ChangeOrdersPanel presupuesto={presupuestoActual} />
            </TabsContent>

            {/* Trazabilidad de Materiales */}
            <TabsContent value="materiales" className="mt-0">
              <TrazabilidadMaterialesPanel presupuesto={presupuestoActual} />
            </TabsContent>

            {/* Conciliación Bancaria */}
            <TabsContent value="caja" className="mt-0">
              <ConciliacionBancariaPanel presupuesto={presupuestoActual} />
            </TabsContent>

            {/* Checklists de Calidad */}
            <TabsContent value="calidad" className="mt-0">
              <ChecklistCalidadPanel presupuesto={presupuestoActual} />
            </TabsContent>

            {/* Reportes Automáticos */}
            <TabsContent value="reportes" className="mt-0">
              <ReportesAutomaticosPanel
                presupuesto={presupuestoActual}
                transacciones={transacciones}
                presupuestos={presupuestos}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
