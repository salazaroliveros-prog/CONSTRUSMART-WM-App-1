import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { OcrDoc } from './OcrService';

export const AprobacionService = {
  async getPendingDocuments(projectId?: string) {
    let query = supabase
      .from('ocr_documentos')
      .select('*')
      .eq('estado', 'pendiente');

    if (projectId) {
      query = query.eq('proyecto_id', projectId);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pending documents:', error);
      toast.error('Error al obtener documentos pendientes');
      throw error;
    }
    return data as Aprobacion[];
  },

  async approveDocument(documentId: string, userId: string) {
    // 1. Marcar documento como aprobado
    const { data, error } = await supabase
      .from('ocr_documentos')
      .update({ estado: 'aprobado', revisado_por: userId })
      .eq('id', documentId)
      .select('*')
      .single();

    if (error) {
      console.error('Error approving document:', error);
      toast.error('Error al aprobar documento');
      throw error;
    }

    // 2. Registrar como transacción de gasto si tiene monto
    const doc = data as OcrDoc;
    if (doc.monto && doc.monto > 0) {
      const { error: txError } = await supabase.from('transacciones').insert({
        user_id: userId,
        tipo: 'gasto',
        categoria: 'materiales',
        descripcion: `Factura aprobada: ${doc.proveedor || 'Proveedor desconocido'}`,
        costo_total: doc.monto,
        costo_unitario: doc.monto,
        cantidad: 1,
        fecha: doc.fecha_factura || new Date().toISOString().split('T')[0],
        proyecto_id: doc.proyecto_id || 'admin',
      });
      if (txError) console.warn('No se pudo registrar transacción de factura aprobada:', txError);
    }

    toast.success('Documento aprobado y registrado como gasto');
    return doc;
  },

  async rejectDocument(documentId: string, userId: string, notes: string) {
    const { data, error } = await supabase
      .from('ocr_documentos')
      .update({ estado: 'rechazado', revisado_por: userId, notas: notes })
      .eq('id', documentId)
      .select('*')
      .single();

    if (error) {
      console.error('Error rejecting document:', error);
      toast.error('Error al rechazar documento');
      throw error;
    }
    toast.success('Documento rechazado');
    return data as OcrDoc;
  }
};
