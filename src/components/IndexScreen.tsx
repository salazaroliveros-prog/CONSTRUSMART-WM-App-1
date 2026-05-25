/**
 * IndexScreen - Pantalla principal con navegación a módulos
 * 
 * Opciones principales:
 * 1. Motor de Presupuestos (PresupuestoScreenV3)
 * 2. Seguimiento y Control (SeguimientoAvanceScreen)
 * 3. Dashboard (si existe)
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalculatorIcon,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface ModuleProps {
  onSelectModule: (module: 'presupuestos' | 'seguimiento' | 'dashboard') => void;
}

export const IndexScreen: React.FC<ModuleProps> = ({ onSelectModule }) => {
  const { presupuestos } = useAppContext();
  const [activeModule, setActiveModule] = useState<'presupuestos' | 'seguimiento' | 'dashboard' | null>(null);

  const handleSelectModule = (module: 'presupuestos' | 'seguimiento' | 'dashboard') => {
    setActiveModule(module);
    onSelectModule(module);
  };

  // Estadísticas
  const presupuestosActivos = presupuestos.filter((p) => p.fase !== 'finalizado').length;
  const presupuestosFinalizados = presupuestos.filter((p) => p.fase === 'finalizado').length;
  const montoTotal = presupuestos.reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header Hero */}
      <div className="relative px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">CONSTRUSMART WM</h1>
          <p className="text-lg text-blue-100 mb-2">Control Integral de Presupuestos y Obras</p>
          <p className="text-sm text-blue-200">Sistema avanzado de gestión para empresas constructoras</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700">{presupuestosActivos}</p>
                <p className="text-sm text-green-600">Presupuestos Activos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-700">{presupuestosFinalizados}</p>
                <p className="text-sm text-blue-600">Proyectos Finalizados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-orange-700">
                  Q{(montoTotal / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-orange-600">Monto Total en Cartera</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Módulos Principales */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Módulos Disponibles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Motor de Presupuestos */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-slate-300 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <CalculatorIcon className="w-6 h-6" />
                <div>
                  <CardTitle>Motor de Presupuestos</CardTitle>
                  <CardDescription className="text-blue-100">
                    Cálculos APU con análisis de sensibilidad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700 mb-4">
                Herramienta profesional para crear y editar presupuestos con:
              </p>
              <ul className="space-y-2 mb-6 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Cálculos APU en tiempo real
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Análisis de sensibilidad
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Arrastrar y soltar renglones
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Exportación (PDF, CSV, JSON)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Comparación entre presupuestos
                </li>
              </ul>

              <Badge className="mb-4 bg-blue-100 text-blue-800">v3.0.0 - Completo</Badge>

              <Button
                onClick={() => handleSelectModule('presupuestos')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Abrir Motor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Seguimiento y Control */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-slate-300 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                <div>
                  <CardTitle>Seguimiento y Control</CardTitle>
                  <CardDescription className="text-green-100">
                    Análisis avanzado del proyecto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700 mb-4">
                Panel integral de control y monitoreo con:
              </p>
              <ul className="space-y-2 mb-6 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Dashboard financiero
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Órdenes de cambio
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Trazabilidad de materiales
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Conciliación bancaria
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Checklists de calidad
                </li>
              </ul>

              <Badge className="mb-4 bg-green-100 text-green-800">Phase 3 - Nuevo</Badge>

              <Button
                onClick={() => handleSelectModule('seguimiento')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Abrir Panel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-blue-100 text-sm border-t border-blue-800">
        <p>© 2026 CONSTRUSMART WM - Sistema de Gestión Integral de Obras</p>
      </div>
    </div>
  );
};
