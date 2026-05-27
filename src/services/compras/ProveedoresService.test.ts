import { describe, it, expect, vi } from 'vitest';
import type { Proveedor } from '@/types/supabase';
import { dbToProveedor } from '@/types/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('ProveedoresService', () => {
  it('dbToProveedor transforma correctamente de DB a app', () => {
    const dbRow = {
      id: 'abc-123',
      user_id: 'user-1',
      nombre: 'Proveedor Test',
      contacto: 'Juan Pérez',
      telefono: '5555-1234',
      email: 'juan@test.com',
      rfc: 'RFC-123',
      activo: true,
    };
    const result: Proveedor = dbToProveedor(dbRow as Record<string, unknown>);
    expect(result.id).toBe('abc-123');
    expect(result.nombre).toBe('Proveedor Test');
    expect(result.contacto).toBe('Juan Pérez');
    expect(result.telefono).toBe('5555-1234');
    expect(result.activo).toBe(true);
  });

  it('dbToProveedor maneja valores nulos', () => {
    const dbRow = { id: 'x', user_id: 'u1', nombre: 'Test' };
    const result: Proveedor = dbToProveedor(dbRow as Record<string, unknown>);
    expect(result.nombre).toBe('Test');
    expect(result.contacto).toBeUndefined();
    expect(result.telefono).toBeUndefined();
    expect(result.activo).toBe(true);
  });
});
