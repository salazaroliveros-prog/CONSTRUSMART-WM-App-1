import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { registerSW } from 'virtual:pwa-register';

const UpdateNotification: React.FC = () => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  const updateSW = registerSW({
    onNeedRefresh: () => {
      setShowUpdateNotification(true);
    },
    onOfflineReady: () => {
      console.log('PWA Offline ready');
      // Optionally show a toast or message here about offline capability
    },
  });

  const handleRefresh = async () => {
    await updateSW({ immediate: true });
    setShowUpdateNotification(false); // Hide notification after refresh
  };

  const handleClose = () => {
    setShowUpdateNotification(false);
  };

  return showUpdateNotification ? (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <Card className="w-96 shadow-lg border border-accent animate-fade-in">
        <CardHeader>
          <CardTitle>¡Actualización Disponible!</CardTitle>
          <CardDescription>Se ha encontrado una nueva versión de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Para obtener las últimas mejoras y correcciones, por favor recarga la página.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            <Button onClick={handleRefresh}>
              Recargar Ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null;
};

export default UpdateNotification;
