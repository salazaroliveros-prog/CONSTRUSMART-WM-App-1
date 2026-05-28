// src/services/ocr/OcrService.ts
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase'; // Assuming Database type is available

type OcrDoc = Database['public']['Tables']['ocr_documentos']['Row'];
type CreateOcrDoc = Database['public']['Tables']['ocr_documentos']['Insert'];

export const OcrService = {
  async uploadDocument(docData: CreateOcrDoc) {
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

  async updateDocumentStatus(id: string, status: OcrDoc['estado'], userId: string) {
    const { data, error } = await supabase
      .from('ocr_documentos')
      .update({ estado: status, revisado_por: userId })
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
