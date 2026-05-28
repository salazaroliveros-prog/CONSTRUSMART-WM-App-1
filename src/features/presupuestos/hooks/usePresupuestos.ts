import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Presupuesto, Cliente, Transaccion } from '@/types/supabase';
import { validateCliente, validateTransaccion } from '@/types/supabase';
import { toast } from 'sonner';
import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';
import { ClientesService } from '@/services/clientes/ClientesService';
import { FinancieroService } from '@/services/financiero/FinancieroService';
import { useAppContext } from '@/contexts/AppContext';

const KEYS = {
  presupuestos: ['presupuestos'] as const,
  clientes: ['clientes'] as const,
  transacciones: ['transacciones'] as const,
};

export function usePresupuestos() {
  return useQuery({
    queryKey: KEYS.presupuestos,
    queryFn: async (): Promise<Presupuesto[]> => {
      return await PresupuestosService.listar();
    },
    staleTime: 30_000,
  });
}

export function useClientes() {
  const { session } = useAppContext();
  return useQuery({
    queryKey: KEYS.clientes,
    queryFn: async (): Promise<Cliente[]> => {
      if (session?.user.id) {
        return await ClientesService.getClientes(session.user.id);
      }
      // Fallback for cases where session is not yet loaded but query runs
      return [];
    },
    staleTime: 30_000,
  });
}

export function useTransacciones() {
  const { session } = useAppContext();
  return useQuery({
    queryKey: KEYS.transacciones,
    queryFn: async (): Promise<Transaccion[]> => {
      return await FinancieroService.getTransacciones(session?.user.id);
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
      return await PresupuestosService.addPresupuesto(payload);
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
