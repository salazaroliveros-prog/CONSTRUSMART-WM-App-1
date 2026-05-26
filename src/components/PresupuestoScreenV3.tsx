/**
 * PresupuestoScreen v3 - Panel simplificado
 * Versión reducida y funcional
 */

'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const PresupuestoScreenV3: React.FC = () => {
  const { presupuestos } = useAppContext();
  const [tabActiva, setTabActiva] = useState<'nuevo' | 'existente' | 'comparar'>('nuevo');

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Motor de Presupuestos</h1>
              <p className="text-sm text-slate-500 mt-1">Gestor de presupuestos avanzado</p>
            </div>
            <Tabs value={tabActiva} onValueChange={(v: string) => {
              if (v === 'nuevo' || v === 'existente' || v === 'comparar') {
                setTabActiva(v);
              }
            }} className="w-auto">
              <TabsList>
                <TabsTrigger value="nuevo">Nuevo</TabsTrigger>
                <TabsTrigger value="existente">Abrir</TabsTrigger>
                <TabsTrigger value="comparar">Comparar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={tabActiva} onValueChange={(v: string) => {
          if (v === 'nuevo' || v === 'existente' || v === 'comparar') {
            setTabActiva(v);
          }
        }} className="w-full">
          <TabsContent value="nuevo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nuevo Presupuesto</CardTitle>
                <CardDescription>Crear un nuevo presupuesto desde cero</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">Editor de presupuestos en desarrollo</p>
                <Button>Iniciar Presupuesto</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existente" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Presupuestos Existentes</CardTitle>
                <CardDescription>Selecciona un presupuesto para editar</CardDescription>
              </CardHeader>
              <CardContent>
                {presupuestos.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>No hay presupuestos disponibles</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {presupuestos.map((p) => (
                      <div key={p.id} className="p-3 border rounded hover:bg-slate-50">
                        <p className="font-medium">{p.proyecto || 'Sin nombre'}</p>
                        <p className="text-sm text-slate-600">ID: {p.id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparar Presupuestos</CardTitle>
                <CardDescription>Compara dos presupuestos lado a lado</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Funcionalidad de comparación en desarrollo</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PresupuestoScreenV3;
