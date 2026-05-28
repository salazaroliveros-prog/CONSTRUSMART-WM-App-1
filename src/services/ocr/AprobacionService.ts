import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase'; // Assuming Database type is available

type OcrDoc = Database['public']['Tables']['ocr_documentos']['Row'];
type Aprobacion = Omit<OcrDoc, 'ocr_raw_text' | 'ocr_data' | 'archivo_url' | 'monto_total'>; // Simplified type for approval context

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
    toast.success('Documento aprobado');
    return data as OcrDoc;
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
