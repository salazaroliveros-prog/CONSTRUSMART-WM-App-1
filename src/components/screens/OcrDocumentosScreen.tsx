/**
 * OcrDocumentosScreen - gestión de documentos OCR cargados (facturas/comprobantes)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AprobacionService } from '@/services/ocr/AprobacionService';
import { OcrService } from '@/services/ocr/OcrService';
import type { OcrDoc } from '@/services/ocr/OcrService';
import { FileText, CheckCircle2, XCircle, ExternalLink, Eye } from 'lucide-react';

type EstadoFiltro = 'todos' | 'pendiente' | 'aprobado' | 'rechazado';

const OcrDocumentosScreen: React.FC = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;
  const [documentos, setDocumentos] = useState<(OcrDoc & { proyecto_nombre?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<EstadoFiltro>('todos');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargarDocumentos = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let query = supabase.from('ocr_documentos').select('*, proyectos:proyecto_id(nombre)').eq('user_id', userId).order('created_at', { ascending: false });
    if (filtro !== 'todos') query = query.eq('estado', filtro);
    const { data, error } = await query;
    if (error) {
      toast.error('Error al cargar documentos OCR');
      setDocumentos([]);
    } else {
      const mapeados = (data || []).map((d: any) => ({
        ...d,
        proyecto_nombre: d.proyectos?.nombre || '—',
      }));
      setDocumentos(mapeados as (OcrDoc & { proyecto_nombre?: string })[]);
    }
    setLoading(false);
  }, [userId, filtro]);

  useEffect(() => {
    if (!userId) return;
    cargarDocumentos();
  }, [userId, filtro, cargarDocumentos]);

  const aprobar = async (id: string) => {
    if (!userId) return;
    setProcesandoId(id);
    try {
      await AprobacionService.approveDocument(id, userId);
      cargarDocumentos();
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazar = async (id: string) => {
    if (!userId) return;
    const motivo = prompt('Motivo del rechazo (opcional):') || '';
    setProcesandoId(id);
    try {
      await AprobacionService.rejectDocument(id, userId, motivo);
      cargarDocumentos();
    } finally {
      setProcesandoId(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <Badge variant="default" className="bg-green-600">Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pendiente</Badge>;
    }
  };

  if (!userId) return <div className="p-4 text-center text-muted-foreground">Cargando sesión…</div>;

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> OCR / Facturas</h1>
        <p className="text-sm text-muted-foreground">Documentos digitalizados para aprobación y registro automático</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtro por estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['todos', 'pendiente', 'aprobado', 'rechazado'] as EstadoFiltro[]).map(f => (
              <Button key={f} variant={filtro === f ? 'default' : 'outline'} onClick={() => setFiltro(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Cargando documentos…</CardContent></Card>
      ) : documentos.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No hay documentos en esta categoría</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentos.map(doc => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{doc.nombre_archivo || 'Documento sin nombre'}</span>
                  {getEstadoBadge(doc.estado || 'pendiente')}
                </CardTitle>
                <CardDescription>
                  {doc.proyecto_nombre} • {new Date(doc.created_at!).toLocaleDateString('es-GT')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {doc.monto && (
                  <p className="text-lg font-semibold">Q{Number(doc.monto).toLocaleString()}</p>
                )}
                {doc.proveedor && <p className="text-sm"><strong>Proveedor:</strong> {doc.proveedor}</p>}
                {doc.fecha_factura && <p className="text-sm"><strong>Fecha factura:</strong> {doc.fecha_factura}</p>}
                {doc.texto_extraido && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Texto extraído (OCR)</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap">{doc.texto_extraido}</pre>
                  </details>
                )}
                {doc.estado === 'pendiente' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" disabled={procesandoId === doc.id} onClick={() => aprobar(doc.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" disabled={procesandoId === doc.id} onClick={() => rechazar(doc.id)}>
                      <XCircle className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
                {doc.url_documento && (
                  <a href={doc.url_documento} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Ver documento original
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OcrDocumentosScreen;
