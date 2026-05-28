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

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { DashboardFinanciero } from './DashboardFinanciero';
import { ChangeOrdersPanel } from './ChangeOrdersPanel';
import { TrazabilidadMaterialesPanel } from './TrazabilidadMaterialesPanel';
import { ConciliacionBancariaPanel } from './ConciliacionBancariaPanel';
import { ChecklistCalidadPanel } from './ChecklistCalidadPanel';
import { ReportesAutomaticosPanel } from './ReportesAutomaticosPanel';
import { fmtQ } from '@/lib/exporters';

interface SeguimientoAvanceScreenProps {
  presupuestoId?: string;
}

export const SeguimientoAvanceScreen: React.FC<SeguimientoAvanceScreenProps> = ({ presupuestoId }) => {
  const { presupuestos, transacciones: allTransacciones } = useAppContext();
  const [tabActiva, setTabActiva] = useState('dashboard');

  // Presupuesto actual
  const presupuestoActual = presupuestoId
    ? presupuestos.find((p) => p.id === presupuestoId) || presupuestos[0]
    : presupuestos[0];

  const transacciones = useMemo(() => {
    if (!presupuestoActual?.id) return [];
    return allTransacciones.filter(t => t.proyectoId === presupuestoActual.id);
  }, [allTransacciones, presupuestoActual?.id]);

  if (!presupuestoActual) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-card-foreground mb-4">No hay presupuestos disponibles</p>
            <p className="text-sm text-muted-foreground">Crea un presupuesto para ver el seguimiento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-transparent animate-fadeIn">
      {/* Resumen del Proyecto */}
      <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border p-4 mb-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {presupuestoActual.proyecto}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              Fase: <span className="font-medium text-primary">{presupuestoActual.fase}</span> · Tipología: {presupuestoActual.tipologia || 'General'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600">
              {fmtQ(presupuestoActual.total || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Presupuesto Total</p>
          </div>
        </div>
      </div>

      {/* Tabs de Paneles */}
      <Tabs
        value={tabActiva}
        onValueChange={setTabActiva}
        className="flex-1 flex flex-col"
      >
        <div className="bg-card dark:bg-card rounded-t-xl border-x border-t border-border px-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-transparent border-b-0 rounded-none p-0 h-auto">
            <TabsTrigger
              value="dashboard"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-xs"
            >
              Financiero
            </TabsTrigger>

            <TabsTrigger
              value="cambios"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-xs"
            >
              Cambios
            </TabsTrigger>

            <TabsTrigger
              value="materiales"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-xs"
            >
              Materiales
            </TabsTrigger>

            <TabsTrigger
              value="caja"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-xs"
            >
              Caja/Concil.
            </TabsTrigger>

            <TabsTrigger
              value="calidad"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-xs"
            >
              Calidad
            </TabsTrigger>

            <TabsTrigger
              value="reportes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-xs"
            >
              Reportes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contenido de Tabs */}
        <div className="flex-1 bg-card dark:bg-card border-x border-b border-border rounded-b-xl overflow-hidden">
          <div className="p-4 md:p-6">
            {/* Dashboard Financiero */}
            <TabsContent value="dashboard" className="mt-0">
              <DashboardFinanciero
                presupuesto={presupuestoActual}
                transacciones={transacciones}
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
