import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { presupuestoTransformer } from '@/types/supabase';
import type { Presupuesto, Cliente, Transaccion } from '@/types/supabase';
import { toast } from 'sonner';

const KEYS = {
  presupuestos: ['presupuestos'] as const,
  clientes: ['clientes'] as const,
  transacciones: ['transacciones'] as const,
};

export function usePresupuestos() {
  return useQuery({
    queryKey: KEYS.presupuestos,
    queryFn: async (): Promise<Presupuesto[]> => {
      const { data, error } = await supabase.from('presupuestos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(presupuestoTransformer);
    },
    staleTime: 30_000,
  });
}

export function useClientes() {
  return useQuery({
    queryKey: KEYS.clientes,
    queryFn: async (): Promise<Cliente[]> => {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

export function useTransacciones() {
  return useQuery({
    queryKey: KEYS.transacciones,
    queryFn: async (): Promise<Transaccion[]> => {
      const { data, error } = await supabase.from('transacciones').select('*').order('fecha', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEYS.presupuestos });
    qc.invalidateQueries({ queryKey: KEYS.clientes });
    qc.invalidateQueries({ queryKey: KEYS.transacciones });
  };
}

export function useAddPresupuesto() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.from('presupuestos').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Presupuesto creado');
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });
}
