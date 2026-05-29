// src/services/ocr/OcrService.ts
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface OcrDoc {
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

export const OcrService = {
  async uploadDocument(docData: Partial<OcrDoc> & { user_id: string }) {
    const { data, error } = await supabase
      .from('ocr_documentos')
      .insert(docData)
      .select('*')
      .single();

    if (error) {
      console.error('Error uploading OCR document:', error);
      toast.error('Error al subir el documento');
      throw error;
    }
    toast.success('Documento enviado para OCR');
    return data as OcrDoc;
  },

  async getDocuments(projectId?: string) {
    let query = supabase.from('ocr_documentos').select('*');
    if (projectId) {
      query = query.eq('proyecto_id', projectId);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching OCR documents:', error);
      toast.error('Error al obtener documentos');
      throw error;
    }
    return data as OcrDoc[];
  },

  async getDocumentById(id: string) {
    const { data, error } = await supabase
      .from('ocr_documentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching OCR document by ID:', error);
      toast.error('Error al obtener documento');
      throw error;
    }
    return data as OcrDoc;
  },

  async updateDocumentStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed', userId: string) {
    const { data, error } = await supabase
      .from('ocr_documentos')
      .update({ status, revisado_por: userId })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating document status:', error);
      toast.error('Error al actualizar estado del documento');
      throw error;
    }
    toast.success('Estado del documento actualizado');
    return data as OcrDoc;
  }
};
