import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { OcrService } from '@/services/ocr/OcrService';
import { AprobacionService } from '@/services/ocr/AprobacionService';
import { toast } from 'sonner';
import PageShell from '@/components/shared/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check, XCircle, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Tipo local para documentos OCR (la tabla ocr_documentos en Supabase)
interface OcrDoc {
  id: string;
  user_id: string;
  proyecto_id?: string | null;
  proveedor?: string | null;
  monto?: number | null;
  fecha_factura?: string | null;
  notas?: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  revisado_por?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

const AprobacionScreen: React.FC = () => {
  const { session, proyectos, presupuestos } = useAppContext();
  const [documents, setDocuments] = useState<OcrDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [openDialog, setOpenDialog] = useState<'approve' | 'reject' | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(null);

  // Resuelve el nombre de un proyecto o presupuesto por ID (ocr_documentos.proyecto_id puede apuntar a ambos)
  const resolverNombreProyecto = (id: string | null | undefined): string => {
    if (!id) return 'Sin Proyecto';
    const proy = proyectos.find(p => p.id === id);
    if (proy) return proy.nombre;
    const pres = presupuestos.find(p => p.id === id);
    if (pres) return pres.proyecto;
    return 'Sin Proyecto';
  };

  const userId = session?.user?.id;

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await OcrService.getDocuments(selectedProyectoId || undefined);
      setDocuments(docs.filter(doc => doc.estado === 'pendiente')); // Only show pending
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Error al cargar los documentos.");
    } finally {
      setLoading(false);
    }
  }, [selectedProyectoId]);

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId, fetchDocuments]);

  const handleAction = async (docId: string, action: 'approve' | 'reject') => {
    if (!userId) return;
    setSelectedDocumentId(docId);
    setOpenDialog(action);
  };

  const confirmAction = async () => {
    if (!selectedDocumentId || !userId) return;
    setLoading(true);
    try {
      if (openDialog === 'approve') {
        await AprobacionService.approveDocument(selectedDocumentId, userId);
      } else if (openDialog === 'reject') {
        await AprobacionService.rejectDocument(selectedDocumentId, userId, rejectionNotes[selectedDocumentId] || '');
      }
      fetchDocuments(); // Refresh list
      toast.success(`Documento ${openDialog}ado correctamente.`);
    } catch (error) {
      console.error(`Error ${openDialog}ing document:`, error);
      toast.error(`Error al ${openDialog}ar documento.`);
    } finally {
      setLoading(false);
      setOpenDialog(null);
      setSelectedDocumentId(null);
      setRejectionNotes({});
    }
  };

  const handleRejectionNotesChange = (docId: string, notes: string) => {
    setRejectionNotes(prev => ({ ...prev, [docId]: notes }));
  };

  const filteredDocuments = documents.filter(doc =>
    doc.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.proyecto_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.notas?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageShell title="Aprobación de Facturas" showTitle={true}>
      <div className="p-4 space-y-4">
<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <Select value={selectedProyectoId || 'all'} onValueChange={(value) => setSelectedProyectoId(value === 'all' ? null : value)}>
                  <SelectTrigger className="min-w-[220px]">
                    <SelectValue placeholder="Todos los proyectos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {proyectos.map((proyecto) => (
                      <SelectItem key={proyecto.id} value={proyecto.id}>
                        {proyecto.nombre}
                      </SelectItem>
                    ))}
                    {presupuestos.map((pres) => (
                      <SelectItem key={pres.id} value={pres.id}>
                        {pres.proyecto} (Presupuesto)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Buscar por proveedor, proyecto o notas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm border-border"
              />
            </div>
          <Button onClick={fetchDocuments} disabled={loading} className="btn-secondary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Refrescar
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
          {loading ? (
            <div className="flex items-center justify-center h-full py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">No hay facturas pendientes de aprobación.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.proveedor || 'N/A'}</TableCell>
                    <TableCell>{resolverNombreProyecto(doc.proyecto_id)}</TableCell>
                    <TableCell>{doc.monto?.toLocaleString('es-GT', { style: 'currency', currency: 'GTQ' })}</TableCell>
                    <TableCell>{doc.fecha_factura ? new Date(doc.fecha_factura).toLocaleDateString('es-GT') : 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{doc.notas || 'Sin notas'}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAction(doc.id, 'approve')} className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10">
                        <Check className="h-4 w-4" /> Aprobar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAction(doc.id, 'reject')} className="text-red-500 border-red-500 hover:bg-red-500/10">
                        <XCircle className="h-4 w-4" /> Rechazar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </div>

      {/* Dialog for confirmation */}
      <AlertDialog open={openDialog !== null && selectedDocumentId !== null} onOpenChange={(o) => { if (!o) { setOpenDialog(null); setSelectedDocumentId(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{openDialog === 'approve' ? 'Aprobar Factura' : 'Rechazar Factura'}</AlertDialogTitle>
            <AlertDialogDescription>
              {openDialog === 'approve'
                ? `¿Estás seguro de aprobar la factura? Esta acción no se puede deshacer.`
                : `¿Estás seguro de rechazar la factura? Escribe un motivo si es necesario.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {openDialog === 'reject' && (
            <div className="my-2">
              <Textarea
                placeholder="Motivo del rechazo (opcional)"
                value={rejectionNotes[selectedDocumentId!]}
                onChange={e => handleRejectionNotesChange(selectedDocumentId!, e.target.value)}
                className="border-border"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {openDialog === 'approve' ? 'Aprobar' : 'Rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default AprobacionScreen;
